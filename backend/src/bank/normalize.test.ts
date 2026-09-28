import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEbTransaction, mockTransactionsForDemo } from './normalize';

describe('normalizeEbTransaction', () => {
  it('maps DBIT REWE to groceries spend', () => {
    const n = normalizeEbTransaction(
      {
        entry_reference: 'x1',
        credit_debit_indicator: 'DBIT',
        booking_date: '2026-09-01',
        remittance_information: ['REWE SAGT DANKE'],
        transaction_amount: { amount: '12.34', currency: 'EUR' },
      },
      'acc-1'
    );
    assert.ok(n);
    assert.equal(n!.kind, 'spend');
    assert.equal(n!.suggestedDistrictId, 'groceries');
    assert.equal(n!.amount, 12.34);
  });

  it('maps CRDT to income', () => {
    const n = normalizeEbTransaction(
      {
        entry_reference: 'x2',
        credit_debit_indicator: 'CRDT',
        booking_date: '2026-09-01',
        remittance_information: ['GEHALT'],
        transaction_amount: { amount: '1000.00', currency: 'EUR' },
      },
      'acc-1'
    );
    assert.ok(n);
    assert.equal(n!.kind, 'income');
    assert.equal(n!.suggestedDistrictId, null);
  });
});

describe('mockTransactionsForDemo', () => {
  it('returns demo rows', () => {
    const rows = mockTransactionsForDemo();
    assert.ok(rows.length >= 3);
    assert.ok(rows.some((r) => r.kind === 'income'));
    assert.ok(rows.some((r) => r.kind === 'spend'));
  });
});
