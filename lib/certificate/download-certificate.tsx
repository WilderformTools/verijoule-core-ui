import { pdf } from "@react-pdf/renderer";

import { ComplianceCertificateDocument } from "./ComplianceCertificateDocument";
import { registerCertificateFonts } from "./register-fonts";
import type { CertificateData } from "./types";

export function certificateFilename(vintageId: string): string {
  return `verijoule-certificate-${vintageId}.pdf`;
}

function asPdfBlob(blob: Blob): Blob {
  if (blob.type === "application/pdf") return blob;
  return new Blob([blob], { type: "application/pdf" });
}

export async function generateCertificatePdf(
  data: CertificateData,
): Promise<Blob> {
  registerCertificateFonts();
  const blob = await pdf(<ComplianceCertificateDocument data={data} />).toBlob();
  return asPdfBlob(blob);
}

/** Open PDF inline in a new tab (viewer only, no forced download). */
export function openBlobInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const tab = window.open("about:blank", "_blank");
  if (!tab) {
    URL.revokeObjectURL(url);
    throw new Error("allow pop-ups to view the certificate");
  }

  tab.document.title = "VeriJouleCore Retirement Record";
  tab.document.body.style.margin = "0";
  tab.document.body.style.background = "#000000";

  const frame = tab.document.createElement("iframe");
  frame.src = url;
  frame.title = "VeriJouleCore Retirement Record";
  frame.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;border:0;background:#ffffff";
  tab.document.body.appendChild(frame);

  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

export async function openCertificate(data: CertificateData) {
  const blob = await generateCertificatePdf(data);
  openBlobInNewTab(blob);
}

/** @deprecated Use openCertificate */
export async function downloadCertificate(data: CertificateData) {
  await openCertificate(data);
}
