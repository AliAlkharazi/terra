import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TapButton } from '@/components/TapButton';
import { colors, layout, radius, space, type } from '@/theme/tokens';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const;

interface Props {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  dark?: boolean;
}

export function appendAmount(current: string, digit: string, maxDigits = 6): string {
  if (current.length >= maxDigits) return current;
  if (current === '' && digit === '0') return current;
  return `${current}${digit}`;
}

export function MoneyKeypad({ onDigit, onBackspace, dark = false }: Props) {
  return (
    <View style={styles.grid}>
      {KEYS.map((key, i) => {
        if (key === '') return <View key={`empty-${i}`} style={styles.key} />;
        const label = key === 'back' ? '⌫' : key;
        return (
          <TapButton
            key={key}
            style={[styles.key, dark ? styles.keyDark : styles.keyLight]}
            pressedScale={0.9}
            onPress={() => (key === 'back' ? onBackspace() : onDigit(key))}
          >
            <Text style={[styles.label, dark ? styles.labelDark : styles.labelLight]}>{label}</Text>
          </TapButton>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space.tight,
  },
  key: {
    width: '31%',
    height: layout.hitTarget + 8,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDark: { backgroundColor: colors.glass },
  keyLight: { backgroundColor: colors.parchmentDim },
  label: { fontFamily: type.bodyBold, fontSize: type.size.xl },
  labelDark: { color: colors.parchment },
  labelLight: { color: colors.moss800 },
});
