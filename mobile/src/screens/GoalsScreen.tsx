import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TapButton } from '@/components/TapButton';
import { useGoalsStore } from '@/store/goalsStore';
import { colors, radius, space, type } from '@/theme/tokens';
import { formatEuro } from '@/theme/money';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Goals'>;

const SUGGESTIONS = ['Vacation', 'Car', 'Emergency Fund', 'Laptop', 'House'];

export function GoalsScreen({ navigation }: Props) {
  const goals = useGoalsStore((s) => s.goals);
  const addGoal = useGoalsStore((s) => s.addGoal);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const save = () => {
    if (!name.trim()) return;
    addGoal(name);
    setName('');
    setOpen(false);
  };

  return (
    <LinearGradient colors={['#2A3A1C', '#141C12', '#0C120E']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.topBar}>
          <TapButton onPress={() => navigation.goBack()} style={styles.back} pressedScale={0.9}>
            <Text style={styles.backText}>←</Text>
          </TapButton>
          <Text style={styles.title}>Goals</Text>
          <View style={styles.back} />
        </View>

        {goals.length === 0 ? (
          <View style={styles.empty}>
            <TapButton style={styles.plus} onPress={() => setOpen(true)} pressedScale={0.92}>
              <Text style={styles.plusMark}>+</Text>
            </TapButton>
            <Text style={styles.hint}>Add a goal</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {goals.map((goal) => (
              <View key={goal.id} style={styles.card}>
                <Text style={styles.cardName}>{goal.name}</Text>
                {goal.target > 0 ? (
                  <Text style={styles.cardMeta}>{formatEuro(goal.target, { cents: false })}</Text>
                ) : (
                  <Text style={styles.cardMeta}>No target yet</Text>
                )}
              </View>
            ))}
            <TapButton style={styles.plusSmall} onPress={() => setOpen(true)} pressedScale={0.92}>
              <Text style={styles.plusMarkSmall}>+</Text>
            </TapButton>
          </View>
        )}
      </SafeAreaView>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>New goal</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={colors.textOnParchmentDim}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={save}
            />
            <View style={styles.chips}>
              {SUGGESTIONS.map((label) => (
                <TapButton key={label} style={styles.chip} onPress={() => setName(label)}>
                  <Text style={styles.chipText}>{label}</Text>
                </TapButton>
              ))}
            </View>
            <TapButton style={styles.save} onPress={save} disabled={!name.trim()}>
              <Text style={styles.saveText}>Add</Text>
            </TapButton>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingTop: space.xs,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glassStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.parchment, fontSize: 18 },
  title: { fontFamily: type.display, fontSize: 22, color: colors.parchment },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  plus: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(244,230,168,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,234,214,0.06)',
  },
  plusMark: { fontSize: 40, color: '#F4E6A8', marginTop: -2, fontFamily: type.body },
  hint: { fontFamily: type.body, fontSize: 14, color: colors.sage300 },
  list: { padding: space.lg, gap: space.sm, flex: 1 },
  card: {
    backgroundColor: colors.glassStrong,
    borderRadius: radius.card,
    padding: space.md,
  },
  cardName: { fontFamily: type.bodyBold, fontSize: 16, color: colors.parchment },
  cardMeta: { fontFamily: type.body, fontSize: 13, color: colors.sage300, marginTop: 4 },
  plusSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(244,230,168,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: space.md,
  },
  plusMarkSmall: { fontSize: 28, color: '#F4E6A8', marginTop: -2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(8,12,8,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.parchment,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    paddingBottom: 40,
  },
  sheetTitle: { fontFamily: type.display, fontSize: 22, color: colors.moss900, marginBottom: space.md },
  input: {
    fontFamily: type.bodyBold,
    fontSize: 18,
    color: colors.moss900,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.moss700,
    paddingVertical: space.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  chip: {
    backgroundColor: colors.parchmentDim,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontFamily: type.body, fontSize: 13, color: colors.moss800 },
  save: {
    marginTop: space.lg,
    backgroundColor: colors.moss900,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { fontFamily: type.bodyBold, fontSize: 16, color: colors.parchment },
});
