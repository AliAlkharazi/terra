import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  pressedScale?: number;
  hoverScale?: number;
  style?: StyleProp<ViewStyle>;
};

export function TapButton({
  children,
  style,
  disabled,
  pressedScale = 0.94,
  hoverScale = 1.05,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const dim = useSharedValue(1);
  const lift = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: lift.value }],
    opacity: dim.value,
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      style={[style, animatedStyle, disabled ? { opacity: 0.38 } : null]}
      onHoverIn={(event) => {
        if (!disabled) {
          scale.value = withSpring(hoverScale, { damping: 16, stiffness: 280, mass: 0.3 });
          lift.value = withSpring(-2, { damping: 14, stiffness: 260 });
        }
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        scale.value = withSpring(1, { damping: 12, stiffness: 260, mass: 0.35 });
        lift.value = withSpring(0, { damping: 12, stiffness: 260 });
        onHoverOut?.(event);
      }}
      onPressIn={(event) => {
        if (!disabled) {
          scale.value = withSpring(pressedScale, { damping: 16, stiffness: 420, mass: 0.35 });
          dim.value = withTiming(0.86, { duration: 70 });
          lift.value = withSpring(0, { damping: 16, stiffness: 320 });
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 12, stiffness: 280, mass: 0.35 });
        dim.value = withTiming(1, { duration: 140 });
        onPressOut?.(event);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
