'use client'

import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { PricingShowcase } from '@/components/PricingShowcase'
import { CTASection } from '@/components/CTASection'

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Hero />
      <Features />
      <PricingShowcase />
      <CTASection />
    </div>
  )
}
