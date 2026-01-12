'use client'

import Link from 'next/link'

export function CTASection() {
  return (
    <div className="py-24 px-4" style={{ backgroundColor: '#C7DCC8' }}>
      <div className="max-w-4xl mx-auto text-center text-white">
        <h2 className="text-4xl font-bold mb-6">
          Ready to Transform Your Salon Business?
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Join hundreds of salons using Pecase to streamline their operations and delight their clients.
        </p>
        <Link
          href="/register"
          className="inline-block px-8 py-4 rounded-lg font-bold bg-white transition-all hover:scale-105"
          style={{ color: '#C7DCC8' }}
        >
          Start Your Free Trial
        </Link>
        <div className="mt-16 pt-16 border-t border-white border-opacity-20">
          <p className="opacity-75 text-sm">
            © 2026 Pecase. All rights reserved. | Privacy Policy | Terms of Service | Contact Us
          </p>
        </div>
      </div>
    </div>
  )
}
