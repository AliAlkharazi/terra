import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { TapButton } from '@/components/TapButton';
import { BackButton } from '@/components/ui/BackButton';
import { MoneyKeypad, appendAmount } from '@/components/MoneyKeypad';
import { colors, radius, space, type } from '@/theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Deposit'>;

export function DepositScreen({ navigation }: Props) {
  const logIncome = useBudgetStore((s) => s.logIncome);
  const [digits, setDigits] = useState('');
  const amount = Number(digits) || 0;

  const confirm = () => {
    if (amount <= 0) return;
    logIncome(amount, 'Deposit');
    navigation.goBack();
  };

  return (
    <View style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <BackButton onPress={() => navigation.goBack()} tone="moss" style={styles.close} />

        <View style={styles.hero}>
          <Text style={[styles.amount, amount === 0 && styles.amountDim]}>€{amount || 0}</Text>
          <View style={styles.chip}>
            <Text style={styles.chipDot}>●</Text>
            <Text style={styles.chipText}>Main Vault · EUR</Text>
            <Text style={styles.chipCaret}>▾</Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <TapButton style={[styles.continue, amount <= 0 && styles.continueDisabled]} onPress={confirm} disabled={amount <= 0}>
            <Text style={styles.continueText}>Continue</Text>
          </TapButton>
          <MoneyKeypad
            dark
            onDigit={(d) => setDigits((v) => appendAmount(v, d))}
            onBackspace={() => setDigits((v) => v.slice(0, -1))}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.moss900 },
  close: {
    alignSelf: 'flex-start',
    marginLeft: space.md,
    marginTop: space.xs,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  amount: {
    fontFamily: type.display,
    fontSize: 56,
    color: colors.parchment,
    marginBottom: space.md,
  },
  amountDim: { color: colors.dimOnMoss },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.glassStrong,
    paddingHorizontal: space.group,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
  },
  chipDot: { color: colors.gold500, fontSize: 10 },
  chipText: { fontFamily: type.bodyBold, fontSize: type.size.sm, color: colors.parchment },
  chipCaret: { color: colors.dimOnMoss, fontSize: type.size.xs },
  bottom: { paddingHorizontal: space.md, paddingBottom: space.md, gap: space.md },
  continue: {
    backgroundColor: colors.parchment,
    borderRadius: radius.pill,
    paddingVertical: space.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueDisabled: { opacity: 0.35 },
  continueText: { fontFamily: type.bodyBold, fontSize: 17, color: colors.moss900 },
});
