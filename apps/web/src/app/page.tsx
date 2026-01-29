'use client';

import Link from 'next/link';
import {
  Calendar,
  Users,
  Globe,
  CreditCard,
  BarChart3,
  Sparkles,
  Check,
  ArrowRight,
  Star,
  Shield,
  Zap,
  Clock,
  MessageSquare,
  Gift,
  Layers,
  MapPin,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { OrganizationSchema } from '@/components/OrganizationSchema';

// ============================================
// LANDING PAGE - PEACASE.COM
// Premium Spa & Salon Management
// ============================================

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream dark:bg-zinc-900 transition-colors">
      <OrganizationSchema />
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}

// ============================================
// NAVIGATION
// ============================================

function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-charcoal/5 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sage flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-charcoal dark:text-white">Peacase</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-charcoal/90 dark:text-white/90 hover:text-charcoal dark:hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-charcoal/90 dark:text-white/90 hover:text-charcoal dark:hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-charcoal/90 dark:text-white/90 hover:text-charcoal dark:hover:text-white transition-colors">
              Testimonials
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-charcoal dark:text-white hover:text-sage transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-lg bg-sage text-white text-sm font-semibold hover:bg-sage-dark hover:shadow-hover hover:-translate-y-0.5 transition-all duration-300"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ============================================
// HERO SECTION
// ============================================

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-soft-peach/30 dark:bg-sage/20 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-soft-lavender/20 dark:bg-lavender/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sage/10 dark:bg-sage/5 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage/10 dark:bg-sage/20 border border-sage/20 dark:border-sage/30 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-sage" />
            <span className="text-sm font-medium text-charcoal dark:text-white">New: AI-Powered Scheduling</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-display-lg font-display font-bold text-charcoal dark:text-white mb-6 animate-slide-up text-balance">
            Premium Spa & Salon Management,{' '}
            <span className="text-sage">Reimagined</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-text-secondary dark:text-gray-300 mb-10 max-w-2xl mx-auto animate-slide-up animation-delay-100 text-balance">
            Everything you need to run your salon. Nothing you dont.
            Start with essentials, add only what you need.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up animation-delay-200">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-sage text-white font-semibold text-lg hover:bg-sage-dark hover:shadow-hover-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-zinc-800 border-2 border-charcoal/10 dark:border-white/10 text-charcoal dark:text-white font-semibold text-lg hover:border-charcoal/20 dark:hover:border-white/20 hover:shadow-card transition-all duration-300"
            >
              View Features
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted dark:text-gray-400 animate-fade-in animation-delay-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 lg:mt-24 animate-slide-up animation-delay-500">
          <div className="relative mx-auto max-w-6xl">
            <div className="absolute inset-0 bg-gradient-to-t from-cream dark:from-gray-900 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-2xl border border-charcoal/10 dark:border-white/10 shadow-card-xl overflow-hidden bg-white dark:bg-zinc-800">
              {/* Browser Chrome */}
              <div className="px-4 py-3 bg-charcoal flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-dark" />
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <div className="w-3 h-3 rounded-full bg-success" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1.5 bg-charcoal/80 rounded-lg text-white/60 text-xs flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success/80" />
                    app.peacase.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard UI */}
              <div className="flex bg-cream dark:bg-zinc-900">
                {/* Sidebar */}
                <div className="w-56 bg-white dark:bg-zinc-800 border-r border-charcoal/10 dark:border-white/10 p-4 hidden md:block">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-sage flex items-center justify-center">
                      <span className="text-white font-bold text-sm">P</span>
                    </div>
                    <span className="font-display font-bold text-charcoal dark:text-white">peacase</span>
                  </div>
                  <nav className="space-y-1">
                    {[
                      { name: 'Dashboard', active: true },
                      { name: 'Calendar', active: false },
                      { name: 'Clients', active: false },
                      { name: 'Services', active: false },
                      { name: 'Staff', active: false },
                      { name: 'Reports', active: false },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          item.active
                            ? 'bg-sage text-white'
                            : 'text-text-muted dark:text-gray-400'
                        }`}
                      >
                        {item.name}
                      </div>
                    ))}
                  </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-4 md:p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-charcoal dark:text-white">Dashboard</h2>
                      <p className="text-xs text-text-muted dark:text-gray-400">Welcome back, Sarah</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center">
                        <span className="text-sage font-semibold text-xs">SJ</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: "Today's Revenue", value: '$1,284', change: '+12%', color: 'bg-sage' },
                      { label: 'Appointments', value: '18', change: '+3', color: 'bg-lavender' },
                      { label: 'New Clients', value: '5', change: '+2', color: 'bg-peach' },
                      { label: 'Avg. Time', value: '47m', change: '-5m', color: 'bg-mint' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white dark:bg-zinc-700 rounded-xl p-4 border border-charcoal/5 dark:border-white/5 shadow-soft">
                        <div className="flex items-start justify-between mb-2">
                          <div className={`w-8 h-8 ${stat.color} rounded-lg`} />
                          <span className="text-xs font-medium text-success">{stat.change}</span>
                        </div>
                        <p className="text-xl font-bold text-charcoal dark:text-white">{stat.value}</p>
                        <p className="text-xs text-text-muted dark:text-gray-400">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Schedule Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-white dark:bg-zinc-700 rounded-xl border border-charcoal/5 dark:border-white/5 shadow-soft overflow-hidden">
                      <div className="px-4 py-3 border-b border-charcoal/5 dark:border-white/5 flex items-center justify-between">
                        <span className="text-sm font-semibold text-charcoal dark:text-white">Today&apos;s Schedule</span>
                        <span className="text-xs text-sage font-medium">View All</span>
                      </div>
                      <div className="divide-y divide-charcoal/5 dark:divide-white/5">
                        {[
                          { time: '09:00 AM', client: 'Sarah Johnson', service: 'Haircut & Style', status: 'confirmed' },
                          { time: '10:30 AM', client: 'Michael Chen', service: 'Beard Trim', status: 'in-progress' },
                          { time: '11:00 AM', client: 'Emily Davis', service: 'Full Color', status: 'confirmed' },
                          { time: '02:00 PM', client: 'David Brown', service: 'Swedish Massage', status: 'confirmed' },
                        ].map((apt, i) => (
                          <div key={i} className="px-4 py-3 flex items-center gap-3">
                            <div className="text-xs text-text-muted dark:text-gray-400 w-16">{apt.time}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-charcoal dark:text-white truncate">{apt.client}</p>
                              <p className="text-xs text-text-muted dark:text-gray-400 truncate">{apt.service}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              apt.status === 'in-progress'
                                ? 'bg-lavender/20 text-lavender-dark dark:bg-lavender/30'
                                : 'bg-sage/20 text-sage-dark dark:bg-sage/30'
                            }`}>
                              {apt.status === 'in-progress' ? 'In Progress' : 'Confirmed'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-zinc-700 rounded-xl border border-charcoal/5 dark:border-white/5 shadow-soft overflow-hidden">
                      <div className="px-4 py-3 border-b border-charcoal/5 dark:border-white/5">
                        <span className="text-sm font-semibold text-charcoal dark:text-white">Recent Activity</span>
                      </div>
                      <div className="p-4 space-y-3">
                        {[
                          { action: 'New booking', detail: 'Sarah Johnson' },
                          { action: 'Payment', detail: '$85 received' },
                          { action: 'New client', detail: 'Robert Wilson' },
                          { action: '5-star review', detail: 'Emily Davis' },
                        ].map((activity, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-sage mt-1.5" />
                            <div>
                              <p className="text-xs font-medium text-charcoal dark:text-white">{activity.action}</p>
                              <p className="text-xs text-text-muted dark:text-gray-400">{activity.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FEATURES SECTION
// ============================================

const features = [
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Drag-and-drop calendar with day, week, and month views. Real-time availability updates across all devices.',
    color: 'peach',
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Complete client profiles with service history, preferences, notes, and communication tracking.',
    color: 'lavender',
  },
  {
    icon: Globe,
    title: 'Online Booking',
    description: 'Beautiful public booking page and embeddable widget. Let clients book 24/7 from anywhere.',
    color: 'mint',
  },
  {
    icon: CreditCard,
    title: 'Payment Processing',
    description: 'Accept cards, Apple Pay, Google Pay. Integrated tipping, invoicing, and refunds.',
    color: 'rose',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Revenue dashboards, staff performance, client retention. Export to PDF or CSV.',
    color: 'peach',
  },
  {
    icon: Sparkles,
    title: 'AI Assistant',
    description: 'Smart scheduling suggestions, demand forecasting, and conversational booking chatbot.',
    color: 'lavender',
  },
];

const colorClasses = {
  peach: 'bg-soft-peach/20 text-soft-peach',
  lavender: 'bg-soft-lavender/20 text-soft-lavender',
  mint: 'bg-soft-mint/20 text-soft-mint',
  rose: 'bg-soft-rose/20 text-soft-rose',
};

const bgColorClasses = {
  peach: 'from-soft-peach/10 to-soft-peach/5',
  lavender: 'from-soft-lavender/10 to-soft-lavender/5',
  mint: 'from-soft-mint/10 to-soft-mint/5',
  rose: 'from-soft-rose/10 to-soft-rose/5',
};

function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage/10 dark:bg-sage/20 border border-sage/20 dark:border-sage/30 mb-6">
            <Layers className="w-4 h-4 text-sage" />
            <span className="text-sm font-medium text-charcoal dark:text-white">Powerful Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-display-sm font-display font-bold text-charcoal dark:text-white mb-4">
            Everything you need to run your salon
          </h2>
          <p className="text-lg text-text-secondary dark:text-gray-400">
            From scheduling to payments, we have got you covered. Choose only the features you need.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group p-6 lg:p-8 rounded-2xl bg-gradient-to-br ${
                bgColorClasses[feature.color as keyof typeof bgColorClasses]
              } bg-white dark:bg-zinc-800 border border-white/60 dark:border-white/10 shadow-card hover:shadow-card-lg hover:-translate-y-1 transition-all duration-300`}
            >
              <div
                className={`inline-flex p-3 rounded-xl ${
                  colorClasses[feature.color as keyof typeof colorClasses]
                } mb-5`}
              >
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-charcoal dark:text-white mb-3">{feature.title}</h3>
              <p className="text-text-secondary dark:text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Additional Features List */}
        <div className="mt-16 lg:mt-20 p-8 lg:p-12 rounded-2xl bg-white dark:bg-zinc-800 border border-charcoal/5 dark:border-white/10 shadow-card">
          <h3 className="text-xl font-semibold text-charcoal dark:text-white mb-6 text-center">
            Plus all these add-on features when you need them
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: MessageSquare, label: 'SMS & Email Reminders' },
              { icon: Gift, label: 'Gift Cards' },
              { icon: Users, label: 'Staff Commissions' },
              { icon: MapPin, label: 'Multi-Location' },
              { icon: Star, label: 'Reviews & Ratings' },
              { icon: Layers, label: 'Packages & Memberships' },
              { icon: Clock, label: 'Consultation Forms' },
              { icon: Globe, label: 'Marketplace Listing' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-sage/5 dark:hover:bg-sage/10 transition-colors">
                <item.icon className="w-5 h-5 text-sage" />
                <span className="text-sm font-medium text-charcoal dark:text-white">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// PRICING SECTION
// ============================================

const pricingPlans = [
  {
    name: 'Essentials',
    price: '$50',
    period: '/month',
    description: 'Perfect for solo practitioners and small salons',
    features: [
      'Calendar & Scheduling',
      'Client Management',
      'Staff Management (up to 10)',
      'Service Management',
      'Basic Dashboard',
      'Mobile Responsive',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Add-ons',
    price: '$25',
    period: '/feature/month',
    description: 'Pay only for features you actually need',
    features: [
      'Online Booking',
      'Payment Processing',
      'SMS/Email Reminders',
      'Marketing Automation',
      'Reports & Analytics',
      'Reviews & Ratings',
      'Packages & Memberships',
      'Gift Cards',
      'Consultation Forms',
      'Multi-Location',
    ],
    cta: 'Build Your Plan',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For growing chains and franchises',
    features: [
      'Everything in Add-ons',
      'AI Assistant',
      'Marketplace Listing',
      'Staff Commissions & Payroll',
      'API Access',
      'White-label Option',
      'Dedicated Support',
      'Custom Integrations',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="py-20 lg:py-32 bg-white dark:bg-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage/10 dark:bg-sage/20 border border-sage/20 dark:border-sage/30 mb-6">
            <Zap className="w-4 h-4 text-sage" />
            <span className="text-sm font-medium text-charcoal dark:text-white">Simple Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-display-sm font-display font-bold text-charcoal dark:text-white mb-4">
            Pay only for what you need
          </h2>
          <p className="text-lg text-text-secondary dark:text-gray-400">
            No hidden fees, no forced bundles. Start with essentials, add features as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl border transition-all duration-300 hover:shadow-card-lg hover:-translate-y-1 ${
                plan.popular
                  ? 'bg-gradient-to-br from-sage/10 to-sage/5 dark:from-sage/20 dark:to-sage/10 border-sage/30 shadow-card-lg'
                  : 'bg-cream dark:bg-zinc-700 border-charcoal/10 dark:border-white/10 shadow-card'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 rounded-full bg-sage text-white text-sm font-medium">
                    Most Flexible
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-charcoal dark:text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-charcoal dark:text-white">{plan.price}</span>
                  <span className="text-text-muted dark:text-gray-400">{plan.period}</span>
                </div>
                <p className="text-sm text-text-secondary dark:text-gray-400 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-sm text-charcoal dark:text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`block w-full py-3 rounded-xl font-semibold text-center transition-all duration-300 ${
                  plan.popular
                    ? 'bg-sage text-white hover:bg-sage-dark hover:shadow-hover'
                    : 'bg-white dark:bg-gray-600 border-2 border-charcoal/10 dark:border-white/10 text-charcoal dark:text-white hover:border-sage/30 dark:hover:border-sage/50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Pricing Calculator CTA */}
        <div className="mt-12 text-center">
          <p className="text-text-muted dark:text-gray-400 mb-2">
            Not sure which features you need?
          </p>
          <Link href="/pricing" className="text-sage font-medium hover:underline inline-flex items-center gap-1">
            Use our pricing calculator
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================
// TESTIMONIALS SECTION
// ============================================

const testimonials = [
  {
    quote: 'Peacase transformed how we manage our salon. The modular pricing means we only pay for what we use.',
    author: 'Sarah Johnson',
    role: 'Owner, Bliss Hair Studio',
    avatar: 'SJ',
  },
  {
    quote: 'The AI scheduling suggestions alone saved us hours every week. Our no-show rate dropped by 30%.',
    author: 'Michael Chen',
    role: 'Manager, Zen Spa & Wellness',
    avatar: 'MC',
  },
  {
    quote: 'Finally, software that understands salons. Clean design, easy to use, and my staff actually enjoys using it.',
    author: 'Emily Rodriguez',
    role: 'Owner, The Beauty Bar',
    avatar: 'ER',
  },
];

function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage/10 dark:bg-sage/20 border border-sage/20 dark:border-sage/30 mb-6">
            <Star className="w-4 h-4 text-sage" />
            <span className="text-sm font-medium text-charcoal dark:text-white">Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-display-sm font-display font-bold text-charcoal dark:text-white mb-4">
            Loved by salon owners everywhere
          </h2>
          <p className="text-lg text-text-secondary dark:text-gray-400">
            Join thousands of salons who switched to Peacase
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 lg:p-8 rounded-2xl bg-white dark:bg-zinc-800 border border-charcoal/5 dark:border-white/10 shadow-card hover:shadow-card-lg transition-all duration-300"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-charcoal/80 dark:text-gray-300 mb-6 leading-relaxed">{testimonial.quote}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sage/20 dark:bg-sage/30 flex items-center justify-center text-sage font-semibold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-charcoal dark:text-white text-sm">{testimonial.author}</p>
                  <p className="text-text-muted dark:text-gray-400 text-xs">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// CTA SECTION
// ============================================

function CTASection() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-sage to-sage-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-display-sm font-display font-bold text-white mb-6">
          Ready to transform your salon?
        </h2>
        <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
          Join thousands of salons using Peacase. Start your 14-day free trial today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-sage font-semibold text-lg hover:shadow-hover-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/demo"
            className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold text-lg hover:bg-white/10 transition-all duration-300"
          >
            Book a Demo
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Secure & encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Setup in 15 minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>24/7 support</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FOOTER
// ============================================

function Footer() {
  return (
    <footer className="py-12 lg:py-16 bg-sidebar dark:bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-sage flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold">Peacase</span>
            </Link>
            <p className="text-white/60 text-sm">
              Premium spa and salon management software for modern businesses.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/demo" className="hover:text-white transition-colors">Book Demo</Link></li>
              <li><Link href="/updates" className="hover:text-white transition-colors">Updates</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              <li><button type="button" onClick={() => { if (typeof window !== 'undefined') { window.dispatchEvent(new CustomEvent('open-cookie-preferences')); } }} className="hover:text-white transition-colors">Cookie Preferences</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            2026 Peacase. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://twitter.com/peacase" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
              Twitter
            </a>
            <a href="https://linkedin.com/company/peacase" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
              LinkedIn
            </a>
            <a href="https://instagram.com/peacase" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
