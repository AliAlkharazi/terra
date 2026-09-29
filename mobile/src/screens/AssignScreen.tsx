import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { TapButton } from '@/components/TapButton';
import { BackButton } from '@/components/ui/BackButton';
import { CategoryIcon } from '@/components/CategoryIcon';
import { colors, layout, radius, space, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import type { DistrictId } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Assign'>;

export function AssignScreen({ navigation }: Props) {
  const districts = useBudgetStore((s) => s.districts);
  const currentMonth = useBudgetStore((s) => s.currentMonth);
  const addToDistrict = useBudgetStore((s) => s.addToDistrict);
  const getReadyToAssign = useBudgetStore((s) => s.getReadyToAssign);
  const getAllAllocationStates = useBudgetStore((s) => s.getAllAllocationStates);
  const transactions = useBudgetStore((s) => s.transactions);
  const allocations = useBudgetStore((s) => s.allocations);

  const vault = useMemo(() => getReadyToAssign(), [getReadyToAssign, transactions, allocations]);
  const rows = useMemo(() => {
    return getAllAllocationStates().map((a) => ({
      ...a,
      district: districts.find((d) => d.id === a.districtId)!,
    }));
  }, [getAllAllocationStates, districts, transactions, allocations, currentMonth]);

  const give = (id: DistrictId, amount: number) => addToDistrict(id, currentMonth, amount);

  return (
    <SafeAreaView style={styles.fill}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} tone="moss" style={styles.back} />
        <Text style={styles.title}>Give jobs</Text>
        <Text style={styles.vault}>{formatEuro(vault)}</Text>
        <Text style={styles.sub}>In the vault — tap to send it to a building</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.districtId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowTop}>
              <View style={styles.icon}>
                <CategoryIcon name={item.district.id} size={22} color={colors.parchment} />
              </View>
              <View style={styles.grow}>
                <Text style={styles.name}>{item.district.label}</Text>
                <Text style={styles.meta}>
                  {formatEuro(item.available, { cents: false })} left · {formatEuro(item.allocated, { cents: false })} given
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TapButton style={styles.chip} onPress={() => give(item.districtId, -10)} disabled={item.allocated < 10}>
                <Text style={styles.chipText}>−10</Text>
              </TapButton>
              <TapButton style={styles.chip} onPress={() => give(item.districtId, 10)} disabled={vault <= 0}>
                <Text style={styles.chipText}>+10</Text>
              </TapButton>
              <TapButton style={styles.chip} onPress={() => give(item.districtId, 50)} disabled={vault <= 0}>
                <Text style={styles.chipText}>+50</Text>
              </TapButton>
              <TapButton
                style={[styles.chip, styles.chipMain]}
                onPress={() => give(item.districtId, vault)}
                disabled={vault <= 0}
              >
                <Text style={[styles.chipText, styles.chipMainText]}>All</Text>
              </TapButton>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.moss900 },
  header: { padding: space.lg, borderBottomWidth: 1, borderBottomColor: colors.moss700 },
  back: { marginBottom: space.sm },
  title: { fontFamily: type.display, fontSize: type.size.xl, color: colors.parchment },
  vault: { fontFamily: type.display, fontSize: type.size.xxl, color: colors.inkGoldBright, marginTop: space.xs },
  sub: {
    fontFamily: type.body,
    fontSize: type.size.sm,
    color: colors.textOnMossDim,
    marginTop: space.xs,
  },
  list: { padding: space.lg },
  row: { marginBottom: space.lg },
  rowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: space.group },
  icon: { marginRight: space.sm },
  grow: { flex: 1 },
  name: { fontFamily: type.bodyBold, fontSize: type.size.base, color: colors.parchment },
  meta: {
    fontFamily: type.body,
    fontSize: type.size.xs,
    color: colors.textOnMossDim,
    marginTop: space.xs,
  },
  actions: { flexDirection: 'row', gap: space.sm },
  chip: {
    backgroundColor: colors.moss700,
    borderRadius: radius.pill,
    paddingHorizontal: space.group,
    paddingVertical: space.sm,
    minHeight: layout.hitTarget,
    minWidth: layout.hitTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipMain: { backgroundColor: colors.ember500 },
  chipText: { fontFamily: type.bodyBold, fontSize: type.size.sm, color: colors.parchment },
  chipMainText: { color: colors.moss900 },
});
