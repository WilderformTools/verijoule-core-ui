import type { Abi, Address } from "viem";
import { getAddress, isAddress } from "viem";

import veriJouleCoreRecAbi from "./abis/verijoule-core-rec.json";
import veriJouleCoreSettlementAbi from "./abis/verijoule-core-settlement.json";

export function resolveProxyAddress(
  envKey: string,
  envValue: string | undefined,
  defaultAddress: Address,
): Address {
  const raw = envValue?.trim();
  if (!raw) return defaultAddress;
  if (!isAddress(raw)) {
    throw new Error(
      `${envKey} must be a valid address (0x…40 hex), or unset to use the default.`,
    );
  }
  return getAddress(raw);
}

/** Canonical Sepolia proxy; override with `NEXT_PUBLIC_VERIJ_CORE_REC_ADDRESS`. */
const DEFAULT_VERIJ_CORE_REC: Address =
  "0x62fb26B311bfde6BcEB24D0452851E922b9e84d9";

/** Canonical Sepolia proxy; override with `NEXT_PUBLIC_VERIJ_CORE_SETTLEMENT_ADDRESS`. */
const DEFAULT_VERIJ_CORE_SETTLEMENT: Address =
  "0x77C5cb632aa28AA72202bbe842dE901Ff3711b6f";

/** VeriJouleCoreREC proxy on Sepolia. */
export function getVeriJouleCoreREC() {
  return {
    address: resolveProxyAddress(
      "NEXT_PUBLIC_VERIJ_CORE_REC_ADDRESS",
      process.env.NEXT_PUBLIC_VERIJ_CORE_REC_ADDRESS,
      DEFAULT_VERIJ_CORE_REC,
    ),
    abi: veriJouleCoreRecAbi as Abi,
  } as const;
}

/** VeriJouleCoreSettlement proxy on Sepolia. */
export function getVeriJouleCoreSettlement() {
  return {
    address: resolveProxyAddress(
      "NEXT_PUBLIC_VERIJ_CORE_SETTLEMENT_ADDRESS",
      process.env.NEXT_PUBLIC_VERIJ_CORE_SETTLEMENT_ADDRESS,
      DEFAULT_VERIJ_CORE_SETTLEMENT,
    ),
    abi: veriJouleCoreSettlementAbi as Abi,
  } as const;
}
