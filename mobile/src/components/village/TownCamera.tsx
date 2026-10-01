import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withDecay } from 'react-native-reanimated';
import { WORLD_CX, WORLD_CY, WORLD_H, WORLD_W } from './TownTerrain';

type Props = {
  children: React.ReactNode;
  /** Extra bottom inset so dock doesn't cover the focal area */
  bottomChrome?: number;
  topChrome?: number;
};

const MIN_SCALE = 0.42;
const MAX_SCALE = 1.8;

/**
 * Free-roam camera: drag to pan, pinch to zoom, inertia on release.
 * World is WORLD_W × WORLD_H; camera starts centered on the vault.
 */
export function TownCamera({ children, bottomChrome = 140, topChrome = 80 }: Props) {
  const { width: vw, height: vh } = useWindowDimensions();

  const scale = useSharedValue(0.7);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startTx = useSharedValue(0);
  const startTy = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  useEffect(() => {
    const usableH = vh - topChrome - bottomChrome;
    const s = 0.7;
    // screen = world * s + t  → place vault at viewport center
    scale.value = s;
    tx.value = vw / 2 - WORLD_CX * s;
    ty.value = topChrome + usableH / 2 - WORLD_CY * s;
  }, [vw, vh, topChrome, bottomChrome, scale, tx, ty]);

  const clampCamera = (nextTx: number, nextTy: number, s: number) => {
    'worklet';
    const minTx = vw - WORLD_W * s + 80;
    const maxTx = -80;
    const minTy = vh - WORLD_H * s + 80;
    const maxTy = -80;
    return {
      x: Math.min(maxTx, Math.max(minTx, nextTx)),
      y: Math.min(maxTy, Math.max(minTy, nextTy)),
    };
  };

  const pan = Gesture.Pan()
    .averageTouches(true)
    .minDistance(6)
    .onBegin(() => {
      startTx.value = tx.value;
      startTy.value = ty.value;
    })
    .onUpdate((e) => {
      const next = clampCamera(startTx.value + e.translationX, startTy.value + e.translationY, scale.value);
      tx.value = next.x;
      ty.value = next.y;
    })
    .onEnd((e) => {
      const s = scale.value;
      tx.value = withDecay({
        velocity: e.velocityX,
        clamp: [vw - WORLD_W * s + 80, -80],
      });
      ty.value = withDecay({
        velocity: e.velocityY,
        clamp: [vh - WORLD_H * s + 80, -80],
      });
    });

  const pinch = Gesture.Pinch()
    .onBegin((e) => {
      startScale.value = scale.value;
      startTx.value = tx.value;
      startTy.value = ty.value;
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onUpdate((e) => {
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, startScale.value * e.scale));
      const ratio = nextScale / scale.value;
      // Keep focal point stable: t' = f - (f - t) * (s'/s)
      // Using start values for stable pinch:
      const r0 = nextScale / startScale.value;
      const nextTx = focalX.value - (focalX.value - startTx.value) * r0;
      const nextTy = focalY.value - (focalY.value - startTy.value) * r0;
      scale.value = nextScale;
      const clamped = clampCamera(nextTx, nextTy, nextScale);
      tx.value = clamped.x;
      ty.value = clamped.y;
      // silence unused
      void ratio;
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  // RN scales from the view center — compensate so pan math stays top-left based:
  // screen = world * s + t
  const cameraStyle = useAnimatedStyle(() => {
    const s = scale.value;
    return {
      transform: [
        { translateX: tx.value + WORLD_CX * (s - 1) },
        { translateY: ty.value + WORLD_CY * (s - 1) },
        { scale: s },
      ],
    };
  });

  return (
    <View style={styles.viewport}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.world, { width: WORLD_W, height: WORLD_H }, cameraStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#2A4A22',
  },
  world: {},
});
