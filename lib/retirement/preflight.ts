import { formatUsdcBaseUnits, totalRecAmount, usdcCost } from "./pricing";
import type { ParsedRetirementLine, RetirementPreflightReads } from "./types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function evaluatePreflight(
  parsed: ParsedRetirementLine[],
  reads: RetirementPreflightReads | undefined,
  readsLoading: boolean,
): { ready: boolean; errors: string[]; warnings: string[]; cost: bigint | null } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (parsed.length === 0) {
    return { ready: false, errors: [], warnings, cost: null };
  }

  if (readsLoading || !reads) {
    return { ready: false, errors: [], warnings, cost: null };
  }

  if (reads.paused) {
    errors.push("settlement contract is paused");
  }

  if (reads.referencePrice <= BigInt(0)) {
    errors.push("reference price is not set");
  }

  const quantities = parsed.map((line) => line.quantity);
  const totalRec = totalRecAmount(quantities);
  const cost = usdcCost(totalRec, reads.referencePrice);

  for (const line of parsed) {
    const onChain = reads.vintages.find((v) => v.vintageId === line.vintageId);
    if (!onChain) {
      errors.push(`${line.vintageId}: missing on-chain data`);
      continue;
    }
    if (!onChain.exists) {
      errors.push(`${line.vintageId}: vintage does not exist on-chain`);
    }
    if (line.quantity > onChain.recBalance) {
      errors.push(
        `${line.vintageId}: quantity exceeds contract inventory (${onChain.recBalance.toString()} MWh)`,
      );
    }
    if (line.quantity > line.maxAvailable && line.quantity <= onChain.recBalance) {
      warnings.push(`${line.vintageId}: ledger shows less than contract (stale indexer)`);
    }
    if (line.maxAvailable > onChain.recBalance) {
      warnings.push(`${line.vintageId}: ledger stale — chain inventory is lower`);
    }
    if (
      !onChain.facilityWallet ||
      onChain.facilityWallet.toLowerCase() === ZERO_ADDRESS
    ) {
      errors.push(`${line.vintageId}: facility wallet not configured`);
    }
  }

  if (reads.usdcBalance < cost) {
    errors.push(
      `insufficient USDC (need ${formatUsdcBaseUnits(cost)}, have ${formatUsdcBaseUnits(reads.usdcBalance)})`,
    );
  }

  return {
    ready: errors.length === 0,
    errors,
    warnings,
    cost,
  };
}

export function needsUsdcApproval(
  cost: bigint,
  allowance: bigint,
): boolean {
  return allowance < cost;
}
