"use client";

import { useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useEffect } from "react";
import { useAccount, useConfig } from "wagmi";

/**
 * Keeps wagmi's active account in sync when the user switches accounts in their
 * wallet extension (e.g. MetaMask accountsChanged).
 *
 * Page-load reconnect is handled silently by Privy's useSyncPrivyWallets +
 * wagmi reconnect({ isReconnecting: true }) — do not call setActiveWallet or
 * connect() here on initial load, or MetaMask will prompt again.
 */
export function ActiveWalletSync() {
  const config = useConfig();
  const { address, isConnected } = useAccount();
  const { wallets, ready: walletsReady } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  useEffect(() => {
    if (!walletsReady || !isConnected || !address || wallets.length === 0) {
      return;
    }

    const wagmiMatchesWallet = wallets.some(
      (wallet) => wallet.address.toLowerCase() === address.toLowerCase(),
    );
    if (wagmiMatchesWallet) return;

    let cancelled = false;

    void (async () => {
      const connection = config.state.connections.get(config.state.current ?? "");
      const connector = connection?.connector;

      if (connector) {
        try {
          const permitted = await connector.getAccounts();
          if (
            !cancelled &&
            permitted.some(
              (account) => account.toLowerCase() === address.toLowerCase(),
            )
          ) {
            return;
          }
        } catch {
          // Fall through to Privy wallet sync.
        }
      }

      const latestWallet = [...wallets].sort(
        (a, b) => b.connectedAt - a.connectedAt,
      )[0];
      if (!latestWallet || cancelled) return;

      await setActiveWallet(latestWallet);
    })();

    return () => {
      cancelled = true;
    };
  }, [walletsReady, wallets, address, isConnected, setActiveWallet, config]);

  return null;
}
