"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import {
  buildCertificateData,
  formatBigInt,
  formatTimestamp,
  openCertificate,
  sepoliaTxUrl,
  type CertificateAuditRow,
} from "@/lib/certificate";

type UserRetirement = {
  vintageId: string;
  totalQuantity: string;
};

type RecsRetired = {
  vintageId: string;
  quantity: string;
  txHash: string;
  timestamp: string;
};

type UserRetirementsData = {
  summaries: UserRetirement[];
  retiredByVintage: Map<string, RecsRetired[]>;
};

type GraphQLResponse = {
  data?: {
    userRetirementss?: {
      items?: UserRetirement[];
    };
    recsRetireds?: {
      items?: RecsRetired[];
    };
  };
  errors?: Array<{ message?: string }>;
};

const INDEXER_URL =
  process.env.NEXT_PUBLIC_INDEXER_URL?.trim() || "http://localhost:42069";

const USER_RETIREMENTS_QUERY = `
  query UserRetirementsData($buyer: String!) {
    userRetirementss(where: { buyer: $buyer }) {
      items {
        vintageId
        totalQuantity
      }
    }
    recsRetireds(where: { by: $buyer }, orderBy: "timestamp", orderDirection: "desc") {
      items {
        vintageId
        quantity
        txHash
        timestamp
      }
    }
  }
`;

type MyRetirementsPanelProps = {
  userAddress: string;
};

