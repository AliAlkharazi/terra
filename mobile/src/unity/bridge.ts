import type { District, DistrictId, DistrictState } from '@/types';

/** Same JSON Unity's TerraBridge.Receive expects. See docs/UNITY_WORLD.md. */
export interface UnityDistrictPayload {
  key: DistrictId;
  label: string;
  icon: string;
  monthlyBudget: number;
  spent: number;
  healthPct: number;
}

export interface UnitySetDistrictsMessage {
  type: 'setDistricts';
  districts: UnityDistrictPayload[];
}

export function toUnitySetDistrictsMessage(
  districts: District[],
  states: DistrictState[]
): UnitySetDistrictsMessage {
  const byId = new Map(states.map((state) => [state.districtId, state]));
  return {
    type: 'setDistricts',
    districts: districts.map((district) => {
      const state = byId.get(district.id);
      return {
        key: district.id,
        label: district.label,
        icon: district.icon,
        monthlyBudget: district.monthlyBudget,
        spent: state?.spent ?? 0,
        healthPct: state?.healthPct ?? 100,
      };
    }),
  };
}
