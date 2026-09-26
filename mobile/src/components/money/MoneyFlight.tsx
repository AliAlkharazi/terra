import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { LastEvent } from '@/store/budgetStore';
import { heroPiece, visualPieces } from '@/engine/moneyVisual';
import { EuroNote } from './EuroNote';
import { EuroCoin } from './EuroCoin';

interface Point {
  x: number;
  y: number;
}

interface Props {
  event: LastEvent | null;
  vault: Point;
  fromBottom: Point;
  category?: Point;
  onImpact?: () => void;
}

function FlyingPiece({
  delay,
  start,
  end,
  piece,
  onDone,
}: {
  delay: number;
  start: Point;
  end: Point;
  piece: ReturnType<typeof heroPiece>;
  onDone?: () => void;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 1400, easing: Easing.bezier(0.22, 0.8, 0.28, 1) }, (finished) => {
        if (finished && onDone) runOnJS(onDone)();
      })
    );
  }, [delay, end.x, end.y, start.x, start.y]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const arc = Math.sin(p * Math.PI) * -90;
    const wiggle = Math.sin(p * Math.PI * 6) * 12 * (1 - p);
    const bend = Math.sin(p * Math.PI * 5) * 0.12;
    return {
      position: 'absolute' as const,
      left: start.x + (end.x - start.x) * p - 59,
      top: start.y + (end.y - start.y) * p + arc - 24,
      transform: [{ rotate: `${-16 + p * 28 + wiggle}deg` }, { scaleX: 1 + bend }, { scale: 0.55 + p * 0.2 - p * p * 0.4 }],
      opacity: p < 0.08 ? p / 0.08 : p > 0.88 ? (1 - p) / 0.12 : 1,
      zIndex: 40,
    };
  });

  return (
    <Animated.View pointerEvents="none" style={style}>
      {piece.kind === 'coin' ? (
        <EuroCoin value={piece.value as 1 | 2} />
      ) : (
        <EuroNote value={piece.value as 5 | 10 | 20 | 50 | 100} />
      )}
    </Animated.View>
  );
}

export function MoneyFlight({ event, vault, fromBottom, category, onImpact }: Props) {
  const [flight, setFlight] = React.useState<{
    key: number;
    start: Point;
    end: Point;
    pieces: ReturnType<typeof visualPieces>;
  } | null>(null);
  const seen = React.useRef(0);

  useEffect(() => {
    if (!event || event.nonce === seen.current || !event.amount) return;
    seen.current = event.nonce;
    const start = event.kind === 'income' ? fromBottom : vault;
    const end = event.kind === 'income' ? vault : (category ?? fromBottom);
    setFlight({ key: event.nonce, start, end, pieces: visualPieces(event.amount, 3) });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, [event, vault, fromBottom, category]);

  if (!flight) return null;

  const bump = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    onImpact?.();
  };

  return (
    <>
      {flight.pieces.map((piece, i) => (
        <FlyingPiece
          key={`${flight.key}-${i}`}
          delay={i * 90}
          start={{ x: flight.start.x + i * 10, y: flight.start.y }}
          end={flight.end}
          piece={piece}
          onDone={i === flight.pieces.length - 1 ? bump : undefined}
        />
      ))}
    </>
  );
}

export function useVaultPulse(token: number) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (!token) return;
    scale.value = withSequence(withSpring(1.08, { damping: 8, stiffness: 220 }), withSpring(1, { damping: 12, stiffness: 180 }));
  }, [token]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

export const pulseStyles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
});
