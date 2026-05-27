import type { ReactNode } from "react";

type TerminalPanelProps = {
  title: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function TerminalPanel({
  title,
  children,
  className,
  contentClassName,
}: TerminalPanelProps) {
  return (
    <section
      className={`relative flex min-h-0 flex-col border border-[#3d3d3d] bg-[#050505] font-mono ${className ?? ""}`}
    >
      <p className="pointer-events-none absolute left-3 top-0 z-10 m-0 -translate-y-1/2 bg-[#050505] px-1 text-xs uppercase tracking-[0.22em] text-white">
        {title}
      </p>
      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden p-4 ${contentClassName ?? ""}`}
      >
        {children}
      </div>
    </section>
  );
}
