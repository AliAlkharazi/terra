import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  forecastBandLabel,
  forecastBasisLabel,
  forecastChipLabel,
  formatEuroFromCents,
  isVisibleForecast,
} from './display.ts';

describe('formatEuroFromCents', () => {
  it('converts integer cents to euros', () => {
    assert.equal(formatEuroFromCents(1999), '€19.99');
    assert.equal(formatEuroFromCents(0), '€0.00');
    assert.equal(formatEuroFromCents(25050), '€250.50');
  });

  it('keeps a leading minus for negative cents', () => {
    assert.equal(formatEuroFromCents(-150), '-€1.50');
  });
});

describe('isVisibleForecast', () => {
  it('hides a missing forecast', () => {
    assert.equal(isVisibleForecast(null), false);
    assert.equal(isVisibleForecast(undefined), false);
  });

  it('shows a forecast object', () => {
    assert.equal(isVisibleForecast({ predictedNextMonthCents: 100 }), true);
  });
});

describe('forecastBasisLabel', () => {
  it('uses basedOnMonths and horizonMonths', () => {
    assert.equal(
      forecastBasisLabel({ basedOnMonths: 1, horizonMonths: 1 }),
      'Based on 1 month / horizon 1'
    );
    assert.equal(
      forecastBasisLabel({ basedOnMonths: 2, horizonMonths: 2 }),
      'Based on 2 months / horizon 2'
    );
    assert.equal(
      forecastBasisLabel({ basedOnMonths: 3, horizonMonths: 3 }),
      'Based on 3 months / horizon 3'
    );
  });
});

describe('forecastBandLabel', () => {
  it('omits the band unless both bounds are present', () => {
    assert.equal(forecastBandLabel({}), null);
    assert.equal(forecastBandLabel({ bandLowCents: 100 }), null);
    assert.equal(forecastBandLabel({ bandHighCents: 300 }), null);
  });

  it('formats both bounds when N is large enough for a band', () => {
    assert.equal(
      forecastBandLabel({ bandLowCents: 1000, bandHighCents: 3000 }),
      '€10.00–€30.00'
    );
  });
});

describe('forecastChipLabel', () => {
  it('labels the list chip as an estimate', () => {
    assert.equal(forecastChipLabel(4200), 'Est. €42.00');
  });
});
