/**
 * User Store Tests
 * Tests for Zustand user authentication store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUserStore } from '../slices/userSlice'

// Mock fetch globally
global.fetch = vi.fn()

describe('useUserStore', () => {
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
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useUserStore())
      
      expect(result.current.currentUser).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Login', () => {
    it('should login successfully', async () => {
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

      const { result } = renderHook(() => useUserStore())

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password'
        })
      })

      expect(result.current.currentUser).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle login failure', async () => {
      // Mock failed API response
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Login failed' })
      })

      const { result } = renderHook(() => useUserStore())

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong-password'
          })
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.currentUser).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Login failed')
    })

    it('should set loading state during login', async () => {
      let resolvePromise: (value: any) => void
      const loginPromise = new Promise(resolve => {
        resolvePromise = resolve
      })

      // Mock delayed API response
      ;(global.fetch as any).mockReturnValueOnce(loginPromise)

      const { result } = renderHook(() => useUserStore())

      // Start login
      act(() => {
        result.current.login({
          email: 'test@example.com',
          password: 'password'
        })
      })

      // Should be loading
      expect(result.current.isLoading).toBe(true)

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ user: { id: '1', email: 'test@example.com', name: 'Test', role: 'user' } })
        })
      })

      // Should not be loading anymore
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Register', () => {
    it('should register successfully', async () => {
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

      const { result } = renderHook(() => useUserStore())

      await act(async () => {
        await result.current.register({
          email: 'new@example.com',
          password: 'password',
          name: 'New User'
        })
      })

      expect(result.current.currentUser).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle registration failure', async () => {
      // Mock failed API response
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Registration failed' })
      })

      const { result } = renderHook(() => useUserStore())

      await act(async () => {
        try {
          await result.current.register({
            email: 'existing@example.com',
            password: 'password',
            name: 'Test User'
          })
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.currentUser).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Registration failed')
    })
  })

  describe('Logout', () => {
    it('should logout successfully', async () => {
      // Set initial authenticated state
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const
      }

      useUserStore.setState({
        currentUser: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })

      // Mock logout API call
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true
      })

      const { result } = renderHook(() => useUserStore())

      act(() => {
        result.current.logout()
      })

      expect(result.current.currentUser).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Update Profile', () => {
    it('should update profile successfully', async () => {
      const initialUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const
      }

      const updatedUser = {
        ...initialUser,
        name: 'Updated User'
      }

      // Set initial authenticated state
      useUserStore.setState({
        currentUser: initialUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })

      // Mock successful API response
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: updatedUser })
      })

      const { result } = renderHook(() => useUserStore())

      await act(async () => {
        await result.current.updateProfile({ name: 'Updated User' })
      })

      expect(result.current.currentUser?.name).toBe('Updated User')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should not update profile when not authenticated', async () => {
      const { result } = renderHook(() => useUserStore())

      await act(async () => {
        try {
          await result.current.updateProfile({ name: 'Updated User' })
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('No user logged in')
        }
      })

      expect(result.current.currentUser).toBeNull()
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should clear error', () => {
      // Set initial error state
      useUserStore.setState({
        currentUser: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Some error'
      })

      const { result } = renderHook(() => useUserStore())

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('should set loading state', () => {
      const { result } = renderHook(() => useUserStore())

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)
    })
  })
})