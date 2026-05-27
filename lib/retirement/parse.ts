import type { RetirementLine } from "./types";

export type ParseQuantityResult =
  | { ok: true; value: bigint }
  | { ok: false; error: string };

export function parseQuantityInput(raw: string): ParseQuantityResult {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) {
    return { ok: false, error: "quantity required" };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, error: "whole MWh only (integers)" };
  }
  const value = BigInt(trimmed);
  if (value <= BigInt(0)) {
    return { ok: false, error: "quantity must be greater than zero" };
  }
  return { ok: true, value };
}

export function parseRetirementLines(
  lines: RetirementLine[],
): { ok: true; parsed: Array<{ vintageId: string; vintageIdBigInt: bigint; maxAvailable: bigint; quantity: bigint }> } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const parsed: Array<{
    vintageId: string;
    vintageIdBigInt: bigint;
    maxAvailable: bigint;
    quantity: bigint;
  }> = [];

  if (lines.length === 0) {
    return { ok: false, errors: [] };
  }

  const seen = new Set<string>();

  for (const line of lines) {
    if (seen.has(line.vintageId)) {
      errors.push(`duplicate vintage ${line.vintageId}`);
      continue;
    }
    seen.add(line.vintageId);

    let vintageIdBigInt: bigint;
    try {
      vintageIdBigInt = BigInt(line.vintageId);
    } catch {
      errors.push(`invalid vintage id ${line.vintageId}`);
      continue;
    }

    const qty = parseQuantityInput(line.quantity);
    if (!qty.ok) {
      errors.push(`${line.vintageId}: ${qty.error}`);
      continue;
    }

    let maxAvailable: bigint;
    try {
      maxAvailable = BigInt(line.maxAvailable);
    } catch {
      errors.push(`${line.vintageId}: invalid indexer balance`);
      continue;
    }

    if (qty.value > maxAvailable) {
      errors.push(
        `${line.vintageId}: quantity exceeds ledger available (${maxAvailable.toString()} MWh)`,
      );
      continue;
    }

    parsed.push({
      vintageId: line.vintageId,
      vintageIdBigInt,
      maxAvailable,
      quantity: qty.value,
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, parsed };
}
