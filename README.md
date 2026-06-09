# VeriJouleCore User Interface

The execution interface and dashboard for VeriJouleCore, enabling cryptographic REC retirements and verifiable record generation.

**Live Environment:** [verijoule.wilderform.tools](https://verijoule.wilderform.tools)

## What This Is

The frontend interface for Wilderform Tools' VeriJouleCore architecture. It provides a browser-based dashboard where users connect a wallet via Privy, browse regional wind and solar facilities on an interactive MapLibre map (2024 EIA Colorado solar & wind farms), and view live REC vintages aggregated by the indexer. Users can execute cryptographic retirements against the on-chain settlement contract and natively download structured PDF records of their retirement history.

## How It Fits in the System

- **[VeriJouleCore (Smart Contracts & Chainlink CRE)](https://github.com/WilderformTools/verijoule-core)** — The foundational logic layer. Contains the settlement smart contracts deployed on Sepolia; all cryptographic writes execute through wagmi/viem directly to these proxies.
- **[VeriJouleCore Ponder Indexer](https://github.com/WilderformTools/verijoule-core-indexer)** — The asynchronous indexing layer. This UI consumes the indexer's GraphQL API to populate the active REC ledger and historical user retirement panels without taxing RPC nodes.

*Note: The UI does not interact with the database directly or natively store state. On-chain reads and transaction simulations gate all execution logic; the indexer strictly powers display metrics and certificate generation.*

## Tech Stack

- **Framework:** Next.js (App Router), React, TypeScript
- **Styling & Mapping:** Tailwind CSS, MapLibre GL
- **Web3 Integration:** Privy, wagmi, viem
- **Record Generation:** `@react-pdf/renderer`

## Deployment Architecture

- **Hosting Environment:** Vercel
- **Authentication Gateway:** Privy
- **Target Network:** Ethereum Sepolia Testnet

## Important Notes

- **Proof of Concept:** This is a strictly technical architecture demonstration operating on the Sepolia testnet with test USDC. The interface acts as a visual layer over public on-chain data. The tokens and retirements executed within this tool do not represent legally recognized RECs or regulatory compliance instruments.
- **Client-Side Verification:** PDF certificates are generated natively on the client from indexed public data. All retirements can be independently verified on-chain utilizing the transaction hashes provided in the audit trail.