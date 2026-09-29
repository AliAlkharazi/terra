import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { TapButton } from '@/components/TapButton';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ModalTopBar } from '@/components/ui/ModalTopBar';
import { colors, layout, radius, space, type } from '@/theme/tokens';
import { themeFor } from '@/theme/categoryTheme';
import { formatEuro } from '@/theme/money';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import type { ActivityItem, PocketId } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'More'>;

function pocketName(id: PocketId | undefined, labels: Record<string, string>) {
  if (!id) return '';
  if (id === 'vault') return 'Main Vault';
  return labels[id] ?? id;
}

export function MoreScreen({ navigation }: Props) {
  const activity = useBudgetStore((s) => s.activity) ?? [];
  const districts = useBudgetStore((s) => s.districts);
  const labels = Object.fromEntries(districts.map((d) => [d.id, d.label]));

  return (
    <View style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ModalTopBar title="Activity" onBack={() => navigation.goBack()} />

        <View style={styles.bankBar}>
          <TapButton style={styles.bankBtn} onPress={() => navigation.navigate('ConnectBank')}>
            <Text style={styles.bankBtnText}>Connect Sparkasse</Text>
          </TapButton>
          <TapButton style={styles.bankBtnSecondary} onPress={() => navigation.navigate('BankInbox')}>
            <Text style={styles.bankBtnSecondaryText}>Inbox</Text>
          </TapButton>
        </View>

        <FlatList
          data={activity}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nothing moved yet.</Text>}
          renderItem={({ item }) => <ActivityRow item={item} labels={labels} />}
        />
      </SafeAreaView>
    </View>
  );
}

function ActivityRow({ item, labels }: { item: ActivityItem; labels: Record<string, string> }) {
  const title =
    item.kind === 'deposit'
      ? `Added to ${pocketName(item.toId, labels)}`
      : `${pocketName(item.fromId, labels)} → ${pocketName(item.toId, labels)}`;
  const iconName = item.kind === 'deposit' ? 'vault' : (item.toId === 'vault' ? 'vault' : item.toId) ?? 'vault';
  const accent = themeFor(iconName).accent;

  return (
    <View style={[styles.row, { borderLeftColor: accent }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>
        <CategoryIcon name={iconName === 'vault' ? 'vault' : iconName} size={20} color={accent} />
      </View>
      <View style={styles.body}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowMeta}>
          {new Date(item.date).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          {item.note ? ` · ${item.note}` : ''}
        </Text>
      </View>
      <Text style={[styles.rowAmt, item.kind === 'deposit' ? styles.rowIn : styles.rowMove]}>
        {item.kind === 'deposit' ? '+' : ''}
        {formatEuro(item.amount, { cents: false })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.creamLift },
  bankBar: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.md,
    marginBottom: space.group,
  },
  bankBtn: {
    flex: 1,
    backgroundColor: colors.moss800,
    borderRadius: radius.md,
    paddingVertical: space.group,
    minHeight: layout.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankBtnText: { fontFamily: type.bodyBold, color: colors.parchment, fontSize: type.size.sm },
  bankBtnSecondary: {
    backgroundColor: colors.parchmentDim,
    borderRadius: radius.md,
    paddingVertical: space.group,
    paddingHorizontal: space.md,
    minHeight: layout.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankBtnSecondaryText: { fontFamily: type.bodyBold, color: colors.moss900, fontSize: type.size.sm },
  list: { paddingHorizontal: space.md, paddingBottom: space.xl },
  empty: {
    fontFamily: type.body,
    color: colors.textOnParchmentDim,
    textAlign: 'center',
    marginTop: space.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    padding: space.group,
    marginBottom: space.sm,
    gap: space.group,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  iconWrap: {
    width: layout.backSize,
    height: layout.backSize,
    borderRadius: layout.backSize / 2,
    backgroundColor: colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  rowTitle: { fontFamily: type.bodyBold, fontSize: type.size.sm + 1, color: colors.moss900 },
  rowMeta: {
    fontFamily: type.body,
    fontSize: type.size.xs,
    color: colors.textOnParchmentDim,
    marginTop: space.xs,
  },
  rowAmt: { fontFamily: type.mono, fontSize: type.size.base },
  rowIn: { color: colors.moss600 },
  rowMove: { color: colors.moss800 },
});
