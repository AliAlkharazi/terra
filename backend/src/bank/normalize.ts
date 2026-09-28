import crypto from 'crypto';
import type { EbTransaction } from './enableBanking';

export type NormalizedBankTx = {
  externalId: string;
  bookingDate: string;
  amount: number;
  currency: string;
  creditDebit: 'CRDT' | 'DBIT';
  remittance: string;
  kind: 'income' | 'spend';
  /** Optional district hint from German merchant keywords */
  suggestedDistrictId: string | null;
  raw: EbTransaction;
};

const KEYWORD_RULES: Array<{ re: RegExp; districtId: string }> = [
  { re: /\b(REWE|EDEKA|ALDI|LIDL|PENNY|NETTO|KAUFLAND|BIO COMPANY)\b/i, districtId: 'groceries' },
  { re: /\b(MCDONALD|BURGER KING|STARBUCKS|VAPIANO|DELIVERY HERO|LIEFERANDO|WOLT)\b/i, districtId: 'dining' },
  { re: /\b(DB BAHN|DEUTSCHE BAHN|BVG|RMV|SSB|UBER|BOLT|SHELL|ARAL|TOTALENERGIES|TANKSTELLE)\b/i, districtId: 'transport' },
  { re: /\b(TELEKOM|VODAFONE|O2 |1&1|STADTWERKE|GAS|STROM|NETFLIX|SPOTIFY|AMAZON PRIME)\b/i, districtId: 'bills' },
  { re: /\b(MIETE|HAUSVERWALTUNG|WOHNUNG)\b/i, districtId: 'property' },
];

function remittanceText(tx: EbTransaction): string {
  const parts = [
    ...(tx.remittance_information ?? []),
    tx.creditor?.name,
    tx.debtor?.name,
    tx.bank_transaction_code?.description,
  ].filter(Boolean) as string[];
  return parts.join(' · ').trim();
}

function externalIdFor(tx: EbTransaction, accountUid: string): string {
  const base =
    tx.entry_reference ||
    tx.transaction_id ||
    [
      accountUid,
      tx.booking_date ?? '',
      tx.transaction_amount?.amount ?? '',
      tx.credit_debit_indicator ?? '',
      remittanceText(tx).slice(0, 80),
    ].join('|');
  return crypto.createHash('sha256').update(base).digest('hex').slice(0, 40);
}

function suggestDistrict(text: string): string | null {
  for (const rule of KEYWORD_RULES) {
    if (rule.re.test(text)) return rule.districtId;
  }
  return null;
}

export function normalizeEbTransaction(tx: EbTransaction, accountUid: string): NormalizedBankTx | null {
  const amountStr = tx.transaction_amount?.amount;
  if (amountStr == null) return null;
  const amount = Math.abs(parseFloat(amountStr));
  if (!Number.isFinite(amount) || amount === 0) return null;

  const indicator = (tx.credit_debit_indicator ?? '').toUpperCase();
  const creditDebit: 'CRDT' | 'DBIT' = indicator === 'CRDT' ? 'CRDT' : 'DBIT';
  const bookingDate =
    tx.booking_date || tx.value_date || tx.transaction_date || new Date().toISOString().slice(0, 10);
  const remittance = remittanceText(tx);
  const kind = creditDebit === 'CRDT' ? 'income' : 'spend';

  return {
    externalId: externalIdFor(tx, accountUid),
    bookingDate,
    amount: Math.round(amount * 100) / 100,
    currency: tx.transaction_amount?.currency ?? 'EUR',
    creditDebit,
    remittance,
    kind,
    suggestedDistrictId: kind === 'spend' ? suggestDistrict(remittance) : null,
    raw: tx,
  };
}

export function mockTransactionsForDemo(): NormalizedBankTx[] {
  const today = new Date();
  const iso = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  };
  const samples: Array<Omit<NormalizedBankTx, 'raw' | 'externalId'> & { externalId: string }> = [
    {
      externalId: 'mock-salary',
      bookingDate: iso(3),
      amount: 2400,
      currency: 'EUR',
      creditDebit: 'CRDT',
      remittance: 'GEHALT ACME GMBH',
      kind: 'income',
      suggestedDistrictId: null,
    },
    {
      externalId: 'mock-rewe',
      bookingDate: iso(2),
      amount: 54.32,
      currency: 'EUR',
      creditDebit: 'DBIT',
      remittance: 'REWE SAGT DANKE',
      kind: 'spend',
      suggestedDistrictId: 'groceries',
    },
    {
      externalId: 'mock-bvg',
      bookingDate: iso(1),
      amount: 49,
      currency: 'EUR',
      creditDebit: 'DBIT',
      remittance: 'BVG ABO MONAT',
      kind: 'spend',
      suggestedDistrictId: 'transport',
    },
    {
      externalId: 'mock-cafe',
      bookingDate: iso(0),
      amount: 12.5,
      currency: 'EUR',
      creditDebit: 'DBIT',
      remittance: 'CAFE SONNE BERLIN',
      kind: 'spend',
      suggestedDistrictId: null,
    },
  ];
  return samples.map((s) => ({ ...s, raw: {} as EbTransaction }));
}
