import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import type { AllocationState, District, DistrictId, PocketId } from '@/types';
import { colors, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import { themeFor } from '@/theme/categoryTheme';
import { BUILDING_BY_ID, SceneSparkles, VaultBuilding } from './buildings';

interface Props {
  districts: District[];
  allocationStates: AllocationState[];
  vaultAmount: number;
  lockedAmount?: number;
  onDistrictPress: (districtId: DistrictId) => void;
  onVaultPress: () => void;
}

const SCENE_W = 440;
const SCENE_H = 400;
/** Slightly smaller buildings + wider pad grid → less clumping */
const VAULT_SIZE = 176;
const BUILDING_SIZE = 142;

type Pad = { x: number; y: number; rx: number; ry: number; theme?: PocketId };

const CX = 220;
const CY = 196;
/** Horizontal / vertical pad spacing (isometric village grid) */
const DX = 114;
const DY = 82;

const PADS: Record<string, Pad> = {
  dining: { x: CX - DX, y: CY - DY, rx: 36, ry: 15, theme: 'dining' },
  property: { x: CX + DX, y: CY - DY, rx: 36, ry: 15, theme: 'property' },
  vault: { x: CX, y: CY, rx: 46, ry: 19, theme: 'vault' },
  groceries: { x: CX - DX, y: CY + DY, rx: 36, ry: 15, theme: 'groceries' },
  bills: { x: CX + DX, y: CY + DY, rx: 36, ry: 15, theme: 'bills' },
  transport: { x: CX, y: CY + DY + 30, rx: 36, ry: 15, theme: 'transport' },
};

function GrassPad({ pad }: { pad: Pad }) {
  const theme = pad.theme ? themeFor(pad.theme) : null;
  return (
    <>
      <Ellipse cx={pad.x} cy={pad.y + 8} rx={pad.rx} ry={pad.ry} fill={theme?.padShadow ?? '#3A6F34'} />
      <Ellipse cx={pad.x} cy={pad.y} rx={pad.rx} ry={pad.ry} fill={theme?.pad ?? '#8FCB62'} opacity={0.92} />
      <Ellipse
        cx={pad.x}
        cy={pad.y - pad.ry * 0.12}
        rx={pad.rx * 0.48}
        ry={pad.ry * 0.38}
        fill={theme?.ink ?? '#B6E07A'}
        opacity={0.28}
      />
    </>
  );
}

function place(pad: Pad, size: number, sceneW: number, sceneH: number) {
  return {
    left: (pad.x / SCENE_W) * sceneW - size / 2,
    top: (pad.y / SCENE_H) * sceneH - size * 0.82,
    width: size,
    zIndex: Math.round(pad.y),
  };
}

const HIT = 52;

function hitBox(pad: Pad, sceneW: number, sceneH: number, extra = 0) {
  const w = HIT + extra;
  const h = HIT + 18;
  return {
    left: (pad.x / SCENE_W) * sceneW - w / 2,
    top: (pad.y / SCENE_H) * sceneH - h * 0.72,
    width: w,
    height: h,
    zIndex: Math.round(pad.y) + 80,
  };
}

export function VillageMap({
  districts,
  allocationStates,
  vaultAmount,
  lockedAmount = 0,
  onDistrictPress,
  onVaultPress,
}: Props) {
  const { width } = useWindowDimensions();
  const sceneW = Math.min(width - 16, 440);
  const sceneH = sceneW * (SCENE_H / SCENE_W);

  const vaultLayout = place(PADS.vault, VAULT_SIZE, sceneW, sceneH);

  const spots = districts
    .filter((d) => !d.isCreditCard && d.id in PADS && d.id in BUILDING_BY_ID)
    .map((district) => {
      const pad = PADS[district.id];
      const state = allocationStates.find((s) => s.districtId === district.id);
      const Building = BUILDING_BY_ID[district.id as Exclude<DistrictId, 'credit_card_payment'>];
      return { district, pad, state, Building };
    })
    .sort((a, b) => a.pad.y - b.pad.y);

  return (
    <View style={[styles.island, { width: sceneW, height: sceneH }]}>
      <Svg width={sceneW} height={sceneH} viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="discTop" cx="50%" cy="38%" r="72%">
            <Stop offset="0%" stopColor="#A6DC72" />
            <Stop offset="42%" stopColor="#78C050" />
            <Stop offset="100%" stopColor="#4C8C38" />
          </RadialGradient>
          <RadialGradient id="vaultGlow" cx="50%" cy="46%" r="24%">
            <Stop offset="0%" stopColor="#FFE08A" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#FFE08A" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Ellipse cx={CX} cy={CY + 22} rx="204" ry="104" fill="#2F6A34" />
        <Ellipse cx={CX} cy={CY + 4} rx="204" ry="104" fill="url(#discTop)" />

        <Ellipse cx={CX} cy={CY} rx="118" ry="54" fill="none" stroke="#E8C45A" strokeWidth="4.5" />
        <Ellipse cx={CX} cy={CY} rx="118" ry="54" fill="none" stroke="#FFE9A8" strokeWidth="1.6" opacity={0.75} />

        <Ellipse cx={CX} cy={CY - 28} rx="88" ry="68" fill="url(#vaultGlow)" />

        {Object.values(PADS).map((pad) => (
          <GrassPad key={`${pad.x}-${pad.y}`} pad={pad} />
        ))}

        <SceneSparkles />
      </Svg>

      <View pointerEvents="none" style={[styles.spot, vaultLayout]}>
        <VaultBuilding size={VAULT_SIZE} />
        <Text style={[styles.caption, { color: themeFor('vault').ink }]}>Main Vault</Text>
        <Text style={[styles.amount, { color: themeFor('vault').accent }]}>{formatEuro(vaultAmount)}</Text>
        {lockedAmount > 0 ? (
          <Text style={[styles.amount, { color: themeFor('vault').ink, fontSize: 11 }]}>
            Frozen {formatEuro(lockedAmount, { cents: false })}
          </Text>
        ) : null}
      </View>

      {spots.map(({ district, pad, state, Building }) => (
        <View key={district.id} pointerEvents="none" style={[styles.spot, place(pad, BUILDING_SIZE, sceneW, sceneH)]}>
          <Building size={BUILDING_SIZE} overspent={state?.isOverspent} />
          <Text style={[styles.caption, { color: themeFor(district.id).ink }]} numberOfLines={1}>
            {district.label}
          </Text>
          <Text style={[styles.amount, { color: themeFor(district.id).accent }, state?.isOverspent && styles.amountOverspent]}>
            {formatEuro(state?.available ?? 0, { cents: false })}
          </Text>
        </View>
      ))}

      <Pressable onPress={onVaultPress} style={[styles.hit, hitBox(PADS.vault, sceneW, sceneH, 14)]} />
      {spots.map(({ district, pad }) => (
        <Pressable
          key={`hit-${district.id}`}
          onPress={() => onDistrictPress(district.id)}
          style={[styles.hit, hitBox(pad, sceneW, sceneH)]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  island: {
    alignSelf: 'center',
  },
  spot: {
    position: 'absolute',
    alignItems: 'center',
  },
  hit: {
    position: 'absolute',
  },
  caption: {
    marginTop: -4,
    fontFamily: type.bodyBold,
    fontSize: type.size.sm,
    color: '#FFF8E4',
    textAlign: 'center',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(8, 14, 10, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  amount: {
    marginTop: 2,
    fontFamily: type.mono,
    fontSize: type.size.sm,
    color: colors.inkGold,
    textAlign: 'center',
    textShadowColor: 'rgba(8, 14, 10, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  amountOverspent: {
    color: colors.coral500,
  },
});
