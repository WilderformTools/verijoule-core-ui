export type RetirementLine = {
  vintageId: string;
  maxAvailable: string;
  quantity: string;
};

export type ParsedRetirementLine = {
  vintageId: string;
  vintageIdBigInt: bigint;
  maxAvailable: bigint;
  quantity: bigint;
};

export type VintageOnChainData = {
  vintageId: string;
  exists: boolean;
  recBalance: bigint;
  plantCode: bigint;
  facilityWallet: `0x${string}` | null;
};

export type RetirementPreflightReads = {
  referencePrice: bigint;
  paused: boolean;
  usdcBalance: bigint;
  usdcAllowance: bigint;
  vintages: VintageOnChainData[];
};

export type TxFlowPhase =
  | "idle"
  | "checking"
  | "needs_approval"
  | "approving"
  | "simulating"
  | "awaiting_signature"
  | "confirming"
  | "success"
  | "error";
