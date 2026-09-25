import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { useAuthStore } from '@/store/authStore';
import { narratorLine } from '@/engine/worldEngine';
import { DistrictTile } from '@/components/DistrictTile';
import { WorldWebView } from '@/components/WorldWebView';
import { Scene3DBoundary } from '@/components/Scene3DBoundary';
import { colors, radius, space, type } from '@/theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'World'>;

const SEASON_GRADIENT: Record<string, [string, string]> = {
  spring: [colors.moss700, colors.moss900],
  summer: [colors.moss600, colors.moss900],
  autumn: [colors.moss800, colors.moss900],
  winter: [colors.moss900, '#0B140F'],
};

export function WorldScreen({ navigation }: Props) {
  const districts = useBudgetStore((s) => s.districts);
  const getSnapshot = useBudgetStore((s) => s.getSnapshot);
  const getBankSnapshot = useBudgetStore((s) => s.getBankSnapshot);
  const lastEvent = useBudgetStore((s) => s.lastEvent);
  const transactions = useBudgetStore((s) => s.transactions);
  const mode = useAuthStore((s) => s.mode);
  const email = useAuthStore((s) => s.email);
  const logout = useAuthStore((s) => s.logout);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [is3DAvailable, setIs3DAvailable] = useState(true);
  const [wants3D, setWants3D] = useState(true);

  const snapshot = useMemo(() => getSnapshot(), [getSnapshot, districts, transactions]);
  const bankSnapshot = useMemo(() => getBankSnapshot(), [getBankSnapshot, transactions]);
  const gradient = SEASON_GRADIENT[snapshot.season];
  const line = narratorLine(snapshot);
  const showFlatGrid = !wants3D || !is3DAvailable;

  return (
    <LinearGradient colors={gradient} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>
                {snapshot.season.toUpperCase()} · {snapshot.month}
                {mode === 'synced' && email ? ` · ${email}` : ' · offline'}
              </Text>
              <Text style={styles.title}>Terra</Text>
            </View>
            <View style={styles.headerButtons}>
              {is3DAvailable && (
                <Pressable style={styles.viewToggle} onPress={() => setWants3D((v) => !v)}>
                  <Text style={styles.viewToggleText}>{wants3D ? '⊞ Grid' : '◆ 3D'}</Text>
                </Pressable>
              )}
              {mode === 'synced' && (
                <Pressable style={styles.viewToggle} onPress={logout}>
                  <Text style={styles.viewToggleText}>Log out</Text>
                </Pressable>
              )}
            </View>
          </View>
          <Text style={styles.narrator}>{line}</Text>
          <Pressable style={styles.unityLink} onPress={() => navigation.navigate('UnityWorld')}>
            <Text style={styles.unityLinkText}>Unity host</Text>
          </Pressable>
        </View>

        {showFlatGrid ? (
          <FlatList
            data={snapshot.districts}
            numColumns={3}
            keyExtractor={(d) => d.districtId}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => {
              const district = districts.find((d) => d.id === item.districtId)!;
              return (
                <DistrictTile
                  district={district}
                  state={item}
                  onPress={() => navigation.navigate('DistrictDetail', { districtId: item.districtId })}
                />
              );
            }}
          />
        ) : (
          <View style={styles.canvasWrap}>
            {/* Interim picture. The CoC-quality World is the Unity project, not this WebView. */}
            <Scene3DBoundary fallback={<View style={styles.canvasWrap} />} onError={() => setIs3DAvailable(false)}>
              <WorldWebView
                districts={districts}
                districtStates={snapshot.districts}
                bankState={bankSnapshot}
                lastEvent={lastEvent}
                onDistrictPress={(districtId) =>
                  navigation.navigate('DistrictDetail', { districtId: districtId as any })
                }
              />
            </Scene3DBoundary>
            <Text style={styles.hint}>Drag to orbit · tap a building to open its district</Text>
          </View>
        )}

        <Pressable style={styles.drawerHandle} onPress={() => setDrawerOpen((o) => !o)}>
          <View style={styles.handleBar} />
          <Text style={styles.drawerLabel}>
            {drawerOpen ? 'Hide numbers' : `$${snapshot.totalSpent.toFixed(0)} of $${snapshot.totalBudget.toFixed(0)}`}
          </Text>
        </Pressable>

        {drawerOpen && (
          <View style={styles.drawer}>
            <Text style={styles.drawerBig}>
              ${snapshot.totalSpent.toFixed(2)}
              <Text style={styles.drawerSmall}> / ${snapshot.totalBudget.toFixed(2)}</Text>
            </Text>
            <Text style={styles.drawerSub}>
              Overall health: {snapshot.overallHealthPct}% · Bank: ${bankSnapshot.totalSaved.toFixed(0)} saved ({bankSnapshot.floors} floor{bankSnapshot.floors === 1 ? '' : 's'})
            </Text>
          </View>
        )}

        <Pressable style={styles.fab} onPress={() => navigation.navigate('AddTransaction', {})}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerText: { flex: 1 },
  headerButtons: { flexDirection: 'row', gap: space.xs },
  viewToggle: { backgroundColor: colors.moss700, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.xs, marginTop: space.xs },
  viewToggleText: { fontFamily: type.bodyBold, fontSize: type.size.xs, color: colors.parchment },
  eyebrow: { fontFamily: type.bodyBold, fontSize: type.size.xs, color: colors.sage300, letterSpacing: 1.5 },
  title: { fontFamily: type.display, fontSize: type.size.display, color: colors.parchment, marginTop: space.xs },
  narrator: { fontFamily: type.body, fontSize: type.size.base, color: colors.textOnMossDim, marginTop: space.sm },
  unityLink: {
    alignSelf: 'flex-start',
    marginTop: space.sm,
    backgroundColor: colors.moss700,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  unityLinkText: { fontFamily: type.bodyBold, fontSize: type.size.xs, color: colors.parchment },
  grid: { paddingHorizontal: space.md, paddingTop: space.md, paddingBottom: space.xxl * 2 },
  canvasWrap: { flex: 1, marginBottom: space.xxl * 2 },
  hint: { position: 'absolute', bottom: space.sm, alignSelf: 'center', fontFamily: type.body, fontSize: type.size.xs, color: colors.textOnMossDim },
  drawerHandle: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.parchment,
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingVertical: space.sm, alignItems: 'center',
  },
  handleBar: { width: 36, height: 4, borderRadius: radius.pill, backgroundColor: colors.textOnParchmentDim, marginBottom: space.xs },
  drawerLabel: { fontFamily: type.mono, fontSize: type.size.base, color: colors.textOnParchment },
  drawer: { position: 'absolute', bottom: 56, left: 0, right: 0, backgroundColor: colors.parchment, paddingHorizontal: space.lg, paddingVertical: space.md },
  drawerBig: { fontFamily: type.mono, fontSize: type.size.xxl, color: colors.textOnParchment },
  drawerSmall: { fontSize: type.size.base, color: colors.textOnParchmentDim },
  drawerSub: { fontFamily: type.body, fontSize: type.size.sm, color: colors.textOnParchmentDim, marginTop: space.xs },
  fab: {
    position: 'absolute', bottom: 130, right: space.lg, width: 56, height: 56, borderRadius: radius.pill,
    backgroundColor: colors.ember500, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { fontFamily: type.display, fontSize: 28, color: colors.moss900, marginTop: -2 },
});
