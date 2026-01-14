'use client';

import Link from 'next/link';
import { Sparkles, ArrowLeft, Shield, Lock, Eye, Trash2, Users, Cookie, Mail } from 'lucide-react';

// ============================================
// PRIVACY POLICY PAGE - PEACASE
// ============================================

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-md border-b border-charcoal/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sage flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-charcoal">Peacase</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-charcoal/70 hover:text-charcoal transition-colors"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage/10 border border-sage/20 mb-6">
              <Shield className="w-4 h-4 text-sage" />
              <span className="text-sm font-medium text-charcoal">Your Privacy Matters</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-display-sm font-display font-bold text-charcoal mb-4">
              Privacy Policy
            </h1>
            <p className="text-charcoal/60">
              Last updated: January 13, 2026
            </p>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-2xl border border-charcoal/5 shadow-card p-8 lg:p-12">
            {/* Introduction */}
            <section className="mb-10">
              <p className="text-charcoal/80 leading-relaxed">
                At Peacase (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we are committed to protecting your privacy and
                ensuring the security of your personal information. This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information when you use our spa and salon management platform.
              </p>
            </section>

            {/* Data Collection */}
            <PolicySection
              icon={Eye}
              title="1. Information We Collect"
              content={
                <>
                  <p className="text-charcoal/80 leading-relaxed mb-4">
                    We collect information that you provide directly to us, as well as information collected
                    automatically when you use our services.
                  </p>

                  <h4 className="font-semibold text-charcoal mb-2">Account Information</h4>
                  <ul className="list-disc list-inside text-charcoal/80 mb-4 space-y-1">
                    <li>Name, email address, and phone number</li>
                    <li>Business name, address, and contact details</li>
                    <li>Payment and billing information</li>
                    <li>Account credentials and preferences</li>
                  </ul>

                  <h4 className="font-semibold text-charcoal mb-2">Salon and Client Data</h4>
                  <ul className="list-disc list-inside text-charcoal/80 mb-4 space-y-1">
                    <li>Staff information (names, schedules, services offered)</li>
                    <li>Client records (names, contact info, appointment history)</li>
                    <li>Service details, pricing, and inventory data</li>
                    <li>Appointment and booking information</li>
                  </ul>

                  <h4 className="font-semibold text-charcoal mb-2">Automatically Collected Information</h4>
                  <ul className="list-disc list-inside text-charcoal/80 space-y-1">
                    <li>Device information and browser type</li>
                    <li>IP address and location data</li>
                    <li>Usage patterns and feature interactions</li>
                    <li>Log data and error reports</li>
                  </ul>
                </>
              }
            />

            {/* Data Usage */}
            <PolicySection
              icon={Lock}
              title="2. How We Use Your Information"
              content={
                <>
                  <p className="text-charcoal/80 leading-relaxed mb-4">
                    We use the information we collect for the following purposes:
                  </p>

                  <h4 className="font-semibold text-charcoal mb-2">Service Provision</h4>
                  <ul className="list-disc list-inside text-charcoal/80 mb-4 space-y-1">
                    <li>Provide, maintain, and improve our platform</li>
                    <li>Process appointments, payments, and transactions</li>
                    <li>Enable features like online booking and client management</li>
                    <li>Deliver customer support and respond to inquiries</li>
                  </ul>

                  <h4 className="font-semibold text-charcoal mb-2">Analytics and Improvement</h4>
                  <ul className="list-disc list-inside text-charcoal/80 mb-4 space-y-1">
                    <li>Analyze usage trends to improve our services</li>
                    <li>Generate business insights and reports for your account</li>
                    <li>Develop new features and functionality</li>
                    <li>Monitor and enhance platform security</li>
                  </ul>

                  <h4 className="font-semibold text-charcoal mb-2">Communication</h4>
                  <ul className="list-disc list-inside text-charcoal/80 space-y-1">
                    <li>Send appointment reminders and notifications</li>
                    <li>Provide service updates and announcements</li>
                    <li>Marketing communications (with your consent)</li>
                    <li>Respond to your requests and feedback</li>
                  </ul>
                </>
              }
            />

            {/* Data Sharing */}
            <PolicySection
              icon={Users}
              title="3. Information Sharing"
              content={
                <>
                  <p className="text-charcoal/80 leading-relaxed mb-4">
                    We do not sell your personal information. We may share your information in the following circumstances:
                  </p>

                  <h4 className="font-semibold text-charcoal mb-2">Service Providers</h4>
                  <ul className="list-disc list-inside text-charcoal/80 mb-4 space-y-1">
                    <li><strong>Payment Processing:</strong> Stripe for secure payment handling</li>
                    <li><strong>Email Services:</strong> SendGrid or similar providers for communications</li>
                    <li><strong>SMS Services:</strong> Twilio or similar for text notifications</li>
                    <li><strong>Cloud Infrastructure:</strong> AWS, Google Cloud, or similar for data hosting</li>
                    <li><strong>Analytics:</strong> Aggregated, anonymized usage data for service improvement</li>
                  </ul>

                  <h4 className="font-semibold text-charcoal mb-2">Legal Requirements</h4>
                  <p className="text-charcoal/80 mb-4">
                    We may disclose information when required by law, court order, or government request,
                    or to protect the rights, property, or safety of Peacase, our users, or others.
                  </p>

                  <h4 className="font-semibold text-charcoal mb-2">Business Transfers</h4>
                  <p className="text-charcoal/80">
                    In the event of a merger, acquisition, or sale of assets, your information may be
                    transferred as part of that transaction. We will notify you of any such change.
                  </p>
                </>
              }
            />

            {/* Data Retention */}
            <PolicySection
              icon={Trash2}
              title="4. Data Retention and Deletion"
              content={
                <>
                  <p className="text-charcoal/80 leading-relaxed mb-4">
                    We retain your information for as long as your account is active or as needed to provide
                    you services. You can request deletion of your data at any time.
                  </p>

                  <h4 className="font-semibold text-charcoal mb-2">Retention Periods</h4>
                  <ul className="list-disc list-inside text-charcoal/80 mb-4 space-y-1">
                    <li><strong>Account Data:</strong> Retained while your account is active</li>
                    <li><strong>Transaction Records:</strong> Retained for 7 years for legal compliance</li>
                    <li><strong>Usage Logs:</strong> Retained for up to 12 months</li>
                    <li><strong>Marketing Data:</strong> Until you unsubscribe or request deletion</li>
                  </ul>

                  <h4 className="font-semibold text-charcoal mb-2">Account Deletion</h4>
                  <p className="text-charcoal/80">
                    You may request complete deletion of your account and associated data by contacting us
                    at [Contact Email]. We will process deletion requests within 30 days, subject to legal
                    retention requirements.
                  </p>
                </>
              }
            />

            {/* User Rights */}
            <PolicySection
              icon={Shield}
              title="5. Your Rights"
              content={
                <>
                  <p className="text-charcoal/80 leading-relaxed mb-4">
                    Depending on your location, you may have the following rights regarding your personal information:
                  </p>

                  <ul className="list-disc list-inside text-charcoal/80 mb-4 space-y-2">
                    <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                    <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                    <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                    <li><strong>Portability:</strong> Request your data in a structured, machine-readable format</li>
                    <li><strong>Objection:</strong> Object to processing of your information for certain purposes</li>
                    <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
                  </ul>

                  <p className="text-charcoal/80">
                    To exercise any of these rights, please contact us at [Contact Email]. We will respond
                    to your request within 30 days.
                  </p>
                </>
              }
            />

            {/* Cookies */}
            <PolicySection
              icon={Cookie}
              title="6. Cookies and Tracking Technologies"
              content={
                <>
                  <p className="text-charcoal/80 leading-relaxed mb-4">
                    We use cookies and similar tracking technologies to improve your experience on our platform.
                  </p>

                  <h4 className="font-semibold text-charcoal mb-2">Types of Cookies We Use</h4>
                  <ul className="list-disc list-inside text-charcoal/80 mb-4 space-y-2">
                    <li><strong>Essential Cookies:</strong> Required for basic platform functionality, authentication, and security</li>
                    <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand how you use our platform</li>
                    <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with consent)</li>
                  </ul>

                  <h4 className="font-semibold text-charcoal mb-2">Managing Cookies</h4>
                  <p className="text-charcoal/80">
                    You can control cookies through your browser settings. Note that disabling certain cookies
                    may affect the functionality of our platform. Most browsers allow you to refuse or delete cookies.
                  </p>
                </>
              }
            />

            {/* Security */}
            <PolicySection
              icon={Lock}
              title="7. Data Security"
              content={
                <>
                  <p className="text-charcoal/80 leading-relaxed mb-4">
                    We implement appropriate technical and organizational measures to protect your information:
                  </p>

                  <ul className="list-disc list-inside text-charcoal/80 space-y-1">
                    <li>Encryption in transit (TLS/SSL) and at rest</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Access controls and authentication measures</li>
                    <li>Employee training on data protection</li>
                    <li>Incident response procedures</li>
                    <li>SOC 2 Type II compliance (where applicable)</li>
                  </ul>
                </>
              }
            />

            {/* Contact */}
            <PolicySection
              icon={Mail}
              title="8. Contact Us"
              content={
                <>
                  <p className="text-charcoal/80 leading-relaxed mb-4">
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
                  </p>

                  <div className="bg-cream rounded-xl p-6 border border-charcoal/5">
                    <p className="text-charcoal mb-2"><strong>[Company Name]</strong></p>
                    <p className="text-charcoal/80">Email: [Contact Email]</p>
                    <p className="text-charcoal/80">Address: [Company Address]</p>
                  </div>

                  <p className="text-charcoal/80 mt-4">
                    For data protection inquiries in the EU, you may also contact your local data protection authority.
                  </p>
                </>
              }
            />

            {/* Changes */}
            <section className="pt-8 border-t border-charcoal/10">
              <h3 className="text-xl font-semibold text-charcoal mb-4">9. Changes to This Policy</h3>
              <p className="text-charcoal/80 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes
                by posting the new policy on this page and updating the &quot;Last updated&quot; date. We encourage you
                to review this policy periodically for any changes.
              </p>
            </section>
          </div>

          {/* Related Links */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/terms"
              className="text-sage font-medium hover:underline"
            >
              View Terms of Service
            </Link>
            <span className="hidden sm:inline text-charcoal/30">|</span>
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
      <footer className="py-8 border-t border-charcoal/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-charcoal/60">
            2026 Peacase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// POLICY SECTION COMPONENT
// ============================================

interface PolicySectionProps {
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

function PolicySection({ icon: Icon, title, content }: PolicySectionProps) {
  return (
    <section className="mb-10 pb-10 border-b border-charcoal/10 last:border-b-0 last:pb-0 last:mb-0">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-2 rounded-lg bg-sage/10 text-sage flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-semibold text-charcoal pt-1">{title}</h3>
      </div>
      <div className="ml-0 lg:ml-14">
        {content}
      </div>
    </section>
  );
}
