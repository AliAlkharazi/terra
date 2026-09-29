import React, { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { themeFor } from '@/theme/categoryTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { TapButton } from '@/components/TapButton';
import { BackButton } from '@/components/ui/BackButton';
import { CategoryIcon } from '@/components/CategoryIcon';
import { MoneyStack } from '@/components/money/MoneyStack';
import { colors, layout, radius, space, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import type { DistrictId } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DistrictDetail'>;

export function DistrictDetailScreen({ route, navigation }: Props) {
  const { districtId } = route.params;
  const districts = useBudgetStore((s) => s.districts);
  const activity = useBudgetStore((s) => s.activity) ?? [];
  const transactions = useBudgetStore((s) => s.transactions);
  const getAllocationState = useBudgetStore((s) => s.getAllocationState);
  const getAllAllocationStates = useBudgetStore((s) => s.getAllAllocationStates);
  const coverOverspend = useBudgetStore((s) => s.coverOverspend);
  const currentMonth = useBudgetStore((s) => s.currentMonth);
  const allocations = useBudgetStore((s) => s.allocations);

  const [coverOpen, setCoverOpen] = useState(false);

  const district = districts.find((d) => d.id === districtId);
  const alloc = useMemo(
    () => getAllocationState(districtId),
    [getAllocationState, districtId, transactions, allocations, currentMonth]
  );

  const donors = useMemo(() => {
    return getAllAllocationStates()
      .filter((a) => a.districtId !== districtId && a.available > 0)
      .map((a) => ({ ...a, district: districts.find((d) => d.id === a.districtId)! }))
      .filter((a) => a.district);
  }, [getAllAllocationStates, districtId, districts, transactions, allocations, currentMonth]);

  const moves = activity.filter((a) => a.fromId === districtId || a.toId === districtId);

  const hole = Math.abs(Math.min(0, alloc.available));

  if (!district) {
    return (
      <SafeAreaView style={styles.fill}>
        <Text style={styles.empty}>Building not found.</Text>
      </SafeAreaView>
    );
  }

  const theme = themeFor(district.id);

  return (
    <LinearGradient colors={theme.bg} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.topBar}>
          <BackButton onPress={() => navigation.goBack()} tone="moss" />
          <View style={styles.topTitle}>
            <CategoryIcon name={district.id} size={16} color={theme.accent} />
            <Text style={[styles.topName, { color: theme.ink }]}>{district.label}</Text>
          </View>
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.hero}>
          <Text style={[styles.huge, { color: theme.ink }, alloc.isOverspent && styles.hugeOver]}>
            {formatEuro(alloc.available, { cents: false })}
          </Text>
          <Text style={[styles.heroHint, { color: theme.accent }]}>{alloc.isOverspent ? 'Overspent' : 'Available'}</Text>
          <View style={styles.stack}>
            <MoneyStack amount={Math.max(0, alloc.available)} large />
          </View>
        </View>

        {alloc.isOverspent ? (
          <TapButton style={styles.cover} onPress={() => setCoverOpen(true)}>
            <Text style={styles.coverText}>Cover {formatEuro(hole)}</Text>
          </TapButton>
        ) : null}

        <FlatList
          data={moves}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No moves yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View>
                <Text style={styles.note}>
                  {item.fromId === districtId ? 'Sent' : 'Received'}
                  {item.note ? ` · ${item.note}` : ''}
                </Text>
                <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.amount}>
                {item.fromId === districtId ? '−' : '+'}
                {formatEuro(item.amount, { cents: false })}
              </Text>
            </View>
          )}
        />

        <View style={styles.bar}>
          <TapButton style={[styles.barBtn, styles.barBtnMain, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('Move', { toId: districtId })}>
            <Text style={[styles.barBtnText, styles.barBtnMainText]}>Move</Text>
          </TapButton>
        </View>

        <Modal visible={coverOpen} transparent animationType="slide" onRequestClose={() => setCoverOpen(false)}>
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Cover from</Text>
              {donors.length === 0 ? (
                <Text style={styles.empty}>No other building has money.</Text>
              ) : (
                donors.map((a) => (
                  <TapButton
                    key={a.districtId}
                    style={styles.donor}
                    onPress={() => {
                      coverOverspend(a.districtId as DistrictId, districtId, currentMonth, hole);
                      setCoverOpen(false);
                    }}
                  >
                    <CategoryIcon name={a.district.id} size={18} color={themeFor(a.district.id).accent} />
                    <Text style={styles.noteDark}>{a.district.label}</Text>
                    <Text style={styles.amountDark}>{formatEuro(a.available)}</Text>
                  </TapButton>
                ))
              )}
              <TapButton onPress={() => setCoverOpen(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </TapButton>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingTop: space.xs,
    minHeight: layout.hitTarget,
  },
  topSpacer: { width: layout.backSize, height: layout.backSize },
  topTitle: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1, justifyContent: 'center' },
  topName: { fontFamily: type.bodyBold, fontSize: type.size.sm + 1, color: colors.parchment },
  hero: { alignItems: 'center', paddingTop: space.xl, paddingBottom: space.md, gap: space.xs },
  huge: {
    fontFamily: type.display,
    fontSize: 56,
    color: colors.parchment,
    letterSpacing: -1,
  },
  hugeOver: { color: colors.coral500 },
  heroHint: {
    fontFamily: type.body,
    fontSize: type.size.sm,
    color: colors.sage300,
    marginTop: space.xs,
  },
  stack: { marginTop: space.lg, minHeight: 70, justifyContent: 'center' },
  cover: {
    alignSelf: 'center',
    backgroundColor: colors.coral500,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: space.group,
    minHeight: 44,
    justifyContent: 'center',
  },
  coverText: { fontFamily: type.bodyBold, color: colors.moss900 },
  list: { padding: space.lg, gap: 0 },
  empty: {
    fontFamily: type.body,
    color: colors.textOnMossDim,
    textAlign: 'center',
    marginTop: space.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.group,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.moss700,
  },
  note: { fontFamily: type.body, fontSize: type.size.base, color: colors.parchment },
  noteDark: {
    flex: 1,
    fontFamily: type.body,
    fontSize: type.size.base,
    color: colors.textOnParchment,
    marginLeft: space.sm,
  },
  date: {
    fontFamily: type.body,
    fontSize: type.size.xs,
    color: colors.textOnMossDim,
    marginTop: space.xs,
  },
  amount: { fontFamily: type.mono, fontSize: type.size.base, color: colors.parchment },
  amountDark: { fontFamily: type.mono, fontSize: type.size.base, color: colors.textOnParchment },
  bar: { flexDirection: 'row', gap: space.sm, padding: space.lg },
  barBtn: {
    flex: 1,
    backgroundColor: colors.moss700,
    borderRadius: radius.md,
    paddingVertical: space.group,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barBtnMain: { backgroundColor: colors.ember500 },
  barBtnText: { fontFamily: type.bodyBold, color: colors.parchment },
  barBtnMainText: { color: colors.moss900 },
  backdrop: { flex: 1, backgroundColor: colors.backdrop, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.parchment,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontFamily: type.display,
    fontSize: type.size.lg,
    color: colors.textOnParchment,
    marginBottom: space.md,
  },
  donor: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.group,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.parchmentDim,
  },
  cancel: {
    fontFamily: type.body,
    textAlign: 'center',
    color: colors.textOnParchmentDim,
    marginTop: space.md,
    paddingVertical: space.sm,
  },
});
