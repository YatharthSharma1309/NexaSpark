/**
 * Convert a major-unit amount (e.g. rupees) to Stripe's smallest currency unit.
 * @param {number} amountMajor
 * @param {string} currency ISO 4217
 */
export function toStripeMinorUnits(amountMajor, currency) {
  const code = currency.toLowerCase();
  const n = Number(amountMajor);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error('Invalid amount');
  }
  if (code === 'jpy' || code === 'krw' || code === 'vnd') {
    return Math.round(n);
  }
  return Math.round(n * 100);
}
