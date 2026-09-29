import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { District, AllocationState } from '@/types';
import { colors, radius, shadow, space, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import { CategoryIcon } from '@/components/CategoryIcon';

interface Props {
  district: District;
  state: AllocationState;
  onPress: () => void;
}

export function DistrictCard({ district, state, onPress }: Props) {
  const accentColor = state.isOverspent ? colors.coral500 : colors.sage500;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <CategoryIcon name={district.id} size={20} color={colors.parchment} />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {district.label}
        </Text>
        <Text style={[styles.available, state.isOverspent && styles.availableOverspent]}>
          {formatEuro(state.available, { cents: false })}
        </Text>

        {state.target && state.targetProgressPct !== null && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${state.targetProgressPct}%` }]} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 104,
    backgroundColor: colors.moss700,
    borderRadius: radius.md,
    marginRight: space.sm,
    marginBottom: space.sm,
    overflow: 'hidden',
    ...shadow.soft,
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  accentBar: { height: 3, width: '100%' },
  body: { padding: space.group, alignItems: 'center', gap: space.xs },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.moss800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: type.bodyBold,
    fontSize: type.size.xs,
    color: colors.parchment,
    textAlign: 'center',
  },
  available: {
    fontFamily: type.mono,
    fontSize: type.size.sm,
    color: colors.sage500,
  },
  availableOverspent: { color: colors.coral500 },
  progressTrack: {
    height: 4,
    width: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.moss800,
    marginTop: space.xs,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.gold500, borderRadius: radius.pill },
});
