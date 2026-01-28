import Link from 'next/link';
import { Sparkles, ArrowLeft, Shield, Lock, Eye, FileText, Globe, Mail } from 'lucide-react';

// ============================================
// PRIVACY POLICY PAGE - PEACASE.COM
// GDPR Compliant Privacy Policy
// ============================================

export const metadata = {
  title: 'Privacy Policy | Peacase',
  description: 'Learn how Peacase collects, uses, and protects your personal data. GDPR compliant privacy policy for our spa and salon management platform.',
};

// Table of Contents items
const tocItems = [
  { id: 'introduction', label: '1. Introduction' },
  { id: 'data-collected', label: '2. Data We Collect' },
  { id: 'how-we-use', label: '3. How We Use Your Data' },
  { id: 'legal-basis', label: '4. Legal Basis for Processing' },
  { id: 'data-sharing', label: '5. Data Sharing & Third Parties' },
  { id: 'data-retention', label: '6. Data Retention' },
  { id: 'your-rights', label: '7. Your Rights' },
  { id: 'cookies', label: '8. Cookies & Tracking' },
  { id: 'data-security', label: '9. Data Security' },
  { id: 'international-transfers', label: '10. International Data Transfers' },
  { id: 'children', label: '11. Children\'s Privacy' },
  { id: 'updates', label: '12. Policy Updates' },
  { id: 'contact', label: '13. Contact Us' },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-cream dark:bg-zinc-900 transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-charcoal/5 dark:border-white/10">
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

      {/* Hero Section */}
      <section className="pt-32 pb-12 lg:pt-40 lg:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-sage/10 dark:bg-sage/20">
              <Shield className="w-6 h-6 text-sage" />
            </div>
            <span className="text-sm font-medium text-sage">Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-display-sm font-display font-bold text-charcoal dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-charcoal/60 dark:text-gray-400 mb-6">
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
          </p>
          <div className="flex items-center gap-4 text-sm text-charcoal/50 dark:text-gray-500">
            <span>Last updated: January 24, 2026</span>
            <span className="w-1 h-1 rounded-full bg-charcoal/30 dark:bg-gray-600" />
            <span>Effective: January 24, 2026</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Table of Contents - Sticky Sidebar */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-charcoal/5 dark:border-white/10 shadow-card">
                  <h2 className="text-sm font-semibold text-charcoal dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sage" />
                    Table of Contents
                  </h2>
                  <nav className="space-y-1">
                    {tocItems.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="block py-1.5 text-sm text-charcoal/60 dark:text-gray-400 hover:text-sage transition-colors"
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
            </aside>

            {/* Policy Content */}
            <main className="lg:col-span-3">
              <div className="prose prose-charcoal dark:prose-invert max-w-none">
                {/* Introduction */}
                <PolicySection id="introduction" title="1. Introduction">
                  <p>
                    Welcome to Peacase (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). Peacase is a comprehensive spa and salon management
                    platform that helps businesses manage appointments, clients, staff, and payments.
                  </p>
                  <p>
                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you
                    use our website, web application, and related services (collectively, the &quot;Service&quot;). This policy
                    applies to all users of our Service, including:
                  </p>
                  <ul>
                    <li><strong>Business Users:</strong> Spa and salon owners, managers, and staff who use Peacase to manage their business</li>
                    <li><strong>End Users:</strong> Clients of businesses who book appointments, make payments, or interact with businesses through Peacase</li>
                  </ul>
                  <p>
                    By using our Service, you agree to the collection and use of information in accordance with this policy.
                    If you do not agree with our practices, please do not use our Service.
                  </p>
                </PolicySection>

                {/* Data We Collect */}
                <PolicySection id="data-collected" title="2. Data We Collect">
                  <p>We collect different types of information depending on how you interact with our Service:</p>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">2.1 Information You Provide</h4>

                  <InfoCard icon={<Eye className="w-5 h-5 text-sage" />} title="Account Information">
                    <ul>
                      <li>Name, email address, and phone number</li>
                      <li>Business name, address, and contact details</li>
                      <li>Password (stored securely using industry-standard encryption)</li>
                      <li>Profile photos and business logos</li>
                    </ul>
                  </InfoCard>

                  <InfoCard icon={<Eye className="w-5 h-5 text-lavender" />} title="Client Information (for Business Users)">
                    <ul>
                      <li>Client names, email addresses, and phone numbers</li>
                      <li>Appointment history and service preferences</li>
                      <li>Notes and special requirements</li>
                      <li>Communication history</li>
                    </ul>
                  </InfoCard>

                  <InfoCard icon={<Eye className="w-5 h-5 text-peach" />} title="Appointment & Service Data">
                    <ul>
                      <li>Appointment dates, times, and durations</li>
                      <li>Services booked and service providers assigned</li>
                      <li>Appointment status and notes</li>
                      <li>Consultation forms and intake questionnaires</li>
                    </ul>
                  </InfoCard>

                  <InfoCard icon={<Eye className="w-5 h-5 text-mint" />} title="Payment Information">
                    <ul>
                      <li>Transaction amounts and dates</li>
                      <li>Payment method details (processed securely by Stripe)</li>
                      <li>Invoices and receipts</li>
                      <li>Tip amounts and gift card balances</li>
                    </ul>
                  </InfoCard>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">2.2 Information Collected Automatically</h4>
                  <ul>
                    <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                    <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the Service</li>
                    <li><strong>Log Data:</strong> IP address, access times, referring URLs</li>
                    <li><strong>Location Data:</strong> Approximate location based on IP address (not precise GPS)</li>
                  </ul>
                </PolicySection>

                {/* How We Use Your Data */}
                <PolicySection id="how-we-use" title="3. How We Use Your Data">
                  <p>We use the information we collect for the following purposes:</p>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">3.1 Service Delivery</h4>
                  <ul>
                    <li>Providing and maintaining the Peacase platform</li>
                    <li>Processing appointments and managing calendars</li>
                    <li>Facilitating payments and generating invoices</li>
                    <li>Enabling communication between businesses and their clients</li>
                    <li>Sending appointment reminders and confirmations</li>
                  </ul>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">3.2 Communication</h4>
                  <ul>
                    <li>Responding to your inquiries and support requests</li>
                    <li>Sending transactional emails (receipts, confirmations, password resets)</li>
                    <li>Sending marketing communications (with your consent)</li>
                    <li>Notifying you of changes to our Service or policies</li>
                  </ul>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">3.3 Improvement & Analytics</h4>
                  <ul>
                    <li>Analyzing usage patterns to improve our Service</li>
                    <li>Developing new features and functionality</li>
                    <li>Conducting research and generating aggregate statistics</li>
                    <li>Troubleshooting technical issues</li>
                  </ul>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">3.4 Security & Compliance</h4>
                  <ul>
                    <li>Detecting and preventing fraud and abuse</li>
                    <li>Enforcing our Terms of Service</li>
                    <li>Complying with legal obligations</li>
                    <li>Protecting the rights and safety of users</li>
                  </ul>
                </PolicySection>

                {/* Legal Basis for Processing */}
                <PolicySection id="legal-basis" title="4. Legal Basis for Processing">
                  <p>
                    Under the General Data Protection Regulation (GDPR) and similar privacy laws, we process your
                    personal data based on the following legal grounds:
                  </p>
                  <ul>
                    <li>
                      <strong>Contract Performance:</strong> Processing necessary to fulfill our contract with you
                      (providing the Service, processing payments, managing appointments)
                    </li>
                    <li>
                      <strong>Legitimate Interests:</strong> Processing necessary for our legitimate business interests
                      (improving our Service, preventing fraud, marketing to existing customers)
                    </li>
                    <li>
                      <strong>Consent:</strong> Processing based on your explicit consent (marketing communications,
                      optional features, cookies)
                    </li>
                    <li>
                      <strong>Legal Obligation:</strong> Processing necessary to comply with applicable laws
                      (tax records, fraud prevention, regulatory requirements)
                    </li>
                  </ul>
                </PolicySection>

                {/* Data Sharing & Third Parties */}
                <PolicySection id="data-sharing" title="5. Data Sharing & Third Parties">
                  <p>
                    We do not sell your personal information. We may share your data with the following categories
                    of third parties:
                  </p>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">5.1 Service Providers</h4>
                  <p>We work with trusted third-party service providers who assist us in operating our Service:</p>

                  <div className="mt-4 space-y-4">
                    <ThirdPartyCard
                      name="Stripe"
                      purpose="Payment Processing"
                      description="Securely processes credit card payments, manages subscriptions, and handles refunds. Stripe is PCI-DSS Level 1 certified."
                      privacyUrl="https://stripe.com/privacy"
                    />
                    <ThirdPartyCard
                      name="Twilio"
                      purpose="SMS Communications"
                      description="Sends appointment reminders, confirmations, and notifications via SMS to clients and staff."
                      privacyUrl="https://www.twilio.com/legal/privacy"
                    />
                    <ThirdPartyCard
                      name="SendGrid"
                      purpose="Email Communications"
                      description="Delivers transactional emails including appointment confirmations, receipts, and account notifications."
                      privacyUrl="https://www.twilio.com/legal/privacy"
                    />
                    <ThirdPartyCard
                      name="Supabase"
                      purpose="Database & Authentication"
                      description="Provides secure database hosting and user authentication services. Data is encrypted at rest and in transit."
                      privacyUrl="https://supabase.com/privacy"
                    />
                    <ThirdPartyCard
                      name="Vercel"
                      purpose="Website Hosting"
                      description="Hosts our web application and provides content delivery for optimal performance worldwide."
                      privacyUrl="https://vercel.com/legal/privacy-policy"
                    />
                  </div>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">5.2 Business Transfers</h4>
                  <p>
                    In the event of a merger, acquisition, or sale of all or a portion of our assets, your personal
                    information may be transferred as part of that transaction. We will notify you via email and/or
                    a prominent notice on our Service of any change in ownership or uses of your personal information.
                  </p>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">5.3 Legal Requirements</h4>
                  <p>We may disclose your information if required to do so by law or in response to:</p>
                  <ul>
                    <li>Valid legal processes (subpoenas, court orders)</li>
                    <li>Government requests from law enforcement agencies</li>
                    <li>Protecting our legal rights or defending against legal claims</li>
                    <li>Preventing fraud or security threats</li>
                  </ul>
                </PolicySection>

                {/* Data Retention */}
                <PolicySection id="data-retention" title="6. Data Retention">
                  <p>
                    We retain your personal information only for as long as necessary to fulfill the purposes for
                    which it was collected, including legal, accounting, or reporting requirements.
                  </p>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-sage/10 dark:bg-sage/20">
                          <th className="text-left p-3 text-sm font-semibold text-charcoal dark:text-white border border-charcoal/10 dark:border-white/10">Data Type</th>
                          <th className="text-left p-3 text-sm font-semibold text-charcoal dark:text-white border border-charcoal/10 dark:border-white/10">Retention Period</th>
                          <th className="text-left p-3 text-sm font-semibold text-charcoal dark:text-white border border-charcoal/10 dark:border-white/10">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">Account Information</td>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">Until account deletion + 30 days</td>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">Service provision and account recovery</td>
                        </tr>
                        <tr className="bg-surface-muted dark:bg-zinc-800/50">
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">Appointment Records</td>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">7 years after appointment</td>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">Business records and legal compliance</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">Payment Records</td>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">7 years after transaction</td>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">Tax and financial regulations</td>
                        </tr>
                        <tr className="bg-surface-muted dark:bg-zinc-800/50">
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">Marketing Preferences</td>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">Until consent withdrawn</td>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">Consent management</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">Usage Logs</td>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">90 days</td>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">Security and troubleshooting</td>
                        </tr>
                        <tr className="bg-surface-muted dark:bg-zinc-800/50">
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">Support Tickets</td>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">3 years after resolution</td>
                          <td className="p-3 text-sm border border-charcoal/10 dark:border-white/10 dark:text-gray-300">Service improvement and dispute resolution</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-4">
                    When you request account deletion, we will delete or anonymize your personal information within
                    30 days, except where we are required to retain certain information for legal or legitimate
                    business purposes.
                  </p>
                </PolicySection>

                {/* Your Rights */}
                <PolicySection id="your-rights" title="7. Your Rights">
                  <p>
                    Under GDPR and similar privacy laws, you have specific rights regarding your personal data.
                    We are committed to honoring these rights:
                  </p>

                  <div className="mt-6 grid gap-4">
                    <RightCard
                      title="Right to Access"
                      description="You can request a copy of all personal data we hold about you. We will provide this information in a portable, machine-readable format within 30 days."
                    />
                    <RightCard
                      title="Right to Rectification"
                      description="If any of your personal data is inaccurate or incomplete, you can request that we correct or update it. You can also update most information directly in your account settings."
                    />
                    <RightCard
                      title="Right to Erasure (Right to be Forgotten)"
                      description="You can request that we delete your personal data. We will comply unless we have a legal obligation to retain the data or it is necessary for ongoing service provision."
                    />
                    <RightCard
                      title="Right to Data Portability"
                      description="You can request your data in a structured, commonly used format (JSON or CSV) to transfer it to another service provider."
                    />
                    <RightCard
                      title="Right to Restrict Processing"
                      description="You can request that we limit how we use your data while we address your concerns about its accuracy or our processing activities."
                    />
                    <RightCard
                      title="Right to Object"
                      description="You can object to processing of your data for direct marketing purposes at any time. You can also object to processing based on legitimate interests."
                    />
                    <RightCard
                      title="Right to Withdraw Consent"
                      description="Where we process data based on your consent, you can withdraw that consent at any time. This will not affect the lawfulness of processing before withdrawal."
                    />
                  </div>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">How to Exercise Your Rights</h4>
                  <p>You can exercise your rights in several ways:</p>
                  <ul>
                    <li>
                      <strong>In-App Tools:</strong> Access your account settings to update information, download your
                      data, or delete your account
                    </li>
                    <li>
                      <strong>Email:</strong> Send a request to{' '}
                      <a href="mailto:privacy@peacase.com" className="text-sage hover:underline">privacy@peacase.com</a>
                    </li>
                    <li>
                      <strong>Contact Form:</strong> Use the contact form on our website
                    </li>
                  </ul>
                  <p className="mt-4">
                    We will respond to all legitimate requests within 30 days. If your request is complex or you have
                    made multiple requests, we may need up to 60 days but will notify you of any extension.
                  </p>
                  <p>
                    If you are not satisfied with how we handle your request, you have the right to lodge a complaint
                    with your local data protection authority.
                  </p>
                </PolicySection>

                {/* Cookies & Tracking */}
                <PolicySection id="cookies" title="8. Cookies & Tracking">
                  <p>
                    We use cookies and similar tracking technologies to enhance your experience on our Service.
                    This section explains what cookies we use and why.
                  </p>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">8.1 What Are Cookies?</h4>
                  <p>
                    Cookies are small text files stored on your device when you visit a website. They help websites
                    remember your preferences and understand how you use the site.
                  </p>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">8.2 Types of Cookies We Use</h4>

                  <div className="mt-4 space-y-4">
                    <CookieCard
                      type="Essential Cookies"
                      required={true}
                      description="Required for the Service to function. These cookies enable core functionality such as security, authentication, and session management."
                      examples="Authentication tokens, CSRF protection, session identifiers"
                    />
                    <CookieCard
                      type="Functional Cookies"
                      required={false}
                      description="Remember your preferences and settings to provide a better experience."
                      examples="Language preferences, theme settings, timezone"
                    />
                    <CookieCard
                      type="Analytics Cookies"
                      required={false}
                      description="Help us understand how visitors use our Service so we can improve it."
                      examples="Page views, feature usage, error tracking"
                    />
                    <CookieCard
                      type="Marketing Cookies"
                      required={false}
                      description="Used to deliver relevant advertisements and measure campaign effectiveness."
                      examples="Ad tracking, conversion tracking, remarketing"
                    />
                  </div>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">8.3 Managing Cookies</h4>
                  <p>
                    You can control cookies through your browser settings. Most browsers allow you to:
                  </p>
                  <ul>
                    <li>View what cookies are stored and delete them individually</li>
                    <li>Block third-party cookies</li>
                    <li>Block cookies from specific sites</li>
                    <li>Block all cookies</li>
                    <li>Delete all cookies when you close your browser</li>
                  </ul>
                  <p className="mt-4">
                    Please note that blocking essential cookies may prevent you from using certain features of our Service.
                  </p>
                </PolicySection>

                {/* Data Security */}
                <PolicySection id="data-security" title="9. Data Security">
                  <p>
                    We take the security of your data seriously and implement appropriate technical and organizational
                    measures to protect your personal information against unauthorized access, alteration, disclosure,
                    or destruction.
                  </p>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">9.1 Technical Measures</h4>
                  <div className="mt-4 grid sm:grid-cols-2 gap-4">
                    <SecurityCard
                      icon={<Lock className="w-5 h-5 text-sage" />}
                      title="Encryption"
                      description="All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption."
                    />
                    <SecurityCard
                      icon={<Shield className="w-5 h-5 text-sage" />}
                      title="Access Controls"
                      description="Role-based access controls ensure only authorized personnel can access sensitive data."
                    />
                    <SecurityCard
                      icon={<Eye className="w-5 h-5 text-sage" />}
                      title="Monitoring"
                      description="Continuous monitoring and logging of system access to detect suspicious activity."
                    />
                    <SecurityCard
                      icon={<Globe className="w-5 h-5 text-sage" />}
                      title="Infrastructure"
                      description="Hosted on secure, SOC 2 compliant cloud infrastructure with regular security audits."
                    />
                  </div>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">9.2 Organizational Measures</h4>
                  <ul>
                    <li>Regular security training for all employees</li>
                    <li>Background checks for employees with access to sensitive data</li>
                    <li>Incident response procedures for security breaches</li>
                    <li>Regular security assessments and penetration testing</li>
                    <li>Vendor security assessments for third-party service providers</li>
                  </ul>

                  <h4 className="text-lg font-semibold text-charcoal dark:text-white mt-6 mb-3">9.3 Data Breach Notification</h4>
                  <p>
                    In the unlikely event of a data breach that affects your personal information, we will notify
                    you and the relevant supervisory authorities within 72 hours of becoming aware of the breach,
                    as required by GDPR.
                  </p>
                </PolicySection>

                {/* International Data Transfers */}
                <PolicySection id="international-transfers" title="10. International Data Transfers">
                  <p>
                    Peacase is based in the United States, and our servers are located in the US and EU. If you are
                    accessing our Service from outside these regions, please be aware that your data may be
                    transferred to, stored, and processed in the US or EU.
                  </p>
                  <p>
                    When we transfer personal data outside the European Economic Area (EEA) or UK, we ensure
                    appropriate safeguards are in place:
                  </p>
                  <ul>
                    <li>
                      <strong>Standard Contractual Clauses (SCCs):</strong> We use EU-approved standard contractual
                      clauses for data transfers to countries without an adequacy decision
                    </li>
                    <li>
                      <strong>Adequacy Decisions:</strong> Where possible, we transfer data to countries with
                      adequate data protection as determined by the European Commission
                    </li>
                    <li>
                      <strong>Data Processing Agreements:</strong> We have agreements in place with all third-party
                      processors that include appropriate data protection provisions
                    </li>
                  </ul>
                  <p className="mt-4">
                    You can request a copy of the safeguards we use by contacting us at{' '}
                    <a href="mailto:privacy@peacase.com" className="text-sage hover:underline">privacy@peacase.com</a>.
                  </p>
                </PolicySection>

                {/* Children's Privacy */}
                <PolicySection id="children" title="11. Children's Privacy">
                  <p>
                    Our Service is not directed to children under 16 years of age. We do not knowingly collect
                    personal information from children under 16. If you are a parent or guardian and believe
                    your child has provided us with personal information, please contact us at{' '}
                    <a href="mailto:privacy@peacase.com" className="text-sage hover:underline">privacy@peacase.com</a>,
                    and we will take steps to delete such information.
                  </p>
                  <p>
                    If we become aware that we have collected personal information from a child under 16 without
                    verification of parental consent, we will delete that information as quickly as possible.
                  </p>
                </PolicySection>

                {/* Policy Updates */}
                <PolicySection id="updates" title="12. Policy Updates">
                  <p>
                    We may update this Privacy Policy from time to time to reflect changes in our practices,
                    technologies, legal requirements, or other factors. When we make changes:
                  </p>
                  <ul>
                    <li>We will update the &quot;Last updated&quot; date at the top of this policy</li>
                    <li>For significant changes, we will notify you via email or a prominent notice in our Service</li>
                    <li>We encourage you to review this policy periodically to stay informed</li>
                  </ul>
                  <p className="mt-4">
                    Your continued use of our Service after any changes indicates your acceptance of the updated
                    Privacy Policy.
                  </p>
                </PolicySection>

                {/* Contact Us */}
                <PolicySection id="contact" title="13. Contact Us">
                  <p>
                    If you have any questions, concerns, or requests regarding this Privacy Policy or our data
                    practices, please contact us:
                  </p>

                  <div className="mt-6 p-6 rounded-xl bg-sage/10 dark:bg-sage/20 border border-sage/20 dark:border-sage/30">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-sage/20 dark:bg-sage/30">
                        <Mail className="w-6 h-6 text-sage" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-charcoal dark:text-white mb-2">Peacase Privacy Team</h4>
                        <p className="text-sm text-charcoal/70 dark:text-gray-400 mb-3">
                          For privacy-related inquiries, data requests, or to exercise your rights:
                        </p>
                        <ul className="space-y-1 text-sm dark:text-gray-300">
                          <li>
                            <strong>Email:</strong>{' '}
                            <a href="mailto:privacy@peacase.com" className="text-sage hover:underline">
                              privacy@peacase.com
                            </a>
                          </li>
                          <li>
                            <strong>Website:</strong>{' '}
                            <a href="https://peacase.com/contact" className="text-sage hover:underline">
                              peacase.com/contact
                            </a>
                          </li>
                          <li>
                            <strong>Response Time:</strong> Within 30 days of receiving your request
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <p className="mt-6">
                    For general support inquiries unrelated to privacy, please contact{' '}
                    <a href="mailto:support@peacase.com" className="text-sage hover:underline">support@peacase.com</a>.
                  </p>
                </PolicySection>
              </div>
            </main>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-sidebar text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sage flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold">Peacase</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-white/60">
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/security" className="hover:text-white transition-colors">Security</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-white/60">
              2026 Peacase. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// REUSABLE COMPONENTS
// ============================================

function PolicySection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="text-2xl font-display font-bold text-charcoal dark:text-white mb-4 pb-2 border-b border-charcoal/10 dark:border-white/10">
        {title}
      </h2>
      <div className="text-charcoal/80 dark:text-gray-300 leading-relaxed space-y-4">
        {children}
      </div>
    </section>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 p-4 rounded-xl bg-surface-muted dark:bg-zinc-800/50 border border-charcoal/5 dark:border-white/10">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h5 className="font-semibold text-charcoal dark:text-white">{title}</h5>
      </div>
      <div className="text-sm text-charcoal/70 dark:text-gray-400">
        {children}
      </div>
    </div>
  );
}

