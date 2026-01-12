'use client'

import { SignupForm } from '@/components/SignupForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4" style={{ backgroundColor: '#F5F3F0' }}>
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#2C2C2C' }}>
          Welcome to Pecase
        </h1>
        <p style={{ color: '#666' }}>
          Start your 14-day free trial—no credit card required
        </p>
      </div>
      <SignupForm />
    </div>
  )
}
