import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { useSpendMemoryStore } from '@/store/spendMemoryStore';
import { TapButton } from '@/components/TapButton';
import { ModalTopBar } from '@/components/ui/ModalTopBar';
import { computeAffordability, type AffordVerdict } from '@/engine/afford';
import { estimateMarketPrice } from '@/engine/estimatePrice';
import { parseWant } from '@/engine/wantParse';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, gradients, radius, space, type } from '@/theme/tokens';
import { ui } from '@/theme/ui';
import { formatEuro } from '@/theme/money';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Afford'>;

export function AffordScreen({ navigation }: Props) {
  const districts = useBudgetStore((s) => s.districts);
  const transactions = useBudgetStore((s) => s.transactions);
  const allocations = useBudgetStore((s) => s.allocations);
  const currentMonth = useBudgetStore((s) => s.currentMonth);
  const getAllAllocationStates = useBudgetStore((s) => s.getAllAllocationStates);
  const getReadyToAssign = useBudgetStore((s) => s.getReadyToAssign);

  const purchases = useSpendMemoryStore((s) => s.purchases);

  const [text, setText] = useState('');
  const [verdict, setVerdict] = useState<AffordVerdict | null>(null);
  const [busy, setBusy] = useState(false);

  const states = useMemo(
    () => getAllAllocationStates(),
    [getAllAllocationStates, transactions, allocations, currentMonth]
  );
  const vault = useMemo(() => getReadyToAssign(), [getReadyToAssign, transactions, allocations]);

  const ask = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const { item, amount } = parseWant(text);
      let market = null;
      if (amount == null && item && item !== 'this') {
        market = await estimateMarketPrice(item);
      }

      const next = computeAffordability({
        sentence: text,
        memory: purchases,
        transactions,
        districts,
        states,
        vault,
        month: currentMonth,
        market,
      });
      setVerdict(next);
      if (next.answer === 'yes') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } finally {
      setBusy(false);
    }
  };

  const tone =
    verdict?.answer === 'yes' ? colors.incomeGreen : verdict?.answer === 'no' ? colors.coral500 : colors.vaultGold;
  const word =
    verdict?.answer === 'yes' ? 'Yes' : verdict?.answer === 'no' ? 'No' : busy ? 'Checking…' : 'Need more';

  return (
    <LinearGradient colors={[...gradients.insights]} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ModalTopBar title="Can I buy this?" onBack={() => navigation.goBack()} tone="moss" />

          <View style={styles.body}>
            <Text style={styles.lead}>Say it simply — it knows what things usually cost.</Text>
            <TextInput
              style={styles.input}
              placeholder="I want a G-Class"
              placeholderTextColor={colors.textOnMossDim}
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => {
                void ask();
              }}
              returnKeyType="go"
              autoFocus
              editable={!busy}
            />
            {busy ? (
              <View style={styles.goBusy}>
                <ActivityIndicator color={colors.moss900} />
              </View>
            ) : (
              <PrimaryButton label="Ask" variant="ember" onPress={() => void ask()} disabled={!text.trim()} />
            )}

            {verdict ? (
              <View style={[ui.glassCard, styles.card, { borderColor: tone }]}>
                <Text style={[styles.word, { color: tone }]}>{word}</Text>
                <Text style={styles.line}>{verdict.line}</Text>
                {verdict.price != null ? (
                  <Text style={styles.meta}>
                    {verdict.priceSource === 'market'
                      ? `Market estimate · ${formatEuro(verdict.price, { cents: false })}`
                      : verdict.priceSource === 'history'
                        ? `${verdict.similarCount} similar buys · usually ${formatEuro(verdict.typical ?? verdict.price, { cents: false })}`
                        : `Using ${formatEuro(verdict.price, { cents: false })}`}
                    {` · free ${formatEuro(verdict.freeCash, { cents: false })}`}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.hint}>
                Try “G-Class”, “iPhone”, or “vacation”. It estimates the price, then checks your vault and spend pace.
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: { flex: 1, padding: space.lg, gap: space.md },
  lead: { fontFamily: type.body, fontSize: 15, color: colors.sage300 },
  input: {
    backgroundColor: colors.glassStrong,
    borderRadius: radius.card,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontFamily: type.body,
    fontSize: type.size.md,
    color: colors.parchment,
  },
  goBusy: {
    ...ui.emberBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginTop: space.md,
    borderWidth: 1.5,
    borderRadius: radius.panel,
    padding: space.lg,
  },
  word: { fontFamily: type.display, fontSize: 40 },
  line: { fontFamily: type.body, fontSize: 18, color: colors.parchment, marginTop: 8, lineHeight: 26 },
  meta: { fontFamily: type.body, fontSize: 13, color: colors.sage300, marginTop: 12 },
  hint: { fontFamily: type.body, fontSize: 14, color: colors.textOnMossDim, lineHeight: 20, marginTop: 8 },
});
