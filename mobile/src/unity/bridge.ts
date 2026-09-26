import type { AllocationState, District, DistrictId } from '@/types';

export interface UnityDistrictPayload {
  key: DistrictId;
  label: string;
  icon: string;
  monthlyBudget: number;
  available: number;
  spent: number;
  allocated: number;
}

export interface UnityVaultPayload {
  key: 'vault';
  label: 'Main Vault';
  amount: number;
  locked: number;
}

/** Same JSON Unity's TerraBridge.Receive expects. See docs/UNITY_WORLD.md. */
export interface UnitySetDistrictsMessage {
  type: 'setDistricts';
  vault: UnityVaultPayload;
  districts: UnityDistrictPayload[];
}

type DistrictMoney = Pick<AllocationState, 'districtId' | 'allocated' | 'spent' | 'available'>;

export function toUnitySetDistrictsMessage(
  districts: District[],
  states: DistrictMoney[],
  vault: { amount: number; locked: number }
): UnitySetDistrictsMessage {
  const byId = new Map(states.map((state) => [state.districtId, state]));
  return {
    type: 'setDistricts',
    vault: {
      key: 'vault',
      label: 'Main Vault',
      amount: vault.amount,
      locked: vault.locked,
    },
    districts: districts.map((district) => {
      const state = byId.get(district.id);
      return {
        key: district.id,
        label: district.label,
        icon: district.icon,
        monthlyBudget: district.monthlyBudget,
        available: state?.available ?? 0,
        spent: state?.spent ?? 0,
        allocated: state?.allocated ?? 0,
      };
    }),
  };
}
