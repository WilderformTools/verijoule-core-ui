"use client";

import { usePrivy } from "@privy-io/react-auth";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const labelClassName =
  "shrink-0 bg-black p-0 py-2 font-mono text-xs uppercase tracking-[0.22em] text-white";

const buttonClassName = `${labelClassName} transition-colors hover:text-[#3d3d3d] disabled:cursor-not-allowed disabled:opacity-60`;

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

type WalletButtonProps = {
  onMyRetirementsClick?: () => void;
};

export function WalletButton({ onMyRetirementsClick }: WalletButtonProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const walletAddress = user?.wallet?.address;

  return (
    <div className="flex w-full min-w-0 items-center justify-end gap-2">
      {!ready ? (
        <button type="button" disabled className={buttonClassName}>
          BOOTING...
        </button>
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
          <span className={`${labelClassName} inline-block cursor-default`}>
            {walletAddress
              ? truncateAddress(walletAddress)
              : "CONNECTED"}
          </span>
          <DisconnectArrow onClick={logout} />
        </>
      )}
    </div>
  );
}
