'use client'

import { useState, useEffect } from 'react'
import { useClientStore } from '@/stores/client.store'

interface ClientProfilePanelProps {
  clientId: string
  isLoading: boolean
  client: any | null
  onClose: () => void
}

export default function ClientProfilePanel({
  clientId,
  isLoading,
  client,
  onClose,
}: ClientProfilePanelProps) {
  const [showAddNoteForm, setShowAddNoteForm] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)

  const { getClientHistory, addClientNote, clientHistory, isLoadingHistory } =
    useClientStore()

  useEffect(() => {
    if (clientId) {
      getClientHistory(clientId)
    }
  }, [clientId, getClientHistory])

  const handleAddNote = async () => {
    if (!noteContent.trim()) return

    try {
      setIsSubmittingNote(true)
      await addClientNote(clientId, noteContent)
      setNoteContent('')
      setShowAddNoteForm(false)
    } catch (error) {
      console.error('Failed to add note:', error)
    } finally {
      setIsSubmittingNote(false)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-lg border-l border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!client) {
    return null
  }

  const getAge = (birthday: string | undefined) => {
    if (!birthday) return null
    const today = new Date()
    const birthDate = new Date(birthday)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }
    return age
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-lg border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {client.firstName} {client.lastName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Client Profile</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Contact Information */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Contact Info</h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{client.phone}</p>
            </div>
            {client.email && (
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{client.email}</p>
              </div>
            )}
            {client.address && (
              <div>
                <p className="text-gray-500">Address</p>
                <p className="font-medium text-gray-900">{client.address}</p>
              </div>
            )}
            {client.birthday && (
              <div>
                <p className="text-gray-500">Birthday</p>
                <p className="font-medium text-gray-900">
                  {new Date(client.birthday).toLocaleDateString()}
                  {getAge(client.birthday) && ` (${getAge(client.birthday)} years)`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Preferences */}
        {(client.preferredStaff || client.preferredService) && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Preferences</h3>
            <div className="space-y-2 text-sm">
              {client.preferredStaff && (
                <div>
                  <p className="text-gray-500">Preferred Staff</p>
                  <p className="font-medium text-gray-900">
                    {client.preferredStaff.firstName}{' '}
                    {client.preferredStaff.lastName}
                  </p>
                </div>
              )}
              {client.preferredService && (
                <div>
                  <p className="text-gray-500">Preferred Service</p>
                  <p className="font-medium text-gray-900">
                    {client.preferredService.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointment History */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Appointments</h3>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : clientHistory?.appointments && clientHistory.appointments.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {clientHistory.appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200"
                >
                  <p className="font-medium text-gray-900">
                    {apt.service.name}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(apt.startTime).toLocaleDateString()} at{' '}
                    {new Date(apt.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {apt.staff.firstName} {apt.staff.lastName}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Status: <span className="capitalize font-medium">{apt.status}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No appointments yet</p>
          )}
        </div>

        {/* Notes Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Notes</h3>
            {!showAddNoteForm && (
              <button
                onClick={() => setShowAddNoteForm(true)}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                + Add Note
              </button>
            )}
          </div>

          {/* Add Note Form */}
          {showAddNoteForm && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add a note about this client..."
                className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleAddNote}
                  disabled={isSubmittingNote || !noteContent.trim()}
                  className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90 disabled:bg-gray-300"
                >
                  {isSubmittingNote ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setShowAddNoteForm(false)
                    setNoteContent('')
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Notes List */}
          {clientHistory?.notes && clientHistory.notes.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {clientHistory.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200"
                >
                  <p className="text-gray-900">{note.content}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    By {note.staff.firstName} {note.staff.lastName} on{' '}
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No notes yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
