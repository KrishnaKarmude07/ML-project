export const INR_PER_USD = 86;

export function formatInr(usdAmount, fractionDigits = 0) {
  const inrAmount = Number(usdAmount) * INR_PER_USD;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(inrAmount);
}
