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
  sepoliaContractUrl,
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
  linkValue: {
    flex: 1,
    fontSize: 10,
    color: "#000000",
    textDecoration: "underline",
  },
  hashLinkValue: {
    flex: 1,
    fontSize: 8,
    letterSpacing: 0.1,
    color: "#000000",
    textDecoration: "underline",
  },
  auditEntry: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
  },
  auditEntryLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  auditViewerHint: {
    marginTop: 4,
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

function FieldRow({
  label,
  value,
  href,
  linkStyle,
}: {
  label: string;
  value: string;
  href?: string;
  linkStyle?: typeof styles.linkValue;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {href ? (
        <Link src={href} style={linkStyle ?? styles.linkValue}>
          {value}
        </Link>
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
    </View>
  );
}

export function ComplianceCertificateDocument({
  data,
}: ComplianceCertificateDocumentProps) {
  return (
    <Document
      title={`VeriJouleCore Retirement Record ${data.certificateId}`}
      author="Wilderform Tools LLC"
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.header}>
            <Text style={styles.brand}>VeriJoule Core</Text>
            <Text style={styles.brandSub}>Wilderform Tools LLC</Text>
            <Text style={styles.title}>REC Retirement Record</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certificate</Text>
            <FieldRow label="Certificate ID" value={data.certificateId} />
            <FieldRow label="Generated (UTC)" value={data.issuedAtUtc} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Retirement Details</Text>
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
            <Text style={styles.sectionTitle}>Blockchain Details</Text>
            <FieldRow label="Network" value={data.network} />
            <FieldRow
              label="REC Contract"
              value={data.recContractAddress}
              href={sepoliaContractUrl(data.recContractAddress)}
              linkStyle={styles.hashLinkValue}
            />
            <FieldRow
              label="Settlement Contract"
              value={data.settlementContractAddress}
              href={sepoliaContractUrl(data.settlementContractAddress)}
              linkStyle={styles.hashLinkValue}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Audit Trail</Text>
            {data.auditTrail.length === 0 ? (
              <Text style={styles.emptyNote}>
                no individual transactions indexed
              </Text>
            ) : (
              <View>
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
                      <FieldRow
                        label="Quantity"
                        value={`${formatBigInt(entry.quantity)} MWh`}
                      />
                      <FieldRow
                        label="Timestamp"
                        value={formatTimestamp(entry.timestamp)}
                      />
                      <FieldRow
                        label="Tx Hash"
                        value={wrapTxHashForPdf(entry.txHash)}
                        href={sepoliaTxUrl(entry.txHash)}
                        linkStyle={styles.hashLinkValue}
                      />
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
            This document is a technical record of on-chain retirements generated by VeriJoule Core for demonstration purposes only. It does not represent legally recognized Renewable Energy Certificates (RECs), environmental attributes, or compliance instruments. This certificate has no regulatory or market value.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
