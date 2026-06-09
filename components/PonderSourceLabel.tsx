import { InfoHexTooltip } from "@/components/InfoHexTooltip";

export function PonderSourceLabel() {
  return (
    <span className="inline-flex items-center gap-1.5">
      source: ponder graphql
      <InfoHexTooltip
        ariaLabel="VeriJoule Core Ponder indexer"
        placement="above"
      >
        <span className="block text-white">Ponder Indexer</span>
        <span className="mt-1.5 block">
          This indexer continuously reads public events emitted by the VeriJoule Core smart contracts on Sepolia. It structures raw on-chain data (mints, retirements, and settlements) into a queryable database to power the REC ledger and retirement history in this interface.
        </span>
        <span className="mt-2 block border-t border-[#333333] pt-2 text-[#888888]">
          The active REC ledger and your historical account data are derived entirely from cryptographically verifiable public ledger data. No private, off-chain, or proprietary data is stored.
        </span>
      </InfoHexTooltip>
    </span>
  );
}
