import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { ModalTopBar } from '@/components/ui/ModalTopBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { MoneyKeypad, appendAmount } from '@/components/MoneyKeypad';
import { colors, radius, space, type } from '@/theme/tokens';
import { ui } from '@/theme/ui';
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
        <ModalTopBar title="Deposit" onBack={() => navigation.goBack()} tone="moss" />

        <View style={styles.hero}>
          <Text style={[ui.amountHero, amount === 0 && ui.amountHeroDim]}>€{amount || 0}</Text>
          <View style={styles.chip}>
            <Text style={styles.chipDot}>●</Text>
            <Text style={styles.chipText}>Main Vault · EUR</Text>
            <Text style={styles.chipCaret}>▾</Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <PrimaryButton
            label="Continue"
            variant="parchment"
            onPress={confirm}
            disabled={amount <= 0}
            style={amount <= 0 ? styles.ctaDisabled : undefined}
          />
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
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.glassStrong,
    paddingHorizontal: space.group,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
  },
  chipDot: { color: colors.gold500, fontSize: type.size.micro },
  chipText: { fontFamily: type.bodyBold, fontSize: type.size.sm, color: colors.parchment },
  chipCaret: { color: colors.dimOnMoss, fontSize: type.size.xs },
  bottom: { paddingHorizontal: space.md, paddingBottom: space.md, gap: space.md },
  ctaDisabled: { opacity: 0.35 },
});
