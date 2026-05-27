export function totalRecAmount(quantities: bigint[]): bigint {
  return quantities.reduce((sum, qty) => sum + qty, BigInt(0));
}

/** Cost in USDC base units (6 decimals): sum(recAmounts) * referencePrice. */
export function usdcCost(totalRec: bigint, referencePrice: bigint): bigint {
  return totalRec * referencePrice;
}

export function formatMwh(value: bigint): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatUsdcBaseUnits(value: bigint, decimals = 6): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionStr = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  const wholeFormatted = new Intl.NumberFormat("en-US").format(whole);
  if (!fractionStr) return wholeFormatted;
  return `${wholeFormatted}.${fractionStr}`;
}
