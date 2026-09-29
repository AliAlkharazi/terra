import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { TapButton } from '@/components/TapButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { CategoryIcon } from '@/components/CategoryIcon';
import { colors, layout, radius, space, type } from '@/theme/tokens';
import { DistrictId } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction'>;
type Mode = 'spend' | 'income';

const MODE_COPY: Record<Mode, { title: string; subtitle: string; button: string; placeholder: string }> = {
  spend: {
    title: 'Spend',
    subtitle: 'Takes money from this building.',
    button: 'Save',
    placeholder: 'What for?',
  },
  income: {
    title: 'Add money',
    subtitle: 'Goes into the vault. Then give it a job.',
    button: 'Add',
    placeholder: 'From where?',
  },
};

export function AddTransactionScreen({ navigation, route }: Props) {
  const districts = useBudgetStore((s) => s.districts);
  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const logIncome = useBudgetStore((s) => s.logIncome);

  const [mode, setMode] = useState<Mode>(route.params?.mode ?? 'spend');
  const [districtId, setDistrictId] = useState<DistrictId>(route.params?.districtId ?? districts[0].id);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const copy = MODE_COPY[mode];

  const handleSave = () => {
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed) || parsed <= 0) return;

    if (mode === 'spend') {
      addTransaction({ districtId, amount: parsed, note: note.trim(), date: new Date().toISOString() });
    } else {
      logIncome(parsed, note.trim());
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.fill}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.modeRow}>
            <TapButton style={[styles.modeButton, mode === 'spend' && styles.modeButtonActiveSpend]} onPress={() => setMode('spend')}>
              <Text style={[styles.modeButtonText, mode === 'spend' && styles.modeButtonTextActive]}>Spend</Text>
            </TapButton>
            <TapButton style={[styles.modeButton, mode === 'income' && styles.modeButtonActiveIncome]} onPress={() => setMode('income')}>
              <Text style={[styles.modeButtonText, mode === 'income' && styles.modeButtonTextActive]}>Add money</Text>
            </TapButton>
          </View>

          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>

          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.amountInput}
            keyboardType="decimal-pad"
            placeholder="€0"
            placeholderTextColor={colors.textOnParchmentDim}
            value={amount}
            onChangeText={setAmount}
          />

          {mode === 'spend' && (
            <>
              <Text style={styles.label}>Building</Text>
              <View style={styles.districtRow}>
                {districts.filter((d) => !d.isCreditCard).map((d) => (
                  <TapButton key={d.id} onPress={() => setDistrictId(d.id)} style={[styles.districtChip, districtId === d.id && styles.districtChipActive]}>
                    <View style={styles.districtChipIcon}>
                      <CategoryIcon name={d.id} size={16} color={districtId === d.id ? colors.parchment : colors.moss800} />
                    </View>
                    <Text style={[styles.districtChipLabel, districtId === d.id && styles.districtChipLabelActive]}>{d.label}</Text>
                  </TapButton>
                ))}
              </View>

            </>
          )}

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder={copy.placeholder}
            placeholderTextColor={colors.textOnParchmentDim}
            value={note}
            onChangeText={setNote}
          />

          <PrimaryButton
            label={copy.button}
            variant="ember"
            onPress={handleSave}
            style={[styles.saveButton, mode === 'income' && styles.saveButtonIncome]}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.parchment },
  content: { padding: space.lg },
  modeRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  modeButton: {
    flex: 1,
    paddingVertical: space.group,
    minHeight: layout.hitTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.parchmentDim,
  },
  modeButtonActiveSpend: { backgroundColor: colors.coral500 },
  modeButtonActiveIncome: { backgroundColor: colors.sage500 },
  modeButtonText: { fontFamily: type.bodyBold, fontSize: type.size.sm, color: colors.textOnParchmentDim },
  modeButtonTextActive: { color: colors.moss900 },
  title: { fontFamily: type.display, fontSize: type.size.xl, color: colors.textOnParchment },
  subtitle: {
    fontFamily: type.body,
    fontSize: type.size.sm,
    color: colors.textOnParchmentDim,
    marginTop: space.xs,
    marginBottom: space.md,
    lineHeight: Math.round(type.size.sm * 1.4),
  },
  label: {
    fontFamily: type.bodyBold,
    fontSize: type.size.sm,
    color: colors.textOnParchmentDim,
    marginTop: space.md,
    marginBottom: space.xs,
  },
  amountInput: {
    fontFamily: type.mono,
    fontSize: type.size.xxl,
    color: colors.textOnParchment,
    borderBottomWidth: 2,
    borderBottomColor: colors.moss700,
    paddingVertical: space.sm,
  },
  districtRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  districtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.group,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
  },
  districtChipActive: { backgroundColor: colors.moss700 },
  districtChipIcon: { marginRight: space.xs },
  districtChipLabel: { fontFamily: type.body, fontSize: type.size.sm, color: colors.textOnParchment },
  districtChipLabelActive: { color: colors.parchment },
  noteInput: {
    fontFamily: type.body,
    fontSize: type.size.base,
    color: colors.textOnParchment,
    backgroundColor: colors.creamLift,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.parchmentDim,
    paddingHorizontal: space.md,
    paddingVertical: space.group,
  },
  saveButton: { marginTop: space.xl },
  saveButtonIncome: { backgroundColor: colors.sage500 },
});
