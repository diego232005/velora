import { brand } from '../config/brand';

export function formatOdd(value) {
  return Number(value).toFixed(2);
}

export function formatMoney(value, locale = brand.locale, currency = brand.currency) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function formatDateTime(iso, locale = brand.locale) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatClock(iso, locale = brand.locale) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function multiplyOdds(odds) {
  return odds.reduce((total, odd) => total * Number(odd || 1), 1);
}
