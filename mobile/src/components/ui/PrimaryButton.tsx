import React from 'react';
import { Text, type StyleProp, type ViewStyle } from 'react-native';
import { TapButton } from '@/components/TapButton';
import { ui } from '@/theme/ui';

type Variant = 'primary' | 'secondary' | 'ember';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
};

const btnStyle = {
  primary: ui.primaryBtn,
  secondary: ui.secondaryBtn,
  ember: ui.emberBtn,
} as const;

const textStyle = {
  primary: ui.primaryBtnText,
  secondary: ui.secondaryBtnText,
  ember: ui.emberBtnText,
} as const;

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
  style,
}: Props) {
  return (
    <TapButton
      onPress={onPress}
      disabled={disabled}
      style={[btnStyle[variant], style]}
      pressedScale={0.96}
      hoverScale={1.02}
    >
      <Text style={textStyle[variant]}>{label}</Text>
    </TapButton>
  );
}
