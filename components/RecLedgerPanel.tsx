"use client";

import { useQuery } from "@tanstack/react-query";
import { PonderSourceLabel } from "@/components/PonderSourceLabel";

export type RecVintageBalance = {
  vintageId: string;
  availableBalance: string;
  totalMinted: string;
};

type GraphQLResponse = {
  data?: {
    recVintageBalances?: {
      items?: RecVintageBalance[];
    };
  };
  errors?: Array<{ message?: string }>;
};

const INDEXER_URL =
  process.env.NEXT_PUBLIC_INDEXER_URL?.trim() || "http://localhost:42069";

const ACTIVE_VINTAGES_QUERY = `
  query ActiveVintages {
    recVintageBalances(where: { availableBalance_gt: "0" }) {
      items {
        vintageId
        availableBalance
        totalMinted
      }
    }
  }
`;

function formatBigInt(value: string) {
  return new Intl.NumberFormat("en-US").format(BigInt(value));
}

function compareBigIntStringsAscending(a: string, b: string) {
  const left = BigInt(a);
  const right = BigInt(b);

  if (left === right) return 0;
  return left < right ? -1 : 1;
}

async function fetchActiveVintages(): Promise<RecVintageBalance[]> {
  const response = await fetch(INDEXER_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: ACTIVE_VINTAGES_QUERY,
    }),
  });

  if (!response.ok) {
    throw new Error(`Indexer request failed with ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse;
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || "GraphQL request failed");
  }

  const items = payload.data?.recVintageBalances?.items ?? [];

  return [...items].sort((a, b) =>
    compareBigIntStringsAscending(a.vintageId, b.vintageId),
  );
}

type RecLedgerPanelProps = {
  cartVintageIds?: string[];
  onAddVintage?: (vintage: RecVintageBalance) => void;
};

export function RecLedgerPanel({
  cartVintageIds = [],
  onAddVintage,
}: RecLedgerPanelProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["active-vintages", INDEXER_URL],
    queryFn: fetchActiveVintages,
    refetchInterval: 15_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-center text-sm uppercase tracking-[0.24em] text-[#8a8a8a]">
        scanning ledger...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-[#cfcfcf]">
          ledger offline
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#666666]">
          check `NEXT_PUBLIC_INDEXER_URL`
        </p>
      </div>
    );
  }

  const vintages = data ?? [];

  if (vintages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-[#8a8a8a]">
          no active vintages
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#666666]">
          available balance is zero across all entries
        </p>
      </div>
    );
  }

  const totalAvailable = vintages.reduce(
    (sum, vintage) => sum + BigInt(vintage.availableBalance),
    BigInt(0),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between border-b border-[#1d1d1d] pb-2 text-[10px] uppercase tracking-[0.22em] text-[#666666]">
        <span>{vintages.length} active vintages</span>
        <span>{formatBigInt(totalAvailable.toString())} mwh live</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-[#1d1d1d] bg-black">
        <div className="grid h-9 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#1d1d1d] px-3 text-[10px] uppercase tracking-[0.22em] text-[#666666]">
          <span>vintage id</span>
          <span>available</span>
        </div>

        <ul className="vj-scrollbar min-h-0 flex-1 divide-y divide-[#111111] overflow-y-auto overscroll-y-contain">
          {vintages.map((vintage) => {
            const inCart = cartVintageIds.includes(vintage.vintageId);
            return (
              <li key={vintage.vintageId}>
                <button
                  type="button"
                  onClick={() => onAddVintage?.(vintage)}
                  disabled={!onAddVintage}
                  className={`grid min-h-10 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 text-left text-sm transition-colors ${
                    onAddVintage ? "hover:bg-[#111111]" : ""
                  } ${inCart ? "bg-[#111111] text-white" : "text-white"}`}
                >
                  <span className="truncate">{vintage.vintageId}</span>
                  <span className="text-right">
                    {formatBigInt(vintage.availableBalance)} MWh
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex shrink-0 items-center justify-between text-[10px] uppercase tracking-[0.22em] text-[#666666]">
        <PonderSourceLabel />
        <span>refresh: 15s</span>
      </div>
    </div>
  );
}