function ThirdPartyCard({
  name,
  purpose,
  description,
  privacyUrl,
}: {
  name: string;
  purpose: string;
  description: string;
  privacyUrl: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-charcoal/10 dark:border-white/10">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h5 className="font-semibold text-charcoal dark:text-white">{name}</h5>
          <span className="text-xs text-sage font-medium">{purpose}</span>
        </div>
        <a
          href={privacyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sage hover:underline"
        >
          Privacy Policy
        </a>
      </div>
      <p className="text-sm text-charcoal/70 dark:text-gray-400">{description}</p>
    </div>
  );
}

function RightCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-charcoal/10 dark:border-white/10 hover:border-sage/30 dark:hover:border-sage/50 transition-colors">
      <h5 className="font-semibold text-charcoal dark:text-white mb-2">{title}</h5>
      <p className="text-sm text-charcoal/70 dark:text-gray-400">{description}</p>
    </div>
  );
}

function CookieCard({
  type,
  required,
  description,
  examples,
}: {
  type: string;
  required: boolean;
  description: string;
  examples: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-charcoal/10 dark:border-white/10">
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-semibold text-charcoal dark:text-white">{type}</h5>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            required
              ? 'bg-sage/20 text-sage-dark dark:text-sage'
              : 'bg-charcoal/10 dark:bg-gray-700 text-charcoal/60 dark:text-gray-400'
          }`}
        >
          {required ? 'Required' : 'Optional'}
        </span>
      </div>
      <p className="text-sm text-charcoal/70 dark:text-gray-400 mb-2">{description}</p>
      <p className="text-xs text-charcoal/50 dark:text-gray-500">
        <strong>Examples:</strong> {examples}
      </p>
    </div>
  );
}

function SecurityCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-charcoal/10 dark:border-white/10">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h5 className="font-semibold text-charcoal dark:text-white">{title}</h5>
      </div>
      <p className="text-sm text-charcoal/70 dark:text-gray-400">{description}</p>
    </div>
  );
}
