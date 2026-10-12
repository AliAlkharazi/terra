import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { TapButton } from '@/components/TapButton';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import type { TerraWorldViewDistrict } from '@/types/worldView';

type Props = {
  district: TerraWorldViewDistrict | null;
  visible: boolean;
  onClose: () => void;
  onMove: () => void;
  onAssign: () => void;
  onLock: () => void;
  onDetails: () => void;
};

function centsToEuros(cents: number): number {
  return cents / 100;
}

/**
 * WareTrack-style click → status sheet. DTO row only — no API / store reads.
 */
export function DistrictQuickSheet({
  district,
  visible,
  onClose,
  onMove,
  onAssign,
  onLock,
  onDetails,
}: Props) {
  if (!district) {
    return (
      <Modal visible={false} transparent animationType="slide" onRequestClose={onClose}>
        <View />
      </Modal>
    );
  }

  const rows: { label: string; value: string }[] = [
    { label: 'Available', value: formatEuro(centsToEuros(district.availableCents), { cents: false }) },
    { label: 'Assigned', value: formatEuro(centsToEuros(district.assignedCents), { cents: false }) },
    { label: 'Spent', value: formatEuro(centsToEuros(district.spentCents), { cents: false }) },
    { label: 'Locked', value: formatEuro(centsToEuros(district.lockedCents), { cents: false }) },
    { label: 'Stage', value: String(district.stage) },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{district.label}</Text>
          <Text style={styles.sub}>
            Health {district.healthPct}% · from world view
          </Text>

          <View style={styles.grid}>
            {rows.map((row) => (
              <View key={row.label} style={styles.row}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.ctaRow}>
            <TapButton style={styles.cta} onPress={onMove} pressedScale={0.96}>
              <Text style={styles.ctaText}>Move</Text>
            </TapButton>
            <TapButton style={styles.cta} onPress={onAssign} pressedScale={0.96}>
              <Text style={styles.ctaText}>Assign</Text>
            </TapButton>
            <TapButton style={styles.cta} onPress={onLock} pressedScale={0.96}>
              <Text style={styles.ctaText}>Lock</Text>
            </TapButton>
          </View>

          <TapButton style={styles.details} onPress={onDetails} pressedScale={0.97}>
            <Text style={styles.detailsText}>Details</Text>
          </TapButton>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#141C12',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(240,234,214,0.12)',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(240,234,214,0.25)',
    marginBottom: space.md,
  },
  title: {
    fontFamily: type.display,
    fontSize: 26,
    color: '#F4E6A8',
  },
  sub: {
    fontFamily: type.body,
    fontSize: type.size.sm,
    color: colors.sage300,
    marginTop: 4,
    marginBottom: space.md,
  },
  grid: {
    gap: 8,
    marginBottom: space.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(240,234,214,0.1)',
  },
  rowLabel: {
    fontFamily: type.body,
    fontSize: 13,
    color: colors.parchment,
    opacity: 0.75,
  },
  rowValue: {
    fontFamily: type.bodyBold,
    fontSize: 15,
    color: colors.parchment,
    textTransform: 'capitalize',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: space.sm,
  },
  cta: {
    flex: 1,
    backgroundColor: 'rgba(240,234,214,0.1)',
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: type.bodyBold,
    fontSize: 13,
    color: colors.parchment,
  },
  details: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailsText: {
    fontFamily: type.bodyBold,
    fontSize: 14,
    color: '#F4E6A8',
    letterSpacing: 0.3,
  },
});
