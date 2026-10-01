import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AllocationState, District, DistrictId, PocketId } from '@/types';
import { colors, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import { themeFor } from '@/theme/categoryTheme';
import { buildingLevel } from '@/engine/buildings';
import { BUILDING_BY_ID, EmptyPlotBuilding, VaultBuilding } from './buildings';
import { TownTerrain, WORLD_H, WORLD_W, tileToWorld } from './TownTerrain';

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

const VAULT_SIZE = 168;
const BUILDING_SIZE = 128;
const EMPTY_SIZE = 108;

type PlaceableId = keyof typeof BUILDING_BY_ID;

/** Tile coords (i, j) on the isometric grass diamond */
const GRID: Record<PlaceableId, [number, number]> = {
  dining: [-3, -2],
  property: [3, -2],
  groceries: [-3, 2],
  bills: [3, 2],
  transport: [0, 4],
  supermarket: [-5, 0],
  cinema: [5, 0],
  library: [0, -5],
  university: [-4, -3],
  hospital: [4, -3],
  school: [-4, 3],
  factory: [4, 3],
  office: [2, 5],
  mall: [-2, 5],
  car_workshop: [2, -5],
};

type Pad = { x: number; y: number; theme: PocketId };

function makePads(): Record<string, Pad> {
  const vault = tileToWorld(0, 0);
  const pads: Record<string, Pad> = {
    vault: { x: vault.x, y: vault.y, theme: 'vault' },
  };
  for (const [id, [i, j]] of Object.entries(GRID) as [PlaceableId, [number, number]][]) {
    const p = tileToWorld(i, j);
    pads[id] = { x: p.x, y: p.y, theme: id };
  }
  return pads;
}

const PADS = makePads();

function spotStyle(pad: Pad, size: number) {
  return {
    left: pad.x - size / 2,
    top: pad.y - size * 0.78,
    width: size,
    zIndex: Math.round(pad.y),
  };
}

function hitStyle(pad: Pad, extra = 0) {
  const w = 64 + extra;
  const h = 72;
  return {
    left: pad.x - w / 2,
    top: pad.y - h * 0.72,
    width: w,
    height: h,
    zIndex: Math.round(pad.y) + 80,
  };
}

/**
 * Full town layer in world coordinates (place inside TownCamera).
 */
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
      return { district, pad, state, Building, placed, level };
    })
    .sort((a, b) => a.pad.y - b.pad.y);

  return (
    <View style={[styles.world, { width: WORLD_W, height: WORLD_H }]} collapsable={false}>
      <TownTerrain />

      <View pointerEvents="none" style={[styles.spot, spotStyle(PADS.vault, VAULT_SIZE)]}>
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
          style={[styles.spot, spotStyle(pad, placed ? BUILDING_SIZE : EMPTY_SIZE)]}
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

      <Pressable onPress={onVaultPress} style={[styles.hit, hitStyle(PADS.vault, 16)]} />
      {spots.map(({ district, pad, placed }) => (
        <Pressable
          key={`hit-${district.id}`}
          onPress={() => (placed ? onDistrictPress(district.id) : onEmptyPlotPress(district.id))}
          style={[styles.hit, hitStyle(pad)]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  world: {
    position: 'relative',
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
    maxWidth: 120,
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
    maxWidth: 120,
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
