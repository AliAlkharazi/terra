import React, { useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useBudgetStore } from '@/store/budgetStore';
import { UnityWorldHost } from '@/unity/UnityWorldHost';
import { toUnitySetDistrictsMessage } from '@/unity/bridge';

type Props = NativeStackScreenProps<RootStackParamList, 'UnityWorld'>;

export function UnityWorldScreen({ navigation }: Props) {
  const districts = useBudgetStore((s) => s.districts);
  const transactions = useBudgetStore((s) => s.transactions);
  const currentMonth = useBudgetStore((s) => s.currentMonth);
  const getSnapshot = useBudgetStore((s) => s.getSnapshot);

  const message = useMemo(() => {
    const snapshot = getSnapshot();
    return toUnitySetDistrictsMessage(districts, snapshot.districts);
  }, [districts, transactions, currentMonth, getSnapshot]);

  return (
    <UnityWorldHost
      message={message}
      onBack={() => navigation.goBack()}
      onDistrictPress={(key) => navigation.navigate('DistrictDetail', { districtId: key })}
    />
  );
}
