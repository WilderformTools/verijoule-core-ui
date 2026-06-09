import type { ReactNode } from "react";

type InfoHexTooltipProps = {
  ariaLabel: string;
  children: ReactNode;
  placement?: "above" | "below";
  className?: string;
};

export function InfoHexTooltip({
  ariaLabel,
  children,
  placement = "below",
  className,
}: InfoHexTooltipProps) {
  const tooltipPosition =
    placement === "above" ? "bottom-full mb-1" : "top-full mt-1";

  return (
    <span
      tabIndex={0}
      className={`group/info relative inline-flex cursor-default outline-none normal-case tracking-normal ${className ?? ""}`}
      aria-label={ariaLabel}
    >
      <svg
        className="size-[0.85rem] shrink-0"
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <polygon
          points="7,1 12.5,3.75 12.5,10.25 7,13 1.5,10.25 1.5,3.75"
          fill="none"
          strokeWidth="1"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="stroke-[#666666] transition-colors group-hover/info:stroke-white group-focus-within/info:stroke-white"
        />
        <text
          x="7"
          y="7.35"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fontWeight="400"
          style={{ textTransform: "none" }}
          className="fill-[#8f8a78] font-mono transition-colors group-hover/info:fill-white group-focus-within/info:fill-white"
        >
          i
        </text>
      </svg>
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-0 z-50 block w-60 box-border whitespace-normal break-words border border-[#3d3d3d] bg-[#050505] px-2.5 py-2 font-mono text-[10px] font-normal normal-case not-italic leading-snug tracking-normal text-[#aaaaaa] opacity-0 transition-opacity group-hover/info:opacity-100 group-focus-within/info:opacity-100 ${tooltipPosition}`}
      >
        {children}
      </span>
    </span>
  );
}
