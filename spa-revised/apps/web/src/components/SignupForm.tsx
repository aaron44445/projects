'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle } from 'lucide-react'

export function SignupForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    salonName: '',
    ownerEmail: '',
    password: '',
    confirmPassword: '',
    phone: '',
    timezone: 'America/New_York'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.salonName.trim()) newErrors.salonName = 'Salon name is required'
    if (!formData.ownerEmail.includes('@')) newErrors.ownerEmail = 'Valid email is required'
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch('http://localhost:3001/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_name: formData.salonName,
          email: formData.ownerEmail,
          password: formData.password,
          phone: formData.phone,
          timezone: formData.timezone
        })
      })

      if (!response.ok) {
        const error = await response.json()
        setErrors({ general: error.message || 'Signup failed' })
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/onboarding'), 2000)
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-white rounded-2xl max-w-md mx-auto" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <h2 className="text-2xl font-bold text-center" style={{ color: '#2C2C2C' }}>
        Create Your Salon Account
      </h2>

      {errors.general && (
        <div className="p-4 rounded-lg flex gap-2" style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', border: '1px solid' }}>
          <AlertCircle size={20} style={{ color: '#dc2626' }} />
          <span style={{ color: '#991b1b' }}>{errors.general}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg flex gap-2" style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac', border: '1px solid' }}>
          <CheckCircle size={20} style={{ color: '#16a34a' }} />
          <span style={{ color: '#15803d' }}>Account created! Redirecting...</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Salon Name
        </label>
        <input
          type="text"
          value={formData.salonName}
          onChange={(e) => setFormData({ ...formData, salonName: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: errors.salonName ? '#dc2626' : '#E8E6E4' }}
          disabled={loading}
        />
        {errors.salonName && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.salonName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Email Address
        </label>
        <input
          type="email"
          value={formData.ownerEmail}
          onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: errors.ownerEmail ? '#dc2626' : '#E8E6E4' }}
          disabled={loading}
        />
        {errors.ownerEmail && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.ownerEmail}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Phone Number
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: errors.phone ? '#dc2626' : '#E8E6E4' }}
          disabled={loading}
        />
        {errors.phone && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Timezone
        </label>
        <select
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: '#E8E6E4' }}
          disabled={loading}
        >
          <option>America/New_York</option>
          <option>America/Chicago</option>
          <option>America/Denver</option>
          <option>America/Los_Angeles</option>
          <option>Europe/London</option>
          <option>Europe/Paris</option>
          <option>Australia/Sydney</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Password
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: errors.password ? '#dc2626' : '#E8E6E4' }}
          disabled={loading}
        />
        {errors.password && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Confirm Password
        </label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: errors.confirmPassword ? '#dc2626' : '#E8E6E4' }}
          disabled={loading}
        />
        {errors.confirmPassword && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.confirmPassword}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg font-bold text-white transition-all"
        style={{ backgroundColor: loading ? '#999' : '#C7DCC8' }}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm" style={{ color: '#666' }}>
        Already have an account? <a href="/login" style={{ color: '#C7DCC8', fontWeight: 'bold' }}>Sign in</a>
      </p>
    </form>
  )
}
