export function sanitizeBrazilianCurrencyInput(value: string) {
  return value.replace(/[^\d,.$\s]/g, "").replace(/\s/g, "");
}

export function parseBrazilianCurrency(value: string): number {
  const normalized = sanitizeBrazilianCurrencyInput(value).replace(/R\$/g, "");
  if (!normalized) return 0;

  const decimalIndex = Math.max(normalized.lastIndexOf(","), normalized.lastIndexOf("."));
  if (decimalIndex >= 0) {
    const fraction = normalized.slice(decimalIndex + 1).replace(/\D/g, "");
    if (fraction.length > 0 && fraction.length <= 2) {
      const whole = normalized.slice(0, decimalIndex).replace(/\D/g, "") || "0";
      return Number(whole) + Number(fraction.padEnd(2, "0")) / 100;
    }
  }

  return Number(normalized.replace(/\D/g, "")) || 0;
}
