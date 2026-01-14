'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Calendar,
  Clock,
  Check,
  ArrowRight,
  Building2,
  Mail,
  Phone,
  User,
  MessageSquare,
  Video,
  Shield,
  Zap,
  Users,
} from 'lucide-react';

const timeSlots = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
];

const demoFeatures = [
  'Personalized walkthrough of all features',
  'Q&A with our product specialists',
  'Custom pricing based on your needs',
  'Migration assistance discussion',
];

export default function DemoPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    businessSize: '',
    message: '',
    preferredDate: '',
    preferredTime: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send to an API
    setIsSubmitted(true);
  };

  // Generate next 14 days for date selection
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date);
      }
    }
    return dates;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-charcoal mb-4">
            Demo Scheduled!
          </h1>
          <p className="text-charcoal/60 mb-8">
            We&apos;ve received your request. Our team will send you a calendar invite
            with video call details within 24 hours.
          </p>
          <div className="bg-white rounded-2xl p-6 border border-charcoal/10 shadow-card mb-8">
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-sage" />
                <span className="text-charcoal">{formData.preferredDate}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-sage" />
                <span className="text-charcoal">{formData.preferredTime}</span>
              </div>
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-sage" />
                <span className="text-charcoal">30-minute video call</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all"
            >
              Back to Home
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 border border-charcoal/20 text-charcoal rounded-xl font-semibold hover:border-sage transition-all"
            >
              Start Free Trial Instead
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="bg-cream/80 backdrop-blur-md border-b border-charcoal/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sage flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-charcoal">Peacase</span>
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-lg bg-sage text-white text-sm font-semibold hover:bg-sage-dark transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left Column - Info */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage/10 border border-sage/20 mb-6">
              <Video className="w-4 h-4 text-sage" />
              <span className="text-sm font-medium text-charcoal">30-minute demo</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-display font-bold text-charcoal mb-6">
              See Peacase in action
            </h1>

            <p className="text-lg text-charcoal/60 mb-8">
              Get a personalized demo of Peacase and see how it can transform your
              salon or spa business. Our product specialists will walk you through
              the features that matter most to you.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-12">
              {demoFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-sage/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-sage" />
                  </div>
                  <span className="text-charcoal">{feature}</span>
                </div>
              ))}
            </div>

            {/* Trust Indicators */}
            <div className="bg-white rounded-2xl p-6 border border-charcoal/10 shadow-soft">
              <p className="text-sm text-charcoal/60 mb-4">Trusted by 2,000+ salons</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-sage" />
                  <span className="text-sm text-charcoal">No commitment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-sage" />
                  <span className="text-sm text-charcoal">Free trial available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-white rounded-2xl p-8 border border-charcoal/10 shadow-card-lg">
            <h2 className="text-xl font-semibold text-charcoal mb-6">
              Schedule your demo
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                      placeholder="Jane"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    placeholder="Smith"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    placeholder="jane@yoursalon.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Business Name & Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Business Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                    <input
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                      placeholder="Your Salon"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Team Size
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                    <select
                      required
                      value={formData.businessSize}
                      onChange={(e) => setFormData({ ...formData, businessSize: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all appearance-none bg-white"
                    >
                      <option value="">Select</option>
                      <option value="1">Just me</option>
                      <option value="2-5">2-5 people</option>
                      <option value="6-10">6-10 people</option>
                      <option value="11-25">11-25 people</option>
                      <option value="25+">25+ people</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preferred Date */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Preferred Date
                </label>
                <div className="flex flex-wrap gap-2">
                  {getAvailableDates().slice(0, 5).map((date) => {
                    const dateStr = formatDate(date);
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setFormData({ ...formData, preferredDate: dateStr })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          formData.preferredDate === dateStr
                            ? 'bg-sage text-white'
                            : 'bg-charcoal/5 text-charcoal hover:bg-charcoal/10'
                        }`}
                      >
                        {dateStr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Time */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Preferred Time (EST)
                </label>
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setFormData({ ...formData, preferredTime: time })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.preferredTime === time
                          ? 'bg-sage text-white'
                          : 'bg-charcoal/5 text-charcoal hover:bg-charcoal/10'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Anything specific you&apos;d like to see? (Optional)
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-charcoal/40" />
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none"
                    placeholder="E.g., I'm interested in the online booking feature..."
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark hover:shadow-hover transition-all flex items-center justify-center gap-2"
              >
                Schedule Demo
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-xs text-charcoal/50 text-center">
                By scheduling a demo, you agree to our{' '}
                <Link href="/privacy" className="text-sage hover:underline">Privacy Policy</Link>.
                We&apos;ll send you a calendar invite within 24 hours.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
