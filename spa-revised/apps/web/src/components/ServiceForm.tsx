/**
 * Service Form Component
 * Form for creating and editing services
 */

'use client'

import { useForm, SubmitHandler } from 'react-hook-form'
import { useState } from 'react'
import { Service, CreateServiceInput, UpdateServiceInput } from '../lib/hooks/useServices'

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
  { value: 120, label: '120 minutes' },
] as const

const CATEGORY_OPTIONS = [
  { value: 'haircut', label: 'Haircut' },
  { value: 'color', label: 'Color Treatment' },
  { value: 'massage', label: 'Massage' },
  { value: 'facial', label: 'Facial' },
  { value: 'other', label: 'Other' },
]

const DEFAULT_COLORS = [
  '#C7DCC8', // Sage green
  '#FFB6C1', // Light pink
  '#87CEEB', // Sky blue
  '#DEB887', // Burlywood
  '#F0E68C', // Khaki
  '#DDA0DD', // Plum
  '#FF7F50', // Coral
  '#20B2AA', // Light sea green
]

interface ServiceFormProps {
  initialService?: Service
  onSubmit: (data: CreateServiceInput | UpdateServiceInput) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

type ServiceFormInput = CreateServiceInput

export function ServiceForm({
  initialService,
  onSubmit,
  onCancel,
  isLoading = false,
}: ServiceFormProps) {
  const [selectedColor, setSelectedColor] = useState(initialService?.color || DEFAULT_COLORS[0])
  const [customColor, setCustomColor] = useState(initialService?.color || '')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ServiceFormInput>({
    defaultValues: initialService
      ? {
          name: initialService.name,
          description: initialService.description,
          durationMinutes: initialService.durationMinutes as 30 | 60 | 90 | 120,
          price: initialService.price,
          category: initialService.category,
          color: initialService.color,
          bufferTimeMinutes: initialService.bufferTimeMinutes,
        }
      : {
          durationMinutes: 60,
          color: DEFAULT_COLORS[0],
          bufferTimeMinutes: 15,
        },
  })

  const onSubmitForm: SubmitHandler<ServiceFormInput> = async (data: ServiceFormInput) => {
    try {
      await onSubmit({
        ...data,
        color: selectedColor || customColor,
      })
      if (!initialService) {
        reset()
        setSelectedColor(DEFAULT_COLORS[0])
        setCustomColor('')
      }
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Form submission error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      {/* Service Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Service Name</label>
        <input
          {...register('name', {
            required: 'Service name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
          })}
          type="text"
          placeholder="e.g., Haircut, Color Treatment"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          placeholder="Describe this service"
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Duration</label>
        <select
          {...register('durationMinutes', {
            required: 'Duration is required',
            valueAsNumber: true,
          })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          <option value="">Select duration</option>
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.durationMinutes && (
          <p className="mt-1 text-sm text-red-600">{errors.durationMinutes.message}</p>
        )}
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Price ($)</label>
        <input
          {...register('price', {
            required: 'Price is required',
            min: { value: 0.01, message: 'Price must be greater than 0' },
            valueAsNumber: true,
          })}
          type="number"
          step="0.01"
          placeholder="0.00"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
        {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          {...register('category')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          <option value="">Select category (optional)</option>
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Service Color</label>
        <div className="space-y-3">
          {/* Preset Colors */}
          <div className="flex gap-2 flex-wrap">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setSelectedColor(color)
                }}
                className={`w-8 h-8 rounded border-2 transition-all ${
                  selectedColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
                disabled={isLoading}
              />
            ))}
          </div>

          {/* Custom Color Input */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customColor || selectedColor}
              onChange={(e) => {
                setCustomColor(e.target.value)
                setSelectedColor(e.target.value)
              }}
              className="h-10 w-16 cursor-pointer"
              disabled={isLoading}
            />
            <input
              {...register('color')}
              type="text"
              value={selectedColor}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
            />
          </div>
        </div>
        {errors.color && <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>}
      </div>

      {/* Buffer Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Buffer Time (minutes)</label>
        <input
          {...register('bufferTimeMinutes', {
            min: { value: 0, message: 'Buffer time cannot be negative' },
            valueAsNumber: true,
          })}
          type="number"
          placeholder="15"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
        <p className="mt-1 text-xs text-gray-500">
          Time to allocate between consecutive appointments
        </p>
        {errors.bufferTimeMinutes && (
          <p className="mt-1 text-sm text-red-600">{errors.bufferTimeMinutes.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : initialService ? 'Update Service' : 'Create Service'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
