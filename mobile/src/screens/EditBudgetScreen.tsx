import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBudgetStore } from '@/store/budgetStore';
import { useAuthStore } from '@/store/authStore';
import { CategoryIcon } from '@/components/CategoryIcon';
import { TapButton } from '@/components/TapButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, radius, space, type } from '@/theme/tokens';
import { TargetType } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditBudget'>;

const TARGET_TYPE_LABELS: Record<TargetType, string> = {
  MONTHLY_NEEDED: 'Needed each month',
  SAVINGS_BALANCE: 'Total balance to reach',
  TARGET_BY_DATE: 'Balance by a date',
};

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 3 },
}) as object;

export function EditBudgetScreen({ route, navigation }: Props) {
  const { districtId } = route.params;
  const districts = useBudgetStore((s) => s.districts);
  const updateDistrictBudget = useBudgetStore((s) => s.updateDistrictBudget);
  const setDistrictTarget = useBudgetStore((s) => s.setDistrictTarget);
  const mode = useAuthStore((s) => s.mode);

  const district = districts.find((d) => d.id === districtId)!;
  const [value, setValue] = useState(String(district.monthlyBudget));

  const [hasTarget, setHasTarget] = useState(!!district.target);
  const [targetType, setTargetType] = useState<TargetType>(district.target?.targetType ?? 'MONTHLY_NEEDED');
  const [targetAmount, setTargetAmount] = useState(String(district.target?.targetAmount ?? ''));
  const [targetDate, setTargetDate] = useState<Date>(
    district.target?.targetDate ? new Date(district.target.targetDate) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = () => {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      updateDistrictBudget(districtId, parsed);
    }

    if (hasTarget) {
      const parsedTarget = parseFloat(targetAmount);
      if (!Number.isNaN(parsedTarget) && parsedTarget > 0) {
        setDistrictTarget(districtId, {
          targetAmount: parsedTarget,
          targetType,
          targetDate: targetType === 'TARGET_BY_DATE' ? targetDate.toISOString() : undefined,
        });
      }
    } else {
      setDistrictTarget(districtId, undefined);
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.fill}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.iconWrap}>
            <CategoryIcon name={district.id} size={36} color={colors.moss800} />
          </View>
          <Text style={styles.title}>Edit {district.label}</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Suggested monthly assign amount</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="decimal-pad"
              value={value}
              onChangeText={setValue}
            />
          </View>

          <View style={styles.card}>
            <TapButton style={styles.targetToggleRow} onPress={() => setHasTarget((v) => !v)}>
              <Text style={styles.label}>Set a savings target</Text>
              <View style={[styles.checkbox, hasTarget && styles.checkboxActive]}>
                {hasTarget && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
            </TapButton>

            {hasTarget && (
              <>
                <View style={styles.targetTypeRow}>
                  {(Object.keys(TARGET_TYPE_LABELS) as TargetType[]).map((tt) => (
                    <TapButton
                      key={tt}
                      style={[styles.typeChip, targetType === tt && styles.typeChipActive]}
                      onPress={() => setTargetType(tt)}
                    >
                      <Text style={[styles.typeChipText, targetType === tt && styles.typeChipTextActive]}>
                        {TARGET_TYPE_LABELS[tt]}
                      </Text>
                    </TapButton>
                  ))}
                </View>

                <Text style={styles.label}>Target amount</Text>
                <TextInput
                  style={styles.targetInput}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textOnParchmentDim}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                />

                {targetType === 'TARGET_BY_DATE' && (
                  <>
                    <Text style={styles.label}>Target date</Text>
                    <TapButton style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                      <Text style={styles.dateButtonText}>
                        {targetDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </Text>
                    </TapButton>
                    {showDatePicker && (
                      <DateTimePicker
                        value={targetDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        minimumDate={new Date()}
                        onChange={(_, selected) => {
                          setShowDatePicker(Platform.OS === 'ios');
                          if (selected) setTargetDate(selected);
                        }}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </View>

          {mode === 'synced' && <Text style={styles.syncNote}>Signed in — remember to back up after making changes.</Text>}

          <PrimaryButton label="Save" variant="ember" onPress={handleSave} style={styles.saveButton} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.parchment },
  content: { padding: space.lg },
  iconWrap: { alignItems: 'center', marginBottom: space.xs },
  title: { fontFamily: type.display, fontSize: type.size.xl, color: colors.textOnParchment, textAlign: 'center', marginTop: space.sm, marginBottom: space.lg },
  card: {
    backgroundColor: colors.creamLift,
    borderRadius: radius.card,
    padding: space.md,
    marginBottom: space.md,
    ...cardShadow,
  },
  label: {
    fontFamily: type.bodyBold,
    fontSize: type.size.sm,
    color: colors.textOnParchmentDim,
    marginTop: space.sm,
    marginBottom: space.xs,
  },
  amountInput: {
    fontFamily: type.mono,
    fontSize: type.size.display,
    color: colors.textOnParchment,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.moss700,
    paddingVertical: space.sm,
  },
  targetToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.moss700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: colors.moss700 },
  checkboxMark: { color: colors.parchment, fontFamily: type.bodyBold, fontSize: type.size.sm },
  targetTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  typeChip: {
    paddingHorizontal: space.group,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.parchmentDim,
  },
  typeChipActive: { backgroundColor: colors.moss700 },
  typeChipText: { fontFamily: type.body, fontSize: type.size.xs, color: colors.textOnParchment },
  typeChipTextActive: { color: colors.parchment },
  targetInput: {
    fontFamily: type.mono,
    fontSize: type.size.lg,
    color: colors.textOnParchment,
    borderBottomWidth: 1,
    borderBottomColor: colors.moss700,
    paddingVertical: space.sm,
  },
  dateButton: {
    backgroundColor: colors.parchmentDim,
    borderRadius: radius.sm,
    paddingVertical: space.group,
    paddingHorizontal: space.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  dateButtonText: { fontFamily: type.bodyBold, fontSize: type.size.base, color: colors.textOnParchment },
  syncNote: {
    fontFamily: type.body,
    fontSize: type.size.xs,
    color: colors.sage500,
    textAlign: 'center',
    marginTop: space.sm,
  },
  saveButton: { marginTop: space.lg, ...cardShadow },
});
