'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

export function Hero() {
  return (
    <div className="relative min-h-screen bg-cream overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-soft-peach/20 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-soft-lavender/15 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-soft-mint/10 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-sage/20 shadow-card-sm">
            <Check size={16} className="text-sage" />
            <span className="text-small font-medium text-charcoal">Trusted by 500+ salons</span>
          </div>

          {/* Headline */}
          <h1 className="text-display-lg lg:text-display-lg font-display font-bold text-charcoal leading-tight">
            The modern way to <br />
            <span className="bg-gradient-to-r from-sage to-sage/70 bg-clip-text text-transparent">
              manage your salon
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-body-lg text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
            Beautiful scheduling, happy clients, seamless payments. Everything your salon needs in one intuitive platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-lg bg-sage text-white font-semibold transition-all duration-300 hover:shadow-hover hover:-translate-y-1 active:scale-95"
            >
              Start free trial
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-white border-2 border-sage/30 text-charcoal font-semibold transition-all duration-300 hover:border-sage/60 hover:shadow-card active:scale-95"
            >
              Watch demo
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="pt-4 space-y-3 text-small text-charcoal/60">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-sage" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-sage" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-sage" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-charcoal/40 font-medium">Scroll to explore</span>
            <svg className="w-5 h-5 text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
