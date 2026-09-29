import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { TapButton } from '@/components/TapButton';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import { useBudgetStore } from '@/store/budgetStore';
import type { DistrictId, Transaction } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BankInbox'>;

export function BankInboxScreen({ navigation }: Props) {
  const districts = useBudgetStore((s) => s.districts);
  const transactions = useBudgetStore((s) => s.transactions);
  const categorizeImportedTx = useBudgetStore((s) => s.categorizeImportedTx);

  const inbox = useMemo(
    () =>
      transactions
        .filter((t) => t.uncategorized && t.kind === 'spend')
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <View style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.topBar}>
          <TapButton onPress={() => navigation.goBack()} style={styles.back} pressedScale={0.9}>
            <Text style={styles.backText}>←</Text>
          </TapButton>
          <Text style={styles.title}>Uncategorized</Text>
          <View style={styles.back} />
        </View>

        <Text style={styles.lead}>
          Bank spends land here until you assign a district. Suggested matches from keywords are already
          categorized.
        </Text>

        <FlatList
          data={inbox}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Inbox clear — sync Sparkasse to import more.</Text>}
          renderItem={({ item }) => (
            <InboxRow
              item={item}
              expanded={activeId === item.id}
              onToggle={() => setActiveId((id) => (id === item.id ? null : item.id))}
              districts={districts.filter((d) => !d.isCreditCard)}
              onPick={(districtId) => {
                categorizeImportedTx(item.id, districtId);
                setActiveId(null);
              }}
            />
          )}
        />
      </SafeAreaView>
    </View>
  );
}

function InboxRow({
  item,
  expanded,
  onToggle,
  districts,
  onPick,
}: {
  item: Transaction;
  expanded: boolean;
  onToggle: () => void;
  districts: { id: DistrictId; label: string }[];
  onPick: (id: DistrictId) => void;
}) {
  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle}>
        <Text style={styles.note}>{item.note || 'Bank spend'}</Text>
        <Text style={styles.meta}>
          {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          {' · '}
          {formatEuro(item.amount)}
        </Text>
      </Pressable>
      {expanded && (
        <View style={styles.chips}>
          {districts.map((d) => (
            <TapButton key={d.id} style={styles.chip} onPress={() => onPick(d.id)}>
              <Text style={styles.chipText}>{d.label}</Text>
            </TapButton>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.creamLift },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingTop: space.xs,
    marginBottom: space.sm,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.parchmentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 18, color: colors.moss800 },
  title: { fontFamily: type.bodyBold, fontSize: 16, color: colors.moss900 },
  lead: {
    fontFamily: type.body,
    fontSize: 13,
    color: colors.textOnParchmentDim,
    paddingHorizontal: space.md,
    marginBottom: space.sm,
    lineHeight: 18,
  },
  list: { paddingHorizontal: space.md, paddingBottom: 40 },
  empty: { textAlign: 'center', color: colors.textOnParchmentDim, marginTop: 48, fontFamily: type.body },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: space.group,
    marginBottom: space.sm,
  },
  note: { fontFamily: type.bodyBold, fontSize: 15, color: colors.moss900 },
  meta: { fontFamily: type.body, fontSize: 12, color: colors.textOnParchmentDim, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.group },
  chip: {
    backgroundColor: colors.moss800,
    borderRadius: radius.pill,
    paddingHorizontal: space.group,
    paddingVertical: space.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: { fontFamily: type.bodyBold, fontSize: 13, color: colors.parchment },
});
