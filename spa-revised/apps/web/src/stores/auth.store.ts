import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  role: string
  salon_id: string
}

interface Salon {
  id: string
  name: string
  email: string
  phone: string
  slug: string
}

interface AuthStore {
  user: User | null
  salon: Salon | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (salonName: string, email: string, phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<void>
  isAuthenticated: () => boolean
  clearError: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      salon: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email: string, _password: string) => {
        set({ isLoading: true, error: null })

        try {
          // Demo mode: accept any credentials
          await new Promise(resolve => setTimeout(resolve, 300))

          const demoUser: User = {
            id: 'user-demo-' + Date.now(),
            email: email || 'demo@salon.com',
            role: 'admin',
            salon_id: 'salon-demo-' + Date.now()
          }

          const demoSalon: Salon = {
            id: demoUser.salon_id,
            name: (email?.split('@')[0] || 'Demo') + "'s Salon",
            email: email || 'salon@example.com',
            phone: '555-0000',
            slug: (email?.split('@')[0] || 'demo') + '-salon'
          }

          set({
            user: demoUser,
            salon: demoSalon,
            accessToken: 'mock-token-' + Date.now(),
            refreshToken: 'mock-refresh-' + Date.now(),
            isLoading: false,
            error: null
          })
        } catch (err: any) {
          set({
            error: err.message || 'Login failed',
            isLoading: false
          })
          throw err
        }
      },

      register: async (salonName: string, email: string, phone: string, _password: string) => {
        set({ isLoading: true, error: null })

        try {
          // Demo mode: accept any registration
          await new Promise(resolve => setTimeout(resolve, 300))

          const demoUser: User = {
            id: 'user-demo-' + Date.now(),
            email: email,
            role: 'admin',
            salon_id: 'salon-demo-' + Date.now()
          }

          const demoSalon: Salon = {
            id: demoUser.salon_id,
            name: salonName,
            email: email,
            phone: phone,
            slug: salonName.toLowerCase().replace(/\s+/g, '-')
          }

          set({
            user: demoUser,
            salon: demoSalon,
            accessToken: 'mock-token-' + Date.now(),
            refreshToken: 'mock-refresh-' + Date.now(),
            isLoading: false,
            error: null
          })
        } catch (err: any) {
          set({
            error: err.message || 'Registration failed',
            isLoading: false
          })
          throw err
        }
      },

      logout: async () => {
        set({
          user: null,
          salon: null,
          accessToken: null,
          refreshToken: null,
          error: null,
          isLoading: false
        })
      },

      refreshAccessToken: async () => {
        const state = get()
        if (!state.refreshToken) {
          set({
            user: null,
            salon: null,
            accessToken: null,
            refreshToken: null,
            error: null
          })
          return
        }

        try {
          set({ isLoading: true })
          // Demo mode: just generate new tokens
          await new Promise(resolve => setTimeout(resolve, 200))
          set({
            accessToken: 'mock-token-' + Date.now(),
            isLoading: false
          })
        } catch (err: any) {
          set({
            user: null,
            salon: null,
            accessToken: null,
            refreshToken: null,
            error: err.message || 'Token refresh failed',
            isLoading: false
          })
          throw err
        }
      },

      isAuthenticated: () => {
        const state = get()
        return !!state.user && !!state.accessToken
      },

      clearError: () => {
        set({ error: null })
      }
    }),
    { 
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        salon: state.salon,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken
      })
    }
  )
)
