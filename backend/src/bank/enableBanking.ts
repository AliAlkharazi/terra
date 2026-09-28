import jwt from 'jsonwebtoken';

const DEFAULT_ORIGIN = 'https://api.enablebanking.com';

export interface Aspsp {
  name: string;
  country: string;
  logo?: string;
  bic?: string;
  psu_types?: string[];
}

export interface EbAccount {
  uid: string;
  iban?: string;
  name?: string;
  currency?: string;
  cash_account_type?: string;
  details?: string;
  account_id?: { iban?: string };
}

export interface EbTransaction {
  entry_reference?: string;
  transaction_id?: string;
  booking_date?: string;
  value_date?: string;
  transaction_date?: string;
  credit_debit_indicator?: 'CRDT' | 'DBIT' | string;
  status?: string;
  remittance_information?: string[];
  creditor?: { name?: string };
  debtor?: { name?: string };
  transaction_amount?: { amount?: string; currency?: string };
  bank_transaction_code?: { description?: string };
}

function apiOrigin(): string {
  return process.env.ENABLE_BANKING_API_ORIGIN || DEFAULT_ORIGIN;
}

function appId(): string {
  const id = process.env.ENABLE_BANKING_APP_ID?.trim();
  if (!id) throw new Error('ENABLE_BANKING_APP_ID is not configured');
  return id;
}

function privateKey(): string {
  let key = process.env.ENABLE_BANKING_PRIVATE_KEY?.trim() ?? '';
  if (!key) throw new Error('ENABLE_BANKING_PRIVATE_KEY is not configured');
  // Support single-line env with \n escapes
  key = key.replace(/\\n/g, '\n');
  if (!key.includes('BEGIN')) {
    key = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
  }
  return key;
}

export function isEnableBankingConfigured(): boolean {
  return Boolean(process.env.ENABLE_BANKING_APP_ID?.trim() && process.env.ENABLE_BANKING_PRIVATE_KEY?.trim());
}

export function isMockMode(): boolean {
  return process.env.ENABLE_BANKING_MOCK === '1' || process.env.ENABLE_BANKING_MOCK === 'true';
}

/** Short-lived RS256 JWT for Enable Banking API auth. */
export function makeEnableBankingJwt(ttlSeconds = 3600): string {
  const iat = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iss: 'enablebanking.com',
      aud: 'api.enablebanking.com',
      iat,
      exp: iat + ttlSeconds,
    },
    privateKey(),
    {
      algorithm: 'RS256',
      header: { alg: 'RS256', typ: 'JWT', kid: appId() },
    }
  );
}

async function ebFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = makeEnableBankingJwt();
  const res = await fetch(`${apiOrigin()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Enable Banking ${init.method ?? 'GET'} ${path} → ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json() as Promise<T>;
}

export async function listAspsps(country = 'DE'): Promise<Aspsp[]> {
  const data = await ebFetch<{ aspsps: Aspsp[] }>(`/aspsps?country=${encodeURIComponent(country)}`);
  return data.aspsps ?? [];
}

export async function startAuthorization(opts: {
  aspspName: string;
  country: string;
  redirectUrl: string;
  state: string;
  validUntilIso: string;
}): Promise<{ url: string }> {
  return ebFetch<{ url: string }>('/auth', {
    method: 'POST',
    body: JSON.stringify({
      access: { valid_until: opts.validUntilIso },
      aspsp: { name: opts.aspspName, country: opts.country },
      state: opts.state,
      redirect_url: opts.redirectUrl,
      psu_type: 'personal',
    }),
  });
}

export async function createSession(code: string): Promise<{
  session_id: string;
  accounts: EbAccount[];
  aspsp?: { name?: string; country?: string };
}> {
  return ebFetch('/sessions', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function getSession(sessionId: string): Promise<{
  session_id?: string;
  accounts: EbAccount[];
  aspsp?: { name?: string; country?: string };
  status?: string;
}> {
  return ebFetch(`/sessions/${encodeURIComponent(sessionId)}`);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const token = makeEnableBankingJwt();
  const res = await fetch(`${apiOrigin()}/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => '');
    throw new Error(`Enable Banking DELETE session → ${res.status}: ${text.slice(0, 300)}`);
  }
}

export async function fetchAllTransactions(
  accountUid: string,
  dateFrom: string
): Promise<EbTransaction[]> {
  const all: EbTransaction[] = [];
  let continuationKey: string | undefined;
  for (let page = 0; page < 50; page++) {
    const params = new URLSearchParams({ date_from: dateFrom });
    if (continuationKey) params.set('continuation_key', continuationKey);
    const data = await ebFetch<{ transactions?: EbTransaction[]; continuation_key?: string }>(
      `/accounts/${encodeURIComponent(accountUid)}/transactions?${params}`
    );
    all.push(...(data.transactions ?? []));
    continuationKey = data.continuation_key;
    if (!continuationKey) break;
  }
  return all;
}

/** Demo ASPSPs when ENABLE_BANKING_MOCK=1 */
export const MOCK_ASPSPS: Aspsp[] = [
  { name: 'Sparkasse Saarbrücken', country: 'DE', bic: 'SAKSDE55XXX' },
  { name: 'Sparkasse Berlin', country: 'DE', bic: 'BELADEBEXXX' },
  { name: 'Deutsche Bank', country: 'DE', bic: 'DEUTDEFFXXX' },
];
