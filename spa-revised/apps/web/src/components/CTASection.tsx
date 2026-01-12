'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-sage overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-30" />
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-white/15 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
        {/* Heading */}
        <div className="space-y-4">
          <h2 className="text-display-sm lg:text-display font-display font-bold text-white leading-tight">
            Ready to take your salon to the next level?
          </h2>
          <p className="text-body-lg lg:text-xl text-white/90 max-w-2xl mx-auto">
            Join hundreds of salons already using Pecase to streamline operations, delight clients, and grow their business.
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-lg bg-white text-sage font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-95 group"
          >
            Start your free trial
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="text-small text-white/80 mt-4">
            14-day free trial • No credit card • Cancel anytime
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-white/0 via-white/30 to-white/0" />

        {/* Footer */}
        <div className="space-y-2 text-small text-white/70">
          <p>© 2026 Pecase. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap text-xs">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="text-white/40">•</span>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <span className="text-white/40">•</span>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
