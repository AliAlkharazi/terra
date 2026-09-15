import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { colors, radius, space, type, healthColor } from '@/theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DistrictDetail'>;

const STAGE_COPY: Record<string, string> = {
  thriving: "This district is thriving — you're well ahead of pace this month.",
  stable: 'Holding steady. On pace with the budget you set.',
  strained: 'Spending is outrunning the month. Still recoverable.',
  wilting: 'This district has outpaced its budget for the days elapsed.',
};

export function DistrictDetailScreen({ route, navigation }: Props) {
  const { districtId } = route.params;
  const districts = useBudgetStore((s) => s.districts);
  const transactions = useBudgetStore((s) => s.transactions);
  const removeTransaction = useBudgetStore((s) => s.removeTransaction);
  const getSnapshot = useBudgetStore((s) => s.getSnapshot);

  const district = districts.find((d) => d.id === districtId)!;
  const snapshot = useMemo(() => getSnapshot(), [getSnapshot]);
  const state = snapshot.districts.find((d) => d.districtId === districtId)!;

  const districtTx = transactions
    .filter((t) => t.districtId === districtId && t.kind === 'spend' && t.date.startsWith(snapshot.month))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const color = healthColor(state.healthPct);

  return (
    <SafeAreaView style={styles.fill}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.icon}>{district.icon}</Text>
          <Pressable style={styles.editButton} onPress={() => navigation.navigate('EditBudget', { districtId })}>
            <Text style={styles.editButtonText}>✎ Edit budget</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>{district.label}</Text>
        <Text style={[styles.health, { color }]}>{state.healthPct}% healthy · {state.stage}</Text>
        <Text style={styles.copy}>{STAGE_COPY[state.stage]}</Text>
        <Text style={styles.amounts}>${state.spent.toFixed(2)} spent of ${state.budget.toFixed(2)} budget</Text>
      </View>

      <FlatList
        data={districtTx}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No spends logged here yet this month.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onLongPress={() => removeTransaction(item.id)}>
            <View>
              <Text style={styles.rowNote}>{item.note || 'Untitled spend'}</Text>
              <Text style={styles.rowDate}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.rowAmount}>${item.amount.toFixed(2)}</Text>
          </Pressable>
        )}
      />

      <Pressable style={styles.addButton} onPress={() => navigation.navigate('AddTransaction', { districtId })}>
        <Text style={styles.addButtonText}>+ Log spend in {district.label}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.moss900 },
  header: { padding: space.lg, borderBottomWidth: 1, borderBottomColor: colors.moss700 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  icon: { fontSize: 32 },
  editButton: { backgroundColor: colors.moss700, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.xs },
  editButtonText: { fontFamily: type.bodyBold, fontSize: type.size.xs, color: colors.parchment },
  title: { fontFamily: type.display, fontSize: type.size.xl, color: colors.parchment, marginTop: space.xs },
  health: { fontFamily: type.bodyBold, fontSize: type.size.sm, marginTop: space.xs, textTransform: 'capitalize' },
  copy: { fontFamily: type.body, fontSize: type.size.sm, color: colors.textOnMossDim, marginTop: space.sm },
  amounts: { fontFamily: type.mono, fontSize: type.size.base, color: colors.parchment, marginTop: space.sm },
  list: { padding: space.lg },
  empty: { fontFamily: type.body, color: colors.textOnMossDim, textAlign: 'center', marginTop: space.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.moss700 },
  rowNote: { fontFamily: type.body, fontSize: type.size.base, color: colors.parchment },
  rowDate: { fontFamily: type.body, fontSize: type.size.xs, color: colors.textOnMossDim, marginTop: 2 },
  rowAmount: { fontFamily: type.mono, fontSize: type.size.base, color: colors.parchment },
  addButton: { margin: space.lg, backgroundColor: colors.ember500, borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center' },
  addButtonText: { fontFamily: type.bodyBold, color: colors.moss900 },
});
