"use client";

import type { TxFlowPhase } from "@/lib/retirement";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io/tx/";

type TxStatusPanelProps = {
  phase: TxFlowPhase;
  statusLabel: string;
  errors: string[];
  warnings: string[];
  txHash: `0x${string}` | null;
};

export function TxStatusPanel({
  phase,
  statusLabel,
  errors,
  warnings,
  txHash,
}: TxStatusPanelProps) {
  const hasContent =
    phase !== "idle" || errors.length > 0 || warnings.length > 0 || txHash;

  if (!hasContent) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-center text-sm uppercase tracking-[0.24em] text-[#8a8a8a]">
        tx status
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto text-left">
      <p
        className={`text-sm uppercase tracking-[0.24em] ${
          phase === "error"
            ? "text-[#cfcfcf]"
            : phase === "success"
              ? "text-white"
              : "text-[#8a8a8a]"
        }`}
      >
        {statusLabel}
      </p>

      {warnings.length > 0 ? (
        <ul className="space-y-1 text-[10px] uppercase tracking-[0.18em] text-[#666666]">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {errors.length > 0 ? (
        <ul className="space-y-1 text-[10px] uppercase tracking-[0.18em] text-[#cfcfcf]">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {txHash ? (
        <a
          href={`${SEPOLIA_EXPLORER}${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="truncate text-[10px] uppercase tracking-[0.18em] text-white underline decoration-[#3d3d3d] underline-offset-2 hover:decoration-white"
        >
          {txHash}
        </a>
      ) : null}
    </div>
  );
}
