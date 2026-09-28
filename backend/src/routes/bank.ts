import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { prisma } from '../prisma';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { encryptSecret, decryptSecret, hashIban } from '../bank/crypto';
import {
  MOCK_ASPSPS,
  createSession,
  deleteSession,
  fetchAllTransactions,
  getSession,
  isEnableBankingConfigured,
  isMockMode,
  listAspsps,
  startAuthorization,
  type Aspsp,
} from '../bank/enableBanking';
import { mockTransactionsForDemo, normalizeEbTransaction, type NormalizedBankTx } from '../bank/normalize';

export const bankRouter = Router();

function redirectUri(): string {
  const uri = process.env.ENABLE_BANKING_REDIRECT_URI?.trim();
  if (!uri) throw new Error('ENABLE_BANKING_REDIRECT_URI is not configured');
  return uri;
}

function bankingReady(): boolean {
  return isMockMode() || (isEnableBankingConfigured() && Boolean(process.env.ENABLE_BANKING_REDIRECT_URI?.trim()));
}

function requireBankingConfigured(_req: AuthedRequest, res: import('express').Response, next: import('express').NextFunction) {
  if (!bankingReady()) {
    return res.status(503).json({
      error:
        'Enable Banking is not configured. Set ENABLE_BANKING_APP_ID, ENABLE_BANKING_PRIVATE_KEY, ENABLE_BANKING_REDIRECT_URI, BANK_SYNC_ENCRYPTION_KEY — or ENABLE_BANKING_MOCK=1 for demo mode. See backend/.env.example.',
    });
  }
  next();
}

/** Pending mock connect states: state → { userId, institutionName, country } */
const mockPending = new Map<string, { userId: string; institutionId: string; institutionName: string; country: string }>();

bankRouter.get('/institutions', requireAuth, requireBankingConfigured, async (req: AuthedRequest, res) => {
  const country = typeof req.query.country === 'string' ? req.query.country.toUpperCase() : 'DE';
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

  let aspsps: Aspsp[];
  if (isMockMode() && !isEnableBankingConfigured()) {
    aspsps = MOCK_ASPSPS.filter((a) => a.country === country);
  } else {
    aspsps = await listAspsps(country);
  }

  let filtered = aspsps;
  if (q) {
    filtered = aspsps.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.bic ?? '').toLowerCase().includes(q)
    );
  } else {
    // Prefer Sparkasse first for DE default list
    filtered = [...aspsps].sort((a, b) => {
      const aSpark = /sparkasse/i.test(a.name) ? 0 : 1;
      const bSpark = /sparkasse/i.test(b.name) ? 0 : 1;
      if (aSpark !== bSpark) return aSpark - bSpark;
      return a.name.localeCompare(b.name);
    });
  }

  res.json({
    institutions: filtered.slice(0, 80).map((a) => ({
      id: `${a.country}:${a.name}`,
      name: a.name,
      country: a.country,
      bic: a.bic ?? null,
      logo: a.logo ?? null,
    })),
    mock: isMockMode() && !isEnableBankingConfigured(),
  });
});

const connectSchema = z.object({
  institutionId: z.string().min(1),
  institutionName: z.string().min(1),
  country: z.string().length(2).default('DE'),
});

bankRouter.post('/connect', requireAuth, requireBankingConfigured, async (req: AuthedRequest, res) => {
  const parsed = connectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { institutionId, institutionName, country } = parsed.data;
  const state = `${req.userId!}:${randomUUID()}`;

  if (isMockMode() && !isEnableBankingConfigured()) {
    mockPending.set(state, { userId: req.userId!, institutionId, institutionName, country });
    const url = `${redirectUri().replace(/\/$/, '')}?code=mock-${randomUUID()}&state=${encodeURIComponent(state)}`;
    return res.json({ url, state, mock: true });
  }

  const validUntil = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
  const { url } = await startAuthorization({
    aspspName: institutionName,
    country,
    redirectUrl: redirectUri(),
    state,
    validUntilIso: validUntil,
  });

  // Stash institution metadata in state via short-lived DB-less map keyed by full state
  mockPending.set(state, { userId: req.userId!, institutionId, institutionName, country });

  res.json({ url, state, mock: false });
});

