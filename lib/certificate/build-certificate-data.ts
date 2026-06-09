import { getAddress } from "viem";

import {
  getVeriJouleCoreREC,
  getVeriJouleCoreSettlement,
} from "@/lib/contracts";

import { formatIssuedAtUtc, formatVintagePeriod } from "./format";
import type { BuildCertificateInput, CertificateData } from "./types";

function buildCertificateId(vintageId: string, buyer: `0x${string}`): string {
  return `vjc-${vintageId}-${buyer.slice(2, 10)}`;
}

export async function buildCertificateData(
  input: BuildCertificateInput,
): Promise<CertificateData> {
  const rec = getVeriJouleCoreREC();
  const settlement = getVeriJouleCoreSettlement();
  const retireeAddress = getAddress(input.buyerAddress);

  return {
    certificateId: buildCertificateId(input.vintageId, retireeAddress),
    issuedAtUtc: formatIssuedAtUtc(new Date()),
    vintageId: input.vintageId,
    vintagePeriod: formatVintagePeriod(input.vintageId),
    totalRetiredMwh: input.totalQuantity,
    retireeAddress,
    network: "Ethereum Sepolia",
    recContractAddress: rec.address,
    settlementContractAddress: settlement.address,
    auditTrail: input.auditTrail,
  };
}
