import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { TapButton } from '@/components/TapButton';
import { CategoryIcon } from '@/components/CategoryIcon';
import { HealthRing } from '@/components/HealthRing';
import { colors, healthColor, radius, space, type } from '@/theme/tokens';
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
    <LinearGradient colors={['#141C12', '#101610', '#0C120E']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.topBar}>
          <TapButton onPress={() => navigation.goBack()} style={styles.back} pressedScale={0.9}>
            <Text style={styles.backText}>←</Text>
          </TapButton>
          <Text style={styles.title}>Insights</Text>
          <View style={styles.back} />
        </View>

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
              <Text style={styles.kicker}>
                Day {insights.dayOfMonth} of {insights.daysInMonth}
              </Text>
              <Text style={styles.headline}>{insights.headline}</Text>
              <Text style={styles.detail}>{insights.detail}</Text>
            </View>
          </View>

          <TapButton style={styles.askCard} onPress={() => navigation.navigate('Afford')} pressedScale={0.98}>
            <Text style={styles.askKicker}>Ask in a sentence</Text>
            <Text style={styles.askTitle}>Can I buy this?</Text>
            <Text style={styles.askHint}>Checks free cash, pace, and what similar things cost you.</Text>
          </TapButton>

          <View style={styles.duo}>
            <TapButton style={styles.askCard} onPress={() => navigation.navigate('Lock')} pressedScale={0.98} hoverScale={1.03}>
              <Text style={styles.askKicker}>Hold</Text>
              <Text style={styles.duoTitle}>Freeze</Text>
            </TapButton>
            <TapButton style={styles.askCard} onPress={() => navigation.navigate('Preview')} pressedScale={0.98} hoverScale={1.03}>
              <Text style={styles.askKicker}>Look ahead</Text>
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
            <View style={styles.mixCard}>
              <Text style={styles.sectionLabel}>Where the money sits</Text>
              <View style={styles.mixBar}>
                {insights.vault > 0 ? <View style={[styles.mixVault, { flex: insights.vault }]} /> : null}
                {insights.inTown > 0 ? <View style={[styles.mixTown, { flex: insights.inTown }]} /> : null}
                {insights.spentThisMonth > 0 ? <View style={[styles.mixSpent, { flex: insights.spentThisMonth }]} /> : null}
              </View>
              <View style={styles.mixLegend}>
                <LegendDot color="#E8C45A" label={`Vault ${formatEuro(insights.vault, { cents: false })}`} />
                <LegendDot color="#78C050" label={`Town ${formatEuro(insights.inTown, { cents: false })}`} />
                <LegendDot color="#D96C5F" label={`Spent ${formatEuro(insights.spentThisMonth, { cents: false })}`} />
              </View>
            </View>
          ) : null}

          {insights.fundPlan.length > 0 ? (
            <View style={styles.planCard}>
              <Text style={styles.sectionLabel}>Suggested funding</Text>
              <Text style={styles.planLead}>
                Move {formatEuro(fundTotal, { cents: false })} from the vault into the buildings that need it most.
              </Text>
              {insights.fundPlan.map((line) => (
                <View key={line.districtId} style={styles.planRow}>
                  <CategoryIcon name={line.districtId} size={16} />
                  <Text style={styles.planName}>{labels[line.districtId] ?? line.districtId}</Text>
                  <Text style={styles.planAmt}>{formatEuro(line.amount, { cents: false })}</Text>
                </View>
              ))}
              <TapButton style={[styles.apply, applied && styles.applyDone]} onPress={applyPlan} disabled={applied}>
                <Text style={[styles.applyText, applied && styles.applyTextDone]}>{applied ? 'Assigned' : 'Apply suggested split'}</Text>
              </TapButton>
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
                style={styles.paceRow}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(240,234,214,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.parchment, fontSize: 18 },
  title: { fontFamily: type.display, fontSize: 22, color: colors.parchment },
  content: { padding: space.md, paddingBottom: space.xxl, gap: space.md },
  hero: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  ringWrap: { width: 118, height: 118, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ringScore: { fontFamily: type.display, fontSize: 28, marginTop: 2 },
  ringHint: { fontFamily: type.bodyBold, fontSize: 11, color: colors.sage300, letterSpacing: 0.6 },
  heroCopy: { flex: 1 },
  kicker: { fontFamily: type.bodyBold, fontSize: 11, color: colors.gold500, letterSpacing: 1 },
  headline: { fontFamily: type.display, fontSize: 22, color: colors.parchment, marginTop: 4, lineHeight: 26 },
  detail: { fontFamily: type.body, fontSize: 13, color: colors.sage300, marginTop: 8, lineHeight: 18 },
  askCard: {
    backgroundColor: 'rgba(232,196,90,0.1)',
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: 'rgba(232,196,90,0.28)',
  },
  askKicker: { fontFamily: type.bodyBold, fontSize: 11, color: colors.gold500, letterSpacing: 1, textTransform: 'uppercase' },
  askTitle: { fontFamily: type.display, fontSize: 22, color: colors.parchment, marginTop: 4 },
  askHint: { fontFamily: type.body, fontSize: 13, color: colors.sage300, marginTop: 6 },
  duo: { flexDirection: 'row', gap: 8 },
  duoTitle: { fontFamily: type.display, fontSize: 18, color: colors.parchment, marginTop: 4 },
  metrics: { flexDirection: 'row', gap: 8 },
  metric: {
    flex: 1,
    backgroundColor: 'rgba(240,234,214,0.07)',
    borderRadius: radius.md,
    padding: 12,
  },
  metricLabel: { fontFamily: type.bodyBold, fontSize: 10, color: colors.sage300, letterSpacing: 0.4 },
  metricValue: { fontFamily: type.display, fontSize: 22, color: colors.parchment, marginTop: 4 },
  metricHint: { fontFamily: type.body, fontSize: 10, color: colors.textOnMossDim, marginTop: 4 },
  mixCard: {
    backgroundColor: 'rgba(240,234,214,0.07)',
    borderRadius: radius.md,
    padding: space.md,
  },
  sectionLabel: {
    fontFamily: type.bodyBold,
    fontSize: 11,
    color: colors.sage300,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mixBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 12, backgroundColor: colors.moss800 },
  mixVault: { backgroundColor: '#E8C45A' },
  mixTown: { backgroundColor: '#78C050' },
  mixSpent: { backgroundColor: '#D96C5F' },
  mixLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: type.body, fontSize: 11, color: colors.parchment },
  planCard: {
    backgroundColor: 'rgba(232,196,90,0.1)',
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: 'rgba(232,196,90,0.28)',
  },
  planLead: { fontFamily: type.body, fontSize: 13, color: colors.parchment, marginTop: 8, marginBottom: 10, lineHeight: 18 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  planName: { flex: 1, fontFamily: type.bodyBold, fontSize: 14, color: colors.parchment },
  planAmt: { fontFamily: type.mono, fontSize: 14, color: '#FFE9A8' },
  apply: {
    marginTop: 12,
    backgroundColor: colors.ember500,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyDone: { backgroundColor: colors.moss700 },
  applyText: { fontFamily: type.bodyBold, fontSize: 15, color: colors.moss900 },
  applyTextDone: { color: colors.parchment },
  paceRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(240,234,214,0.07)',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  paceStripe: { width: 5 },
  paceBody: { flex: 1, padding: 12 },
  paceTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paceName: { flex: 1, fontFamily: type.bodyBold, fontSize: 15 },
  paceTag: { fontFamily: type.bodyBold, fontSize: 11, color: colors.sage300 },
  paceTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(240,234,214,0.12)', marginTop: 8, overflow: 'hidden' },
  paceFill: { height: 6, borderRadius: 3 },
  paceMeta: { fontFamily: type.body, fontSize: 11, color: colors.textOnMossDim, marginTop: 6 },
});
