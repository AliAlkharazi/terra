import React, { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { themeFor } from '@/theme/categoryTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { TapButton } from '@/components/TapButton';
import { BackButton } from '@/components/ui/BackButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ui } from '@/theme/ui';
import { CategoryIcon } from '@/components/CategoryIcon';
import { MoneyStack } from '@/components/money/MoneyStack';
import { colors, layout, radius, space, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import { buildingLevel, upgradeProgress } from '@/engine/buildings';
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
  const getBuildingFunded = useBudgetStore((s) => s.getBuildingFunded);
  const placedBuildings = useBudgetStore((s) => s.placedBuildings);

  const [coverOpen, setCoverOpen] = useState(false);

  const district = districts.find((d) => d.id === districtId);
  const alloc = useMemo(
    () => getAllocationState(districtId),
    [getAllocationState, districtId, transactions, allocations, currentMonth]
  );
  const funded = useMemo(
    () => getBuildingFunded(districtId),
    [getBuildingFunded, districtId, placedBuildings]
  );
  const progress = upgradeProgress(funded);
  const level = buildingLevel(funded);

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
        <View style={ui.modalTopBar}>
          <BackButton onPress={() => navigation.goBack()} tone="moss" />
          <View style={styles.topTitle}>
            <CategoryIcon name={district.id} size={16} color={theme.accent} />
            <Text style={[styles.topName, { color: theme.ink }]}>{district.label}</Text>
          </View>
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.levelBadge}>Level {level}</Text>
          <Text style={[styles.huge, { color: theme.ink }, alloc.isOverspent && styles.hugeOver]}>
            {formatEuro(alloc.available, { cents: false })}
          </Text>
          <Text style={[styles.heroHint, { color: theme.accent }]}>{alloc.isOverspent ? 'Overspent' : 'Available'}</Text>
          <View style={styles.stack}>
            <MoneyStack amount={Math.max(0, alloc.available)} large />
          </View>
          {progress.nextAt != null ? (
            <View style={styles.upgradeBox}>
              <Text style={styles.upgradeLabel}>
                Upgrade → Lv {level + 1} · {formatEuro(progress.needed, { cents: false })} more funded
              </Text>
              <View style={styles.upgradeTrack}>
                <View style={[styles.upgradeFill, { width: `${Math.round(progress.pct * 100)}%`, backgroundColor: theme.accent }]} />
              </View>
              <Text style={styles.upgradeMeta}>
                Funded {formatEuro(funded, { cents: false })} / {formatEuro(progress.nextAt, { cents: false })}
              </Text>
            </View>
          ) : (
            <Text style={styles.upgradeMeta}>Max level · funded {formatEuro(funded, { cents: false })}</Text>
          )}
        </View>

        {alloc.isOverspent ? (
          <PrimaryButton
            label={`Cover ${formatEuro(hole)}`}
            variant="ember"
            onPress={() => setCoverOpen(true)}
            style={styles.cover}
          />
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
          <PrimaryButton
            label="Fund / upgrade"
            variant="ember"
            onPress={() => navigation.navigate('Move', { toId: districtId })}
            style={[styles.barBtn, { backgroundColor: theme.accent }]}
          />
        </View>

        <Modal visible={coverOpen} transparent animationType="slide" onRequestClose={() => setCoverOpen(false)}>
          <View style={ui.backdrop}>
            <View style={ui.sheet}>
              <Text style={ui.sheetTitle}>Cover from</Text>
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
              <TapButton style={ui.linkBtn} onPress={() => setCoverOpen(false)}>
                <Text style={ui.linkText}>Cancel</Text>
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
  topSpacer: { width: layout.backSize, height: layout.backSize },
  topTitle: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1, justifyContent: 'center' },
  topName: { fontFamily: type.bodyBold, fontSize: type.size.sm + 1, color: colors.parchment },
  hero: { alignItems: 'center', paddingTop: space.lg, paddingBottom: space.md, gap: space.xs },
  levelBadge: {
    fontFamily: type.bodyBold,
    fontSize: type.size.xs,
    color: colors.inkGoldBright,
    letterSpacing: 1,
    textTransform: 'uppercase',
    backgroundColor: colors.glassInk,
    overflow: 'hidden',
    borderRadius: radius.pill,
    paddingHorizontal: space.group,
    paddingVertical: space.xs,
  },
  huge: {
    fontFamily: type.display,
    fontSize: type.size.hero,
    color: colors.parchment,
    letterSpacing: -1,
  },
  hugeOver: { color: colors.coral500 },
  upgradeBox: {
    width: '86%',
    marginTop: space.md,
    gap: space.xs,
  },
  upgradeLabel: {
    fontFamily: type.bodyBold,
    fontSize: type.size.xs,
    color: colors.parchment,
    textAlign: 'center',
  },
  upgradeTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.glassInk,
    overflow: 'hidden',
  },
  upgradeFill: { height: '100%', borderRadius: radius.pill },
  upgradeMeta: {
    fontFamily: type.body,
    fontSize: type.size.xs,
    color: colors.sage300,
    textAlign: 'center',
  },
  heroHint: {
    fontFamily: type.body,
    fontSize: type.size.sm,
    color: colors.sage300,
    marginTop: space.xs,
  },
  stack: { marginTop: space.lg, minHeight: 70, justifyContent: 'center' },
  cover: { alignSelf: 'center', paddingHorizontal: space.lg },
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
  barBtn: { flex: 1 },
  donor: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.group,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.parchmentDim,
  },
});
