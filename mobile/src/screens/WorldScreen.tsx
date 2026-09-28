import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useBudgetStore } from '@/store/budgetStore';
import { useAuthStore } from '@/store/authStore';
import { VillageMap } from '@/components/village/VillageMap';
import { TapButton } from '@/components/TapButton';
import { GoalAirplane } from '@/components/GoalAirplane';
import { useCountUp } from '@/components/money/useCountUp';
import { colors, healthColor, radius, space, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import { computeInsights } from '@/engine/insights';
import { lockedTotal } from '@/engine/locks';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'World'>;

export function WorldScreen({ navigation }: Props) {
  const districts = useBudgetStore((s) => s.districts);
  const transactions = useBudgetStore((s) => s.transactions);
  const allocations = useBudgetStore((s) => s.allocations);
  const currentMonth = useBudgetStore((s) => s.currentMonth);
  const getAllAllocationStates = useBudgetStore((s) => s.getAllAllocationStates);
  const getReadyToAssign = useBudgetStore((s) => s.getReadyToAssign);
  const backupNow = useBudgetStore((s) => s.backupNow);
  const restoreFromBackup = useBudgetStore((s) => s.restoreFromBackup);

  const mode = useAuthStore((s) => s.mode);
  const logout = useAuthStore((s) => s.logout);

  const focused = useIsFocused();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const seed = () => useBudgetStore.getState().seedHistory();
    if (useBudgetStore.persist.hasHydrated()) seed();
    else return useBudgetStore.persist.onFinishHydration(seed);
  }, []);

  const allocationStates = useMemo(
    () => getAllAllocationStates(),
    [getAllAllocationStates, transactions, allocations, currentMonth]
  );
  const locks = useBudgetStore((s) => s.locks);
  const vault = useMemo(
    () => getReadyToAssign(),
    [getReadyToAssign, transactions, allocations, locks]
  );
  const inTown = allocationStates.reduce((sum, a) => sum + Math.max(0, a.available), 0);
  const locked = lockedTotal(locks);
  const moneyLeft = inTown + Math.max(0, vault) + locked;
  const shownTotal = useCountUp(moneyLeft);
  const shownVault = useCountUp(Math.max(0, vault));
  const shownTown = useCountUp(inTown);
  const insights = useMemo(
    () =>
      computeInsights({
        districts,
        states: allocationStates,
        transactions,
        vault,
        month: currentMonth,
      }),
    [districts, allocationStates, transactions, vault, currentMonth]
  );

  const ping = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2200);
  };

  const openAccount = () => {
    const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      {
        text: 'Connect Sparkasse',
        onPress: () => navigation.navigate('ConnectBank'),
      },
      { text: 'Close', style: 'cancel' },
    ];
    if (mode === 'synced') {
      buttons.unshift(
        {
          text: 'Backup',
          onPress: async () => {
            const result = await backupNow();
            ping(result.success ? 'Saved' : result.error ?? 'Backup failed');
          },
        },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            const result = await restoreFromBackup();
            ping(result.success ? 'Restored' : result.error ?? 'Restore failed');
          },
        },
        { text: 'Log out', style: 'destructive', onPress: logout }
      );
    }
    Alert.alert(
      'Account',
      mode === 'synced'
        ? 'Backup keeps your data in the cloud. Connect Sparkasse via Open Banking to import transactions.'
        : 'You are using Terra offline. Log in to connect Sparkasse.',
      buttons
    );
  };

  return (
    <LinearGradient colors={['#3A4A22', '#1A2618', '#101610']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.fill}>
      <View pointerEvents="none" style={styles.sunGlow} />
      <SafeAreaView style={styles.fill}>
        <View style={styles.header}>
          <TapButton onPress={() => navigation.navigate('Reports')} style={styles.headerTap} pressedScale={0.97}>
            <Text style={styles.eyebrow}>{currentMonth}</Text>
            <Text style={styles.total}>{formatEuro(shownTotal, { cents: false })}</Text>
            <Text style={styles.totalLabel}>
              Vault {formatEuro(shownVault, { cents: false })} · Town {formatEuro(shownTown, { cents: false })}
              {locked > 0 ? ` · Frozen ${formatEuro(locked, { cents: false })}` : ''}
            </Text>
            <View style={styles.healthChip}>
              <View style={[styles.healthDot, { backgroundColor: healthColor(insights.health) }]} />
              <Text style={styles.healthChipText}>
                Insights {insights.health} · {insights.healthLabel}
              </Text>
            </View>
          </TapButton>
          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>

        <View style={styles.skyLane} pointerEvents="box-none">
          <GoalsLaunch onOpen={() => navigation.navigate('Goals')} focused={focused} />
        </View>

        <View style={styles.mapWrap}>
          <VillageMap
            districts={districts}
            allocationStates={allocationStates}
            vaultAmount={shownVault}
            lockedAmount={locked}
            onDistrictPress={(districtId) => navigation.navigate('DistrictDetail', { districtId })}
            onVaultPress={() => navigation.navigate('Move')}
          />
        </View>

        <View style={styles.dock}>
          <View style={styles.dockPrimary}>
            <TapButton style={styles.dockBtn} onPress={() => navigation.navigate('Deposit')} hoverScale={1.03}>
              <Text style={styles.dockBtnText}>Deposit</Text>
            </TapButton>
            <TapButton style={[styles.dockBtn, styles.dockBtnMain]} onPress={() => navigation.navigate('Move')} hoverScale={1.03}>
              <Text style={[styles.dockBtnText, styles.dockBtnMainText]}>Move</Text>
            </TapButton>
            <TapButton style={styles.dockBtn} onPress={() => navigation.navigate('More')} hoverScale={1.03}>
              <Text style={styles.dockBtnText}>Activity</Text>
            </TapButton>
          </View>
          <View style={styles.dockDivider} />
          <View style={styles.dockSecondary}>
            <TapButton onPress={() => navigation.navigate('Lock')} pressedScale={0.96} hoverScale={1.04}>
              <Text style={styles.dockLink}>Freeze</Text>
            </TapButton>
            <Text style={styles.dockDot}>·</Text>
            <TapButton onPress={() => navigation.navigate('Preview')} pressedScale={0.96} hoverScale={1.04}>
              <Text style={styles.dockLink}>Preview</Text>
            </TapButton>
            <Text style={styles.dockDot}>·</Text>
            <TapButton onPress={() => navigation.navigate('Afford')} pressedScale={0.96} hoverScale={1.04}>
              <Text style={styles.dockLink}>Ask</Text>
            </TapButton>
          </View>
        </View>

        <TapButton style={styles.account} onPress={openAccount} pressedScale={0.92}>
          <Text style={styles.accountText}>{mode === 'synced' ? 'Account' : 'Offline'}</Text>
        </TapButton>
      </SafeAreaView>
    </LinearGradient>
  );
}

