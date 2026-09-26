import React from 'react';
import { StyleSheet, View } from 'react-native';
import { visualPieces } from '@/engine/moneyVisual';
import { EuroNote } from './EuroNote';
import { EuroCoin } from './EuroCoin';

interface Props {
  amount: number;
}

export function VaultCash({ amount }: Props) {
  const pieces = visualPieces(amount, 3);
  if (pieces.length === 0) return null;
  return (
    <View pointerEvents="none" style={styles.wrap}>
      {pieces.map((piece, i) => (
        <View key={`${piece.value}-${i}`} style={[styles.item, { top: 18 - i * 7, transform: [{ rotate: `${-18 + i * 10}deg` }] }]}>
          {piece.kind === 'coin' ? (
            <EuroCoin value={piece.value as 1 | 2} size={22} />
          ) : (
            <EuroNote value={piece.value as 5 | 10 | 20 | 50 | 100} width={54} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 66,
    height: 48,
    alignItems: 'center',
  },
  item: {
    position: 'absolute',
  },
});
