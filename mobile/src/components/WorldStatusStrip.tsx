import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TapButton } from '@/components/TapButton';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import type { TerraWorldViewDTO } from '@/types/worldView';

type Props = {
  worldView: TerraWorldViewDTO;
  onReadyPress: () => void;
  onLockedPress: () => void;
};

function centsToEuros(cents: number): number {
  return cents / 100;
}

/**
 * Thin WareTrack-style KPI strip — DTO fields only, not a card dashboard.
 */
export function WorldStatusStrip({ worldView, onReadyPress, onLockedPress }: Props) {
  const ready = centsToEuros(worldView.readyToAssignCents);
  const locked = centsToEuros(worldView.lockedTotalCents);
  const onTrack =
    worldView.meta?.onTrackDistrictCount ??
    worldView.districts.filter((d) => d.healthPct >= 55).length;

  return (
    <View style={styles.strip} accessibilityRole="summary">
      <TapButton style={styles.cell} onPress={onReadyPress} pressedScale={0.97} hoverScale={1.02}>
        <Text style={styles.label}>Ready</Text>
        <Text style={styles.value}>{formatEuro(ready, { cents: false })}</Text>
      </TapButton>
      <View style={styles.rule} />
      <TapButton style={styles.cell} onPress={onLockedPress} pressedScale={0.97} hoverScale={1.02}>
        <Text style={styles.label}>Frozen</Text>
        <Text style={styles.value}>{formatEuro(locked, { cents: false })}</Text>
      </TapButton>
      <View style={styles.rule} />
      <View style={styles.cell}>
        <Text style={styles.label}>On track</Text>
        <Text style={styles.value}>
          {onTrack}/{worldView.districts.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: space.md,
    marginBottom: space.sm,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(12, 18, 14, 0.55)',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(240,234,214,0.12)',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 1,
  },
  rule: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(240,234,214,0.16)',
    marginVertical: 4,
  },
  label: {
    fontFamily: type.body,
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.sage300,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: type.bodyBold,
    fontSize: 13,
    color: colors.parchment,
  },
});
