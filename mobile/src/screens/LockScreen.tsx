import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useBudgetStore } from '@/store/budgetStore';
import { TapButton } from '@/components/TapButton';
import { BackButton } from '@/components/ui/BackButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ui } from '@/theme/ui';
import { MoneyKeypad, appendAmount } from '@/components/MoneyKeypad';
import { colors, layout, radius, space, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import { lockedTotal } from '@/engine/locks';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Lock'>;

const PRESETS = [
  { id: 'day', label: '1 day', days: 1 },
  { id: 'week', label: '1 week', days: 7 },
  { id: 'month', label: '1 month', days: 30 },
] as const;

export function LockScreen({ navigation }: Props) {
  const lockMoney = useBudgetStore((s) => s.lockMoney);
  const vault = useBudgetStore((s) => s.getReadyToAssign());
  const locks = useBudgetStore((s) => s.locks);
  const alreadyLocked = lockedTotal(locks);

  const [digits, setDigits] = useState('');
  const [custom, setCustom] = useState(false);
  const [customDays, setCustomDays] = useState(14);
  const amount = Number(digits) || 0;
  const canLock = amount > 0 && amount <= vault + 0.001;

  const lockFor = (days: number) => {
    if (!canLock) return;
    lockMoney(amount, days);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  return (
    <View style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <BackButton onPress={() => navigation.goBack()} tone="moss" style={styles.close} />

        <View style={styles.hero}>
          <Text style={ui.kickerOnMoss}>Freeze</Text>
          <Text style={[ui.amountHero, amount === 0 && ui.amountHeroDim]}>€{amount || 0}</Text>
          <Text style={styles.free}>
            {formatEuro(vault, { cents: false })} free
            {alreadyLocked > 0 ? ` · ${formatEuro(alreadyLocked, { cents: false })} already frozen` : ''}
          </Text>
        </View>

        {amount > 0 ? (
          <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.durations}>
            <Text style={styles.pick}>How long?</Text>
            <View style={styles.chips}>
              {PRESETS.map((p) => (
                <TapButton
                  key={p.id}
                  style={[styles.chip, !canLock && styles.chipOff]}
                  hoverScale={1.08}
                  onPress={() => lockFor(p.days)}
                  disabled={!canLock}
                >
                  <Text style={styles.chipText}>{p.label}</Text>
                </TapButton>
              ))}
              <TapButton
                style={[styles.chip, custom && styles.chipOn]}
                hoverScale={1.08}
                onPress={() => setCustom(true)}
              >
                <Text style={[styles.chipText, custom && styles.chipTextOn]}>Custom</Text>
              </TapButton>
            </View>
            {custom ? (
              <Animated.View entering={FadeInUp.duration(220)} style={styles.customRow}>
                <TapButton style={styles.step} onPress={() => setCustomDays((d) => Math.max(1, d - 1))}>
                  <Text style={styles.stepText}>−</Text>
                </TapButton>
                <Text style={styles.customDays}>{customDays} days</Text>
                <TapButton style={styles.step} onPress={() => setCustomDays((d) => d + 1)}>
                  <Text style={styles.stepText}>+</Text>
                </TapButton>
                <PrimaryButton
                  label="Freeze"
                  variant="ember"
                  onPress={() => lockFor(customDays)}
                  disabled={!canLock}
                  style={styles.lockNow}
                />
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : (
          <Text style={styles.hint}>Type an amount. Then tap a length — that’s it.</Text>
        )}

        <View style={styles.bottom}>
          <MoneyKeypad
            dark
            onDigit={(d) => setDigits((v) => appendAmount(v, d))}
            onBackspace={() => setDigits((v) => v.slice(0, -1))}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.moss900 },
  close: {
    alignSelf: 'flex-start',
    marginLeft: space.md,
    marginTop: space.xs,
  },
  hero: { alignItems: 'center', paddingTop: space.group, gap: space.xs },
  free: {
    fontFamily: type.body,
    fontSize: type.size.sm,
    color: colors.sage300,
    marginTop: space.xs,
  },
  hint: {
    textAlign: 'center',
    fontFamily: type.body,
    fontSize: type.size.sm,
    color: colors.textOnMossDim,
    marginTop: space.lg,
    paddingHorizontal: space.lg,
    lineHeight: Math.round(type.size.sm * 1.45),
  },
  durations: { paddingHorizontal: space.md, marginTop: space.lg },
  pick: {
    fontFamily: type.bodyBold,
    fontSize: type.size.sm,
    color: colors.parchment,
    marginBottom: space.group,
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: colors.glassStrong,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.group,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    minHeight: layout.hitTarget,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.ember500, borderColor: colors.ember500 },
  chipOff: { opacity: 0.45 },
  chipText: { fontFamily: type.bodyBold, fontSize: type.size.sm, color: colors.parchment },
  chipTextOn: { color: colors.moss900 },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.group,
    marginTop: space.group,
  },
  step: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontFamily: type.display, fontSize: type.size.xl - 4, color: colors.parchment },
  customDays: {
    fontFamily: type.bodyBold,
    fontSize: type.size.base,
    color: colors.parchment,
    minWidth: 78,
    textAlign: 'center',
  },
  lockNow: { paddingHorizontal: space.group + 4 },
  bottom: { marginTop: 'auto', paddingHorizontal: space.md, paddingBottom: space.md },
});
