"use client";

import { useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import { useAccount, useConfig } from "wagmi";

import { switchWalletAccount } from "@/lib/switchWalletAccount";

const SWITCH_SPINNER_MS = 300;

function truncateAddress(value: string): string {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function AccountSwitchSpinner() {
  return (
    <svg
      viewBox="0 0 14 14"
      width={14}
      height={14}
      aria-hidden
      className="block shrink-0 animate-wallet-disconnect"
    >
      <circle
        cx="7"
        cy="7"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeDasharray="8 24"
      />
    </svg>
  );
}

function AccountLabel({
  address,
  isSwitching,
  labelClassName,
  onClick,
  menuOpen,
}: {
  address: Address;
  isSwitching: boolean;
  labelClassName: string;
  onClick?: () => void;
  menuOpen?: boolean;
}) {
  const truncated = truncateAddress(address);
  const content = (
    <span className="relative inline-flex items-center justify-center">
      <span className={isSwitching ? "invisible" : undefined} aria-hidden={isSwitching}>
        {truncated}
      </span>
      {isSwitching ? (
        <span
          className="absolute inset-0 flex items-center justify-center"
          role="status"
          aria-live="polite"
          aria-label="Switching account"
        >
          <AccountSwitchSpinner />
        </span>
      ) : null}
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isSwitching}
        aria-expanded={menuOpen}
        aria-haspopup="listbox"
        className={`${labelClassName} transition-colors hover:text-[#3d3d3d] disabled:cursor-default disabled:hover:text-white`}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={`${labelClassName} inline-block cursor-default`}>
      {content}
    </span>
  );
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
  const [isSwitching, setIsSwitching] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<Address | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const switchStartedAt = useRef<number | null>(null);
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

  const finishSwitch = useCallback(() => {
    setIsSwitching(false);
    setPendingAddress(null);
    switchStartedAt.current = null;
  }, []);

  useEffect(() => {
    if (!isSwitching || !pendingAddress) return;
    if (pendingAddress.toLowerCase() !== connectedAddress.toLowerCase()) return;

    const elapsed = switchStartedAt.current
      ? Date.now() - switchStartedAt.current
      : 0;
    const remaining = Math.max(0, SWITCH_SPINNER_MS - elapsed);
    const timer = window.setTimeout(finishSwitch, remaining);

    return () => window.clearTimeout(timer);
  }, [isSwitching, pendingAddress, connectedAddress, finishSwitch]);

  const handleSelect = async (target: Address) => {
    setOpen(false);
    if (target.toLowerCase() === connectedAddress.toLowerCase()) return;

    setPendingAddress(target);
    setIsSwitching(true);
    switchStartedAt.current = Date.now();

    try {
      const permitted = connector
        ? accounts.length > 0
          ? accounts
          : await connector.getAccounts()
        : accounts;

      if (
        permitted.some(
          (account) => account.toLowerCase() === target.toLowerCase(),
        )
      ) {
        switchWalletAccount(config, target, permitted);
        return;
      }

      const wallet = uniqueWallets.find(
        (entry) => entry.address.toLowerCase() === target.toLowerCase(),
      );
      if (wallet) {
        await setActiveWallet(wallet);
        return;
      }

      finishSwitch();
    } catch {
      finishSwitch();
    }
  };

  const displayAddress = pendingAddress ?? connectedAddress;

  if (!canSwitch) {
    return (
      <AccountLabel
        address={displayAddress}
        isSwitching={isSwitching}
        labelClassName={labelClassName}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <AccountLabel
        address={displayAddress}
        isSwitching={isSwitching}
        labelClassName={labelClassName}
        menuOpen={open}
        onClick={() => {
          if (isSwitching) return;
          setOpen((current) => !current);
        }}
      />
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
