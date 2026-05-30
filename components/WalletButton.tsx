"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";

import { AccountMenu } from "@/components/AccountMenu";

const DISCONNECT_SPINNER_MS = 450;

const labelClassName =
  "shrink-0 bg-black p-0 py-2 font-mono text-xs uppercase tracking-[0.22em] text-white";

const buttonClassName = `${labelClassName} transition-colors hover:text-[#3d3d3d] disabled:cursor-not-allowed disabled:opacity-60`;

const dividerClassName = "font-mono text-xs font-light text-[#666666]";

function HeaderDivider() {
  return <span className={dividerClassName}>|</span>;
}

function WireframeDisconnectArrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      width={18}
      height={18}
      aria-hidden
      className="block shrink-0"
      fill="none"
    >
      <g stroke="currentColor" strokeWidth={1.25} strokeLinecap="square">
        <line x1="1" y1="8" x2="9.5" y2="8" />
        <line x1="11" y1="8" x2="8" y2="4" />
        <line x1="11" y1="8" x2="8" y2="12" />
      </g>
    </svg>
  );
}

function DisconnectArrow({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Disconnect wallet"
      className="flex h-8 w-8 shrink-0 items-center justify-center bg-black text-white transition-colors hover:text-[#3d3d3d]"
    >
      <WireframeDisconnectArrow />
    </button>
  );
}

function DisconnectSpinner() {
  return (
    <span
      className="flex h-8 shrink-0 items-center justify-center bg-black px-2 text-white"
      role="status"
      aria-live="polite"
      aria-label="Disconnecting wallet"
    >
      <svg
        viewBox="0 0 14 14"
        width={14}
        height={14}
        aria-hidden
        className="block shrink-0 animate-wallet-disconnect"
      >
        <circle cx="7" cy="2" r="1.5" fill="currentColor" />
        <circle cx="11.33" cy="9.5" r="1.5" fill="currentColor" />
        <circle cx="2.67" cy="9.5" r="1.5" fill="currentColor" />
      </svg>
    </span>
  );
}

type WalletButtonProps = {
  onMyRetirementsClick?: () => void;
};

export function WalletButton({ onMyRetirementsClick }: WalletButtonProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { ready: walletsReady } = useWallets();
  const { address } = useAccount();
  const walletAddress = address ?? user?.wallet?.address;
  const isRestoringSession = ready && authenticated && !walletsReady;
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const disconnectStartedAt = useRef<number | null>(null);

  const handleDisconnect = useCallback(() => {
    disconnectStartedAt.current = Date.now();
    setIsDisconnecting(true);
    void logout();
  }, [logout]);

  useEffect(() => {
    if (!isDisconnecting || authenticated) return;

    const elapsed = disconnectStartedAt.current
      ? Date.now() - disconnectStartedAt.current
      : 0;
    const remaining = Math.max(0, DISCONNECT_SPINNER_MS - elapsed);
    const timer = window.setTimeout(() => {
      setIsDisconnecting(false);
      disconnectStartedAt.current = null;
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [isDisconnecting, authenticated]);

  return (
    <div className="flex w-full min-w-0 items-center justify-end gap-2">
      {!ready || isRestoringSession ? (
        <button type="button" disabled className={buttonClassName}>
          BOOTING...
        </button>
      ) : isDisconnecting ? (
        <DisconnectSpinner />
      ) : !authenticated ? (
        <button type="button" onClick={login} className={buttonClassName}>
          CONNECT
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={onMyRetirementsClick}
            disabled={!onMyRetirementsClick}
            className={buttonClassName}
          >
            MY RETIREMENTS
          </button>
          <HeaderDivider />
          {walletAddress && isAddress(walletAddress) ? (
            <AccountMenu address={walletAddress} labelClassName={labelClassName} />
          ) : (
            <span className={`${labelClassName} inline-block cursor-default`}>
              CONNECTED
            </span>
          )}
          <HeaderDivider />
          <DisconnectArrow onClick={handleDisconnect} />
        </>
      )}
    </div>
  );
}
