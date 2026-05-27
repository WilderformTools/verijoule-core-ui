import type { Abi } from "viem";
import { BaseError, ContractFunctionRevertedError, decodeErrorResult } from "viem";

import { getVeriJouleCoreREC, getVeriJouleCoreSettlement } from "@/lib/contracts";

const ERROR_LABELS: Record<string, string> = {
  VeriJouleCoreSettlement__ArrayLengthMismatch: "vintage and amount arrays must match",
  VeriJouleCoreSettlement__FacilityWalletNotFound: "facility wallet not found",
  VeriJouleCoreSettlement__InsufficientRECsBalance: "insufficient REC inventory",
  VeriJouleCoreSettlement__InvalidAmount: "invalid amount",
  VeriJouleCoreSettlement__InvalidPlantCode: "invalid plant code",
  VeriJouleCoreSettlement__InvalidPrice: "invalid reference price",
  VeriJouleCoreSettlement__InvalidVintage: "invalid vintage",
  VeriJouleCoreSettlement__ZeroAddress: "zero address",
  VeriJouleCoreREC__VintageNotMinted: "vintage not minted",
  EnforcedPause: "contract is paused",
  SafeERC20FailedOperation: "USDC transfer failed",
};

function decodeWithAbis(data: `0x${string}`): string | null {
  const abis: Abi[] = [
    getVeriJouleCoreSettlement().abi,
    getVeriJouleCoreREC().abi,
  ];
  for (const abi of abis) {
    try {
      const decoded = decodeErrorResult({ abi, data });
      return ERROR_LABELS[decoded.errorName] ?? decoded.errorName;
    } catch {
      // try next abi
    }
  }
  return null;
}

export function formatTransactionError(error: unknown): string {
  if (error instanceof BaseError) {
    const revert = error.walk(
      (err) => err instanceof ContractFunctionRevertedError,
    );
    if (revert instanceof ContractFunctionRevertedError) {
      const data = revert.data;
      if (data && typeof data === "object" && "errorName" in data) {
        const name = String(data.errorName);
        return ERROR_LABELS[name] ?? name;
      }
      if (typeof data === "string") {
        const decoded = decodeWithAbis(data);
        if (decoded) return decoded;
      }
      if (revert.reason) return revert.reason;
    }
    return error.shortMessage || error.message;
  }
  if (error instanceof Error) return error.message;
  return "transaction failed";
}
