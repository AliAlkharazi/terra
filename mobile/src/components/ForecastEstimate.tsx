import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DistrictForecast } from '@/types';
import { forecastBandLabel, forecastBasisLabel, formatEuroFromCents } from '@/forecast/display';
import { colors, radius, space, type } from '@/theme/tokens';

/**
 * Reads the forecast already attached to `GET /districts`.
 * Callers hide this entirely when that field is null.
 */
export function ForecastEstimate({ forecast }: { forecast: DistrictForecast }) {
  const amount = formatEuroFromCents(forecast.predictedNextMonthCents);
  const band = forecastBandLabel(forecast);

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={
        band
          ? `Next-month estimate ${amount}. ${forecastBasisLabel(forecast)}. Range ${band}. An estimate, not a budget and not a guarantee.`
          : `Next-month estimate ${amount}. ${forecastBasisLabel(forecast)}. An estimate, not a budget and not a guarantee.`
      }
    >
      <Text style={styles.kicker}>NEXT-MONTH ESTIMATE</Text>
      <Text style={styles.amount}>{amount}</Text>
      <Text style={styles.meta}>{forecastBasisLabel(forecast)}</Text>
      {band ? <Text style={styles.meta}>Range {band}</Text> : null}
      <Text style={styles.disclaimer}>An estimate, not a budget and not a guarantee.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: space.md,
    backgroundColor: colors.moss800,
    borderRadius: radius.md,
    padding: space.md,
  },
  kicker: {
    fontFamily: type.bodyBold,
    fontSize: type.size.xs,
    color: colors.sage300,
    letterSpacing: 1.5,
  },
  amount: {
    fontFamily: type.mono,
    fontSize: type.size.xl,
    color: colors.parchment,
    marginTop: space.xs,
  },
  meta: {
    fontFamily: type.body,
    fontSize: type.size.sm,
    color: colors.textOnMossDim,
    marginTop: space.xs,
  },
  disclaimer: {
    fontFamily: type.body,
    fontSize: type.size.xs,
    color: colors.sage300,
    marginTop: space.sm,
  },
});
