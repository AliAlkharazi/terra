import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { TapButton } from '@/components/TapButton';
import { ModalTopBar } from '@/components/ui/ModalTopBar';
import { CategoryIcon } from '@/components/CategoryIcon';
import { colors, gradients, radius, space, type } from '@/theme/tokens';
import { ui } from '@/theme/ui';
import { formatEuro } from '@/theme/money';
import { themeFor } from '@/theme/categoryTheme';
import { computeMonthPreview, monthShort, type UpcomingPayment } from '@/engine/preview';
import { activeLocks, daysLeft } from '@/engine/locks';
import type { Trend } from '@/engine/forecast';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Preview'>;

const TREND_ARROW: Record<Trend, string> = { up: '↑', down: '↓', flat: '→' };
const BAR_MAX = 46;

export function PreviewScreen({ navigation }: Props) {
  const districts = useBudgetStore((s) => s.districts);
  const transactions = useBudgetStore((s) => s.transactions);
  const allocations = useBudgetStore((s) => s.allocations);
  const locks = useBudgetStore((s) => s.locks) ?? [];
  const currentMonth = useBudgetStore((s) => s.currentMonth);
  const getAllAllocationStates = useBudgetStore((s) => s.getAllAllocationStates);
  const getReadyToAssign = useBudgetStore((s) => s.getReadyToAssign);

  const states = useMemo(
    () => getAllAllocationStates(),
    [getAllAllocationStates, transactions, allocations, currentMonth]
  );
  const vault = useMemo(() => getReadyToAssign(), [getReadyToAssign, transactions, allocations, locks]);
  const preview = useMemo(
    () => computeMonthPreview({ districts, states, locks, transactions, vault, month: currentMonth }),
    [districts, states, locks, transactions, vault, currentMonth]
  );
  const liveLocks = activeLocks(locks);
  const labels = Object.fromEntries(districts.map((d) => [d.id, d.label]));
  const basis = `${monthShort(preview.basisMonths[0])}–${monthShort(preview.basisMonths[preview.basisMonths.length - 1])}`;
  const nextShort = monthShort(preview.nextMonth);
  const short = preview.endNext < 0;

  return (
    <LinearGradient colors={[...gradients.insights]} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ModalTopBar title="Preview" onBack={() => navigation.goBack()} tone="moss" />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(320)} style={styles.hero}>
            <Text style={ui.kickerOnMoss}>
              {preview.nextLabel}
              {preview.hasHistory ? ` · based on ${basis}` : ''}
            </Text>
            <Text style={styles.headline}>
              {!preview.hasHistory
                ? 'Not enough history yet to forecast.'
                : short
                  ? `${nextShort} looks ${formatEuro(-preview.endNext, { cents: false })} short.`
                  : `You should end ${nextShort} with about ${formatEuro(preview.endNext, { cents: false })}.`}
            </Text>
            {preview.hasHistory ? (
              <Text style={styles.sub}>
                Expect {formatEuro(preview.expectedIncome, { cents: false })} in and{' '}
                {formatEuro(preview.expectedSpend, { cents: false })} out.
              </Text>
            ) : null}
          </Animated.View>

          <View style={styles.metrics}>
            <Metric label="Start" value={formatEuro(preview.startNext, { cents: false })} />
            <Metric label="In" value={`+${formatEuro(preview.expectedIncome, { cents: false })}`} tint={colors.incomeGreen} />
            <Metric label="Out" value={`−${formatEuro(preview.expectedSpend, { cents: false })}`} tint={colors.outflowOrange} />
            <Metric label="End" value={formatEuro(preview.endNext, { cents: false })} tint={short ? colors.coral500 : colors.inkGoldBright} />
          </View>

          <Text style={styles.section}>Upcoming payments</Text>
          {preview.payments.length === 0 ? (
            <Text style={styles.empty}>No repeating payments found yet.</Text>
          ) : (
            preview.payments.map((payment, i) => <PaymentRow key={payment.id} payment={payment} index={i} />)
          )}

          <Text style={[styles.section, styles.sectionGap]}>By building</Text>
          {preview.categories.map((row, i) => {
            const theme = themeFor(row.districtId);
            const max = Math.max(...row.history, row.forecast, row.plan, 1);
            const over = row.forecast - row.plan;
            return (
              <Animated.View key={row.districtId} entering={FadeInDown.delay(40 * i).springify().damping(16)} style={styles.buildRow}>
                <View style={styles.buildLeft}>
                  <View style={styles.buildTop}>
                    <CategoryIcon name={row.districtId} size={16} color={theme.accent} />
                    <Text style={[styles.buildName, { color: theme.ink }]}>{labels[row.districtId]}</Text>
                  </View>
                  <Text style={styles.buildAmt}>
                    {formatEuro(row.forecast, { cents: false })}{' '}
                    <Text style={styles.trend}>{TREND_ARROW[row.trend]}</Text>
                  </Text>
                  <Text style={[styles.buildMeta, over > 0.5 && styles.buildOver]}>
                    {over > 0.5
                      ? `${formatEuro(over, { cents: false })} over plan`
                      : `Plan ${formatEuro(row.plan, { cents: false })}`}
                  </Text>
                </View>
                <View style={styles.bars}>
                  {row.history.map((value, b) => (
                    <BarColumn
                      key={preview.basisMonths[b]}
                      label={monthShort(preview.basisMonths[b])}
                      value={value}
                      max={max}
                      color={theme.accent}
                      delay={80 * b + 40 * i}
                    />
                  ))}
                  <BarColumn label={nextShort} value={row.forecast} max={max} color={theme.accent} delay={260 + 40 * i} forecast />
                </View>
              </Animated.View>
            );
          })}

          {liveLocks.length > 0 ? (
            <>
              <Text style={[styles.section, styles.sectionGap]}>Frozen now</Text>
              {liveLocks.map((lock) => (
                <View key={lock.id} style={styles.row}>
                  <Text style={[styles.rowLabel, styles.flex]}>{daysLeft(lock)}d left</Text>
                  <Text style={styles.rowAmt}>{formatEuro(lock.amount, { cents: false })}</Text>
                </View>
              ))}
            </>
          ) : null}

          <Text style={[styles.section, styles.sectionGap]}>Carries over</Text>
          {preview.rollovers.length === 0 ? (
            <Text style={styles.empty}>No leftover in buildings yet.</Text>
          ) : (
            preview.rollovers.map((item) => (
              <View key={item.districtId} style={styles.row}>
                <CategoryIcon name={item.districtId} size={16} />
                <Text style={[styles.rowLabel, styles.flex]}>{item.label}</Text>
                <Text style={styles.rowAmt}>{formatEuro(item.amount, { cents: false })}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function PaymentRow({ payment, index }: { payment: UpcomingPayment; index: number }) {
  const date = new Date(payment.date);
  const tint =
    payment.kind === 'income'
      ? colors.incomeGreen
      : payment.kind === 'unlock'
        ? '#6BA3C9'
        : themeFor(payment.districtId ?? 'vault').accent;
  const sign = payment.kind === 'bill' ? '−' : '+';
  return (
    <Animated.View entering={FadeInDown.delay(35 * index).springify().damping(16)} style={styles.row}>
      <View style={[styles.dateChip, { borderColor: tint }]}>
        <Text style={styles.dateDay}>{date.getUTCDate()}</Text>
        <Text style={styles.dateMon}>{date.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })}</Text>
      </View>
      <CategoryIcon name={payment.districtId ?? 'vault'} size={16} color={tint} />
      <Text style={[styles.rowLabel, styles.flex]} numberOfLines={1}>
        {payment.label}
      </Text>
      <Text style={[styles.rowAmt, { color: payment.kind === 'bill' ? colors.parchment : tint }]}>
        {sign}
        {formatEuro(payment.amount, { cents: false })}
      </Text>
    </Animated.View>
  );
}

function BarColumn({
  label,
  value,
  max,
  color,
  delay,
  forecast,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  delay: number;
  forecast?: boolean;
}) {
  const height = useSharedValue(0);
  useEffect(() => {
    height.value = withDelay(delay, withTiming(Math.max(3, (value / max) * BAR_MAX), { duration: 520 }));
  }, [value, max, delay, height]);
  const style = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <View style={styles.barCol}>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.bar,
            forecast ? { borderColor: color, borderWidth: 1.5, backgroundColor: `${color}55` } : { backgroundColor: color, opacity: 0.55 },
            style,
          ]}
        />
      </View>
      <Text style={[styles.barLabel, forecast && { color }]}>{label}</Text>
    </View>
  );
}

