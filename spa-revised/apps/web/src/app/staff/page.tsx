'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Trash2 } from 'lucide-react'

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStaff() {
      try {
        const response = await fetch('http://localhost:3001/api/v1/staff')
        if (!response.ok) throw new Error('Failed to fetch staff')
        const data = await response.json()
        setStaff(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load staff')
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2C2C2C' }}>
            Staff Management
          </h1>
          <p style={{ color: '#666' }}>
            Manage your team members and their availability
          </p>
        </div>
        <button
          className="px-6 py-3 rounded-lg font-bold text-white flex items-center gap-2"
          style={{ backgroundColor: '#C7DCC8' }}
        >
          <Plus size={20} /> Add Staff Member
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5' }}>
          <p style={{ color: '#dc2626' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#666' }}>Loading staff...</div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12">
          <Users size={48} style={{ color: '#999', margin: '0 auto 16px' }} />
          <p style={{ color: '#666' }}>No staff members added yet</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F5F3F0', borderBottom: '1px solid #E8E6E4' }}>
                <th className="p-4 text-left" style={{ color: '#2C2C2C' }}>Name</th>
                <th className="p-4 text-left" style={{ color: '#2C2C2C' }}>Email</th>
                <th className="p-4 text-left" style={{ color: '#2C2C2C' }}>Role</th>
                <th className="p-4 text-left" style={{ color: '#2C2C2C' }}>Status</th>
                <th className="p-4 text-center" style={{ color: '#2C2C2C' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person, i) => (
                <tr key={person.id} style={{ borderBottom: i < staff.length - 1 ? '1px solid #E8E6E4' : 'none' }}>
                  <td className="p-4" style={{ color: '#2C2C2C' }}>
                    <strong>{person.first_name} {person.last_name}</strong>
                  </td>
                  <td className="p-4" style={{ color: '#666' }}>{person.email}</td>
                  <td className="p-4" style={{ color: '#666' }}>
                    <span className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: '#F5F3F0', color: '#2C2C2C' }}>
                      {person.role}
                    </span>
                  </td>
                  <td className="p-4" style={{ color: '#666' }}>
                    <span className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: person.is_active ? '#d1fae5' : '#fee2e2', color: person.is_active ? '#065f46' : '#991b1b' }}>
                      {person.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex gap-3 justify-center">
                      <button style={{ color: '#C7DCC8' }}>
                        <Edit2 size={18} />
                      </button>
                      <button style={{ color: '#dc2626' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
