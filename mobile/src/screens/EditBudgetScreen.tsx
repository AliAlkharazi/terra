import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '@/store/budgetStore';
import { useAuthStore } from '@/store/authStore';
import { colors, radius, space, type } from '@/theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditBudget'>;

export function EditBudgetScreen({ route, navigation }: Props) {
  const { districtId } = route.params;
  const districts = useBudgetStore((s) => s.districts);
  const updateDistrictBudget = useBudgetStore((s) => s.updateDistrictBudget);
  const mode = useAuthStore((s) => s.mode);

  const district = districts.find((d) => d.id === districtId)!;
  const [value, setValue] = useState(String(district.monthlyBudget));

  const handleSave = () => {
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0) return;
    updateDistrictBudget(districtId, parsed);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.fill}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Text style={styles.icon}>{district.icon}</Text>
          <Text style={styles.title}>Edit {district.label} budget</Text>
          <Text style={styles.subtitle}>Monthly amount this district paces against.</Text>

          <TextInput
            style={styles.amountInput}
            keyboardType="decimal-pad"
            value={value}
            onChangeText={setValue}
            autoFocus
          />

          {mode === 'synced' && (
            <Text style={styles.syncNote}>Signed in — this will also sync to your account.</Text>
          )}

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save budget</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.parchment },
  content: { flex: 1, padding: space.lg, justifyContent: 'center' },
  icon: { fontSize: 40, textAlign: 'center' },
  title: { fontFamily: type.display, fontSize: type.size.xl, color: colors.textOnParchment, textAlign: 'center', marginTop: space.sm },
  subtitle: { fontFamily: type.body, fontSize: type.size.sm, color: colors.textOnParchmentDim, textAlign: 'center', marginTop: space.xs, marginBottom: space.lg },
  amountInput: {
    fontFamily: type.mono, fontSize: type.size.display, color: colors.textOnParchment,
    textAlign: 'center', borderBottomWidth: 2, borderBottomColor: colors.moss700, paddingVertical: space.sm,
  },
  syncNote: { fontFamily: type.body, fontSize: type.size.xs, color: colors.sage500, textAlign: 'center', marginTop: space.md },
  saveButton: { marginTop: space.xl, backgroundColor: colors.ember500, borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center' },
  saveButtonText: { fontFamily: type.bodyBold, fontSize: type.size.base, color: colors.moss900 },
});
