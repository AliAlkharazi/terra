import React, { useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useBudgetStore } from '@/store/budgetStore';
import { lockedTotal } from '@/engine/locks';
import { UnityWorldHost } from '@/unity/UnityWorldHost';
import { toUnitySetDistrictsMessage } from '@/unity/bridge';

type Props = NativeStackScreenProps<RootStackParamList, 'UnityWorld'>;

export function UnityWorldScreen({ navigation }: Props) {
  const districts = useBudgetStore((s) => s.districts);
  const transactions = useBudgetStore((s) => s.transactions);
  const allocations = useBudgetStore((s) => s.allocations);
  const currentMonth = useBudgetStore((s) => s.currentMonth);
  const locks = useBudgetStore((s) => s.locks);
  const getAllAllocationStates = useBudgetStore((s) => s.getAllAllocationStates);
  const getReadyToAssign = useBudgetStore((s) => s.getReadyToAssign);

  const message = useMemo(() => {
    return toUnitySetDistrictsMessage(districts, getAllAllocationStates(), {
      amount: Math.max(0, getReadyToAssign()),
      locked: lockedTotal(locks),
    });
  }, [districts, transactions, allocations, currentMonth, locks, getAllAllocationStates, getReadyToAssign]);

  return (
    <UnityWorldHost
      message={message}
      onBack={() => navigation.goBack()}
      onDistrictPress={(key) => navigation.navigate('DistrictDetail', { districtId: key })}
      onVaultPress={() => navigation.navigate('Move')}
    />
  );
}
