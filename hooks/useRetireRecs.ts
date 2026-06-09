"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { useCallback, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useConfig,
  useReadContract,
  useReadContracts,
  useSwitchChain,
} from "wagmi";
import { sepolia } from "wagmi/chains";

import {
  buildPreflightReads,
  evaluatePreflight,
  formatTransactionError,
  needsUsdcApproval,
  parseRetirementLines,
  type RetirementLine,
  type RetirementPreflightReads,
  type TxFlowPhase,
} from "@/lib/retirement";
import {
  getUsdcToken,
  getVeriJouleCoreREC,
  getVeriJouleCoreSettlement,
} from "@/lib/contracts";

const rec = getVeriJouleCoreREC();
const settlement = getVeriJouleCoreSettlement();
const usdc = getUsdcToken();

type UseRetireRecsOptions = {
  lines: RetirementLine[];
};

export function useRetireRecs({ lines }: UseRetireRecsOptions) {
  const config = useConfig();
  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const [phase, setPhase] = useState<TxFlowPhase>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [flowErrors, setFlowErrors] = useState<string[]>([]);

  const clientParse = useMemo(() => parseRetirementLines(lines), [lines]);

  const parsed = useMemo(
    () => (clientParse.ok ? clientParse.parsed : []),
    [clientParse],
  );

  const { data: settlementReferencePrice } = useReadContract({
    ...settlement,
    functionName: "getReferencePrice",
    chainId: sepolia.id,
    query: { enabled: lines.length > 0 },
  });

  const vintageContracts = useMemo(() => {
    if (!parsed.length) return [];
    return parsed.flatMap((line) => [
      {
        ...rec,
        functionName: "exists" as const,
        args: [line.vintageIdBigInt] as const,
      },
      {
        ...rec,
        functionName: "balanceOf" as const,
        args: [rec.address, line.vintageIdBigInt] as const,
      },
      {
        ...rec,
        functionName: "getPlantCode" as const,
        args: [line.vintageIdBigInt] as const,
      },
    ]);
  }, [parsed]);

  const globalContracts = useMemo(() => {
    if (!address || !parsed.length) return [];
    return [
      { ...settlement, functionName: "getReferencePrice" as const },
      { ...settlement, functionName: "paused" as const },
      {
        ...usdc,
        functionName: "balanceOf" as const,
        args: [address] as const,
      },
      {
        ...usdc,
        functionName: "allowance" as const,
        args: [address, settlement.address] as const,
      },
    ];
  }, [address, parsed.length]);

  const {
    data: globalData,
    isLoading: globalLoading,
    refetch: refetchGlobal,
  } = useReadContracts({
    contracts: globalContracts,
    query: { enabled: globalContracts.length > 0 },
  });

  const {
    data: vintageData,
    isLoading: vintageLoading,
    refetch: refetchVintage,
  } = useReadContracts({
    contracts: vintageContracts,
    query: { enabled: vintageContracts.length > 0 },
  });

  const plantCodes = useMemo(() => {
    if (!vintageData || !parsed.length) return [] as (bigint | null)[];
    return parsed.map((_, index) => {
      const plantResult = vintageData[index * 3 + 2];
      if (plantResult?.status !== "success") return null;
      return plantResult.result as bigint;
    });
  }, [vintageData, parsed]);

  const facilityContractEntries = useMemo(() => {
    return parsed.flatMap((line, index) => {
      const plantCode = plantCodes[index];
      if (plantCode === null || plantCode === undefined) return [];
      return [
        {
          vintageId: line.vintageId,
          contract: {
            ...settlement,
            functionName: "getFacilityWallet" as const,
            args: [plantCode] as const,
          },
        },
      ];
    });
  }, [parsed, plantCodes]);

  const facilityContracts = useMemo(
    () => facilityContractEntries.map((entry) => entry.contract),
    [facilityContractEntries],
  );

  const {
    data: facilityData,
    isLoading: facilityLoading,
    refetch: refetchFacility,
  } = useReadContracts({
    contracts: facilityContracts,
    query: { enabled: facilityContracts.length > 0 },
  });

  const readsLoading = globalLoading || vintageLoading || facilityLoading;

  const preflightReads: RetirementPreflightReads | undefined = useMemo(
    () =>
      buildPreflightReads(
        parsed,
        globalData,
        vintageData,
        facilityData,
        facilityContractEntries,
      ),
    [parsed, globalData, vintageData, facilityData, facilityContractEntries],
  );

  const preflight = evaluatePreflight(parsed, preflightReads, readsLoading);

  const wrongChain = isConnected && chainId !== sepolia.id;

  const retire = useCallback(async (): Promise<boolean> => {
    setFlowErrors([]);
    setTxHash(null);

    if (!isConnected || !address) {
      setPhase("error");
      setFlowErrors(["connect wallet"]);
      return false;
    }

    if (wrongChain) {
      try {
        setPhase("checking");
        await switchChainAsync({ chainId: sepolia.id });
      } catch (error) {
        setPhase("error");
        setFlowErrors([formatTransactionError(error)]);
        return false;
      }
    }

    if (!clientParse.ok) {
      setPhase("error");
      setFlowErrors(clientParse.errors);
      return false;
    }

    setPhase("checking");
    const [globalRefetch, vintageRefetch, facilityRefetch] = await Promise.all([
      refetchGlobal(),
      refetchVintage(),
      refetchFacility(),
    ]);

    const latestReads = buildPreflightReads(
      clientParse.parsed,
      globalRefetch.data,
      vintageRefetch.data,
      facilityRefetch.data,
      facilityContractEntries,
    );

    const latestPreflight = evaluatePreflight(
      clientParse.parsed,
      latestReads,
      false,
    );

    if (!latestPreflight.ready || latestPreflight.cost === null) {
      setPhase("error");
      setFlowErrors(
        latestPreflight.errors.length > 0
          ? latestPreflight.errors
          : ["preflight failed"],
      );
      return false;
    }

    const cost = latestPreflight.cost;
    let allowance = latestReads?.usdcAllowance ?? BigInt(0);
    const linesParsed = clientParse.parsed;
    const vintageIds = linesParsed.map((l) => l.vintageIdBigInt);
    const amounts = linesParsed.map((l) => l.quantity);

    try {
      if (needsUsdcApproval(cost, allowance)) {
        setPhase("approving");
        const approveHash = await writeContract(config, {
          ...usdc,
          functionName: "approve",
          args: [settlement.address, cost],
          chainId: sepolia.id,
          account: address,
        });
        setTxHash(approveHash);
        await waitForTransactionReceipt(config, {
          hash: approveHash,
          chainId: sepolia.id,
        });
        allowance = await readContract(config, {
          ...usdc,
          functionName: "allowance",
          args: [address, settlement.address],
          chainId: sepolia.id,
        });
        if (needsUsdcApproval(cost, allowance)) {
          throw new Error("USDC approval did not reach required amount");
        }
      }

      setPhase("simulating");

      const retireParams =
        linesParsed.length === 1
          ? {
            ...settlement,
            functionName: "purchaseAndRetireRECs" as const,
            args: [vintageIds[0]!, amounts[0]!] as const,
          }
          : {
            ...settlement,
            functionName: "purchaseAndRetireBatchRECs" as const,
            args: [vintageIds, amounts] as const,
          };

      const { request } = await simulateContract(config, {
        ...retireParams,
        chainId: sepolia.id,
        account: address,
      });

      setPhase("awaiting_signature");
      const retireHash = await writeContract(config, request);
      setTxHash(retireHash);
      setPhase("confirming");
      await waitForTransactionReceipt(config, {
        hash: retireHash,
        chainId: sepolia.id,
      });

      setPhase("success");
      await queryClient.invalidateQueries({ queryKey: ["active-vintages"] });
      return true;
    } catch (error) {
      setPhase("error");
      setFlowErrors([formatTransactionError(error)]);
      return false;
    }
  }, [
    address,
    clientParse,
    config,
    isConnected,
    facilityContractEntries,
    queryClient,
    refetchFacility,
    refetchGlobal,
    refetchVintage,
    switchChainAsync,
    wrongChain,
  ]);

  const isBusy = [
    "checking",
    "approving",
    "simulating",
    "awaiting_signature",
    "confirming",
  ].includes(phase);

  const needsApproval =
    preflight.cost !== null &&
    preflightReads !== undefined &&
    needsUsdcApproval(preflight.cost, preflightReads.usdcAllowance);

  const statusLabel = useMemo(() => {
    switch (phase) {
      case "idle":
        return needsApproval && preflight.ready
          ? "ready — approve USDC on retire"
          : preflight.ready
            ? "ready to retire"
            : readsLoading
              ? "checking…"
              : "idle";
      case "checking":
        return "checking…";
      case "needs_approval":
        return "needs USDC approval";
      case "approving":
        return "approving USDC (1/2)…";
      case "simulating":
        return "simulating…";
      case "awaiting_signature":
        return "confirm in wallet…";
      case "confirming":
        return "confirming…";
      case "success":
        return "success";
      case "error":
        return "error";
      default:
        return "idle";
    }
  }, [phase, needsApproval, preflight.ready, readsLoading]);

  const allErrors = useMemo(() => {
    const list = [...flowErrors];
    if (lines.length > 0) {
      if (!clientParse.ok) list.push(...clientParse.errors);
      if (phase !== "error" && !readsLoading) list.push(...preflight.errors);
    }
    return [...new Set(list)].filter((message) => message !== "cart is empty");
  }, [clientParse, flowErrors, lines.length, phase, preflight.errors, readsLoading]);

  return {
    retire,
    phase,
    setPhase,
    txHash,
    statusLabel,
    preflight,
    preflightReads,
    readsLoading,
    wrongChain,
    isBusy,
    canRetire:
      isConnected &&
      !wrongChain &&
      clientParse.ok &&
      preflight.ready &&
      !isBusy &&
      phase !== "success",
    allErrors,
    warnings: preflight.warnings,
    parsed,
    cost: preflight.cost,
    referencePrice:
      (settlementReferencePrice as bigint | undefined) ??
      preflightReads?.referencePrice,
  };
}
