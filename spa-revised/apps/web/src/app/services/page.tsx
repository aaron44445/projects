/**
 * Services Management Page
 * Displays and manages salon services
 */

'use client'

import { useState, useEffect } from 'react'
import { useServices } from '../../lib/hooks/useServices'
import { ServiceForm } from '../../components/ServiceForm'

interface ServiceModalState {
  isOpen: boolean
  mode: 'create' | 'edit'
  serviceId?: string
}

export default function ServicesPage() {
  const { services, loading, error, fetchServices, createService, updateService, deleteService, clearError } =
    useServices()
  const [modal, setModal] = useState<ServiceModalState>({ isOpen: false, mode: 'create' })
  const [submitting, setSubmitting] = useState(false)

  // Fetch services on mount
  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const handleCreateClick = () => {
    setModal({ isOpen: true, mode: 'create' })
  }

  const handleEditClick = (serviceId: string) => {
    setModal({ isOpen: true, mode: 'edit', serviceId })
  }

  const handleCloseModal = () => {
    setModal({ isOpen: false, mode: 'create' })
    clearError()
  }

  const handleFormSubmit = async (data: any) => {
    setSubmitting(true)
    try {
      if (modal.mode === 'create') {
        await createService(data)
      } else if (modal.serviceId) {
        await updateService(modal.serviceId, data)
      }
      handleCloseModal()
    } catch (err) {
      console.error('Error submitting form:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return
    }

    try {
      await deleteService(serviceId)
    } catch (err) {
      console.error('Error deleting service:', err)
    }
  }

  const selectedService = modal.serviceId
    ? services.find((s) => s.id === modal.serviceId)
    : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-600 mt-1">Manage your salon&apos;s service offerings</p>
          </div>
          <button
            onClick={handleCreateClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Service
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
            <button
              onClick={clearError}
              className="ml-2 text-red-600 hover:text-red-800 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && !services.length ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No services yet</p>
            <button
              onClick={handleCreateClick}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create your first service
            </button>
          </div>
        ) : (
          /* Services Table */
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Color</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-gray-600 text-xs mt-1">{service.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {service.durationMinutes} min
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${service.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {service.category || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: service.color }}
                          title={service.color}
                        />
                        <span className="text-xs text-gray-500">{service.color}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(service.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(service.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
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

      {/* Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {modal.mode === 'create' ? 'Create Service' : 'Edit Service'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            <ServiceForm
              initialService={selectedService}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
              isLoading={submitting}
            />
          </div>
        </div>
      )}
    </div>
  )
}
