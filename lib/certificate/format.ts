export function formatBigInt(value: string): string {
  return new Intl.NumberFormat("en-US").format(BigInt(value));
}

export function formatTimestamp(timestamp: string): string {
  const numeric = Number(timestamp);
  const ms = numeric < 1e12 ? numeric * 1000 : numeric;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(ms));
}

export function formatIssuedAtUtc(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

/** Parse YYYYMMDD vintage ids into a human-readable period label. */
export function formatVintagePeriod(vintageId: string): string | null {
  if (!/^\d{8}$/.test(vintageId)) return null;
  const year = Number(vintageId.slice(0, 4));
  const month = Number(vintageId.slice(4, 6));
  const day = Number(vintageId.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function sepoliaTxUrl(txHash: string): string {
  const normalized = txHash.startsWith("0x") ? txHash : `0x${txHash}`;
  return `https://sepolia.etherscan.io/tx/${normalized}`;
}

/** Insert line breaks so full tx hashes fit within the PDF content width. */
export function wrapTxHashForPdf(hash: string, charsPerLine = 38): string {
  const normalized = hash.startsWith("0x") ? hash : `0x${hash}`;
  const lines: string[] = [];
  for (let i = 0; i < normalized.length; i += charsPerLine) {
    lines.push(normalized.slice(i, i + charsPerLine));
  }
  return lines.join("\n");
}
