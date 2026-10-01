import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useBudgetStore } from '@/store/budgetStore';
import { useAuthStore } from '@/store/authStore';
import { VillageMap } from '@/components/village/VillageMap';
import { BuildShopModal } from '@/components/village/BuildShopModal';
import { TapButton } from '@/components/TapButton';
import { GoalAirplane } from '@/components/GoalAirplane';
import { ResourceBar } from '@/components/ui/ResourceBar';
import { useCountUp } from '@/components/money/useCountUp';
import { colors, healthColor, layout, radius, space, type } from '@/theme/tokens';
import { ui } from '@/theme/ui';
import { formatEuro } from '@/theme/money';
import { themeFor } from '@/theme/categoryTheme';
import { BUILD_COST_MIN } from '@/engine/buildings';
import { computeInsights } from '@/engine/insights';
import { lockedTotal } from '@/engine/locks';
import { BUILDING_CATALOG } from '@/village/buildingCatalog';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import type { DistrictId } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'World'>;

function shopCostFor(districtId: DistrictId): number {
  const entry = BUILDING_CATALOG.find((b) => b.districtId === districtId);
  return entry?.cost && entry.cost > 0 ? entry.cost : BUILD_COST_MIN;
}

export function WorldScreen({ navigation }: Props) {
  const districts = useBudgetStore((s) => s.districts);
  const transactions = useBudgetStore((s) => s.transactions);
  const allocations = useBudgetStore((s) => s.allocations);
  const currentMonth = useBudgetStore((s) => s.currentMonth);
  const getAllAllocationStates = useBudgetStore((s) => s.getAllAllocationStates);
  const getReadyToAssign = useBudgetStore((s) => s.getReadyToAssign);
  const backupNow = useBudgetStore((s) => s.backupNow);
  const restoreFromBackup = useBudgetStore((s) => s.restoreFromBackup);
  const placedBuildings = useBudgetStore((s) => s.placedBuildings);
  const placeBuilding = useBudgetStore((s) => s.placeBuilding);
  const getUnplacedDistricts = useBudgetStore((s) => s.getUnplacedDistricts);

  const mode = useAuthStore((s) => s.mode);
  const logout = useAuthStore((s) => s.logout);

  const focused = useIsFocused();
  const [status, setStatus] = useState<string | null>(null);
  const [buildOpen, setBuildOpen] = useState(false);

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

  const vaultCap = Math.max(1000, Math.round(Math.max(0, vault) * 1.2));
  const townCap = Math.max(1000, Math.round(inTown * 1.2));

  const ping = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2200);
  };

  const placedFunded = useMemo(() => {
    const map: Partial<Record<DistrictId, number>> = {};
    for (const b of placedBuildings ?? []) map[b.districtId] = b.funded;
    return map;
  }, [placedBuildings]);

  const placedIds = useMemo(
    () => new Set((placedBuildings ?? []).map((b) => b.districtId)),
    [placedBuildings]
  );

  const unplaced = useMemo(
    () => getUnplacedDistricts(),
    [getUnplacedDistricts, placedBuildings, districts]
  );

  const confirmPlace = (districtId: DistrictId) => {
    const district = districts.find((d) => d.id === districtId);
    if (!district) return;
    const cost = shopCostFor(districtId);
    Alert.alert(
      `Build ${district.label}?`,
      `Spend ${formatEuro(cost, { cents: false })} from the vault to open this building on the map. Put more money in later to upgrade it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Build (${formatEuro(cost, { cents: false })})`,
          onPress: () => {
            const result = placeBuilding(districtId);
            if (result.ok) {
              setBuildOpen(false);
              ping(`${district.label} built`);
            } else {
              Alert.alert('Can’t build', result.error);
            }
          },
        },
      ]
    );
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
    <ImageBackground source={require('../../assets/grass-field.jpg')} style={styles.fill} resizeMode="cover">
      <View pointerEvents="none" style={styles.grassTint} />
      <SafeAreaView style={styles.fill}>
        <View style={styles.header}>
          <TapButton onPress={() => navigation.navigate('Reports')} style={styles.headerTap} pressedScale={0.97}>
            <Text style={styles.eyebrow}>Terra · {currentMonth}</Text>
            <View style={[ui.chipOnMoss, styles.healthChip]}>
              <View style={[styles.healthDot, { backgroundColor: healthColor(insights.health) }]} />
              <Text style={ui.chipTextOnMoss}>
                {insights.healthLabel}
              </Text>
            </View>
          </TapButton>
          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>

        <View style={styles.resourceStack} pointerEvents="none">
          <ResourceBar
            value={shownVault}
            max={vaultCap}
            fillColor={themeFor('vault').accent}
          />
          <ResourceBar
            value={shownTown}
            max={townCap}
            fillColor={colors.sage300}
            style={styles.townBar}
          />
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
            placedFunded={placedFunded}
            onDistrictPress={(districtId) => navigation.navigate('DistrictDetail', { districtId })}
            onEmptyPlotPress={confirmPlace}
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
            <TapButton
              style={styles.dockBtn}
              onPress={() => {
                if (unplaced.length === 0) {
                  ping('All buildings placed');
                  return;
                }
                setBuildOpen(true);
              }}
              hoverScale={1.03}
            >
              <Text style={styles.dockBtnText}>Build</Text>
            </TapButton>
          </View>
          <View style={styles.dockDivider} />
          <View style={styles.dockSecondary}>
            <TapButton onPress={() => navigation.navigate('More')} pressedScale={0.96} hoverScale={1.04} style={styles.dockLinkHit}>
              <Text style={styles.dockLink}>Activity</Text>
            </TapButton>
            <Text style={styles.dockDot}>·</Text>
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

      <BuildShopModal
        visible={buildOpen}
        onClose={() => setBuildOpen(false)}
        vault={Math.max(0, vault)}
        placedIds={placedIds}
        districts={districts}
        onBuild={confirmPlace}
      />
    </ImageBackground>
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
    x.value = withTiming(28, { duration: 420, easing: Easing.in(Easing.cubic) });
    y.value = withTiming(-36, { duration: 420, easing: Easing.out(Easing.cubic) });
    fade.value = withTiming(0, { duration: 360 }, (finished) => {
      if (finished) runOnJS(onOpen)();
    });
  };

  const planeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value + bob.value }],
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
  grassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 36, 22, 0.12)',
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
    fontSize: type.size.sm,
    color: colors.parchment,
    letterSpacing: 0.6,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
  resourceStack: {
    position: 'absolute',
    right: space.md,
    top: 118,
    zIndex: 7,
    gap: space.md,
  },
  townBar: {
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
