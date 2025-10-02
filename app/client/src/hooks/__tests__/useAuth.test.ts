/**
 * useAuth Hook Tests
 * Tests for authentication utility hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { useUserStore } from '../../store/slices/userSlice'

// Mock fetch globally
global.fetch = vi.fn()

describe('useAuth', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUserStore.setState({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    })
    
    // Reset fetch mock
    vi.resetAllMocks()
  })

  describe('Initial State', () => {
    it('should return correct initial state', () => {
      const { result } = renderHook(() => useAuth())
      
      expect(result.current.currentUser).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.isAdmin).toBe(false)
    })
  })

  describe('Admin Detection', () => {
    it('should detect admin user', () => {
      // Set admin user in store
      useUserStore.setState({
        currentUser: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        },
        isAuthenticated: true,
        isLoading: false,
        error: null
      })

      const { result } = renderHook(() => useAuth())
      
      expect(result.current.isAdmin).toBe(true)
    })

    it('should detect regular user', () => {
      // Set regular user in store
      useUserStore.setState({
        currentUser: {
          id: '1',
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user'
        },
        isAuthenticated: true,
        isLoading: false,
        error: null
      })

      const { result } = renderHook(() => useAuth())
      
      expect(result.current.isAdmin).toBe(false)
    })

    it('should return false for isAdmin when no user', () => {
      const { result } = renderHook(() => useAuth())
      
      expect(result.current.isAdmin).toBe(false)
    })
  })

  describe('Authentication Actions', () => {
    it('should provide login function', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const
      }

      // Mock successful API response
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser })
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password'
        })
      })

      expect(result.current.currentUser).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should provide register function', async () => {
      const mockUser = {
        id: '1',
        email: 'new@example.com',
        name: 'New User',
        role: 'user' as const
      }

      // Mock successful API response
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser })
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.register({
          email: 'new@example.com',
          password: 'password',
          name: 'New User'
        })
      })

      expect(result.current.currentUser).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should provide logout function', () => {
      // Set initial authenticated state
      useUserStore.setState({
        currentUser: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        },
        isAuthenticated: true,
        isLoading: false,
        error: null
      })

      // Mock logout API call
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true
      })

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.logout()
      })

      expect(result.current.currentUser).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should provide updateProfile function', async () => {
      const initialUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const
      }

      // Set initial authenticated state
      useUserStore.setState({
        currentUser: initialUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })

      const updatedUser = {
        ...initialUser,
        name: 'Updated User'
      }

      // Mock successful API response
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: updatedUser })
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.updateProfile({ name: 'Updated User' })
      })

      expect(result.current.currentUser?.name).toBe('Updated User')
    })

    it('should provide clearError function', () => {
      // Set initial error state
      useUserStore.setState({
        currentUser: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Some error'
      })

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('State Reactivity', () => {
    it('should react to store changes', () => {
      const { result } = renderHook(() => useAuth())

      // Initially not authenticated
      expect(result.current.isAuthenticated).toBe(false)

      // Update store directly
      act(() => {
        useUserStore.setState({
          currentUser: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user'
          },
          isAuthenticated: true,
          isLoading: false,
          error: null
        })
      })

      // Hook should reflect the change
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.currentUser?.name).toBe('Test User')
    })
  })
})