/**
 * User Store
 * App-specific user store using FluxStack core
 */

// Temporary direct implementation until module resolution is fixed
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface BaseUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

// Type aliases for compatibility
export type User = BaseUser

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface BaseUserStore {
  currentUser: BaseUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (credentials: { email: string; password: string }) => Promise<void>
  register: (data: { email: string; password: string; name: string }) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<BaseUser>) => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

// Create user store using Zustand directly (temporary)
export const useUserStore = create<BaseUserStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Login failed')
          }

          const { user } = await response.json()
          set({
            currentUser: user,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false
          })
          throw error
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Registration failed')
          }

          const { user } = await response.json()
          set({
            currentUser: user,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false
          })
          throw error
        }
      },

      logout: () => {
        fetch('/api/auth/logout', { method: 'POST' }).catch(console.error)
        set({
          currentUser: null,
          isAuthenticated: false,
          error: null
        })
      },

      updateProfile: async (data) => {
        const { currentUser } = get()
        if (!currentUser) {
          throw new Error('No user logged in')
        }

        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Profile update failed')
          }

          const { user } = await response.json()
          set({
            currentUser: user,
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Profile update failed',
            isLoading: false
          })
          throw error
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ isLoading: loading })
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)