export type CertificateAuditRow = {
  quantity: string;
  txHash: string;
  timestamp: string;
};

export type CertificateData = {
  certificateId: string;
  issuedAtUtc: string;
  vintageId: string;
  vintagePeriod: string | null;
  totalRetiredMwh: string;
  retireeAddress: string;
  network: string;
  recContractAddress: string;
  settlementContractAddress: string;
  plantCode: string | null;
  auditTrail: CertificateAuditRow[];
};

export type BuildCertificateInput = {
  vintageId: string;
  totalQuantity: string;
  buyerAddress: string;
  auditTrail: CertificateAuditRow[];
};
