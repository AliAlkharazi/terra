import type { District } from '@/types';
import { toUnitySetDistrictsMessage } from '../bridge';

const districts: District[] = [
  { id: 'dining', label: 'Diner', icon: '', monthlyBudget: 250 },
  { id: 'property', label: 'Home', icon: '', monthlyBudget: 200 },
];

describe('toUnitySetDistrictsMessage', () => {
  it('builds the village payload Unity receives, including the vault', () => {
    const message = toUnitySetDistrictsMessage(
      districts,
      [
        { districtId: 'dining', allocated: 250, spent: 210, available: 40 },
        { districtId: 'property', allocated: 200, spent: 20, available: -10 },
      ],
      { amount: 1280, locked: 100 }
    );

    expect(message.type).toBe('setDistricts');
    expect(message.vault).toEqual({ key: 'vault', label: 'Main Vault', amount: 1280, locked: 100 });
    expect(message.districts).toEqual([
      { key: 'dining', label: 'Diner', icon: '', monthlyBudget: 250, available: 40, spent: 210, allocated: 250 },
      { key: 'property', label: 'Home', icon: '', monthlyBudget: 200, available: -10, spent: 20, allocated: 200 },
    ]);
  });
});