/** OAuth redirect target — browser/WebView lands here (no JWT). */
bankRouter.get('/callback', async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const error = typeof req.query.error === 'string' ? req.query.error : '';

  if (error) {
    return res.status(400).send(callbackHtml(false, `Bank declined: ${error}`));
  }
  if (!code || !state) {
    return res.status(400).send(callbackHtml(false, 'Missing code or state from bank redirect.'));
  }

  const userId = state.split(':')[0];
  if (!userId) return res.status(400).send(callbackHtml(false, 'Invalid state.'));

  const pending = mockPending.get(state);
  mockPending.delete(state);

  try {
    if (isMockMode() && !isEnableBankingConfigured() && code.startsWith('mock-')) {
      if (!pending || pending.userId !== userId) {
        const existing = await prisma.bankConnection.findFirst({ where: { userId } });
        if (existing) {
          return res.send(callbackHtml(true, `Already connected to ${existing.institutionName}. Return to Terra and tap Sync.`));
        }
        return res.status(400).send(callbackHtml(false, 'Unknown or expired mock connect state.'));
      }
      const sessionId = `mock-session-${randomUUID()}`;
      await prisma.bankConnection.upsert({
        where: { userId_institutionId: { userId, institutionId: pending.institutionId } },
        create: {
          userId,
          institutionId: pending.institutionId,
          institutionName: pending.institutionName,
          country: pending.country,
          sessionEnc: encryptSecret(sessionId),
          accountIds: [{ uid: 'mock-account-1', name: 'Girokonto', ibanHash: hashIban('DE89370400440532013000') }],
        },
        update: {
          institutionName: pending.institutionName,
          sessionEnc: encryptSecret(sessionId),
          accountIds: [{ uid: 'mock-account-1', name: 'Girokonto', ibanHash: hashIban('DE89370400440532013000') }],
        },
      });
      return res.send(callbackHtml(true, `Connected to ${pending.institutionName} (demo). Return to Terra and tap Sync.`));
    }

    if (!isEnableBankingConfigured()) {
      return res.status(503).send(callbackHtml(false, 'Enable Banking is not configured on the server.'));
    }

    const session = await createSession(code);
    const institutionName = pending?.institutionName || session.aspsp?.name || 'Bank';
    const country = pending?.country || session.aspsp?.country || 'DE';
    const institutionId = pending?.institutionId || `${country}:${institutionName}`;

    const accounts = (session.accounts ?? []).map((a) => ({
      uid: a.uid,
      name: a.name || a.details || 'Account',
      ibanHash: hashIban(a.iban || a.account_id?.iban),
      currency: a.currency ?? 'EUR',
    }));

    await prisma.bankConnection.upsert({
      where: { userId_institutionId: { userId, institutionId } },
      create: {
        userId,
        institutionId,
        institutionName,
        country,
        sessionEnc: encryptSecret(session.session_id),
        accountIds: accounts,
      },
      update: {
        institutionName,
        sessionEnc: encryptSecret(session.session_id),
        accountIds: accounts,
      },
    });

    return res.send(callbackHtml(true, `Connected to ${institutionName}. Return to Terra and tap Sync.`));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to complete bank connection.';
    console.error('[bank/callback]', message);
    return res.status(500).send(callbackHtml(false, message));
  }
});

