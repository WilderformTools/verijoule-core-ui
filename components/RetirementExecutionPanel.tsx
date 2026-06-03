"use client";

import {
  formatMwh,
  formatUsdcBaseUnits,
  totalRecAmount,
  usdcCost,
  type RetirementLine,
} from "@/lib/retirement";

type RetirementExecutionPanelProps = {
  lines: RetirementLine[];
  focusedVintageId: string | null;
  referencePrice: bigint | undefined;
  onQuantityChange: (vintageId: string, quantity: string) => void;
  onRemoveLine: (vintageId: string) => void;
};

const quickQtyButtonClass =
  "border border-[#3d3d3d] px-1 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#8a8a8a] transition-colors hover:border-white hover:text-white";

function parseQuantityBigInt(raw: string): bigint {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!/^\d+$/.test(trimmed)) return BigInt(0);
  try {
    return BigInt(trimmed);
  } catch {
    return BigInt(0);
  }
}

function quantityAfterAdd(line: RetirementLine, delta: number): string {
  const max = BigInt(line.maxAvailable);
  const next = parseQuantityBigInt(line.quantity) + BigInt(delta);
  const capped = next > max ? max : next;
  return capped.toString();
}

export function RetirementExecutionPanel({
  lines,
  focusedVintageId,
  referencePrice,
  onQuantityChange,
  onRemoveLine,
}: RetirementExecutionPanelProps) {
  if (lines.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-center text-sm uppercase tracking-[0.24em] text-[#8a8a8a]">
        select vintages from ledger
      </div>
    );
  }

  const quantities = lines
    .map((line) => {
      const trimmed = line.quantity.trim().replace(/,/g, "");
      if (!/^\d+$/.test(trimmed)) return BigInt(0);
      try {
        return BigInt(trimmed);
      } catch {
        return BigInt(0);
      }
    })
    .filter((q) => q > BigInt(0));

  const totalMwh =
    quantities.length > 0 ? totalRecAmount(quantities) : BigInt(0);
  const estimatedUsdc =
    referencePrice !== undefined && totalMwh > BigInt(0)
      ? usdcCost(totalMwh, referencePrice)
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-[#1d1d1d] pb-2 text-[10px] uppercase tracking-[0.22em] text-[#666666]">
        <span>{lines.length} line{lines.length === 1 ? "" : "s"}</span>
        <span>
          {totalMwh > BigInt(0) ? `${formatMwh(totalMwh)} mwh` : "enter quantities"}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-[#1d1d1d] bg-black">
        <div className="grid h-9 shrink-0 grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)_auto] items-center gap-3 border-b border-[#1d1d1d] px-3 text-[10px] uppercase tracking-[0.22em] text-[#666666]">
          <span>vintage id</span>
          <span>quantity</span>
          <span className="sr-only">remove</span>
        </div>

        <ul className="vj-scrollbar min-h-0 flex-1 divide-y divide-[#111111] overflow-y-auto overscroll-y-contain">
          {lines.map((line) => {
            const isFocused = line.vintageId === focusedVintageId;
            return (
              <li
                key={line.vintageId}
                className={`grid min-h-10 grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)_auto] items-center gap-3 px-3 py-2 text-sm ${
                  isFocused ? "bg-[#111111]" : ""
                }`}
              >
                <span className="truncate text-white">{line.vintageId}</span>
                <div className="flex min-w-0 items-center gap-1">
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => onQuantityChange(line.vintageId, "")}
                      className={quickQtyButtonClass}
                      aria-label={`Clear quantity for vintage ${line.vintageId}`}
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onQuantityChange(line.vintageId, quantityAfterAdd(line, 1))
                      }
                      className={quickQtyButtonClass}
                      aria-label={`Add 1 MWh for vintage ${line.vintageId}`}
                    >
                      1
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onQuantityChange(line.vintageId, quantityAfterAdd(line, 5))
                      }
                      className={quickQtyButtonClass}
                      aria-label={`Add 5 MWh for vintage ${line.vintageId}`}
                    >
                      5
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="MWh"
                    value={line.quantity}
                    onChange={(event) =>
                      onQuantityChange(line.vintageId, event.target.value)
                    }
                    className="min-w-0 flex-1 border border-[#3d3d3d] bg-black px-2 py-1 text-right text-sm text-white outline-none focus:border-white"
                    aria-label={`Quantity for vintage ${line.vintageId}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveLine(line.vintageId)}
                  className="border border-[#3d3d3d] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[#8a8a8a] transition-colors hover:border-white hover:text-white"
                  aria-label={`Remove vintage ${line.vintageId}`}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex shrink-0 flex-col gap-1 text-[10px] uppercase tracking-[0.22em] text-[#666666]">
        {estimatedUsdc !== null ? (
          <span>est. cost: {formatUsdcBaseUnits(estimatedUsdc)} USDC</span>
        ) : (
          <span>est. cost: —</span>
        )}
        {referencePrice !== undefined ? (
          <span>price: {formatUsdcBaseUnits(referencePrice)} USDC / MWh</span>
        ) : null}
      </div>
    </div>
  );
}
