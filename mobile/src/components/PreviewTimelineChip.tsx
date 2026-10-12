import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { TapButton } from '@/components/TapButton';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import type { MonthPreviewChipSummary } from '@/engine/preview';

type Props = {
  summary: MonthPreviewChipSummary;
  onPress: () => void;
};

/**
 * WareTrack timeline analog — one short Preview chip (no charts).
 */
export function PreviewTimelineChip({ summary, onPress }: Props) {
  const unlockLabel =
    summary.unlockCount === 0
      ? 'no unlocks'
      : `${summary.unlockCount} unlock${summary.unlockCount === 1 ? '' : 's'}`;

  return (
    <TapButton style={styles.chip} onPress={onPress} pressedScale={0.97} hoverScale={1.02}>
      <Text style={styles.text}>
        Next {summary.nextShort} · {unlockLabel} · ends {formatEuro(summary.endNext, { cents: false })}
      </Text>
    </TapButton>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'center',
    marginHorizontal: space.md,
    marginBottom: space.sm,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(18,40,26,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(240,234,214,0.14)',
  },
  text: {
    fontFamily: type.bodyBold,
    fontSize: 12,
    color: colors.parchment,
    letterSpacing: 0.2,
  },
});
