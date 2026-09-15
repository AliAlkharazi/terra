import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { colors, radius, space, type } from '@/theme/tokens';
import { DistrictId } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction'>;
type Mode = 'spend' | 'save';

export function AddTransactionScreen({ navigation, route }: Props) {
  const districts = useBudgetStore((s) => s.districts);
  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const logSaving = useBudgetStore((s) => s.logSaving);

  const [mode, setMode] = useState<Mode>('spend');
  const [districtId, setDistrictId] = useState<DistrictId>(route.params?.districtId ?? districts[0].id);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSave = () => {
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed) || parsed <= 0) return;

    if (mode === 'spend') {
      addTransaction({ districtId, amount: parsed, note: note.trim(), date: new Date().toISOString() });
    } else {
      logSaving(parsed, note.trim());
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.fill}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.modeRow}>
            <Pressable style={[styles.modeButton, mode === 'spend' && styles.modeButtonActiveSpend]} onPress={() => setMode('spend')}>
              <Text style={[styles.modeButtonText, mode === 'spend' && styles.modeButtonTextActive]}>💥 Spend</Text>
            </Pressable>
            <Pressable style={[styles.modeButton, mode === 'save' && styles.modeButtonActiveSave]} onPress={() => setMode('save')}>
              <Text style={[styles.modeButtonText, mode === 'save' && styles.modeButtonTextActive]}>🏗️ Save</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>{mode === 'spend' ? 'Log a spend' : 'Log savings'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'spend' ? 'Damages the district — scaffolding goes up.' : 'Adds a floor to the bank — construction crane style.'}
          </Text>

          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.amountInput}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textOnParchmentDim}
            value={amount}
            onChangeText={setAmount}
          />

          {mode === 'spend' && (
            <>
              <Text style={styles.label}>District</Text>
              <View style={styles.districtRow}>
                {districts.map((d) => (
                  <Pressable key={d.id} onPress={() => setDistrictId(d.id)} style={[styles.districtChip, districtId === d.id && styles.districtChipActive]}>
                    <Text style={styles.districtChipIcon}>{d.icon}</Text>
                    <Text style={[styles.districtChipLabel, districtId === d.id && styles.districtChipLabelActive]}>{d.label}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder={mode === 'spend' ? 'What was it for?' : 'What are you saving for?'}
            placeholderTextColor={colors.textOnParchmentDim}
            value={note}
            onChangeText={setNote}
          />

          <Pressable style={[styles.saveButton, mode === 'save' && styles.saveButtonSave]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{mode === 'spend' ? 'Save spend' : 'Add to bank'}</Text>
          </Pressable>
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
  modeButtonActiveSave: { backgroundColor: colors.gold500 },
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
  noteInput: { fontFamily: type.body, fontSize: type.size.base, color: colors.textOnParchment, borderBottomWidth: 1, borderBottomColor: colors.parchmentDim, paddingVertical: space.sm },
  saveButton: { marginTop: space.xl, backgroundColor: colors.ember500, borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center' },
  saveButtonSave: { backgroundColor: colors.gold500 },
  saveButtonText: { fontFamily: type.bodyBold, fontSize: type.size.base, color: colors.moss900 },
});
