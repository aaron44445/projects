import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: "#1a1a1a",
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#00FF8F",
    borderBottomStyle: "solid",
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0A0A0B",
  },
  logoAccent: {
    color: "#00AA5F",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0A0A0B",
    marginTop: 16,
  },
  date: {
    fontSize: 10,
    color: "#666666",
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0A0A0B",
    marginTop: 24,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 11,
    color: "#333333",
    marginBottom: 8,
    lineHeight: 1.6,
  },
  bold: {
    fontWeight: "bold",
    color: "#0A0A0B",
  },
  listItem: {
    fontSize: 11,
    color: "#333333",
    marginBottom: 4,
    paddingLeft: 12,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  signatureBlock: {
    width: "45%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
    borderBottomStyle: "solid",
    height: 40,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 10,
    color: "#666666",
  },
  footer: {
    fontSize: 9,
    color: "#999999",
    textAlign: "center",
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    borderTopStyle: "solid",
  },
});

interface ContractPDFProps {
  clientName: string;
  services: string[];
  monthlyPrice: number;
}

export function ContractPDF({
  clientName,
  services,
  monthlyPrice,
}: ContractPDFProps) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(monthlyPrice);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            Inject<Text style={styles.logoAccent}>SEO</Text>
          </Text>
          <Text style={styles.title}>Service Agreement</Text>
          <Text style={styles.date}>Effective Date: {today}</Text>
        </View>

        {/* Parties */}
        <Text style={styles.sectionTitle}>1. Parties</Text>
        <Text style={styles.paragraph}>
          This Service Agreement (&quot;Agreement&quot;) is entered into by and
          between:
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Provider:</Text> InjectSEO
          (&quot;Agency&quot;)
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Client:</Text> {clientName}
          (&quot;Client&quot;)
        </Text>

        {/* Scope of Services */}
        <Text style={styles.sectionTitle}>2. Scope of Services</Text>
        <Text style={styles.paragraph}>
          The Agency agrees to provide the following SEO and digital marketing
          services to the Client:
        </Text>
        {services.map((service, i) => (
          <Text key={i} style={styles.listItem}>
            {"\u2022"} {service}
          </Text>
        ))}

        {/* Compensation */}
        <Text style={styles.sectionTitle}>3. Compensation</Text>
        <Text style={styles.paragraph}>
          The Client agrees to pay the Agency a monthly retainer of{" "}
          <Text style={styles.bold}>{formattedPrice}/month</Text>. Payment is
          due on the 1st of each month via Stripe or agreed-upon payment method.
          Late payments beyond 10 days may result in suspension of services.
        </Text>

        {/* Term */}
        <Text style={styles.sectionTitle}>4. Term</Text>
        <Text style={styles.paragraph}>
          This Agreement has a minimum term of{" "}
          <Text style={styles.bold}>3 months</Text> beginning on the Effective
          Date. After the initial term, the Agreement will renew on a
          month-to-month basis.
        </Text>

        {/* Cancellation */}
        <Text style={styles.sectionTitle}>5. Cancellation</Text>
        <Text style={styles.paragraph}>
          Either party may terminate this Agreement with{" "}
          <Text style={styles.bold}>30 days written notice</Text> after the
          initial 3-month term. Written notice must be sent via email to the
          other party. Any prepaid services will be delivered through the end of
          the notice period.
        </Text>

        {/* Confidentiality */}
        <Text style={styles.sectionTitle}>6. Confidentiality</Text>
        <Text style={styles.paragraph}>
          Both parties agree to keep confidential any proprietary information
          shared during the course of this engagement. This includes but is not
          limited to: business strategies, financial data, client lists, and
          marketing analytics. This obligation survives termination of the
          Agreement.
        </Text>

        {/* Signatures */}
        <Text style={styles.sectionTitle}>7. Signatures</Text>
        <Text style={styles.paragraph}>
          By signing below, both parties agree to the terms and conditions
          outlined in this Agreement.
        </Text>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              InjectSEO (Agency) — Date
            </Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              {clientName} (Client) — Date
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          InjectSEO — Precision SEO for Aesthetic Practices — injectseo.com
        </Text>
      </Page>
    </Document>
  );
}
