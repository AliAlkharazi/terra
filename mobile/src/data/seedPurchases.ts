import type { DistrictId } from '@/types';

export type MemoryPurchase = {
  id: string;
  date: string;
  item: string;
  amount: number;
  districtId: DistrictId;
  source: 'live' | 'seed';
};

export const SEED_PURCHASES: MemoryPurchase[] = [
  { id: 's1', date: '2026-06-04T10:00:00.000Z', item: 'coffee', amount: 3.2, districtId: 'dining', source: 'seed' },
  { id: 's2', date: '2026-06-07T12:00:00.000Z', item: 'lunch diner', amount: 14.5, districtId: 'dining', source: 'seed' },
  { id: 's3', date: '2026-06-11T18:00:00.000Z', item: 'sneakers', amount: 79, districtId: 'dining', source: 'seed' },
  { id: 's4', date: '2026-06-14T09:00:00.000Z', item: 'groceries rewe', amount: 42, districtId: 'groceries', source: 'seed' },
  { id: 's5', date: '2026-06-18T08:00:00.000Z', item: 'train ticket', amount: 9.4, districtId: 'transport', source: 'seed' },
  { id: 's6', date: '2026-06-22T19:00:00.000Z', item: 'pizza', amount: 16, districtId: 'dining', source: 'seed' },
  { id: 's7', date: '2026-06-26T11:00:00.000Z', item: 'groceries', amount: 38, districtId: 'groceries', source: 'seed' },
  { id: 's8', date: '2026-06-29T07:00:00.000Z', item: 'coffee', amount: 3.5, districtId: 'dining', source: 'seed' },
  { id: 's9', date: '2026-07-03T10:00:00.000Z', item: 'phone bill', amount: 29, districtId: 'bills', source: 'seed' },
  { id: 's10', date: '2026-07-06T13:00:00.000Z', item: 'lunch', amount: 13, districtId: 'dining', source: 'seed' },
  { id: 's11', date: '2026-07-10T16:00:00.000Z', item: 'uber', amount: 12, districtId: 'transport', source: 'seed' },
  { id: 's12', date: '2026-07-15T09:00:00.000Z', item: 'groceries', amount: 51, districtId: 'groceries', source: 'seed' },
  { id: 's13', date: '2026-07-19T18:00:00.000Z', item: 'jacket', amount: 65, districtId: 'dining', source: 'seed' },
  { id: 's14', date: '2026-07-24T11:00:00.000Z', item: 'coffee', amount: 4, districtId: 'dining', source: 'seed' },
  { id: 's15', date: '2026-07-28T20:00:00.000Z', item: 'dinner', amount: 28, districtId: 'dining', source: 'seed' },
  { id: 's16', date: '2026-08-02T08:00:00.000Z', item: 'rent extra', amount: 40, districtId: 'property', source: 'seed' },
  { id: 's17', date: '2026-08-05T12:00:00.000Z', item: 'groceries', amount: 47, districtId: 'groceries', source: 'seed' },
  { id: 's18', date: '2026-08-09T15:00:00.000Z', item: 'running shoes', amount: 99, districtId: 'dining', source: 'seed' },
  { id: 's19', date: '2026-08-12T07:00:00.000Z', item: 'coffee', amount: 3.8, districtId: 'dining', source: 'seed' },
  { id: 's20', date: '2026-08-16T19:00:00.000Z', item: 'takeaway', amount: 18, districtId: 'dining', source: 'seed' },
  { id: 's21', date: '2026-08-20T09:00:00.000Z', item: 'bus pass', amount: 49, districtId: 'transport', source: 'seed' },
  { id: 's22', date: '2026-08-23T11:00:00.000Z', item: 'groceries', amount: 36, districtId: 'groceries', source: 'seed' },
  { id: 's23', date: '2026-08-27T18:00:00.000Z', item: 'new shoes', amount: 89, districtId: 'dining', source: 'seed' },
  { id: 's24', date: '2026-08-30T10:00:00.000Z', item: 'lunch', amount: 12.5, districtId: 'dining', source: 'seed' },
  { id: 's25', date: '2026-09-02T08:00:00.000Z', item: 'coffee', amount: 3.4, districtId: 'dining', source: 'seed' },
  { id: 's26', date: '2026-09-05T13:00:00.000Z', item: 'groceries', amount: 44, districtId: 'groceries', source: 'seed' },
  { id: 's27', date: '2026-09-08T19:00:00.000Z', item: 'diner', amount: 22, districtId: 'dining', source: 'seed' },
  { id: 's28', date: '2026-09-12T09:00:00.000Z', item: 'train', amount: 11, districtId: 'transport', source: 'seed' },
  { id: 's29', date: '2026-09-16T17:00:00.000Z', item: 'coffee', amount: 3.9, districtId: 'dining', source: 'seed' },
  { id: 's30', date: '2026-09-20T12:00:00.000Z', item: 'lunch', amount: 15, districtId: 'dining', source: 'seed' },
];
