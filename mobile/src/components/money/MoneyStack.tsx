import React from 'react';
import { StyleSheet, View } from 'react-native';
import { visualPieces } from '@/engine/moneyVisual';
import { EuroNote } from './EuroNote';
import { EuroCoin } from './EuroCoin';

export function MoneyStack({ amount, large = false }: { amount: number; large?: boolean }) {
  const pieces = visualPieces(amount, 4);
  if (pieces.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {pieces.map((piece, i) => (
        <View key={`${piece.value}-${i}`} style={{ marginLeft: i === 0 ? 0 : large ? -28 : -22, zIndex: i, transform: [{ rotate: `${-10 + i * 7}deg` }] }}>
          {piece.kind === 'coin' ? (
            <EuroCoin value={piece.value as 1 | 2} size={large ? 28 : 22} />
          ) : (
            <EuroNote value={piece.value as 5 | 10 | 20 | 50 | 100} width={large ? 88 : 62} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
  },
});
