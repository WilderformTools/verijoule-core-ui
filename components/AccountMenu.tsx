"use client";

import { useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import { useAccount, useConfig } from "wagmi";

import { switchWalletAccount } from "@/lib/switchWalletAccount";

function truncateAddress(value: string): string {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

const connectedBadgeClassName =
  "shrink-0 border border-[#3d3d3d] px-1.5 py-0.5 text-[8px] uppercase tracking-[0.18em] text-[#b3b3b3]";

function AccountOption({
  account,
  walletName,
  isActive,
  onSelect,
}: {
  account: Address;
  walletName?: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
        isActive ? "text-[#b3b3b3]" : "text-white hover:text-[#3d3d3d]"
      }`}
    >
      <span className="min-w-0 truncate">
        {truncateAddress(account)}
        {walletName ? (
          <span
            className={`ml-2 ${isActive ? "text-[#888888]" : "text-[#666666]"}`}
          >
            {walletName}
          </span>
        ) : null}
      </span>
      {isActive ? (
        <span className={connectedBadgeClassName}>Connected</span>
      ) : null}
    </button>
  );
}

type AccountMenuProps = {
  address: Address;
  labelClassName: string;
};

export function AccountMenu({ address, labelClassName }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<readonly Address[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const config = useConfig();
  const { address: activeAddress, connector } = useAccount();
  const { wallets, ready: walletsReady } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  const connectedAddress = activeAddress ?? address;

  useEffect(() => {
    if (!connector || !walletsReady) return;

    let cancelled = false;
    void connector.getAccounts().then((list) => {
      if (!cancelled) setAccounts(list);
    });

    return () => {
      cancelled = true;
    };
  }, [connector, walletsReady, connectedAddress, open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const uniqueWallets = walletsReady
    ? wallets.filter(
        (wallet, index, list) =>
          list.findIndex(
            (entry) =>
              entry.address.toLowerCase() === wallet.address.toLowerCase(),
          ) === index,
      )
    : [];

  const connectorAddresses = new Set(
    accounts.map((account) => account.toLowerCase()),
  );
  const externalWallets = uniqueWallets.filter(
    (wallet) => !connectorAddresses.has(wallet.address.toLowerCase()),
  );

  const canSwitch =
    accounts.length + externalWallets.length > 1 ||
    uniqueWallets.length > 1;

  const handleSelect = async (target: Address) => {
    setOpen(false);
    if (target.toLowerCase() === connectedAddress.toLowerCase()) return;

    const permitted = connector
      ? accounts.length > 0
        ? accounts
        : await connector.getAccounts()
      : accounts;

    if (
      permitted.some((account) => account.toLowerCase() === target.toLowerCase())
    ) {
      switchWalletAccount(config, target, permitted);
      return;
    }

    const wallet = uniqueWallets.find(
      (entry) => entry.address.toLowerCase() === target.toLowerCase(),
    );
    if (wallet) {
      await setActiveWallet(wallet);
    }
  };

  if (!canSwitch) {
    return (
      <span className={`${labelClassName} inline-block cursor-default`}>
        {truncateAddress(connectedAddress)}
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`${labelClassName} transition-colors hover:text-[#3d3d3d]`}
      >
        {truncateAddress(connectedAddress)}
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label="Select wallet account"
          className="absolute right-0 top-full z-50 mt-1 min-w-48 border border-[#3d3d3d] bg-[#050505] py-1 shadow-lg"
        >
          {accounts.map((account) => (
            <AccountOption
              key={account}
              account={account}
              isActive={
                account.toLowerCase() === connectedAddress.toLowerCase()
              }
              onSelect={() => void handleSelect(account)}
            />
          ))}
          {externalWallets.map((wallet) => (
            <AccountOption
              key={wallet.address}
              account={wallet.address as Address}
              walletName={wallet.meta.name}
              isActive={
                wallet.address.toLowerCase() === connectedAddress.toLowerCase()
              }
              onSelect={() => void handleSelect(wallet.address as Address)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