bankRouter.get('/accounts', requireAuth, requireBankingConfigured, async (req: AuthedRequest, res) => {
  const connections = await prisma.bankConnection.findMany({
    where: { userId: req.userId! },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({
    connections: connections.map((c) => ({
      id: c.id,
      institutionId: c.institutionId,
      institutionName: c.institutionName,
      country: c.country,
      accounts: c.accountIds,
      lastSyncedAt: c.lastSyncedAt,
      createdAt: c.createdAt,
    })),
  });
});

bankRouter.post('/sync', requireAuth, requireBankingConfigured, async (req: AuthedRequest, res) => {
  const connectionId = typeof req.body?.connectionId === 'string' ? req.body.connectionId : undefined;
  const connections = await prisma.bankConnection.findMany({
    where: {
      userId: req.userId!,
      ...(connectionId ? { id: connectionId } : {}),
    },
  });
  if (connections.length === 0) {
    return res.status(404).json({ error: 'No bank connection. Connect Sparkasse first.' });
  }

  const imported: NormalizedBankTx[] = [];
  let created = 0;
  let skipped = 0;

  for (const conn of connections) {
    let sessionId: string;
    try {
      sessionId = decryptSecret(conn.sessionEnc);
    } catch (e) {
      return res.status(500).json({ error: e instanceof Error ? e.message : 'Cannot decrypt session' });
    }

    const dateFrom = conn.lastSyncedAt
      ? new Date(conn.lastSyncedAt.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    let normalized: NormalizedBankTx[] = [];

    if (sessionId.startsWith('mock-session-') || (isMockMode() && !isEnableBankingConfigured())) {
      normalized = mockTransactionsForDemo();
    } else {
      const accounts = (conn.accountIds as Array<{ uid: string; ibanHash?: string }>) ?? [];
      let accountUids = accounts.map((a) => a.uid).filter(Boolean);
      if (accountUids.length === 0) {
        const session = await getSession(sessionId);
        accountUids = (session.accounts ?? []).map((a) => a.uid);
      }
      for (const uid of accountUids) {
        const txs = await fetchAllTransactions(uid, dateFrom);
        for (const tx of txs) {
          const n = normalizeEbTransaction(tx, uid);
          if (n) normalized.push(n);
        }
      }
    }

    for (const n of normalized) {
      try {
        await prisma.bankTransaction.create({
          data: {
            connectionId: conn.id,
            externalId: n.externalId,
            bookingDate: n.bookingDate,
            amount: n.amount,
            currency: n.currency,
            creditDebit: n.creditDebit,
            remittance: n.remittance,
            accountIbanHash: '',
            raw: n.raw as object,
          },
        });
        created += 1;
        imported.push(n);
      } catch {
        skipped += 1;
      }
    }

    await prisma.bankConnection.update({
      where: { id: conn.id },
      data: { lastSyncedAt: new Date() },
    });
  }

  res.json({
    imported: imported.map((n) => ({
      externalId: n.externalId,
      bookingDate: n.bookingDate,
      amount: n.amount,
      currency: n.currency,
      kind: n.kind,
      remittance: n.remittance,
      suggestedDistrictId: n.suggestedDistrictId,
      importSource: 'sparkasse' as const,
    })),
    created,
    skipped,
  });
});

bankRouter.delete('/connection', requireAuth, requireBankingConfigured, async (req: AuthedRequest, res) => {
  const connectionId = typeof req.body?.connectionId === 'string' ? req.body.connectionId : undefined;
  const connections = await prisma.bankConnection.findMany({
    where: {
      userId: req.userId!,
      ...(connectionId ? { id: connectionId } : {}),
    },
  });

  for (const conn of connections) {
    try {
      const sessionId = decryptSecret(conn.sessionEnc);
      if (!sessionId.startsWith('mock-session-') && isEnableBankingConfigured()) {
        await deleteSession(sessionId).catch(() => undefined);
      }
    } catch {
      // still delete local row
    }
    await prisma.bankConnection.delete({ where: { id: conn.id } });
  }

  res.json({ ok: true, deleted: connections.length });
});

function callbackHtml(ok: boolean, message: string): string {
  const title = ok ? 'Bank connected' : 'Connection failed';
  const color = ok ? '#1B2E24' : '#8B2E2E';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  body{font-family:-apple-system,system-ui,sans-serif;background:#F4F1EA;color:${color};padding:32px;text-align:center}
  h1{font-size:22px} p{opacity:.85;line-height:1.4}
  .flag{display:none} .ok .flag-ok,.err .flag-err{display:block}
</style></head>
<body class="${ok ? 'ok' : 'err'}" data-terra-bank="${ok ? 'connected' : 'failed'}">
  <h1>${title}</h1>
  <p>${escapeHtml(message)}</p>
  <p class="flag flag-ok">You can close this window and return to Terra.</p>
  <p class="flag flag-err">Close this window and try again from Terra.</p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
