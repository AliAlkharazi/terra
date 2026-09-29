import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { TapButton } from '@/components/TapButton';
import { ModalTopBar } from '@/components/ui/ModalTopBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { CategoryIcon } from '@/components/CategoryIcon';
import { HealthRing } from '@/components/HealthRing';
import { colors, gradients, healthColor, space, type } from '@/theme/tokens';
import { ui } from '@/theme/ui';
import { formatEuro } from '@/theme/money';
import { themeFor } from '@/theme/categoryTheme';
import { computeInsights, type PaceStatus } from '@/engine/insights';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

const PACE_COPY: Record<PaceStatus, string> = {
  overspent: 'Overspent',
  hot: 'Burning fast',
  on_track: 'On pace',
  cold: 'Under-using',
  idle: 'Quiet',
};

export function ReportsScreen({ navigation }: Props) {
  const districts = useBudgetStore((s) => s.districts);
  const transactions = useBudgetStore((s) => s.transactions);
  const allocations = useBudgetStore((s) => s.allocations);
  const currentMonth = useBudgetStore((s) => s.currentMonth);
  const getAllAllocationStates = useBudgetStore((s) => s.getAllAllocationStates);
  const getReadyToAssign = useBudgetStore((s) => s.getReadyToAssign);
  const moveMoney = useBudgetStore((s) => s.moveMoney);

  const [applied, setApplied] = useState(false);

  const states = useMemo(
    () => getAllAllocationStates(),
    [getAllAllocationStates, transactions, allocations, currentMonth]
  );
  const vault = useMemo(() => getReadyToAssign(), [getReadyToAssign, transactions, allocations]);
  const insights = useMemo(
    () => computeInsights({ districts, states, transactions, vault, month: currentMonth }),
    [districts, states, transactions, vault, currentMonth]
  );

  const labels = Object.fromEntries(districts.map((d) => [d.id, d.label]));
  const mix = insights.vault + insights.inTown + insights.spentThisMonth;
  const fundTotal = insights.fundPlan.reduce((sum, line) => sum + line.amount, 0);

  const applyPlan = () => {
    if (insights.fundPlan.length === 0) return;
    insights.fundPlan.forEach((line) => {
      moveMoney('vault', line.districtId, line.amount, 'Suggested funding');
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setApplied(true);
  };

  return (
    <LinearGradient colors={[...gradients.insights]} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ModalTopBar title="Insights" onBack={() => navigation.goBack()} tone="moss" />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.ringWrap}>
              <HealthRing score={insights.health} />
              <View style={styles.ringLabel} pointerEvents="none">
                <Text style={[styles.ringScore, { color: healthColor(insights.health) }]}>{insights.health}</Text>
                <Text style={styles.ringHint}>{insights.healthLabel}</Text>
              </View>
            </View>
            <View style={styles.heroCopy}>
              <Text style={ui.kickerOnMoss}>
                Day {insights.dayOfMonth} of {insights.daysInMonth}
              </Text>
              <Text style={styles.headline}>{insights.headline}</Text>
              <Text style={styles.detail}>{insights.detail}</Text>
            </View>
          </View>

          <TapButton style={[ui.glassCardStrong, styles.askCard]} onPress={() => navigation.navigate('Afford')} pressedScale={0.98}>
            <Text style={ui.kickerOnMoss}>Ask in a sentence</Text>
            <Text style={styles.askTitle}>Can I buy this?</Text>
            <Text style={styles.askHint}>Checks free cash, pace, and what similar things cost you.</Text>
          </TapButton>

          <View style={styles.duo}>
            <TapButton style={[ui.glassCard, styles.askCard]} onPress={() => navigation.navigate('Lock')} pressedScale={0.98} hoverScale={1.03}>
              <Text style={ui.kickerOnMoss}>Hold</Text>
              <Text style={styles.duoTitle}>Freeze</Text>
            </TapButton>
            <TapButton style={[ui.glassCard, styles.askCard]} onPress={() => navigation.navigate('Preview')} pressedScale={0.98} hoverScale={1.03}>
              <Text style={ui.kickerOnMoss}>Look ahead</Text>
              <Text style={styles.duoTitle}>Preview</Text>
            </TapButton>
          </View>

          <View style={styles.metrics}>
            <Metric
              label="Age of money"
              value={insights.ageOfMoneyDays == null ? '—' : `${insights.ageOfMoneyDays}d`}
              hint="FIFO age of spent cash"
            />
            <Metric
              label="Runway"
              value={insights.runwayDays == null ? '—' : `${insights.runwayDays}d`}
              hint="Town + vault at this pace"
            />
            <Metric label="Spent" value={formatEuro(insights.spentThisMonth, { cents: false })} hint="This month" />
          </View>

          {mix > 0 ? (
            <View style={ui.glassCard}>
              <Text style={styles.sectionLabel}>Where the money sits</Text>
              <View style={styles.mixBar}>
                {insights.vault > 0 ? <View style={[styles.mixVault, { flex: insights.vault }]} /> : null}
                {insights.inTown > 0 ? <View style={[styles.mixTown, { flex: insights.inTown }]} /> : null}
                {insights.spentThisMonth > 0 ? <View style={[styles.mixSpent, { flex: insights.spentThisMonth }]} /> : null}
              </View>
              <View style={styles.mixLegend}>
                <LegendDot color={colors.vaultGold} label={`Vault ${formatEuro(insights.vault, { cents: false })}`} />
                <LegendDot color={colors.townGreen} label={`Town ${formatEuro(insights.inTown, { cents: false })}`} />
                <LegendDot color={colors.coral500} label={`Spent ${formatEuro(insights.spentThisMonth, { cents: false })}`} />
              </View>
            </View>
          ) : null}

          {insights.fundPlan.length > 0 ? (
            <View style={[ui.glassCardStrong, styles.planCard]}>
              <Text style={styles.sectionLabel}>Suggested funding</Text>
              <Text style={styles.planLead}>
                Move {formatEuro(fundTotal, { cents: false })} from the vault into the buildings that need it most.
              </Text>
              {insights.fundPlan.map((line) => (
                <View key={line.districtId} style={styles.planRow}>
                  <CategoryIcon name={line.districtId} size={16} />
                  <Text style={styles.planName}>{labels[line.districtId] ?? line.districtId}</Text>
                  <Text style={[ui.amountGold, styles.planAmt]}>{formatEuro(line.amount, { cents: false })}</Text>
                </View>
              ))}
              <PrimaryButton
                label={applied ? 'Assigned' : 'Apply suggested split'}
                variant={applied ? 'ghostMoss' : 'ember'}
                onPress={applyPlan}
                disabled={applied}
                style={styles.apply}
              />
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Pace by building</Text>
          {insights.categories.map((row) => {
            const theme = themeFor(row.districtId);
            const expected = Math.max(row.expectedByToday, 0.01);
            const width = Math.min(1, row.spent / expected);
            return (
              <TapButton
                key={row.districtId}
                style={[ui.glassCard, styles.paceRow]}
                onPress={() => navigation.navigate('DistrictDetail', { districtId: row.districtId })}
              >
                <View style={[styles.paceStripe, { backgroundColor: theme.accent }]} />
                <View style={styles.paceBody}>
                  <View style={styles.paceTop}>
                    <CategoryIcon name={row.districtId} size={16} color={theme.accent} />
                    <Text style={[styles.paceName, { color: theme.ink }]}>{labels[row.districtId]}</Text>
                    <Text style={styles.paceTag}>{PACE_COPY[row.pace]}</Text>
                  </View>
                  <View style={styles.paceTrack}>
                    <View style={[styles.paceFill, { width: `${width * 100}%`, backgroundColor: theme.accent }]} />
                  </View>
                  <Text style={styles.paceMeta}>
                    {formatEuro(row.spent, { cents: false })} spent
                    {row.daysToEmpty != null ? ` · ${row.daysToEmpty}d left at this pace` : ' · no burn yet'}
                  </Text>
                </View>
              </TapButton>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricHint}>{hint}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: space.md, paddingBottom: space.xxl, gap: space.group },
  hero: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  ringWrap: { width: 118, height: 118, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ringScore: { fontFamily: type.display, fontSize: type.size.lg + 8, marginTop: 2 },
  ringHint: { fontFamily: type.bodyBold, fontSize: type.size.micro, color: colors.sage300, letterSpacing: 0.6 },
  heroCopy: { flex: 1 },
  headline: { fontFamily: type.display, fontSize: type.size.xl - 4, color: colors.parchment, marginTop: space.xs, lineHeight: 26 },
  detail: { fontFamily: type.body, fontSize: type.size.sm, color: colors.sage300, marginTop: space.sm, lineHeight: 18 },
  askCard: { flex: 1 },
  askTitle: { fontFamily: type.display, fontSize: type.size.lg + 2, color: colors.parchment, marginTop: 4 },
  askHint: { fontFamily: type.body, fontSize: type.size.sm, color: colors.sage300, marginTop: space.sm },
  duo: { flexDirection: 'row', gap: space.sm },
  duoTitle: { fontFamily: type.display, fontSize: type.size.md, color: colors.parchment, marginTop: 4 },
  metrics: { flexDirection: 'row', gap: space.sm },
  metric: {
    flex: 1,
    ...ui.glassCard,
    padding: space.group,
  },
  metricLabel: { fontFamily: type.bodyBold, fontSize: type.size.micro, color: colors.sage300, letterSpacing: 0.4 },
  metricValue: { fontFamily: type.display, fontSize: type.size.lg + 2, color: colors.parchment, marginTop: 4 },
  metricHint: { fontFamily: type.body, fontSize: type.size.micro, color: colors.textOnMossDim, marginTop: 4 },
  sectionLabel: {
    fontFamily: type.bodyBold,
    fontSize: type.size.micro,
    color: colors.sage300,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mixBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: space.group, backgroundColor: colors.moss800 },
  mixVault: { backgroundColor: colors.vaultGold },
  mixTown: { backgroundColor: colors.townGreen },
  mixSpent: { backgroundColor: colors.coral500 },
  mixLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.group, marginTop: space.group },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: type.body, fontSize: type.size.micro + 1, color: colors.parchment },
  planCard: {},
  planLead: { fontFamily: type.body, fontSize: type.size.sm, color: colors.parchment, marginTop: space.sm, marginBottom: space.group, lineHeight: 18 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  planName: { flex: 1, fontFamily: type.bodyBold, fontSize: 14, color: colors.parchment },
  planAmt: { fontSize: type.size.sm + 1 },
  apply: { marginTop: space.group },
  paceRow: {
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 0,
  },
  paceStripe: { width: 4 },
  paceBody: { flex: 1, padding: space.group },
  paceTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  paceName: { flex: 1, fontFamily: type.bodyBold, fontSize: type.size.sm + 1 },
  paceTag: { fontFamily: type.bodyBold, fontSize: type.size.xs, color: colors.sage300 },
  paceTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.glassStrong,
    marginTop: space.sm,
    overflow: 'hidden',
  },
  paceFill: { height: 6, borderRadius: 3 },
  paceMeta: {
    fontFamily: type.body,
    fontSize: type.size.xs,
    color: colors.textOnMossDim,
    marginTop: space.sm,
  },
});
