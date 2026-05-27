import { createPublicClient, getAddress, http } from "viem";
import { readContract } from "viem/actions";
import { sepolia } from "viem/chains";

import {
  getVeriJouleCoreREC,
  getVeriJouleCoreSettlement,
} from "@/lib/contracts";

import { formatIssuedAtUtc, formatVintagePeriod } from "./format";
import type { BuildCertificateInput, CertificateData } from "./types";

const sepoliaRpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL?.trim();

function getPublicClient() {
  return createPublicClient({
    chain: sepolia,
    transport: sepoliaRpc ? http(sepoliaRpc) : http(),
  });
}

function buildCertificateId(vintageId: string, buyer: `0x${string}`): string {
  return `vj-${vintageId}-${buyer.slice(2, 10)}`;
}

async function fetchPlantCode(vintageId: string): Promise<string | null> {
  try {
    const vintageIdBigInt = BigInt(vintageId);
    const rec = getVeriJouleCoreREC();
    const client = getPublicClient();
    const plantCode = (await readContract(client, {
      address: rec.address,
      abi: rec.abi,
      functionName: "getPlantCode",
      args: [vintageIdBigInt],
    })) as bigint;
    return plantCode.toString();
  } catch {
    return null;
  }
}

export async function buildCertificateData(
  input: BuildCertificateInput,
): Promise<CertificateData> {
  const rec = getVeriJouleCoreREC();
  const settlement = getVeriJouleCoreSettlement();
  const retireeAddress = getAddress(input.buyerAddress);
  const plantCode = await fetchPlantCode(input.vintageId);

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
    plantCode,
    auditTrail: input.auditTrail,
  };
}
