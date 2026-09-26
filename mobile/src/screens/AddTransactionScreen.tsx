import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { TapButton } from '@/components/TapButton';
import { CategoryIcon } from '@/components/CategoryIcon';
import { colors, radius, space, type } from '@/theme/tokens';
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

          <TapButton style={[styles.saveButton, mode === 'income' && styles.saveButtonIncome]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{copy.button}</Text>
          </TapButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.parchment },
  content: { padding: space.lg },
  modeRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  modeButton: { flex: 1, paddingVertical: space.sm, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.parchmentDim },
  modeButtonActiveSpend: { backgroundColor: colors.coral500 },
  modeButtonActiveIncome: { backgroundColor: colors.sage500 },
  modeButtonText: { fontFamily: type.bodyBold, fontSize: type.size.sm, color: colors.textOnParchmentDim },
  modeButtonTextActive: { color: colors.moss900 },
  title: { fontFamily: type.display, fontSize: type.size.xl, color: colors.textOnParchment },
  subtitle: { fontFamily: type.body, fontSize: type.size.sm, color: colors.textOnParchmentDim, marginTop: space.xs, marginBottom: space.md },
  label: { fontFamily: type.bodyBold, fontSize: type.size.sm, color: colors.textOnParchmentDim, marginTop: space.md, marginBottom: space.xs },
  amountInput: { fontFamily: type.mono, fontSize: type.size.xxl, color: colors.textOnParchment, borderBottomWidth: 2, borderBottomColor: colors.moss700, paddingVertical: space.sm },
  districtRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  districtChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, paddingVertical: space.xs, borderRadius: radius.pill, backgroundColor: colors.parchmentDim, marginRight: space.xs, marginBottom: space.xs },
  districtChipActive: { backgroundColor: colors.moss700 },
  districtChipIcon: { marginRight: 4 },
  districtChipLabel: { fontFamily: type.body, fontSize: type.size.sm, color: colors.textOnParchment },
  districtChipLabelActive: { color: colors.parchment },
  creditCardToggle: { flexDirection: 'row', alignItems: 'center', marginTop: space.md },
  checkbox: { width: 22, height: 22, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.moss700, alignItems: 'center', justifyContent: 'center', marginRight: space.sm },
  checkboxActive: { backgroundColor: colors.moss700 },
  checkboxMark: { color: colors.parchment, fontFamily: type.bodyBold, fontSize: 13 },
  creditCardLabel: { fontFamily: type.body, fontSize: type.size.sm, color: colors.textOnParchment },
  creditCardNote: { fontFamily: type.body, fontSize: type.size.xs, color: colors.textOnParchmentDim, marginTop: space.xs },
  noteInput: { fontFamily: type.body, fontSize: type.size.base, color: colors.textOnParchment, borderBottomWidth: 1, borderBottomColor: colors.parchmentDim, paddingVertical: space.sm },
  saveButton: { marginTop: space.xl, backgroundColor: colors.ember500, borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center' },
  saveButtonIncome: { backgroundColor: colors.sage500 },
  saveButtonText: { fontFamily: type.bodyBold, fontSize: type.size.base, color: colors.moss900 },
});
