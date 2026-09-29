import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { TapButton } from '@/components/TapButton';
import { MoneyKeypad, appendAmount } from '@/components/MoneyKeypad';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import { CategoryIcon } from '@/components/CategoryIcon';
import { themeFor } from '@/theme/categoryTheme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import type { PocketId } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Move'>;

export function MoveScreen({ navigation, route }: Props) {
  const districts = useBudgetStore((s) => s.districts);
  const transactions = useBudgetStore((s) => s.transactions);
  const allocations = useBudgetStore((s) => s.allocations);
  const currentMonth = useBudgetStore((s) => s.currentMonth);
  const moveMoney = useBudgetStore((s) => s.moveMoney);
  const getReadyToAssign = useBudgetStore((s) => s.getReadyToAssign);
  const getAllAllocationStates = useBudgetStore((s) => s.getAllAllocationStates);

  const vault = useMemo(() => Math.max(0, getReadyToAssign()), [getReadyToAssign, transactions, allocations]);
  const states = useMemo(
    () => getAllAllocationStates(),
    [getAllAllocationStates, transactions, allocations, currentMonth]
  );

  const pockets = useMemo(() => {
    const list: { id: PocketId; label: string; balance: number }[] = [{ id: 'vault', label: 'Main Vault', balance: vault }];
    districts
      .filter((d) => !d.isCreditCard)
      .forEach((d) => {
        const st = states.find((s) => s.districtId === d.id);
        list.push({ id: d.id, label: d.label, balance: Math.max(0, st?.available ?? 0) });
      });
    return list;
  }, [districts, states, vault]);

  const [topId, setTopId] = useState<PocketId>(route.params?.toId ?? 'groceries');
  const [bottomId, setBottomId] = useState<PocketId>('vault');
  const [flowUp, setFlowUp] = useState(true);
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState('');
  const [picking, setPicking] = useState<'top' | 'bottom' | null>(null);
  const rotation = useSharedValue(0);

  const amount = Number(digits) || 0;
  const top = pockets.find((p) => p.id === topId) ?? pockets[1];
  const bottom = pockets.find((p) => p.id === bottomId) ?? pockets[0];
  const fromId = flowUp ? bottomId : topId;
  const toId = flowUp ? topId : bottomId;
  const from = flowUp ? bottom : top;

  const flipArrow = () => {
    setFlowUp((v) => !v);
    rotation.value = withSpring(rotation.value + 180, { damping: 14, stiffness: 180 });
  };

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const canMove = amount > 0 && fromId !== toId && amount <= from.balance + 0.001;

  const confirm = () => {
    if (!canMove) return;
    moveMoney(fromId, toId, amount, note);
    navigation.goBack();
  };

  const pick = (id: PocketId) => {
    if (picking === 'top') {
      setTopId(id);
      if (id === bottomId) setBottomId(topId);
    } else if (picking === 'bottom') {
      setBottomId(id);
      if (id === topId) setTopId(bottomId);
    }
    setPicking(null);
  };

  return (
    <View style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.topBar}>
          <TapButton onPress={() => navigation.goBack()} style={styles.back} pressedScale={0.9}>
            <Text style={styles.backText}>←</Text>
          </TapButton>
          <Text style={styles.title}>Move money</Text>
          <View style={styles.back} />
        </View>

        <View style={styles.cards}>
          <PocketCard
            pocket={top}
            signedAmount={amount}
            sign={flowUp ? '+' : '-'}
            onPress={() => setPicking('top')}
          />

          <TapButton onPress={flipArrow} style={styles.arrowHit} pressedScale={0.9}>
            <Animated.View style={[styles.arrow, arrowStyle]}>
              <Text style={styles.arrowGlyph}>↑</Text>
            </Animated.View>
          </TapButton>

          <PocketCard
            pocket={bottom}
            signedAmount={amount}
            sign={flowUp ? '-' : '+'}
            onPress={() => setPicking('bottom')}
          />

          <TextInput
            style={styles.note}
            placeholder="Add note"
            placeholderTextColor={colors.textOnParchmentDim}
            value={note}
            onChangeText={setNote}
          />
        </View>

        <View style={styles.bottom}>
          <TapButton
            style={[styles.moveBtn, canMove ? styles.moveReady : styles.moveDisabled]}
            onPress={confirm}
            disabled={!canMove}
          >
            <Text style={[styles.moveText, canMove && styles.moveTextReady]}>Move</Text>
          </TapButton>
          <MoneyKeypad
            onDigit={(d) => setDigits((v) => appendAmount(v, d))}
            onBackspace={() => setDigits((v) => v.slice(0, -1))}
          />
        </View>
      </SafeAreaView>

      <Modal visible={picking != null} transparent animationType="fade" onRequestClose={() => setPicking(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPicking(null)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{picking === 'top' ? 'Top' : 'Bottom'}</Text>
            {pockets.map((p) => (
              <TapButton key={p.id} style={styles.sheetRow} onPress={() => pick(p.id)}>
                <CategoryIcon name={p.id === 'vault' ? 'vault' : p.id} size={20} color={themeFor(p.id).accent} />
                <Text style={styles.sheetName}>{p.label}</Text>
                <Text style={styles.sheetBal}>{formatEuro(p.balance, { cents: false })}</Text>
              </TapButton>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function PocketCard({
  pocket,
  signedAmount,
  sign,
  onPress,
}: {
  pocket: { id: PocketId; label: string; balance: number };
  signedAmount: number;
  sign: '+' | '-';
  onPress: () => void;
}) {
  const shown = signedAmount > 0 ? `${sign}${signedAmount.toLocaleString('de-DE')} €` : `${sign}0 €`;
  const theme = themeFor(pocket.id);
  return (
    <TapButton style={[styles.card, { borderLeftColor: theme.accent }]} onPress={onPress} pressedScale={0.98}>
      <View style={styles.cardLeft}>
        <CategoryIcon name={pocket.id === 'vault' ? 'vault' : pocket.id} size={22} color={theme.accent} />
        <View>
          <Text style={styles.cardName}>{pocket.label}</Text>
          <Text style={styles.cardBal}>{formatEuro(pocket.balance, { cents: false })}</Text>
        </View>
      </View>
      <Text style={styles.cardAmt}>{shown}</Text>
    </TapButton>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#F4F1EA' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingTop: space.xs,
  },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.parchmentDim, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 18, color: colors.moss800 },
  title: { fontFamily: type.bodyBold, fontSize: 16, color: colors.moss900 },
  cards: { flex: 1, paddingHorizontal: space.md, paddingTop: space.lg, gap: 0 },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.panel,
    paddingHorizontal: space.md,
    paddingVertical: space.group + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: space.group, flex: 1 },
  cardName: { fontFamily: type.bodyBold, fontSize: type.size.base, color: colors.moss900 },
  cardBal: {
    fontFamily: type.body,
    fontSize: type.size.xs,
    color: colors.textOnParchmentDim,
    marginTop: space.xs,
  },
  cardAmt: { fontFamily: type.mono, fontSize: type.size.lg, color: colors.moss800 },
  arrowHit: { alignSelf: 'center', marginVertical: -space.md, zIndex: 2 },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.moss900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowGlyph: { color: colors.parchment, fontSize: type.size.lg, fontFamily: type.bodyBold },
  note: {
    marginTop: space.md,
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    paddingHorizontal: space.md,
    paddingVertical: space.group,
    fontFamily: type.body,
    fontSize: type.size.sm + 1,
    color: colors.moss900,
  },
  bottom: { paddingHorizontal: space.md, paddingBottom: space.md, gap: space.md },
  moveBtn: {
    backgroundColor: colors.parchmentDim,
    borderRadius: radius.pill,
    paddingVertical: space.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveReady: { backgroundColor: colors.moss900 },
  moveDisabled: { opacity: 0.55 },
  moveText: { fontFamily: type.bodyBold, fontSize: type.size.md, color: colors.moss900 },
  moveTextReady: { color: colors.parchment },
  backdrop: { flex: 1, backgroundColor: colors.backdrop, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.parchment,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    paddingBottom: 40,
    gap: space.sm,
  },
  sheetTitle: {
    fontFamily: type.display,
    fontSize: type.size.xl - 4,
    color: colors.moss900,
    marginBottom: space.sm,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.group,
    paddingVertical: space.group,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.parchmentDim,
  },
  sheetName: { flex: 1, fontFamily: type.bodyBold, fontSize: type.size.base, color: colors.moss900 },
  sheetBal: { fontFamily: type.mono, fontSize: type.size.sm, color: colors.textOnParchmentDim },
});
