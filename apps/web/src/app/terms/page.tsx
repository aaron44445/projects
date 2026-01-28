'use client';

import Link from 'next/link';
import { Sparkles, ArrowLeft, FileText, UserCheck, AlertTriangle, CreditCard, BookOpen, Shield, XCircle, Scale, RefreshCw, Mail, List } from 'lucide-react';

// ============================================
// TERMS OF SERVICE PAGE - PEACASE
// ============================================

const tableOfContents = [
  { id: 'service-description', title: '1. Service Description' },
  { id: 'account-responsibilities', title: '2. Account Responsibilities' },
  { id: 'acceptable-use', title: '3. Acceptable Use Policy' },
  { id: 'payment-terms', title: '4. Payment Terms' },
  { id: 'intellectual-property', title: '5. Intellectual Property' },
  { id: 'limitation-liability', title: '6. Limitation of Liability' },
  { id: 'termination', title: '7. Termination' },
  { id: 'dispute-resolution', title: '8. Dispute Resolution' },
  { id: 'changes-terms', title: '9. Changes to Terms' },
  { id: 'contact', title: '10. Contact Information' },
];

export default function TermsOfServicePage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-charcoal/5 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sage flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-charcoal dark:text-white">Peacase</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-charcoal/70 dark:text-gray-300 hover:text-charcoal dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage/10 dark:bg-sage/20 border border-sage/20 dark:border-sage/30 mb-6">
              <FileText className="w-4 h-4 text-sage" />
              <span className="text-sm font-medium text-charcoal dark:text-white">Legal Agreement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-display-sm font-display font-bold text-charcoal dark:text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-charcoal/60 dark:text-gray-400">
              Last updated: January 24, 2026
            </p>
          </div>

          {/* Table of Contents */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-charcoal/5 dark:border-white/10 shadow-card p-6 lg:p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-sage/10 dark:bg-sage/20 text-sage">
                <List className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-charcoal dark:text-white">Table of Contents</h2>
            </div>
            <nav className="grid sm:grid-cols-2 gap-2">
              {tableOfContents.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-left px-3 py-2 rounded-lg text-sm text-charcoal/70 dark:text-gray-400 hover:text-charcoal dark:hover:text-white hover:bg-sage/5 dark:hover:bg-sage/10 transition-colors"
                >
                  {item.title}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-charcoal/5 dark:border-white/10 shadow-card p-8 lg:p-12">
            {/* Introduction */}
            <section className="mb-10">
              <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                Welcome to Peacase. These Terms of Service (&quot;Terms&quot;) govern your access to and use of our
                spa and salon management platform, including our website, applications, and related services
                (collectively, the &quot;Service&quot;).
              </p>
              <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed">
                By accessing or using the Service, you agree to be bound by these Terms. If you do not agree
                to these Terms, you may not access or use the Service. If you are using the Service on behalf
                of an organization, you represent that you have the authority to bind that organization to these Terms.
              </p>
            </section>

            {/* Service Description */}
            <TermsSection
              id="service-description"
              icon={Sparkles}
              title="1. Service Description"
              content={
                <>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                    Peacase provides a cloud-based spa and salon management platform that enables businesses to:
                  </p>

                  <ul className="list-disc list-inside text-charcoal/80 dark:text-gray-300 mb-4 space-y-1">
                    <li>Manage appointments, scheduling, and calendar operations</li>
                    <li>Store and organize client information and service history</li>
                    <li>Process payments and manage financial transactions</li>
                    <li>Create and manage staff schedules and commissions</li>
                    <li>Offer online booking to clients</li>
                    <li>Generate reports and business analytics</li>
                    <li>Send automated reminders and marketing communications</li>
                  </ul>

                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed">
                    We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time,
                    with or without notice. We will endeavor to provide reasonable notice for material changes.
                  </p>
                </>
              }
            />

            {/* Account Responsibilities */}
            <TermsSection
              id="account-responsibilities"
              icon={UserCheck}
              title="2. Account Responsibilities"
              content={
                <>
                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Account Creation</h4>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                    To use the Service, you must create an account and provide accurate, complete, and current
                    information. You are responsible for maintaining the confidentiality of your account credentials
                    and for all activities that occur under your account.
                  </p>

                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Account Security</h4>
                  <ul className="list-disc list-inside text-charcoal/80 dark:text-gray-300 mb-4 space-y-1">
                    <li>You must use a strong, unique password for your account</li>
                    <li>You must not share your account credentials with unauthorized parties</li>
                    <li>You must notify us immediately of any unauthorized access or security breach</li>
                    <li>You are responsible for ensuring authorized users comply with these Terms</li>
                  </ul>

                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Eligibility</h4>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed">
                    You must be at least 18 years old and have the legal capacity to enter into a binding contract
                    to use the Service. By using the Service, you represent and warrant that you meet these requirements.
                  </p>
                </>
              }
            />

            {/* Acceptable Use */}
            <TermsSection
              id="acceptable-use"
              icon={AlertTriangle}
              title="3. Acceptable Use Policy"
              content={
                <>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                    You agree to use the Service only for lawful purposes and in accordance with these Terms.
                    You agree not to:
                  </p>

                  <ul className="list-disc list-inside text-charcoal/80 dark:text-gray-300 mb-4 space-y-2">
                    <li>Use the Service for any illegal or unauthorized purpose</li>
                    <li>Violate any applicable laws, regulations, or third-party rights</li>
                    <li>Upload or transmit viruses, malware, or other harmful code</li>
                    <li>Attempt to gain unauthorized access to the Service or other systems</li>
                    <li>Interfere with or disrupt the Service or servers</li>
                    <li>Scrape, crawl, or collect data from the Service without authorization</li>
                    <li>Use the Service to send spam or unsolicited communications</li>
                    <li>Impersonate any person or entity or misrepresent your affiliation</li>
                    <li>Reverse engineer, decompile, or disassemble the Service</li>
                    <li>Remove or alter any proprietary notices or labels</li>
                  </ul>

                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed">
                    We reserve the right to investigate and take appropriate action against anyone who violates
                    this provision, including removal of content and termination of accounts.
                  </p>
                </>
              }
            />

            {/* Payment Terms */}
            <TermsSection
              id="payment-terms"
              icon={CreditCard}
              title="4. Payment Terms"
              content={
                <>
                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Pricing and Billing</h4>
                  <ul className="list-disc list-inside text-charcoal/80 dark:text-gray-300 mb-4 space-y-1">
                    <li>Subscription fees are billed monthly or annually in advance</li>
                    <li>Add-on features are billed separately based on your selections</li>
                    <li>All fees are in USD unless otherwise specified</li>
                    <li>Prices may change with 30 days&apos; notice</li>
                  </ul>

                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Payment Processing</h4>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                    Payments are processed through Stripe. By providing payment information, you authorize us
                    to charge your payment method for all fees incurred. You are responsible for providing
                    accurate and current payment information.
                  </p>

                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Refunds</h4>
                  <ul className="list-disc list-inside text-charcoal/80 dark:text-gray-300 mb-4 space-y-1">
                    <li>Annual subscriptions: Pro-rated refund within first 30 days</li>
                    <li>Monthly subscriptions: No refunds for partial months</li>
                    <li>Add-on features: Refundable within 14 days if unused</li>
                    <li>Free trial: No payment required; cancel anytime before trial ends</li>
                  </ul>

                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Failed Payments</h4>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed">
                    If a payment fails, we will attempt to process it again and notify you. After multiple
                    failed attempts, we may suspend your access to the Service until payment is received.
                  </p>
                </>
              }
            />

            {/* Intellectual Property */}
            <TermsSection
              id="intellectual-property"
              icon={BookOpen}
              title="5. Intellectual Property"
              content={
                <>
                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Our Intellectual Property</h4>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                    The Service and all content, features, and functionality are owned by Peacase and are
                    protected by copyright, trademark, and other intellectual property laws. You may not copy,
                    modify, distribute, or create derivative works without our express written permission.
                  </p>

                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Your Content</h4>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                    You retain ownership of all data and content you upload to the Service (&quot;Your Content&quot;).
                    By using the Service, you grant us a limited license to use, store, and process Your Content
                    solely to provide the Service to you.
                  </p>

                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Feedback</h4>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed">
                    If you provide feedback, suggestions, or ideas about the Service, you grant us the right
                    to use such feedback without restriction or compensation to you.
                  </p>
                </>
              }
            />

            {/* Limitation of Liability */}
            <TermsSection
              id="limitation-liability"
              icon={Shield}
              title="6. Limitation of Liability"
              content={
                <>
                  <div className="bg-cream dark:bg-gray-900 rounded-xl p-6 border border-charcoal/5 dark:border-white/10 mb-4">
                    <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed text-sm">
                      TO THE MAXIMUM EXTENT PERMITTED BY LAW, PEACASE AND ITS OFFICERS, DIRECTORS, EMPLOYEES,
                      AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                      PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL,
                      ARISING FROM YOUR USE OF THE SERVICE.
                    </p>
                  </div>

                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                    Our total liability for any claims arising from or related to the Service shall not exceed
                    the amount you paid to us in the twelve (12) months preceding the claim.
                  </p>

                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed">
                    The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either
                    express or implied, including but not limited to warranties of merchantability, fitness for
                    a particular purpose, and non-infringement.
                  </p>
                </>
              }
            />

            {/* Termination */}
            <TermsSection
              id="termination"
              icon={XCircle}
              title="7. Termination"
              content={
                <>
                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Termination by You</h4>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                    You may terminate your account at any time by contacting us or through your account settings.
                    Upon termination, you will lose access to the Service and Your Content may be deleted after
                    a reasonable retention period.
                  </p>

                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Termination by Us</h4>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                    We may terminate or suspend your account immediately, without prior notice, if:
                  </p>
                  <ul className="list-disc list-inside text-charcoal/80 dark:text-gray-300 mb-4 space-y-1">
                    <li>You breach any provision of these Terms</li>
                    <li>We are required to do so by law</li>
                    <li>We discontinue the Service</li>
                    <li>Your payment is delinquent for more than 30 days</li>
                  </ul>

                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Effect of Termination</h4>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed">
                    Upon termination, your right to use the Service will immediately cease. We will provide
                    you with an opportunity to export Your Content for 30 days following termination, unless
                    prohibited by law. Sections that by their nature should survive termination will survive.
                  </p>
                </>
              }
            />

            {/* Dispute Resolution */}
            <TermsSection
              id="dispute-resolution"
              icon={Scale}
              title="8. Dispute Resolution"
              content={
                <>
                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Informal Resolution</h4>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                    Before initiating any formal dispute resolution, you agree to contact us at [Contact Email]
                    to attempt to resolve the dispute informally. We will attempt to resolve disputes within
                    30 days of receiving your notice.
                  </p>

                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Arbitration</h4>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                    If informal resolution is unsuccessful, any disputes shall be resolved through binding
                    arbitration in accordance with the rules of the American Arbitration Association. The
                    arbitration shall be conducted in [Company Location], and the arbitrator&apos;s decision
                    shall be final and binding.
                  </p>

                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Class Action Waiver</h4>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                    You agree that any dispute resolution proceedings will be conducted only on an individual
                    basis and not in a class, consolidated, or representative action.
                  </p>

                  <h4 className="font-semibold text-charcoal dark:text-white mb-2">Governing Law</h4>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed">
                    These Terms shall be governed by and construed in accordance with the laws of the State
                    of [State], without regard to its conflict of law provisions.
                  </p>
                </>
              }
            />

            {/* Changes to Terms */}
            <TermsSection
              id="changes-terms"
              icon={RefreshCw}
              title="9. Changes to Terms"
              content={
                <>
                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                    We reserve the right to modify these Terms at any time. We will provide notice of material
                    changes by:
                  </p>

                  <ul className="list-disc list-inside text-charcoal/80 dark:text-gray-300 mb-4 space-y-1">
                    <li>Posting the updated Terms on our website</li>
                    <li>Sending an email to the address associated with your account</li>
                    <li>Displaying a notice within the Service</li>
                  </ul>

                  <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed">
                    Your continued use of the Service after the effective date of any changes constitutes
                    acceptance of the modified Terms. If you do not agree to the changes, you must stop
                    using the Service and terminate your account.
                  </p>
                </>
              }
            />

            {/* Contact */}
            <section id="contact" className="pt-8 border-t border-charcoal/10 dark:border-white/10 scroll-mt-28">
              <h3 className="text-xl font-semibold text-charcoal dark:text-white mb-4">10. Contact Information</h3>
              <p className="text-charcoal/80 dark:text-gray-300 leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us:
              </p>

              <div className="bg-cream dark:bg-gray-900 rounded-xl p-6 border border-charcoal/5 dark:border-white/10">
                <p className="text-charcoal dark:text-white mb-2"><strong>[Company Name]</strong></p>
                <p className="text-charcoal/80 dark:text-gray-300">Email: [Contact Email]</p>
                <p className="text-charcoal/80 dark:text-gray-300">Address: [Company Address]</p>
              </div>
            </section>
          </div>

          {/* Related Links */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/privacy"
              className="text-sage font-medium hover:underline"
            >
              View Privacy Policy
            </Link>
            <span className="hidden sm:inline text-charcoal/30 dark:text-gray-600">|</span>
            <Link
              href="/security"
              className="text-sage font-medium hover:underline"
            >
              Security Information
            </Link>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-8 border-t border-charcoal/5 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-charcoal/60 dark:text-gray-400">
            2026 Peacase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// TERMS SECTION COMPONENT
// ============================================

interface TermsSectionProps {
  id?: string;
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

function TermsSection({ id, icon: Icon, title, content }: TermsSectionProps) {
  return (
    <section id={id} className="mb-10 pb-10 border-b border-charcoal/10 dark:border-white/10 last:border-b-0 last:pb-0 last:mb-0 scroll-mt-28">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-2 rounded-lg bg-sage/10 dark:bg-sage/20 text-sage flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-semibold text-charcoal dark:text-white pt-1">{title}</h3>
      </div>
      <div className="ml-0 lg:ml-14">
        {content}
      </div>
    </section>
  );
}