function compareBigIntStringsAscending(a: string, b: string) {
  const left = BigInt(a);
  const right = BigInt(b);

  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function truncateHash(hash: string) {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

async function fetchUserRetirements(buyer: string): Promise<UserRetirementsData> {
  const response = await fetch(INDEXER_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: USER_RETIREMENTS_QUERY,
      variables: { buyer },
    }),
  });

  if (!response.ok) {
    throw new Error(`Indexer request failed with ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse;
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || "GraphQL request failed");
  }

  const summaries = [...(payload.data?.userRetirementss?.items ?? [])].sort((a, b) =>
    compareBigIntStringsAscending(a.vintageId, b.vintageId),
  );

  const retiredByVintage = new Map<string, RecsRetired[]>();
  for (const item of payload.data?.recsRetireds?.items ?? []) {
    const existing = retiredByVintage.get(item.vintageId) ?? [];
    existing.push(item);
    retiredByVintage.set(item.vintageId, existing);
  }

  return { summaries, retiredByVintage };
}

function toAuditRows(entries: RecsRetired[]): CertificateAuditRow[] {
  return entries.map((entry) => ({
    quantity: entry.quantity,
    txHash: entry.txHash,
    timestamp: entry.timestamp,
  }));
}

export function MyRetirementsPanel({ userAddress }: MyRetirementsPanelProps) {
  const buyer = userAddress.toLowerCase();
  const [expandedVintageId, setExpandedVintageId] = useState<string | null>(null);
  const [generatingVintageId, setGeneratingVintageId] = useState<string | null>(
    null,
  );
  const [certificateError, setCertificateError] = useState<{
    vintageId: string;
    message: string;
  } | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user-retirements", INDEXER_URL, buyer],
    queryFn: () => fetchUserRetirements(buyer),
    enabled: Boolean(userAddress),
    refetchOnWindowFocus: false,
  });

  const summaries = data?.summaries ?? [];
  const retiredByVintage = data?.retiredByVintage ?? new Map<string, RecsRetired[]>();

  const handleGenerateCertificate = useCallback(
    async (
      vintageId: string,
      totalQuantity: string,
      auditTrail: RecsRetired[],
    ) => {
      setCertificateError(null);
      setGeneratingVintageId(vintageId);
      try {
        const certificateData = await buildCertificateData({
          vintageId,
          totalQuantity,
          buyerAddress: userAddress,
          auditTrail: toAuditRows(auditTrail),
        });
        await openCertificate(certificateData);
      } catch (err) {
        setCertificateError({
          vintageId,
          message:
            err instanceof Error ? err.message : "certificate generation failed",
        });
      } finally {
        setGeneratingVintageId(null);
      }
    },
    [userAddress],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-center text-sm uppercase tracking-[0.24em] text-[#8a8a8a]">
        loading retirements...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-[#cfcfcf]">
          retirements offline
        </p>
        <p className="max-w-xs text-[10px] uppercase tracking-[0.2em] text-[#666666]">
          {error instanceof Error ? error.message : "check indexer connection"}
        </p>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-[#8a8a8a]">
          no retirements found
        </p>
      </div>
    );
  }

  const totalRetired = summaries.reduce(
    (sum, row) => sum + BigInt(row.totalQuantity),
    BigInt(0),
  );

  const toggleVintage = (vintageId: string) => {
    setExpandedVintageId((current) => (current === vintageId ? null : vintageId));
    setCertificateError(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-[#1d1d1d] pb-2 text-[10px] uppercase tracking-[0.22em] text-[#666666]">
        <span>{summaries.length} retired vintages</span>
        <span>{formatBigInt(totalRetired.toString())} mwh retired</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-[#1d1d1d] bg-black">
        <div className="grid h-9 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#1d1d1d] px-3 text-[10px] uppercase tracking-[0.22em] text-[#666666]">
          <span>vintage id</span>
          <span>total retired</span>
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-[#111111] overflow-y-auto overscroll-y-contain">
          {summaries.map((summary) => {
            const isExpanded = expandedVintageId === summary.vintageId;
            const auditTrail = retiredByVintage.get(summary.vintageId) ?? [];
            const isGenerating = generatingVintageId === summary.vintageId;

            return (
              <li key={summary.vintageId} className="text-sm text-white">
                <button
                  type="button"
                  onClick={() => toggleVintage(summary.vintageId)}
                  className="grid min-h-10 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 text-left transition-colors hover:bg-[#0a0a0a]"
                >
                  <span className="truncate">{summary.vintageId}</span>
                  <span className="text-right">
                    {formatBigInt(summary.totalQuantity)} MWh
                  </span>
                </button>

                {isExpanded ? (
                  <div className="border-t border-[#1d1d1d] bg-[#050505] px-3 pb-3 pt-3">
                    <button
                      type="button"
                      disabled={isGenerating || generatingVintageId !== null}
                      onClick={() =>
                        handleGenerateCertificate(
                          summary.vintageId,
                          summary.totalQuantity,
                          auditTrail,
                        )
                      }
                      className="mb-3 w-full border border-[#3d3d3d] bg-black px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black disabled:hover:text-white"
                    >
                      {isGenerating
                        ? "generating…"
                        : "generate compliance certificate"}
                    </button>

                    {certificateError?.vintageId === summary.vintageId ? (
                      <p className="mb-3 text-center text-[10px] uppercase tracking-[0.2em] text-[#cfcfcf]">
                        {certificateError.message}
                      </p>
                    ) : null}

                    {auditTrail.length === 0 ? (
                      <p className="text-center text-[10px] uppercase tracking-[0.2em] text-[#666666]">
                        no audit entries for this vintage
                      </p>
                    ) : (
                      <div className="overflow-hidden border border-[#1d1d1d]">
                        <div className="grid grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] gap-2 border-b border-[#1d1d1d] px-2 py-2 text-[10px] uppercase tracking-[0.22em] text-[#666666]">
                          <span>date</span>
                          <span>qty</span>
                          <span className="text-right">tx</span>
                        </div>
                        <ul className="divide-y divide-[#111111]">
                          {auditTrail.map((entry) => (
                            <li
                              key={`${entry.txHash}-${entry.timestamp}`}
                              className="grid grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] gap-2 px-2 py-2 text-xs text-white"
                            >
                              <span className="truncate text-[#cfcfcf]">
                                {formatTimestamp(entry.timestamp)}
                              </span>
                              <span>{formatBigInt(entry.quantity)}</span>
                              <a
                                href={sepoliaTxUrl(entry.txHash)}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate text-right text-[#666666] underline decoration-[#3d3d3d] underline-offset-2 transition-colors hover:text-white hover:decoration-white"
                                title={entry.txHash}
                              >
                                {truncateHash(entry.txHash)}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex shrink-0 items-center justify-between text-[10px] uppercase tracking-[0.22em] text-[#666666]">
        <span>source: ponder graphql</span>
      </div>
    </div>
  );
}
