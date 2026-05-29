"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

import { ActiveWalletSync } from "@/components/ActiveWalletSync";

type Web3ProvidersProps = {
  children: ReactNode;
};

const sepoliaRpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL?.trim();

const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: sepoliaRpc ? http(sepoliaRpc) : http(),
  },
});

const privyClientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID?.trim();

export function Web3Providers({ children }: Web3ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ""}
      {...(privyClientId ? { clientId: privyClientId } : {})}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#FFFFFF",
          // Privy runtime accepts null here, but current SDK typings require string/ReactElement.
          logo: null as unknown as string,
          walletList: [
            "detected_ethereum_wallets",
            "metamask",
            "rabby_wallet",
            "coinbase_wallet",
          ],
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "off",
          },
        },
        loginMethods: ["wallet"],
        defaultChain: sepolia,
        supportedChains: [sepolia],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <ActiveWalletSync />
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
