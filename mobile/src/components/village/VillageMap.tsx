import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import type { AllocationState, District, DistrictId, PocketId } from '@/types';
import { colors, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import { themeFor } from '@/theme/categoryTheme';
import { buildingLevel } from '@/engine/buildings';
import { BUILDING_BY_ID, EmptyPlotBuilding, SceneSparkles, VaultBuilding } from './buildings';

interface Props {
  districts: District[];
  allocationStates: AllocationState[];
  vaultAmount: number;
  lockedAmount?: number;
  /** districtId → lifetime funded (0 / missing = empty plot) */
  placedFunded: Partial<Record<DistrictId, number>>;
  onDistrictPress: (districtId: DistrictId) => void;
  onEmptyPlotPress: (districtId: DistrictId) => void;
  onVaultPress: () => void;
}

const SCENE_W = 520;
const SCENE_H = 480;
const VAULT_SIZE = 176;
const BUILDING_SIZE = 132;
const EMPTY_SIZE = 110;

type PlaceableId = keyof typeof BUILDING_BY_ID;

type Pad = { x: number; y: number; rx: number; ry: number; theme?: PocketId };

const CX = 260;
const CY = 228;
const DX = 96;
const DY = 70;

/** Isometric-ish grid offsets (col, row) → pad around vault. */
const GRID: Record<PlaceableId, [number, number]> = {
  dining: [-1, -1],
  property: [1, -1],
  groceries: [-1, 1],
  bills: [1, 1],
  transport: [0, 1.45],
  supermarket: [-2, 0],
  cinema: [2, 0],
  library: [0, -2],
  university: [-2, -1],
  hospital: [2, -1],
  school: [-2, 1],
  factory: [2, 1],
  office: [1, 2],
  mall: [-1, 2],
  car_workshop: [1, -2],
};

function padAt(col: number, row: number, theme: PocketId): Pad {
  return {
    x: CX + col * DX,
    y: CY + row * DY,
    rx: 32,
    ry: 13,
    theme,
  };
}

const PADS: Record<string, Pad> = {
  vault: { x: CX, y: CY, rx: 46, ry: 19, theme: 'vault' },
  ...Object.fromEntries(
    (Object.entries(GRID) as [PlaceableId, [number, number]][]).map(([id, [col, row]]) => [
      id,
      padAt(col, row, id),
    ])
  ),
};

function GrassPad({ pad, empty }: { pad: Pad; empty?: boolean }) {
  const theme = pad.theme ? themeFor(pad.theme) : null;
  const padFill = empty ? '#6FA84A' : theme?.pad ?? '#8FCB62';
  return (
    <>
      <Ellipse cx={pad.x} cy={pad.y + 8} rx={pad.rx} ry={pad.ry} fill={theme?.padShadow ?? '#3A6F34'} />
      <Ellipse cx={pad.x} cy={pad.y} rx={pad.rx} ry={pad.ry} fill={padFill} opacity={empty ? 0.7 : 0.92} />
      <Ellipse
        cx={pad.x}
        cy={pad.y - pad.ry * 0.12}
        rx={pad.rx * 0.48}
        ry={pad.ry * 0.38}
        fill={theme?.ink ?? '#B6E07A'}
        opacity={empty ? 0.14 : 0.28}
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

const HIT = 54;

function hitBox(pad: Pad, sceneW: number, sceneH: number, extra = 0) {
  const w = HIT + extra;
  const h = HIT + 22;
  return {
    left: (pad.x / SCENE_W) * sceneW - w / 2,
    top: (pad.y / SCENE_H) * sceneH - h * 0.7,
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
  placedFunded,
  onDistrictPress,
  onEmptyPlotPress,
  onVaultPress,
}: Props) {
  const { width } = useWindowDimensions();
  const sceneW = Math.min(width - 16, SCENE_W);
  const sceneH = sceneW * (SCENE_H / SCENE_W);

  const vaultLayout = place(PADS.vault, VAULT_SIZE, sceneW, sceneH);

  const padKeys = useMemo(() => new Set(Object.keys(PADS)), []);

  const spots = districts
    .filter((d) => !d.isCreditCard && d.id in BUILDING_BY_ID && padKeys.has(d.id))
    .map((district) => {
      const pad = PADS[district.id];
      const state = allocationStates.find((s) => s.districtId === district.id);
      const funded = placedFunded[district.id];
      const placed = funded != null && funded > 0;
      const level = placed ? buildingLevel(funded) : 0;
      const Building = BUILDING_BY_ID[district.id as PlaceableId];
      return { district, pad, state, Building, placed, level, funded: funded ?? 0 };
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

        <Ellipse cx={CX} cy={CY + 26} rx="238" ry="118" fill="#2F6A34" />
        <Ellipse cx={CX} cy={CY + 6} rx="238" ry="118" fill="url(#discTop)" />

        <Ellipse cx={CX} cy={CY} rx="132" ry="60" fill="none" stroke={colors.vaultGold} strokeWidth="4.5" />
        <Ellipse cx={CX} cy={CY} rx="132" ry="60" fill="none" stroke={colors.inkGoldBright} strokeWidth="1.6" opacity={0.75} />

        <Ellipse cx={CX} cy={CY - 28} rx="96" ry="72" fill="url(#vaultGlow)" />

        {Object.entries(PADS).map(([key, pad]) => {
          if (key === 'vault') return <GrassPad key={key} pad={pad} />;
          const funded = placedFunded[key as DistrictId];
          const empty = funded == null || funded <= 0;
          return <GrassPad key={key} pad={pad} empty={empty} />;
        })}

        <SceneSparkles />
      </Svg>

      <View pointerEvents="none" style={[styles.spot, vaultLayout]}>
        <VaultBuilding size={VAULT_SIZE} />
        <Text style={[styles.caption, { color: themeFor('vault').ink }]}>Main Vault</Text>
        <Text style={[styles.amount, { color: themeFor('vault').accent }]}>{formatEuro(vaultAmount)}</Text>
        {lockedAmount > 0 ? (
          <Text style={[styles.amount, styles.frozenAmt, { color: themeFor('vault').ink }]}>
            Frozen {formatEuro(lockedAmount, { cents: false })}
          </Text>
        ) : null}
      </View>

      {spots.map(({ district, pad, state, Building, placed, level }) => (
        <View
          key={district.id}
          pointerEvents="none"
          style={[styles.spot, place(pad, placed ? BUILDING_SIZE : EMPTY_SIZE, sceneW, sceneH)]}
        >
          {placed ? (
            <Building size={BUILDING_SIZE} overspent={state?.isOverspent} />
          ) : (
            <EmptyPlotBuilding size={EMPTY_SIZE} />
          )}
          <Text style={[styles.caption, { color: themeFor(district.id).ink }]} numberOfLines={1}>
            {placed ? district.label : 'Build'}
          </Text>
          {placed ? (
            <>
              <Text
                style={[
                  styles.amount,
                  { color: themeFor(district.id).accent },
                  state?.isOverspent && styles.amountOverspent,
                ]}
              >
                {formatEuro(state?.available ?? 0, { cents: false })}
              </Text>
              <Text style={styles.level}>Lv {level}</Text>
            </>
          ) : (
            <Text style={styles.amountDim}>{district.label}</Text>
          )}
        </View>
      ))}

      <Pressable onPress={onVaultPress} style={[styles.hit, hitBox(PADS.vault, sceneW, sceneH, 14)]} />
      {spots.map(({ district, pad, placed }) => (
        <Pressable
          key={`hit-${district.id}`}
          onPress={() => (placed ? onDistrictPress(district.id) : onEmptyPlotPress(district.id))}
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
    paddingHorizontal: 4,
  },
  hit: {
    position: 'absolute',
  },
  caption: {
    marginTop: -2,
    maxWidth: '100%',
    fontFamily: type.bodyBold,
    fontSize: type.size.xs,
    color: colors.inkGoldBright,
    textAlign: 'center',
    letterSpacing: 0.15,
    textShadowColor: 'rgba(8, 14, 10, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  amount: {
    marginTop: 2,
    maxWidth: '100%',
    fontFamily: type.mono,
    fontSize: type.size.xs,
    color: colors.inkGold,
    textAlign: 'center',
    textShadowColor: 'rgba(8, 14, 10, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  amountDim: {
    marginTop: 2,
    fontFamily: type.body,
    fontSize: type.size.micro,
    color: colors.sage300,
    textAlign: 'center',
    textShadowColor: 'rgba(8, 14, 10, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  level: {
    marginTop: 1,
    fontFamily: type.bodyBold,
    fontSize: type.size.micro,
    color: colors.inkGoldBright,
    letterSpacing: 0.4,
    textShadowColor: 'rgba(8, 14, 10, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  frozenAmt: {
    fontSize: type.size.micro,
    opacity: 0.9,
  },
  amountOverspent: {
    color: colors.coral500,
  },
});
