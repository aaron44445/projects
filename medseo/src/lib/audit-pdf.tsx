import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { AuditResult } from "./audit-analyzer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#1a1a1a",
    color: "#e5e5e5",
    padding: 40,
    fontFamily: "Helvetica",
  },
  coverPage: {
    backgroundColor: "#0A0A0B",
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { fontSize: 32, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 },
  logoAccent: { color: "#00FF8F" },
  title: { fontSize: 24, color: "#FFFFFF", marginTop: 20 },
  subtitle: { fontSize: 14, color: "#999999", marginTop: 8 },
  date: { fontSize: 11, color: "#666666", marginTop: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 24,
    marginBottom: 12,
  },
  scoreBox: {
    backgroundColor: "#111111",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  scoreNumber: { fontSize: 48, fontWeight: "bold" },
  scoreLabel: { fontSize: 12, color: "#999999", marginTop: 4 },
  issueCard: {
    backgroundColor: "#111111",
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  issuePriority: { fontSize: 10, fontWeight: "bold", marginBottom: 4 },
  issueTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  issueDesc: { fontSize: 11, color: "#BBBBBB", marginBottom: 4 },
  issueRec: { fontSize: 11, color: "#00FF8F", marginBottom: 4 },
  issueImpact: { fontSize: 10, color: "#2DD4BF" },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metricBox: {
    backgroundColor: "#111111",
    borderRadius: 6,
    padding: 12,
    width: "30%",
    alignItems: "center",
  },
  metricValue: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF" },
  metricLabel: { fontSize: 10, color: "#999999", marginTop: 4 },
  summary: { fontSize: 13, color: "#CCCCCC", lineHeight: 1.6 },
  footer: { fontSize: 10, color: "#666666", marginTop: 30, textAlign: "center" },
  ctaBox: {
    backgroundColor: "#0A2A15",
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
    alignItems: "center",
  },
  ctaText: { fontSize: 14, color: "#00FF8F", fontWeight: "bold" },
  ctaSubtext: { fontSize: 11, color: "#CCCCCC", marginTop: 8 },
});

function getScoreColor(score: number): string {
  if (score >= 75) return "#00FF8F";
  if (score >= 50) return "#FFB800";
  return "#FF4444";
}

function getPriorityColor(priority: string): string {
  if (priority === "HIGH") return "#FF4444";
  if (priority === "MEDIUM") return "#FFB800";
  return "#00FF8F";
}

export function AuditPDF({ audit }: { audit: AuditResult }) {
  const { siteAnalysis, pageSpeed, aiAnalysis } = audit;

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.logo}>
          Inject<Text style={styles.logoAccent}>SEO</Text>
        </Text>
        <Text style={styles.title}>SEO Diagnostic Report</Text>
        <Text style={styles.subtitle}>
          {siteAnalysis.businessName || siteAnalysis.url}
        </Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </Page>

      {/* Results Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Overall Health Score</Text>
        <View style={styles.scoreBox}>
          <Text
            style={[
              styles.scoreNumber,
              { color: getScoreColor(aiAnalysis.overallScore) },
            ]}
          >
            {aiAnalysis.overallScore}/100
          </Text>
          <Text style={styles.scoreLabel}>SEO HEALTH SCORE</Text>
        </View>

        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.summary}>{aiAnalysis.executiveSummary}</Text>

        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text
              style={[
                styles.metricValue,
                { color: getScoreColor(pageSpeed.performanceScore) },
              ]}
            >
              {pageSpeed.performanceScore}
            </Text>
            <Text style={styles.metricLabel}>Performance</Text>
          </View>
          <View style={styles.metricBox}>
            <Text
              style={[
                styles.metricValue,
                { color: getScoreColor(pageSpeed.seoScore) },
              ]}
            >
              {pageSpeed.seoScore}
            </Text>
            <Text style={styles.metricLabel}>SEO</Text>
          </View>
          <View style={styles.metricBox}>
            <Text
              style={[
                styles.metricValue,
                { color: getScoreColor(pageSpeed.accessibilityScore) },
              ]}
            >
              {pageSpeed.accessibilityScore}
            </Text>
            <Text style={styles.metricLabel}>Accessibility</Text>
          </View>
        </View>
      </Page>

      {/* Issues Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Issues Found</Text>
        {aiAnalysis.issues.map((issue, i) => (
          <View key={i} style={styles.issueCard}>
            <Text
              style={[
                styles.issuePriority,
                { color: getPriorityColor(issue.priority) },
              ]}
            >
              {issue.priority} PRIORITY
            </Text>
            <Text style={styles.issueTitle}>{issue.title}</Text>
            <Text style={styles.issueDesc}>{issue.description}</Text>
            <Text style={styles.issueRec}>
              Recommendation: {issue.recommendation}
            </Text>
            <Text style={styles.issueImpact}>Impact: {issue.impact}</Text>
          </View>
        ))}

        <View style={styles.ctaBox}>
          <Text style={styles.ctaText}>Ready to fix these issues?</Text>
          <Text style={styles.ctaSubtext}>
            Book a free strategy call at injectseo.com/book
          </Text>
        </View>

        <Text style={styles.footer}>
          Generated by InjectSEO — injectseo.com
        </Text>
      </Page>
    </Document>
  );
}
