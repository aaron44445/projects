'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4" style={{ backgroundColor: '#F5F3F0' }}>
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-6" style={{ color: '#2C2C2C' }}>
          Professional Salon Management Made Simple
        </h1>

        <p className="text-xl mb-8" style={{ color: '#666' }}>
          Manage appointments, clients, staff, and payments all in one beautiful platform.
          Start your free trial today—no credit card required.
        </p>

        <div className="flex gap-4 justify-center mb-12 flex-wrap">
          <Link
            href="/register"
            className="px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition-all hover:scale-105"
            style={{ backgroundColor: '#C7DCC8', color: '#fff' }}
          >
            Start Free Trial <ArrowRight size={20} />
          </Link>

          <Link
            href="/demo"
            className="px-8 py-4 rounded-lg font-semibold border-2"
            style={{ borderColor: '#C7DCC8', color: '#C7DCC8' }}
          >
            Watch Demo
          </Link>
        </div>

        <div className="text-sm" style={{ color: '#999' }}>
          14-day free trial • No credit card needed • Full feature access
        </div>
      </div>
    </div>
  )
}