function Metric({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, tint ? { color: tint } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: space.md, paddingBottom: space.xxl, gap: space.sm },
  hero: { marginBottom: 6 },
  headline: { fontFamily: type.display, fontSize: type.size.lg + 4, color: colors.parchment, marginTop: 6, lineHeight: 30 },
  sub: { fontFamily: type.body, fontSize: type.size.sm, color: colors.sage300, marginTop: 6 },
  metrics: { flexDirection: 'row', gap: space.sm, marginVertical: space.sm },
  metric: { flex: 1, ...ui.glassCard, paddingVertical: space.tight, paddingHorizontal: space.sm },
  metricLabel: { fontFamily: type.bodyBold, fontSize: type.size.micro, color: colors.sage300, letterSpacing: 0.4 },
  metricValue: { fontFamily: type.display, fontSize: type.size.base, color: colors.parchment, marginTop: 4 },
  section: {
    fontFamily: type.bodyBold,
    fontSize: type.size.micro,
    color: colors.sage300,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 4,
  },
  sectionGap: { marginTop: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.group,
    ...ui.glassCard,
    paddingHorizontal: space.group,
    paddingVertical: space.tight,
  },
  dateChip: {
    width: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: space.xs,
  },
  dateDay: { fontFamily: type.display, fontSize: 15, color: colors.parchment, lineHeight: 18 },
  dateMon: { fontFamily: type.bodyBold, fontSize: 9, color: colors.sage300, textTransform: 'uppercase' },
  rowLabel: { fontFamily: type.bodyBold, fontSize: 15, color: colors.parchment },
  rowAmt: { fontFamily: type.mono, fontSize: type.size.sm + 1, color: colors.inkGoldBright },
  empty: { fontFamily: type.body, fontSize: 13, color: colors.textOnMossDim, marginBottom: 8 },
  buildRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    ...ui.glassCard,
    padding: space.group,
  },
  buildLeft: { flex: 1 },
  buildTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  buildName: { fontFamily: type.bodyBold, fontSize: 15 },
  buildAmt: { fontFamily: type.display, fontSize: 20, color: colors.parchment, marginTop: 6 },
  trend: { fontFamily: type.bodyBold, fontSize: 15, color: colors.sage300 },
  buildMeta: { fontFamily: type.body, fontSize: 12, color: colors.sage300, marginTop: 2 },
  buildOver: { color: colors.coral500 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  barCol: { alignItems: 'center', width: 26 },
  barTrack: { height: BAR_MAX, justifyContent: 'flex-end' },
  bar: { width: 16, borderRadius: 5 },
  barLabel: { fontFamily: type.bodyBold, fontSize: 9, color: colors.sage300, marginTop: 4 },
});
