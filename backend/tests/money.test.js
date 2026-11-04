import test from 'node:test';
import assert from 'node:assert/strict';
import {
  centavosToPesos,
  multiplyOddsMillis,
  oddToMillis,
  pesosToCentavos,
  potentialWinCentavos,
} from '../src/utils/money.js';

test('pesosToCentavos evita flotantes peligrosos', () => {
  assert.equal(pesosToCentavos(10.5), 1050);
  assert.equal(centavosToPesos(1050), 10.5);
});

test('cuotas en milésimas', () => {
  assert.equal(oddToMillis(2.5), 2500);
  assert.equal(multiplyOddsMillis([2000, 1500]), 3000);
  assert.equal(potentialWinCentavos(10000, 2500), 25000);
});

test('parlay tres selecciones', () => {
  const total = multiplyOddsMillis([1800, 2000, 1500]);
  assert.equal(total, 5400);
  assert.equal(potentialWinCentavos(20000, total), 108000);
});
