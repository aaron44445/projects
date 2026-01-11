/**
 * Client Store
 * State management for client-related data
 */

import { create } from 'zustand'
import * as clientsAPI from '@/lib/api/clients'

export interface ClientSearchResult {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  createdAt: string
  lastAppointmentDate?: string
}

export interface ClientProfile {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  address?: string
  birthday?: string
  notes?: string
  preferredStaffId?: string
  preferredServiceId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  preferredStaff?: {
    id: string
    firstName: string
    lastName: string
  }
  preferredService?: {
    id: string
    name: string
  }
}

interface ClientState {
  // Search results
  searchResults: ClientSearchResult[]
  isSearching: boolean
  searchError: string | null

  // Current client profile
  currentClient: ClientProfile | null
  isLoadingProfile: boolean
  profileError: string | null

  // Client history
  clientHistory: {
    appointments: any[]
    notes: any[]
  } | null
  isLoadingHistory: boolean
  historyError: string | null

  // Actions
  searchClients: (query: string) => Promise<void>
  getClientProfile: (clientId: string) => Promise<void>
  getClientHistory: (clientId: string) => Promise<void>
  createClient: (data: any) => Promise<ClientProfile>
  updateClient: (clientId: string, data: any) => Promise<ClientProfile>
  addClientNote: (clientId: string, content: string) => Promise<any>
  clearSearch: () => void
  clearProfile: () => void
}

export const useClientStore = create<ClientState>((set) => ({
  // Initial state
  searchResults: [],
  isSearching: false,
  searchError: null,

  currentClient: null,
  isLoadingProfile: false,
  profileError: null,

  clientHistory: null,
  isLoadingHistory: false,
  historyError: null,

  // Actions
  searchClients: async (query: string) => {
    set({ isSearching: true, searchError: null })
    try {
      const results = await clientsAPI.searchClients(query)
      set({
        searchResults: results,
        isSearching: false,
      })
    } catch (error: any) {
      set({
        isSearching: false,
        searchError: error.response?.data?.error || error.message,
      })
      throw error
    }
  },

  getClientProfile: async (clientId: string) => {
    set({ isLoadingProfile: true, profileError: null })
    try {
      const profile = await clientsAPI.getClientProfile(clientId)
      set({
        currentClient: profile,
        isLoadingProfile: false,
      })
    } catch (error: any) {
      set({
        isLoadingProfile: false,
        profileError: error.response?.data?.error || error.message,
      })
      throw error
    }
  },

  getClientHistory: async (clientId: string) => {
    set({ isLoadingHistory: true, historyError: null })
    try {
      const history = await clientsAPI.getClientHistory(clientId)
      set({
        clientHistory: history,
        isLoadingHistory: false,
      })
    } catch (error: any) {
      set({
        isLoadingHistory: false,
        historyError: error.response?.data?.error || error.message,
      })
      throw error
    }
  },

  createClient: async (data: any) => {
    try {
      const newClient = await clientsAPI.createClient(data)
      return newClient
    } catch (error: any) {
      throw error
    }
  },

  updateClient: async (clientId: string, data: any) => {
    try {
      const updatedClient = await clientsAPI.updateClient(clientId, data)
      set({ currentClient: updatedClient })
      return updatedClient
    } catch (error: any) {
      throw error
    }
  },

  addClientNote: async (clientId: string, content: string) => {
    try {
      const note = await clientsAPI.addClientNote(clientId, content)
      // Update the notes in clientHistory if available
      set((state) => ({
        clientHistory: state.clientHistory
          ? {
              ...state.clientHistory,
              notes: [note, ...state.clientHistory.notes],
            }
          : null,
      }))
      return note
    } catch (error: any) {
      throw error
    }
  },

  clearSearch: () => {
    set({
      searchResults: [],
      isSearching: false,
      searchError: null,
    })
  },

  clearProfile: () => {
    set({
      currentClient: null,
      isLoadingProfile: false,
      profileError: null,
      clientHistory: null,
      isLoadingHistory: false,
      historyError: null,
    })
  },
}))
