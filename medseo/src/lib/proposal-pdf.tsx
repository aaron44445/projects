import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface ProposalData {
  clientName: string;
  services: string[];
  monthlyPrice: number;
  callNotes?: string;
  executiveSummary: string;
  scopeOfWork: {
    service: string;
    description: string;
    deliverables: string[];
  }[];
  timeline: {
    month1: string;
    month2: string;
    month3: string;
  };
  investment: {
    monthly: number;
    includes: string[];
  };
  whyInjectSEO: string;
}

const styles = StyleSheet.create({
  // Cover page
  coverPage: {
    backgroundColor: "#0A0A0B",
    padding: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  logoAccent: {
    color: "#00FF8F",
  },
  coverTitle: {
    fontSize: 20,
    color: "#FFFFFF",
    marginTop: 40,
    textAlign: "center",
  },
  coverClient: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#00FF8F",
    marginTop: 12,
    textAlign: "center",
  },
  coverDate: {
    fontSize: 12,
    color: "#666666",
    marginTop: 24,
  },
  coverTagline: {
    fontSize: 11,
    color: "#999999",
    marginTop: 60,
    textAlign: "center",
  },

  // Content pages
  page: {
    backgroundColor: "#1a1a1a",
    color: "#e5e5e5",
    padding: 40,
    fontFamily: "Helvetica",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 24,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: "#00FF8F",
  },
  sectionTitleFirst: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: "#00FF8F",
  },
  bodyText: {
    fontSize: 12,
    color: "#CCCCCC",
    lineHeight: 1.6,
    marginBottom: 12,
  },

  // Scope of work cards
  serviceCard: {
    backgroundColor: "#111111",
    borderRadius: 6,
    padding: 14,
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 11,
    color: "#BBBBBB",
    marginBottom: 8,
    lineHeight: 1.5,
  },
  deliverableLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#2DD4BF",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  deliverableItem: {
    fontSize: 11,
    color: "#AAAAAA",
    marginBottom: 3,
    paddingLeft: 8,
  },

  // Timeline
  timelineRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  timelineLabel: {
    width: 80,
    fontSize: 12,
    fontWeight: "bold",
    color: "#00FF8F",
  },
  timelineText: {
    flex: 1,
    fontSize: 11,
    color: "#CCCCCC",
    lineHeight: 1.5,
  },

  // Investment
  investmentBox: {
    backgroundColor: "#0A2A15",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  investmentAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#00FF8F",
  },
  investmentPer: {
    fontSize: 12,
    color: "#AAAAAA",
    marginTop: 4,
  },
  includesLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 6,
    marginTop: 12,
  },
  includesItem: {
    fontSize: 11,
    color: "#AAAAAA",
    marginBottom: 3,
    paddingLeft: 8,
  },

  // Why section
  whyBox: {
    backgroundColor: "#111111",
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  whyText: {
    fontSize: 12,
    color: "#CCCCCC",
    lineHeight: 1.6,
  },

  // Next steps / signature
  nextStepsBox: {
    backgroundColor: "#111111",
    borderRadius: 8,
    padding: 20,
    marginTop: 16,
  },
  nextStepItem: {
    fontSize: 12,
    color: "#CCCCCC",
    marginBottom: 8,
    lineHeight: 1.5,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#666666",
    marginTop: 30,
    paddingBottom: 2,
    width: "60%",
  },
  signatureLabel: {
    fontSize: 10,
    color: "#999999",
    marginTop: 6,
  },
  signatureDate: {
    fontSize: 10,
    color: "#999999",
    marginTop: 20,
  },

  // Footer
  footer: {
    fontSize: 10,
    color: "#666666",
    marginTop: 30,
    textAlign: "center",
  },
});

export function ProposalPDF({ data }: { data: ProposalData }) {
  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.logo}>
          Inject<Text style={styles.logoAccent}>SEO</Text>
        </Text>
        <Text style={styles.coverTitle}>Growth Proposal for</Text>
        <Text style={styles.coverClient}>{data.clientName}</Text>
        <Text style={styles.coverDate}>{formattedDate}</Text>
        <Text style={styles.coverTagline}>
          Premium SEO Solutions for Medical Aesthetics
        </Text>
      </Page>

      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitleFirst}>Executive Summary</Text>
        <Text style={styles.bodyText}>{data.executiveSummary}</Text>

        {/* Scope of Work */}
        <Text style={styles.sectionTitle}>Scope of Work</Text>
        {data.scopeOfWork.map((item, i) => (
          <View key={i} style={styles.serviceCard}>
            <Text style={styles.serviceName}>{item.service}</Text>
            <Text style={styles.serviceDesc}>{item.description}</Text>
            <Text style={styles.deliverableLabel}>Deliverables</Text>
            {item.deliverables.map((d, j) => (
              <Text key={j} style={styles.deliverableItem}>
                {"\u2022"} {d}
              </Text>
            ))}
          </View>
        ))}
      </Page>

      {/* Timeline + Investment + Why */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitleFirst}>90-Day Timeline</Text>
        <View style={styles.timelineRow}>
          <Text style={styles.timelineLabel}>Month 1</Text>
          <Text style={styles.timelineText}>{data.timeline.month1}</Text>
        </View>
        <View style={styles.timelineRow}>
          <Text style={styles.timelineLabel}>Month 2</Text>
          <Text style={styles.timelineText}>{data.timeline.month2}</Text>
        </View>
        <View style={styles.timelineRow}>
          <Text style={styles.timelineLabel}>Month 3</Text>
          <Text style={styles.timelineText}>{data.timeline.month3}</Text>
        </View>

        {/* Investment */}
        <Text style={styles.sectionTitle}>Investment</Text>
        <View style={styles.investmentBox}>
          <Text style={styles.investmentAmount}>
            ${data.investment.monthly.toLocaleString()}
          </Text>
          <Text style={styles.investmentPer}>per month</Text>
        </View>
        <Text style={styles.includesLabel}>This includes:</Text>
        {data.investment.includes.map((item, i) => (
          <Text key={i} style={styles.includesItem}>
            {"\u2022"} {item}
          </Text>
        ))}

        {/* Why InjectSEO */}
        <Text style={styles.sectionTitle}>Why InjectSEO</Text>
        <View style={styles.whyBox}>
          <Text style={styles.whyText}>{data.whyInjectSEO}</Text>
        </View>
      </Page>

      {/* Next Steps + Signature */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitleFirst}>Next Steps</Text>
        <View style={styles.nextStepsBox}>
          <Text style={styles.nextStepItem}>
            1. Review this proposal and reach out with any questions.
          </Text>
          <Text style={styles.nextStepItem}>
            2. Schedule a follow-up call to finalize the scope and timeline.
          </Text>
          <Text style={styles.nextStepItem}>
            3. Sign below to confirm engagement and we will begin onboarding within 48 hours.
          </Text>
          <Text style={styles.nextStepItem}>
            4. Receive your first progress report within 14 days of kickoff.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Agreement</Text>
        <Text style={styles.bodyText}>
          By signing below, {data.clientName} agrees to engage InjectSEO for the
          services outlined in this proposal at a monthly investment of $
          {data.investment.monthly.toLocaleString()}.
        </Text>

        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>
          Authorized Signature — {data.clientName}
        </Text>

        <Text style={styles.signatureDate}>Date: ____________________</Text>

        <Text style={styles.footer}>
          Generated by InjectSEO — injectseo.com
        </Text>
      </Page>
    </Document>
  );
}
