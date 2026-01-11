'use client'

import { useEffect, useState, useCallback } from 'react'
import { useClientStore } from '@/stores/client.store'
import ClientSearchBar from '@/components/clients/ClientSearchBar'
import ClientSearchResults from '@/components/clients/ClientSearchResults'
import ClientProfilePanel from '@/components/clients/ClientProfilePanel'
import CreateClientModal from '@/components/clients/CreateClientModal'

export default function ClientsPage() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const {
    searchClients,
    getClientProfile,
    clearProfile,
    searchResults,
    isSearching,
    currentClient,
    isLoadingProfile,
  } = useClientStore()

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length > 0 || debouncedQuery === '') {
      searchClients(debouncedQuery)
    }
  }, [debouncedQuery, searchClients])

  const handleClientSelect = useCallback(
    (clientId: string) => {
      setSelectedClientId(clientId)
      getClientProfile(clientId)
    },
    [getClientProfile]
  )

  const handleCloseProfile = useCallback(() => {
    setSelectedClientId(null)
    clearProfile()
  }, [clearProfile])

  const handleCreateClientSuccess = useCallback(() => {
    setIsCreateModalOpen(false)
    // Refresh search results
    searchClients(debouncedQuery)
  }, [debouncedQuery, searchClients])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and view your salon clients
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
            >
              + Add Client
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search and Results */}
          <div className="lg:col-span-2">
            <ClientSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              isLoading={isSearching}
            />

            <ClientSearchResults
              results={searchResults}
              isLoading={isSearching}
              onSelectClient={handleClientSelect}
              selectedClientId={selectedClientId}
            />
          </div>

          {/* Client Profile Panel */}
          {selectedClientId && (
            <div className="lg:col-span-1">
              <ClientProfilePanel
                clientId={selectedClientId}
                isLoading={isLoadingProfile}
                client={currentClient}
                onClose={handleCloseProfile}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create Client Modal */}
      {isCreateModalOpen && (
        <CreateClientModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateClientSuccess}
        />
      )}
    </div>
  )
}
