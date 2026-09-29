import React from 'react';
import { Text, type StyleProp, type ViewStyle } from 'react-native';
import { TapButton } from '@/components/TapButton';
import { ui } from '@/theme/ui';

type Props = {
  onPress: () => void;
  /** Use on dark (moss) backgrounds */
  tone?: 'parchment' | 'moss';
  style?: StyleProp<ViewStyle>;
};

export function BackButton({ onPress, tone = 'parchment', style }: Props) {
  const moss = tone === 'moss';
  return (
    <TapButton
      onPress={onPress}
      style={[moss ? ui.backBtnOnMoss : ui.backBtn, style]}
      pressedScale={0.92}
      accessibilityRole="button"
      accessibilityLabel="Back"
    >
      <Text style={moss ? ui.backGlyphOnMoss : ui.backGlyph}>←</Text>
    </TapButton>
  );
}
