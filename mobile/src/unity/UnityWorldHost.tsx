import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DistrictId } from '@/types';
import type { UnitySetDistrictsMessage } from '@/unity/bridge';
import { colors, healthColor, radius, space, type } from '@/theme/tokens';

interface Props {
  message: UnitySetDistrictsMessage;
  onBack: () => void;
  onDistrictPress: (key: DistrictId) => void;
}

export function UnityWorldHost({ message, onBack, onDistrictPress }: Props) {
  return (
    <View style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.topBar}>
          <Pressable onPress={onBack} style={styles.back}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.title}>Unity host</Text>
          <View style={styles.back} />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>No 3D in this screen</Text>
            <Text style={styles.bannerBody}>
              The town is the Unity project in unity/. Expo Go cannot embed that view. This host only shows the
              district message the next embed will send to TerraBridge.Receive.
            </Text>
          </View>

          {message.districts.map((district) => (
            <Pressable key={district.key} style={styles.row} onPress={() => onDistrictPress(district.key)}>
              <View style={[styles.swatch, { backgroundColor: healthColor(district.healthPct) }]} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>
                  {district.icon} {district.label}
                </Text>
                <Text style={styles.rowMeta}>
                  {district.key} · budget {district.monthlyBudget} · spent {district.spent} · health {district.healthPct}%
                </Text>
              </View>
            </Pressable>
          ))}

          <Text style={styles.jsonLabel}>setDistricts</Text>
          <Text style={styles.json}>{JSON.stringify(message, null, 2)}</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.parchment },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingTop: space.xs,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.parchmentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 18, color: colors.moss800 },
  title: { fontFamily: type.bodyBold, fontSize: 16, color: colors.moss900 },
  body: { padding: space.md, paddingBottom: space.xxl },
  banner: {
    backgroundColor: colors.moss800,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.md,
  },
  bannerTitle: { fontFamily: type.bodyBold, fontSize: type.size.base, color: colors.parchment },
  bannerBody: { fontFamily: type.body, fontSize: type.size.sm, color: colors.sage300, marginTop: space.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.parchmentDim,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.sm,
  },
  swatch: { width: 10, height: 36, borderRadius: radius.pill },
  rowText: { flex: 1 },
  rowTitle: { fontFamily: type.bodyBold, fontSize: type.size.base, color: colors.textOnParchment },
  rowMeta: { fontFamily: type.body, fontSize: type.size.xs, color: colors.textOnParchmentDim, marginTop: 2 },
  jsonLabel: {
    fontFamily: type.bodyBold,
    fontSize: type.size.xs,
    color: colors.textOnParchmentDim,
    marginTop: space.md,
    marginBottom: space.xs,
    letterSpacing: 1,
  },
  json: {
    fontFamily: type.mono,
    fontSize: 12,
    color: colors.moss900,
    backgroundColor: '#E7E1D2',
    borderRadius: radius.sm,
    padding: space.md,
  },
});
