'use client'

interface ClientSearchResultsProps {
  results: any[]
  isLoading: boolean
  onSelectClient: (clientId: string) => void
  selectedClientId: string | null
}

export default function ClientSearchResults({
  results,
  isLoading,
  onSelectClient,
  selectedClientId,
}: ClientSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">No clients found. Create one to get started.</p>
      </div>
    )
  }

  const getLastAppointmentDate = (client: any) => {
    if (client.appointments && client.appointments.length > 0) {
      const date = new Date(client.appointments[0].startTime)
      return date.toLocaleDateString()
    }
    return 'No appointments'
  }

  return (
    <div className="space-y-2">
      {results.map((client) => (
        <button
          key={client.id}
          onClick={() => onSelectClient(client.id)}
          className={`w-full p-4 border rounded-lg text-left transition-colors ${
            selectedClientId === client.id
              ? 'bg-primary/10 border-primary'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                {client.firstName} {client.lastName}
              </h3>
              <p className="text-sm text-gray-500">{client.phone}</p>
              {client.email && (
                <p className="text-sm text-gray-500">{client.email}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Last appointment
              </p>
              <p className="text-sm font-medium text-gray-700">
                {getLastAppointmentDate(client)}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
