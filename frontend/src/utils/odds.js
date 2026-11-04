/** Lógica pura de cuotas / parlays (testeable). */

export function multiplyOdds(odds) {
  if (!Array.isArray(odds) || odds.length === 0) return 1;
  return odds.reduce((total, odd) => total * Number(odd || 1), 1);
}

export function potentialReturn(stake, odds) {
  const amount = Number(stake);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return amount * multiplyOdds(odds);
}

export function potentialProfit(stake, odds) {
  return potentialReturn(stake, odds) - Number(stake || 0);
}

export function oddToMillis(odd) {
  const n = Number(odd);
  if (!Number.isFinite(n) || n <= 1) throw new Error('Cuota inválida');
  return Math.round(n * 1000);
}

export function multiplyOddsMillis(values) {
  if (!values.length) return 1000;
  return Math.round(values.reduce((acc, v) => (acc * Number(v)) / 1000, 1000));
}
