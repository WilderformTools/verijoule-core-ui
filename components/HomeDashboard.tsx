"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { MapContainer } from "@/components/MapContainer";
import { InfoHexTooltip } from "@/components/InfoHexTooltip";
import { MyRetirementsPanel } from "@/components/MyRetirementsPanel";
import {
  RecLedgerPanel,
  type RecVintageBalance,
} from "@/components/RecLedgerPanel";
import { RetirementExecutionPanel } from "@/components/RetirementExecutionPanel";
import { TerminalPanel } from "@/components/TerminalPanel";
import { TxStatusPanel } from "@/components/TxStatusPanel";
import { WalletButton } from "@/components/WalletButton";
import { useRetireRecs } from "@/hooks/useRetireRecs";
import type { RetirementLine } from "@/lib/retirement";

export function HomeDashboard() {
  const { user } = usePrivy();
  const { address } = useAccount();
  const walletAddress = address ?? user?.wallet?.address;
  const [retirementsOpen, setRetirementsOpen] = useState(false);
  const [cartLines, setCartLines] = useState<RetirementLine[]>([]);
  const [focusedVintageId, setFocusedVintageId] = useState<string | null>(null);

  const cartVintageIds = useMemo(
    () => cartLines.map((line) => line.vintageId),
    [cartLines],
  );

  const {
    retire,
    phase,
    txHash,
    statusLabel,
    canRetire,
    isBusy,
    allErrors,
    warnings,
    referencePrice,
    setPhase,
  } = useRetireRecs({ lines: cartLines });

  const handleAddVintage = useCallback((vintage: RecVintageBalance) => {
    setCartLines((current) => {
      const existing = current.find((line) => line.vintageId === vintage.vintageId);
      if (existing) {
        setFocusedVintageId(vintage.vintageId);
        return current;
      }
      setFocusedVintageId(vintage.vintageId);
      return [
        ...current,
        {
          vintageId: vintage.vintageId,
          maxAvailable: vintage.availableBalance,
          quantity: "",
        },
      ];
    });
    setPhase("idle");
  }, [setPhase]);

  const handleQuantityChange = useCallback((vintageId: string, quantity: string) => {
    setCartLines((current) =>
      current.map((line) =>
        line.vintageId === vintageId ? { ...line, quantity } : line,
      ),
    );
    setPhase("idle");
  }, [setPhase]);

  const handleRemoveLine = useCallback((vintageId: string) => {
    setCartLines((current) => current.filter((line) => line.vintageId !== vintageId));
    setFocusedVintageId((current) => (current === vintageId ? null : current));
    setPhase("idle");
  }, [setPhase]);

  const handleRetire = useCallback(async () => {
    const success = await retire();
    if (success) {
      setCartLines([]);
      setFocusedVintageId(null);
    }
  }, [retire]);

  useEffect(() => {
    if (!retirementsOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRetirementsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [retirementsOpen]);

  return (
    <main className="h-dvh overflow-x-auto overflow-y-hidden bg-black px-6 pb-6 pt-0 text-white">
      <div className="mx-auto flex h-full min-h-0 min-w-[72rem] max-w-[96rem] flex-col bg-black px-6 pb-6 pt-2">
        <div className="grid grid-cols-[11fr_9fr] items-center gap-4">
          <div className="flex min-w-0 items-center gap-3 whitespace-nowrap">
            <h1 className="flex items-center font-mono text-xl font-semibold tracking-tight text-white">
              VeriJoule<span className="italic">Core</span>
              <InfoHexTooltip
                ariaLabel="VeriJoule Core proof-of-concept and disclaimer"
                className="ml-2"
              >
                <span className="block text-white">VeriJouleCore | Proof of Concept
                </span>
                <span className="mt-1.5 block">
                  This interface demonstrates a technical pipeline for natively originating and retiring Renewable Energy Certificates (RECs) from public grid data.
                </span>
                <span className="mt-2 block border-t border-[#333333] pt-2 text-[#888888]">
                  The tool pulls daily net solar and wind generation data for the PSCO (Public Service Company of Colorado) balancing authority directly from the U.S. EIA. It aggregates this physical production into vintage IDs and mints matching ERC-1155 tokens on the Sepolia testnet. For this technical demonstration, the entire state of Colorado is treated as a single unified facility.
                </span>
                <span className="mt-2 block border-t border-[#333333] pt-2 text-[#888888]">
                  Disclaimer: This is a technical proof of concept only. The tokens minted and retired within this tool do not represent legally recognized RECs, regulatory compliance instruments, or environmental attributes with market value.
                </span>
              </InfoHexTooltip>
            </h1>
            <span className="font-mono text-xs font-light text-[#666666]">|</span>
            <p className="font-mono text-xs font-light uppercase tracking-[0.28em] text-[#666666]">
              <a
                href="https://www.wilderform.tools"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-white"
              >
                Wilderform Tools
              </a>
            </p>
          </div>
          <WalletButton
            onMyRetirementsClick={() => setRetirementsOpen(true)}
          />
        </div>

        <div className="mt-2 grid min-h-0 flex-1 grid-rows-[minmax(0,1.7fr)_minmax(12rem,0.95fr)] gap-4 overflow-hidden pt-1">
          <div className="grid h-full min-h-0 grid-cols-[11fr_9fr] gap-4">
            <MapContainer className="h-full min-h-0" />

            <TerminalPanel title="REC Ledger" className="h-full min-h-0">
              <RecLedgerPanel
                cartVintageIds={cartVintageIds}
                onAddVintage={handleAddVintage}
              />
            </TerminalPanel>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[11fr_9fr] gap-4">
            <TerminalPanel
              title="Retirement Execution Block"
              className="min-h-0"
              contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4 pb-2"
            >
              <RetirementExecutionPanel
                lines={cartLines}
                focusedVintageId={focusedVintageId}
                referencePrice={referencePrice}
                onQuantityChange={handleQuantityChange}
                onRemoveLine={handleRemoveLine}
              />
            </TerminalPanel>
            <div className="flex min-h-0 min-w-0 flex-col gap-4">
              <TerminalPanel title="Tx Status" className="min-h-0 min-w-0 flex-[0.6] basis-0">
                <TxStatusPanel
                  phase={phase}
                  statusLabel={statusLabel}
                  errors={allErrors}
                  warnings={warnings}
                  txHash={txHash}
                />
              </TerminalPanel>
              <button
                type="button"
                onClick={handleRetire}
                disabled={!canRetire}
                className="flex min-h-0 flex-[0.4] basis-0 items-center justify-center border border-[#3d3d3d] bg-[#050505] px-4 font-mono text-base uppercase tracking-[0.22em] text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#050505] disabled:hover:text-white"
              >
                {isBusy ? statusLabel : "RETIRE RECs"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {retirementsOpen ? (
        <div
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/80 p-6"
          role="presentation"
          onClick={() => setRetirementsOpen(false)}
        >
          <div
            className="relative flex h-[min(32rem,85vh)] w-full max-w-lg min-h-0 cursor-default flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-retirements-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setRetirementsOpen(false)}
              className="absolute right-3 top-0 z-20 -translate-y-1/2 border border-[#3d3d3d] bg-[#050505] px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-white transition-colors hover:bg-white hover:text-black"
            >
              close
            </button>
            <TerminalPanel
              title="My Retirements"
              className="h-full min-h-0"
              contentClassName="flex min-h-0 flex-1 flex-col p-4"
            >
              <div id="my-retirements-title" className="sr-only">
                My Retirements
              </div>
              {walletAddress ? (
                <MyRetirementsPanel userAddress={walletAddress} />
              ) : (
                <div className="flex min-h-0 flex-1 items-center justify-center text-center text-sm uppercase tracking-[0.24em] text-[#8a8a8a]">
                  wallet required
                </div>
              )}
            </TerminalPanel>
          </div>
        </div>
      ) : null}
    </main>
  );
}
