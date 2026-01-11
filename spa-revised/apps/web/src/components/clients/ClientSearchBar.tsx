'use client'

import { ChangeEvent } from 'react'

interface ClientSearchBarProps {
  value: string
  onChange: (value: string) => void
  isLoading?: boolean
}

export default function ClientSearchBar({
  value,
  onChange,
  isLoading = false,
}: ClientSearchBarProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={value}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        )}
        {!isLoading && value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      {value && (
        <p className="mt-2 text-sm text-gray-500">
          Type to search clients by name, phone, or email
        </p>
      )}
    </div>
  )
}
