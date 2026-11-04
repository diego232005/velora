/** Dinero en centavos COP (enteros). Cuotas en milésimas (2.50 => 2500). */

export function pesosToCentavos(pesos) {
  const n = Number(pesos);
  if (!Number.isFinite(n)) throw new Error('Monto inválido');
  return Math.round(n * 100);
}

export function centavosToPesos(centavos) {
  return Number(centavos) / 100;
}

export function oddToMillis(odd) {
  const n = Number(odd);
  if (!Number.isFinite(n) || n <= 1) throw new Error('Cuota inválida');
  return Math.round(n * 1000);
}

export function millisToOdd(millis) {
  return Number(millis) / 1000;
}

export function multiplyOddsMillis(values) {
  if (!values.length) return 1000;
  const product = values.reduce((acc, v) => (acc * Number(v)) / 1000, 1000);
  return Math.round(product);
}

export function potentialWinCentavos(stakeCentavos, cuotaTotalMillis) {
  return Math.floor((Number(stakeCentavos) * Number(cuotaTotalMillis)) / 1000);
}
