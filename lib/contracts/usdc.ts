import type { Abi, Address } from "viem";

import { resolveProxyAddress } from "./config";

/** Circle test USDC on Sepolia; override with `NEXT_PUBLIC_USDC_ADDRESS`. */
const DEFAULT_USDC: Address = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

export const erc20Abi = [
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
] as const satisfies Abi;

/** USDC token used by VeriJouleCoreSettlement on Sepolia. */
export function getUsdcToken() {
  return {
    address: resolveProxyAddress(
      "NEXT_PUBLIC_USDC_ADDRESS",
      process.env.NEXT_PUBLIC_USDC_ADDRESS,
      DEFAULT_USDC,
    ),
    abi: erc20Abi,
  } as const;
}
