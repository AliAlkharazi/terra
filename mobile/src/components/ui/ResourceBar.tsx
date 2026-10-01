import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EuroCoin } from '@/components/money/EuroCoin';
import { formatDots } from '@/theme/money';
import { colors, radius, space, type } from '@/theme/tokens';

type Props = {
  /** Current amount (fills the bar) */
  value: number;
  /** Capacity / max for the fill ratio */
  max: number;
  /** Optional label above the bar (e.g. Max: 1.000) */
  showMax?: boolean;
  fillColor?: string;
  style?: object;
};

/**
 * Clash-of-Clans style resource pill — fill + outlined amount + euro coin cap.
 */
export function ResourceBar({
  value,
  max,
  showMax = true,
  fillColor = '#E8C45A',
  style,
}: Props) {
  const cap = Math.max(1, max);
  const pct = Math.max(0, Math.min(1, value / cap));

  return (
    <View style={[styles.wrap, style]}>
      {showMax ? <Text style={styles.max}>Max: {formatDots(cap)}</Text> : null}
      <View style={styles.row}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: fillColor }]} />
          <Text style={styles.value} numberOfLines={1}>
            {formatDots(value)}
          </Text>
        </View>
        <View style={styles.coin}>
          <EuroCoin value={2} size={40} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 168,
  },
  max: {
    fontFamily: type.bodyBold,
    fontSize: type.size.micro,
    color: '#FFFFFF',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 3,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    flex: 1,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(12,18,14,0.62)',
    borderWidth: 2,
    borderColor: '#1A1208',
    overflow: 'hidden',
    justifyContent: 'center',
    paddingRight: 22,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
  },
  value: {
    fontFamily: type.bodyBold,
    fontSize: type.size.sm,
    color: '#FFFFFF',
    textAlign: 'right',
    paddingHorizontal: space.sm,
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  coin: {
    marginLeft: -18,
    zIndex: 2,
  },
});
