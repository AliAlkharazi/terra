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
import { colors, gradients, healthColor, layout, radius, space, type } from '@/theme/tokens';
import { ui } from '@/theme/ui';
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
    <LinearGradient colors={[...gradients.world]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.fill}>
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
            <View style={[ui.chipOnMoss, styles.healthChip]}>
              <View style={[styles.healthDot, { backgroundColor: healthColor(insights.health) }]} />
              <Text style={ui.chipTextOnMoss}>
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

        <View style={ui.dock}>
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
            <TapButton onPress={() => navigation.navigate('Lock')} pressedScale={0.96} hoverScale={1.04} style={styles.dockLinkHit}>
              <Text style={styles.dockLink}>Freeze</Text>
            </TapButton>
            <Text style={styles.dockDot}>·</Text>
            <TapButton onPress={() => navigation.navigate('Preview')} pressedScale={0.96} hoverScale={1.04} style={styles.dockLinkHit}>
              <Text style={styles.dockLink}>Preview</Text>
            </TapButton>
            <Text style={styles.dockDot}>·</Text>
            <TapButton onPress={() => navigation.navigate('Afford')} pressedScale={0.96} hoverScale={1.04} style={styles.dockLinkHit}>
              <Text style={styles.dockLink}>Ask</Text>
            </TapButton>
          </View>
        </View>

        <TapButton style={styles.account} onPress={openAccount} pressedScale={0.92}>
          <Text style={[ui.chipTextOnMoss, styles.accountText]}>{mode === 'synced' ? 'Account' : 'Offline'}</Text>
        </TapButton>
      </SafeAreaView>
    </LinearGradient>
  );
}

function GoalsLaunch({ onOpen, focused }: { onOpen: () => void; focused: boolean }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const fade = useSharedValue(1);
  const bob = useSharedValue(0);
  const flying = useRef(false);

  const startIdle = () => {
    bob.value = withRepeat(withTiming(-3, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true);
  };

  useEffect(() => {
    startIdle();
  }, []);

  useEffect(() => {
    if (!focused) return;
    flying.current = false;
    x.value = 0;
    y.value = 0;
    fade.value = 1;
    startIdle();
  }, [focused]);

  const takeOff = () => {
    if (flying.current) return;
    flying.current = true;
    bob.value = withTiming(0, { duration: 80 });
    // Stay level (0°) — slide up/out, no tilt
    x.value = withTiming(28, { duration: 420, easing: Easing.in(Easing.cubic) });
    y.value = withTiming(-36, { duration: 420, easing: Easing.out(Easing.cubic) });
    fade.value = withTiming(0, { duration: 360 }, (finished) => {
      if (finished) runOnJS(onOpen)();
    });
  };

  const planeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value + bob.value },
    ],
    opacity: fade.value,
  }));

  return (
    <TapButton onPress={takeOff} style={styles.goals} pressedScale={0.96} hoverScale={1.03}>
      <Animated.View style={[styles.goalsInner, planeStyle]}>
        <Text style={styles.goalsLabel}>Goals</Text>
        <GoalAirplane size={52} />
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
    backgroundColor: colors.sunGlow,
  },
  header: {
    alignItems: 'center',
    paddingTop: space.sm,
    paddingHorizontal: space.lg,
    gap: space.xs,
  },
  headerTap: { alignItems: 'center', gap: space.xs },
  eyebrow: {
    fontFamily: type.bodyBold,
    fontSize: type.size.xs,
    color: colors.sage300,
    letterSpacing: 1.2,
  },
  total: {
    fontFamily: type.display,
    fontSize: type.size.display - 4,
    color: colors.inkGold,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  totalLabel: {
    fontFamily: type.body,
    fontSize: type.size.sm,
    color: colors.parchment,
    opacity: 0.88,
    textAlign: 'center',
    lineHeight: Math.round(type.size.sm * type.line.snug),
  },
  healthChip: {
    alignSelf: 'center',
    marginTop: space.xs,
  },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  status: {
    fontFamily: type.body,
    fontSize: type.size.xs,
    color: colors.gold500,
    marginTop: space.xs,
  },
  mapWrap: { flex: 1, justifyContent: 'center', paddingVertical: space.sm },
  skyLane: {
    height: 64,
    marginTop: space.xs,
    zIndex: 6,
    overflow: 'visible',
  },
  goals: {
    position: 'absolute',
    right: space.md,
    top: 0,
    minHeight: layout.hitTarget,
    justifyContent: 'center',
  },
  goalsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.glassInk,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingLeft: space.md,
    paddingRight: space.group,
    paddingVertical: space.sm,
    minHeight: layout.hitTarget,
  },
  dockPrimary: {
    flexDirection: 'row',
    gap: space.sm,
  },
  dockBtn: {
    flex: 1,
    backgroundColor: colors.glassStrong,
    borderRadius: radius.md,
    paddingVertical: space.group,
    minHeight: layout.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockBtnMain: {
    backgroundColor: colors.ember500,
  },
  dockBtnText: {
    fontFamily: type.bodyBold,
    fontSize: type.size.base,
    color: colors.parchment,
  },
  dockBtnMainText: {
    color: colors.moss900,
  },
  dockDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginHorizontal: space.xs,
  },
  dockSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.group,
    paddingVertical: space.xs,
  },
  dockLinkHit: {
    minHeight: layout.hitTarget,
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  dockLink: {
    fontFamily: type.bodyBold,
    fontSize: type.size.sm,
    color: colors.inkGold,
    letterSpacing: 0.2,
  },
  dockDot: {
    fontFamily: type.body,
    fontSize: type.size.sm,
    color: colors.dimOnMoss,
  },
  account: {
    position: 'absolute',
    top: 56,
    left: space.md,
    zIndex: 8,
    minHeight: layout.hitTarget - 4,
    justifyContent: 'center',
  },
  accountText: {
    backgroundColor: colors.glassInk,
    overflow: 'hidden',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  goalsLabel: {
    fontFamily: type.bodyBold,
    fontSize: type.size.sm,
    color: colors.inkGoldBright,
    letterSpacing: 0.3,
  },
});
