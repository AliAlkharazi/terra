import React from 'react';
import { Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { TapButton } from '@/components/TapButton';
import { ui } from '@/theme/ui';

type Variant = 'primary' | 'secondary' | 'ember' | 'parchment' | 'ghostMoss';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const btnStyle = {
  primary: ui.primaryBtn,
  secondary: ui.secondaryBtn,
  ember: ui.emberBtn,
  parchment: ui.parchmentBtn,
  ghostMoss: ui.ghostBtnOnMoss,
} as const;

const textStyleMap = {
  primary: ui.primaryBtnText,
  secondary: ui.secondaryBtnText,
  ember: ui.emberBtnText,
  parchment: ui.parchmentBtnText,
  ghostMoss: ui.ghostBtnOnMossText,
} as const;

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
  style,
  textStyle,
}: Props) {
  return (
    <TapButton
      onPress={onPress}
      disabled={disabled}
      style={[btnStyle[variant], style]}
      pressedScale={0.96}
      hoverScale={1.02}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[textStyleMap[variant], textStyle]}>{label}</Text>
    </TapButton>
  );
}
