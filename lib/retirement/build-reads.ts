import type { ParsedRetirementLine, RetirementPreflightReads } from "./types";

type ReadResult = {
  status: "success" | "failure";
  result?: unknown;
};

export function buildPreflightReads(
  parsed: ParsedRetirementLine[],
  globalData: ReadResult[] | undefined,
  vintageData: ReadResult[] | undefined,
  facilityData: ReadResult[] | undefined,
  facilityEntries: Array<{ vintageId: string }>,
): RetirementPreflightReads | undefined {
  if (!globalData || globalData.length < 4 || !vintageData || !parsed.length) {
    return undefined;
  }

  const refPrice = globalData[0];
  const paused = globalData[1];
  const usdcBal = globalData[2];
  const usdcAllow = globalData[3];

  if (
    refPrice?.status !== "success" ||
    paused?.status !== "success" ||
    usdcBal?.status !== "success" ||
    usdcAllow?.status !== "success"
  ) {
    return undefined;
  }

  const facilityByVintage = new Map<string, `0x${string}` | null>();
  facilityEntries.forEach((entry, index) => {
    const facilityResult = facilityData?.[index];
    facilityByVintage.set(
      entry.vintageId,
      facilityResult?.status === "success"
        ? (facilityResult.result as `0x${string}`)
        : null,
    );
  });

  const vintages = parsed.map((line, index) => {
    const existsResult = vintageData[index * 3];
    const balanceResult = vintageData[index * 3 + 1];
    const plantResult = vintageData[index * 3 + 2];

    return {
      vintageId: line.vintageId,
      exists:
        existsResult?.status === "success"
          ? Boolean(existsResult.result)
          : false,
      recBalance:
        balanceResult?.status === "success"
          ? (balanceResult.result as bigint)
          : BigInt(0),
      plantCode:
        plantResult?.status === "success"
          ? (plantResult.result as bigint)
          : BigInt(0),
      facilityWallet: facilityByVintage.get(line.vintageId) ?? null,
    };
  });

  return {
    referencePrice: refPrice.result as bigint,
    paused: paused.result as boolean,
    usdcBalance: usdcBal.result as bigint,
    usdcAllowance: usdcAllow.result as bigint,
    vintages,
  };
}
