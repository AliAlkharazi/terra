import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { forecastChipLabel, formatEuroFromCents, isVisibleForecast } from '@/forecast/display';
import { District, DistrictForecast, DistrictState } from '@/types';
import { colors, radius, space, type, healthColor } from '@/theme/tokens';

interface Props {
  district: District;
  state: DistrictState;
  forecast: DistrictForecast | null;
  onPress: () => void;
}

export function DistrictTile({ district, state, forecast, onPress }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handlePressIn = () => { scale.value = withSpring(0.95); };
  const handlePressOut = () => { scale.value = withSpring(1); };

  const health = state.healthPct;
  const color = healthColor(health);
  const plantScale = 0.5 + (health / 100) * 0.6;
  const droop = health < 40 ? (40 - health) * 0.6 : 0;

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.tile, animatedStyle]}>
        <Svg width={72} height={72} viewBox="0 0 72 72">
          <Ellipse cx={36} cy={58} rx={26} ry={8} fill={colors.moss700} />
          <PlantGlyph scale={plantScale} droopDeg={droop} color={color} />
        </Svg>
        <Text style={styles.icon}>{district.icon}</Text>
        <Text style={styles.label}>{district.label}</Text>
        <Text style={[styles.pct, { color }]}>{health}%</Text>
        {isVisibleForecast(forecast) ? (
          <Text
            style={styles.estimate}
            numberOfLines={1}
            accessibilityLabel={`Next-month estimate ${formatEuroFromCents(forecast.predictedNextMonthCents)}`}
          >
            {forecastChipLabel(forecast.predictedNextMonthCents)}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function PlantGlyph({ scale, droopDeg, color }: { scale: number; droopDeg: number; color: string }) {
  return (
    <Path
      d={`M36 58 C36 ${58 - 22 * scale} ${36 - 10 * scale} ${58 - 30 * scale} 36 ${58 - 34 * scale} C${36 + 10 * scale} ${58 - 30 * scale} 36 ${58 - 22 * scale} 36 58 Z`}
      fill={color}
      transform={`rotate(${droopDeg} 36 58)`}
      opacity={0.9}
    />
  );
}

const styles = StyleSheet.create({
  tile: { width: 96, alignItems: 'center', paddingVertical: space.sm, borderRadius: radius.md },
  icon: { fontSize: 18, marginTop: -8 },
  label: { fontFamily: type.body, fontSize: type.size.xs, color: colors.textOnMoss, marginTop: 2 },
  pct: { fontFamily: type.bodyBold, fontSize: type.size.xs, marginTop: 2 },
  estimate: { width: '100%', fontFamily: type.body, fontSize: type.size.xs, color: colors.sage300, marginTop: 2, textAlign: 'center' },
});