function GoalsLaunch({ onOpen, focused }: { onOpen: () => void; focused: boolean }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rot = useSharedValue(18);
  const fade = useSharedValue(1);
  const bob = useSharedValue(0);
  const tug = useSharedValue(0);
  const flying = useRef(false);

  const startIdle = () => {
    bob.value = withRepeat(withTiming(-5, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
    tug.value = withRepeat(withTiming(8, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
  };

  useEffect(() => {
    startIdle();
  }, []);

  useEffect(() => {
    if (!focused) return;
    flying.current = false;
    x.value = 0;
    y.value = 0;
    rot.value = 18;
    fade.value = 1;
    startIdle();
  }, [focused]);

  const takeOff = () => {
    if (flying.current) return;
    flying.current = true;
    bob.value = withTiming(0, { duration: 80 });
    tug.value = withTiming(0, { duration: 80 });
    x.value = withTiming(160, { duration: 520, easing: Easing.in(Easing.cubic) });
    y.value = withTiming(-40, { duration: 520, easing: Easing.out(Easing.cubic) });
    rot.value = withTiming(8, { duration: 520 });
    fade.value = withTiming(0, { duration: 420 }, (finished) => {
      if (finished) runOnJS(onOpen)();
    });
  };

  const planeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value + tug.value },
      { translateY: y.value + bob.value },
      { rotate: `${rot.value}deg` },
    ],
    opacity: fade.value,
  }));

  return (
    <TapButton onPress={takeOff} style={styles.goals} pressedScale={0.98}>
      <Animated.View style={[styles.goalsInner, planeStyle]}>
        <Text style={styles.goalsLabel}>Goals</Text>
        <GoalAirplane size={108} />
      </Animated.View>
    </TapButton>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: 'visible' },
  sunGlow: {
    position: 'absolute',
    top: -70,
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(232, 176, 72, 0.2)',
  },
  header: { alignItems: 'center', paddingTop: space.sm, paddingHorizontal: space.lg },
  headerTap: { alignItems: 'center' },
  eyebrow: { fontFamily: type.bodyBold, fontSize: type.size.xs, color: colors.sage300, letterSpacing: 1.2 },
  total: {
    fontFamily: type.display,
    fontSize: 40,
    color: '#F4E6A8',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  totalLabel: { fontFamily: type.body, fontSize: type.size.sm, color: colors.parchment, opacity: 0.85, marginTop: 2 },
  healthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(18,40,26,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  healthDot: { width: 7, height: 7, borderRadius: 4 },
  healthChipText: { fontFamily: type.bodyBold, fontSize: 11, color: colors.parchment, letterSpacing: 0.3 },
  status: { fontFamily: type.body, fontSize: type.size.xs, color: colors.gold500, marginTop: space.xs },
  mapWrap: { flex: 1, justifyContent: 'center' },
  skyLane: {
    height: 88,
    marginTop: 4,
    zIndex: 6,
    overflow: 'visible',
  },
  goals: {
    position: 'absolute',
    right: -78,
    top: 4,
    width: 188,
  },
  goalsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dock: {
    marginHorizontal: space.md,
    marginBottom: space.md,
    backgroundColor: 'rgba(12, 18, 14, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(240,234,214,0.1)',
    padding: 10,
    gap: 10,
  },
  dockPrimary: {
    flexDirection: 'row',
    gap: 8,
  },
  dockBtn: {
    flex: 1,
    backgroundColor: 'rgba(240,234,214,0.1)',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockBtnMain: {
    backgroundColor: colors.ember500,
  },
  dockBtnText: {
    fontFamily: type.bodyBold,
    fontSize: 14,
    color: colors.parchment,
  },
  dockBtnMainText: {
    color: colors.moss900,
  },
  dockDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(240,234,214,0.12)',
    marginHorizontal: 4,
  },
  dockSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 2,
  },
  dockLink: {
    fontFamily: type.bodyBold,
    fontSize: 13,
    color: '#F4E6A8',
    letterSpacing: 0.2,
  },
  dockDot: {
    fontFamily: type.body,
    fontSize: 13,
    color: 'rgba(240,234,214,0.28)',
  },
  account: { position: 'absolute', top: 54, left: space.md },
  accountText: {
    fontFamily: type.bodyBold,
    fontSize: 11,
    color: colors.parchment,
    backgroundColor: 'rgba(18,40,26,0.55)',
    overflow: 'hidden',
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  goalsLabel: {
    fontFamily: type.bodyBold,
    fontSize: 12,
    color: colors.parchment,
    textShadowColor: 'rgba(10,18,12,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    width: 44,
  },
});
