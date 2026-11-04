import test from 'node:test';
import assert from 'node:assert/strict';
import {
  multiplyOdds,
  multiplyOddsMillis,
  oddToMillis,
  potentialProfit,
  potentialReturn,
} from './odds.js';

test('combinada multiplica cuotas', () => {
  assert.equal(Number(multiplyOdds([2, 1.5]).toFixed(2)), 3);
});

test('retorno y ganancia neta', () => {
  assert.equal(potentialReturn(10000, [2, 1.5]), 30000);
  assert.equal(potentialProfit(10000, [2]), 10000);
});

test('milésimas alineadas con backend', () => {
  assert.equal(oddToMillis(2.5), 2500);
  assert.equal(multiplyOddsMillis([2000, 1500]), 3000);
});
