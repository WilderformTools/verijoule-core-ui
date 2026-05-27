# VeriJoule Core UI — agent notes

**What this is:** Next.js front end for **VeriJoule Core** — a decentralized telemetry / energy-data product (**Wilderform Tools LLC**). Branding and copy in `app/layout.tsx` metadata should stay aligned with that.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, **MapLibre GL** for maps, **Privy** + **wagmi v3** + **viem** for wallets and contract calls.

**Paths:** Use the `@/*` alias (see `tsconfig.json`) for imports from the repo root.

---

## Next.js version

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Web3 (single chain: Sepolia only)

- **Providers:** `components/Web3Providers.tsx` wraps the app (`app/layout.tsx`). It configures **Privy** (wallet login) and **wagmi** via `@privy-io/wagmi` `createConfig` with **`chains: [sepolia]`** only.
- **Wallet UI:** `components/WalletButton.tsx` uses Privy (`usePrivy`).
- **RPC:** Optional `NEXT_PUBLIC_SEPOLIA_RPC_URL` in `Web3Providers` transport; if unset, wagmi uses the default public Sepolia HTTP endpoint.
- Do **not** reintroduce a second wagmi config; this file is the source of truth for client Ethereum transport + chain.

For reads/writes, import hooks from **`wagmi`** and **`sepolia`** from **`wagmi/chains`**, and pass `chainId: sepolia.id` where required.

---

## Smart contracts

- **Module:** `lib/contracts/` — ABIs as JSON under `lib/contracts/abis/`, **`getVeriJouleCoreREC()`** and **`getVeriJouleCoreSettlement()`** in `config.ts`, re-exported from `lib/contracts/index.ts`.
- **Proxies:** Env / defaults resolve to **proxy addresses** on Sepolia; ABIs are **implementation** ABIs (delegatecall / transparent proxy pattern). See comments in `lib/contracts/config.ts`.
- **Defaults:** Canonical Sepolia proxy addresses are **hard-coded fallbacks** when env vars are empty, so builds and local dev work without `.env` for those two addresses. Override with `NEXT_PUBLIC_VERIJ_CORE_REC_ADDRESS` and `NEXT_PUBLIC_VERIJ_CORE_SETTLEMENT_ADDRESS` when needed.
- **Typed env:** `env.d.ts` augments `NodeJS.ProcessEnv` for `NEXT_PUBLIC_*` keys; `tsconfig.json` includes `env.d.ts`. Copy **`.env.example`** to `.env.local` for local secrets (e.g. Privy).

---

## Map and Colorado plant data

- **Map:** `components/MapContainer.tsx` — MapLibre, Colorado-focused UI. Basemap: optional `NEXT_PUBLIC_MAPLIBRE_STYLE_URL`; behavior and data sources are summarized in **`docs/colorado-wind-solar-map.md`**.
- **Regenerated data:** `npm run build:co-plants` runs `scripts/build-co-plants.mjs`, which reads **`CO SUN WIND OUTPUT.csv`** at the repo root and writes **`lib/co-energy-plants.ts`** (do not hand-edit that output file).

---

## Commands

- `npm run dev` — local dev server  
- `npm run build` / `npm run start` — production build and serve  
- `npm run lint` — ESLint  
- `npm run build:co-plants` — regenerate `lib/co-energy-plants.ts` from the CSV  

---

## Misc

- **`CLAUDE.md`** in this repo only references this file for Cursor/agent rules.
- Large contract ABI JSON files are expected under `lib/contracts/abis/`; prefer small, focused edits elsewhere when extending behavior.
