declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_PRIVY_APP_ID?: string;
    NEXT_PUBLIC_INDEXER_URL?: string;
    NEXT_PUBLIC_SEPOLIA_RPC_URL?: string;
    NEXT_PUBLIC_MAPLIBRE_STYLE_URL?: string;
    /** Optional; defaults to canonical Sepolia VeriJouleCoreREC proxy. */
    NEXT_PUBLIC_VERIJ_CORE_REC_ADDRESS?: string;
    /** Optional; defaults to canonical Sepolia VeriJouleCoreSettlement proxy. */
    NEXT_PUBLIC_VERIJ_CORE_SETTLEMENT_ADDRESS?: string;
    /** Optional; defaults to Circle test USDC on Sepolia (see lib/contracts/usdc.ts). */
    NEXT_PUBLIC_USDC_ADDRESS?: string;
  }
}
