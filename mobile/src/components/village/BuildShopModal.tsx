import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EuroCoin } from '@/components/money/EuroCoin';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TapButton } from '@/components/TapButton';
import { formatDots } from '@/theme/money';
import { themeFor } from '@/theme/categoryTheme';
import { colors, layout, radius, space, type } from '@/theme/tokens';
import { ui } from '@/theme/ui';
import type { District, DistrictId } from '@/types';
import {
  BUILDING_CATALOG,
  SHOP_TABS,
  type BuildingShopTab,
} from '@/village/buildingCatalog';

type Props = {
  visible: boolean;
  onClose: () => void;
  vault: number;
  placedIds: DistrictId[] | Set<DistrictId>;
  onBuild: (districtId: DistrictId) => void;
  districts: District[];
};

function isPlaced(placedIds: DistrictId[] | Set<DistrictId>, id: DistrictId): boolean {
  if (placedIds instanceof Set) return placedIds.has(id);
  return placedIds.includes(id);
}

function districtLabel(districts: District[], id: DistrictId | 'vault'): string {
  if (id === 'vault') return 'Bank';
  return districts.find((d) => d.id === id)?.label ?? id;
}

export function BuildShopModal({
  visible,
  onClose,
  vault,
  placedIds,
  onBuild,
  districts,
}: Props) {
  const [tab, setTab] = useState<BuildingShopTab>('everyday');

  const cards = useMemo(
    () => BUILDING_CATALOG.filter((entry) => entry.tab === tab),
    [tab]
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={ui.backdrop} onPress={onClose}>
        <Pressable style={[ui.sheet, styles.sheet]} onPress={() => undefined}>
          <Text style={ui.sheetTitle}>Buildings</Text>
          <Text style={styles.vaultLine}>Vault {formatDots(Math.max(0, vault))}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
            style={styles.tabsScroll}
          >
            {SHOP_TABS.map((t) => {
              const active = t.id === tab;
              return (
                <TapButton
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  style={[styles.tab, active && styles.tabActive]}
                  pressedScale={0.97}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                </TapButton>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
          >
            {cards.map((entry) => {
              const isVault = entry.districtId === 'vault' || entry.districtId === undefined;
              const districtId = entry.districtId;
              const built =
                !isVault && districtId !== 'vault' && districtId != null
                  ? isPlaced(placedIds, districtId)
                  : false;
              const canAfford =
                !isVault && districtId != null && districtId !== 'vault'
                  ? vault + 0.001 >= entry.cost
                  : false;
              const disabled = isVault || built || (!canAfford && entry.cost > 0);

              const iconName =
                districtId === 'vault' || districtId == null ? 'vault' : districtId;
              const accent =
                iconName === 'vault' ? themeFor('vault').accent : themeFor(iconName).accent;

              return (
                <TapButton
                  key={entry.id}
                  disabled={disabled}
                  onPress={() => {
                    if (isVault || districtId == null || districtId === 'vault') return;
                    onBuild(districtId);
                  }}
                  style={[styles.card, disabled && styles.cardDisabled]}
                  pressedScale={0.98}
                >
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {entry.label}
                  </Text>
                  <View style={styles.iconWrap}>
                    <CategoryIcon name={iconName as DistrictId | 'vault'} size={36} color={accent} />
                  </View>
                  <Text style={styles.blurb} numberOfLines={2}>
                    {entry.blurb}
                  </Text>
                  <View style={styles.costRow}>
                    {isVault ? (
                      <Text style={styles.alwaysOpen}>Always open</Text>
                    ) : built ? (
                      <Text style={styles.builtLabel}>Built</Text>
                    ) : (
                      <>
                        <Text style={styles.cost}>{formatDots(entry.cost)}</Text>
                        <EuroCoin value={2} size={28} />
                      </>
                    )}
                  </View>
                  {!isVault && !built && entry.cost > 0 && !canAfford ? (
                    <Text style={styles.needMore}>Need more in vault</Text>
                  ) : null}
                  {!isVault && districtId && districtId !== 'vault' ? (
                    <Text style={styles.metaLabel} numberOfLines={1}>
                      {districtLabel(districts, districtId)}
                    </Text>
                  ) : null}
                </TapButton>
              );
            })}
          </ScrollView>

          <PrimaryButton label="Close" variant="secondary" onPress={onClose} style={styles.close} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const CARD_W = 148;

const styles = StyleSheet.create({
  sheet: {
    maxHeight: '88%',
  },
  vaultLine: {
    fontFamily: type.bodyBold,
    fontSize: type.size.sm,
    color: colors.moss800,
    marginBottom: space.sm,
  },
  tabsScroll: {
    flexGrow: 0,
    marginBottom: space.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: space.sm,
    paddingRight: space.sm,
  },
  tab: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.creamLift,
    minHeight: layout.hitTarget - 8,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.moss800,
  },
  tabText: {
    fontFamily: type.bodyBold,
    fontSize: type.size.sm,
    color: colors.moss800,
  },
  tabTextActive: {
    color: colors.parchment,
  },
  cardRow: {
    flexDirection: 'row',
    gap: space.sm,
    paddingBottom: space.sm,
  },
  card: {
    width: CARD_W,
    backgroundColor: colors.creamLift,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.moss800,
    padding: space.md,
    minHeight: 200,
  },
  cardDisabled: {
    opacity: 0.72,
  },
  cardTitle: {
    fontFamily: type.bodyBold,
    fontSize: type.size.base,
    color: colors.moss900,
    textAlign: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    marginVertical: space.sm,
  },
  blurb: {
    fontFamily: type.body,
    fontSize: type.size.xs,
    color: colors.textOnParchmentDim,
    textAlign: 'center',
    minHeight: 32,
    lineHeight: Math.round(type.size.xs * type.line.normal),
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    marginTop: space.sm,
  },
  cost: {
    fontFamily: type.bodyBold,
    fontSize: type.size.sm,
    color: colors.moss900,
  },
  alwaysOpen: {
    fontFamily: type.bodyBold,
    fontSize: type.size.xs,
    color: colors.textOnParchmentDim,
  },
  builtLabel: {
    fontFamily: type.bodyBold,
    fontSize: type.size.sm,
    color: colors.sage300,
  },
  needMore: {
    marginTop: space.xs,
    fontFamily: type.body,
    fontSize: type.size.micro,
    color: colors.coral500,
    textAlign: 'center',
  },
  metaLabel: {
    marginTop: space.xs,
    fontFamily: type.body,
    fontSize: type.size.micro,
    color: colors.textOnParchmentDim,
    textAlign: 'center',
  },
  close: {
    marginTop: space.md,
  },
});
