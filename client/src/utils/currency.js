export const EXCHANGE_RATE = 86;
export const CURRENCY_SYMBOL = '₹';

const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

// Formats direct INR value (e.g. 15000 -> ₹15,000)
export const formatDirectPrice = (amountINR) => {
  if (amountINR === undefined || amountINR === null) return '';
  return formatter.format(Math.round(Number(amountINR)));
};
