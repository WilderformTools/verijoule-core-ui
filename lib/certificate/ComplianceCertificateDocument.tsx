import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import {
  formatBigInt,
  formatTimestamp,
  sepoliaTxUrl,
  wrapTxHashForPdf,
} from "./format";
import { CERTIFICATE_FONT_FAMILY } from "./register-fonts";
import type { CertificateData } from "./types";

const styles = StyleSheet.create({
  page: {
    fontFamily: CERTIFICATE_FONT_FAMILY,
    fontSize: 10,
    color: "#000000",
    backgroundColor: "#ffffff",
    padding: 36,
  },
  frame: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000000",
    padding: 24,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  brand: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  brandSub: {
    marginTop: 4,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#333333",
  },
  title: {
    marginTop: 14,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#333333",
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    width: 130,
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#333333",
  },
  value: {
    flex: 1,
    fontSize: 10,
  },
  auditList: {
    borderWidth: 1,
    borderColor: "#333333",
  },
  auditEntry: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
  },
  auditEntryLast: {
    borderBottomWidth: 0,
  },
  auditMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 12,
  },
  auditDate: {
    flex: 1,
    fontSize: 8,
    color: "#333333",
  },
  auditQty: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  auditHashLabel: {
    fontSize: 7,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#666666",
    marginBottom: 3,
  },
  auditHash: {
    fontSize: 7,
    lineHeight: 1.4,
    letterSpacing: 0.2,
    color: "#000000",
    textDecoration: "underline",
  },
  auditViewerHint: {
    marginTop: 8,
    fontSize: 6.5,
    letterSpacing: 0.6,
    lineHeight: 1.4,
    color: "#666666",
    textTransform: "uppercase",
  },
  emptyNote: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#666666",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333333",
    fontSize: 7,
    letterSpacing: 0.8,
    lineHeight: 1.5,
    color: "#333333",
    textTransform: "uppercase",
  },
});

type ComplianceCertificateDocumentProps = {
  data: CertificateData;
};

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function ComplianceCertificateDocument({
  data,
}: ComplianceCertificateDocumentProps) {
  return (
    <Document
      title={`VeriJoule Certificate ${data.certificateId}`}
      author="Wilderform Tools LLC"
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.header}>
            <Text style={styles.brand}>VeriJoule Core</Text>
            <Text style={styles.brandSub}>Wilderform Tools LLC</Text>
            <Text style={styles.title}>REC Retirement Compliance Certificate</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certificate</Text>
            <FieldRow label="Certificate ID" value={data.certificateId} />
            <FieldRow label="Issued (UTC)" value={data.issuedAtUtc} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Retirement</Text>
            <FieldRow label="Vintage ID" value={data.vintageId} />
            {data.vintagePeriod ? (
              <FieldRow label="Vintage Period" value={data.vintagePeriod} />
            ) : null}
            <FieldRow
              label="Total Retired"
              value={`${formatBigInt(data.totalRetiredMwh)} MWh`}
            />
            <FieldRow label="Retired By" value={data.retireeAddress} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chain</Text>
            <FieldRow label="Network" value={data.network} />
            <FieldRow label="REC Contract" value={data.recContractAddress} />
            <FieldRow
              label="Settlement"
              value={data.settlementContractAddress}
            />
            <FieldRow
              label="Plant Code"
              value={data.plantCode ?? "unavailable"}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Audit Trail</Text>
            {data.auditTrail.length === 0 ? (
              <Text style={styles.emptyNote}>
                no individual transactions indexed
              </Text>
            ) : (
              <View style={styles.auditList}>
                {data.auditTrail.map((entry, index) => {
                  const isLast = index === data.auditTrail.length - 1;
                  return (
                    <View
                      key={`${entry.txHash}-${entry.timestamp}`}
                      style={
                        isLast
                          ? [styles.auditEntry, styles.auditEntryLast]
                          : styles.auditEntry
                      }
                    >
                      <View style={styles.auditMeta}>
                        <Text style={styles.auditDate}>
                          {formatTimestamp(entry.timestamp)}
                        </Text>
                        <Text style={styles.auditQty}>
                          {formatBigInt(entry.quantity)} mwh
                        </Text>
                      </View>
                      <Text style={styles.auditHashLabel}>transaction</Text>
                      <Link
                        src={sepoliaTxUrl(entry.txHash)}
                        style={styles.auditHash}
                      >
                        {wrapTxHashForPdf(entry.txHash)}
                      </Link>
                    </View>
                  );
                })}
                <Text style={styles.auditViewerHint}>
                  transaction links: ctrl+click or cmd+click to open etherscan in a
                  new tab (depends on pdf viewer)
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.footer}>
            This certificate summarizes REC retirements recorded on-chain and
            indexed by VeriJoule Core. It is provided for informational
            purposes only and does not constitute legal, regulatory, or
            compliance advice.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
