/**
 * UI Store Tests
 * Tests for Zustand UI state store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUIStore } from '../slices/uiSlice'

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      theme: 'system',
      sidebarOpen: true,
      notifications: [],
      modals: [],
      loading: {
        global: false,
        operations: {}
      }
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useUIStore())
      
      expect(result.current.theme).toBe('system')
      expect(result.current.sidebarOpen).toBe(true)
      expect(result.current.notifications).toEqual([])
      expect(result.current.modals).toEqual([])
      expect(result.current.loading.global).toBe(false)
      expect(result.current.loading.operations).toEqual({})
    })
  })

  describe('Theme Management', () => {
    it('should set theme', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('dark')

      act(() => {
        result.current.setTheme('light')
      })

      expect(result.current.theme).toBe('light')
    })
  })

  describe('Sidebar Management', () => {
    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useUIStore())

      // Initially open
      expect(result.current.sidebarOpen).toBe(true)

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.sidebarOpen).toBe(false)

      act(() => {
        result.current.toggleSidebar()
      })

      expect(result.current.sidebarOpen).toBe(true)
    })

    it('should set sidebar open state', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setSidebarOpen(false)
      })

      expect(result.current.sidebarOpen).toBe(false)

      act(() => {
        result.current.setSidebarOpen(true)
      })

      expect(result.current.sidebarOpen).toBe(true)
    })
  })

  describe('Notification Management', () => {
    it('should add notification', () => {
      const { result } = renderHook(() => useUIStore())

      const notification = {
        type: 'success' as const,
        title: 'Success',
        message: 'Operation completed'
      }

      act(() => {
        result.current.addNotification(notification)
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0]).toMatchObject(notification)
      expect(result.current.notifications[0].id).toBeDefined()
      expect(result.current.notifications[0].timestamp).toBeDefined()
    })

    it('should remove notification', () => {
      const { result } = renderHook(() => useUIStore())

      // Add a notification first
      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Info',
          message: 'Information'
        })
      })

      const notificationId = result.current.notifications[0].id

      act(() => {
        result.current.removeNotification(notificationId)
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it('should clear all notifications', () => {
      const { result } = renderHook(() => useUIStore())

      // Add multiple notifications
      act(() => {
        result.current.addNotification({
          type: 'success',
          title: 'Success 1',
          message: 'Message 1'
        })
        result.current.addNotification({
          type: 'error',
          title: 'Error 1',
          message: 'Message 2'
        })
      })

      expect(result.current.notifications).toHaveLength(2)

      act(() => {
        result.current.clearNotifications()
      })

      expect(result.current.notifications).toHaveLength(0)
    })

    it('should auto-remove notification after duration', async () => {
      vi.useFakeTimers()
      
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Auto Remove',
          message: 'This will be removed',
          duration: 1000
        })
      })

      expect(result.current.notifications).toHaveLength(1)

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Wait for the timeout to execute
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.notifications).toHaveLength(0)

      vi.useRealTimers()
    })

    it('should not auto-remove notification with duration 0', async () => {
      vi.useFakeTimers()
      
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Persistent',
          message: 'This will not be removed',
          duration: 0
        })
      })

      expect(result.current.notifications).toHaveLength(1)

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      expect(result.current.notifications).toHaveLength(1)

      vi.useRealTimers()
    })
  })

  describe('Modal Management', () => {
    it('should open modal', () => {
      const { result } = renderHook(() => useUIStore())

      const modal = {
        component: 'TestModal',
        props: { title: 'Test' }
      }

      act(() => {
        result.current.openModal(modal)
      })

      expect(result.current.modals).toHaveLength(1)
      expect(result.current.modals[0]).toMatchObject(modal)
      expect(result.current.modals[0].id).toBeDefined()
    })

    it('should close modal', () => {
      const { result } = renderHook(() => useUIStore())

      // Open a modal first
      act(() => {
        result.current.openModal({
          component: 'TestModal',
          props: { title: 'Test' }
        })
      })

      const modalId = result.current.modals[0].id

      act(() => {
        result.current.closeModal(modalId)
      })

      expect(result.current.modals).toHaveLength(0)
    })

    it('should close all modals', () => {
      const { result } = renderHook(() => useUIStore())

      // Open multiple modals
      act(() => {
        result.current.openModal({
          component: 'Modal1',
          props: { title: 'Modal 1' }
        })
        result.current.openModal({
          component: 'Modal2',
          props: { title: 'Modal 2' }
        })
      })

      expect(result.current.modals).toHaveLength(2)

      act(() => {
        result.current.closeAllModals()
      })

      expect(result.current.modals).toHaveLength(0)
    })
  })

  describe('Loading Management', () => {
    it('should set global loading', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setGlobalLoading(true)
      })

      expect(result.current.loading.global).toBe(true)

      act(() => {
        result.current.setGlobalLoading(false)
      })

      expect(result.current.loading.global).toBe(false)
    })

    it('should set operation loading', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setOperationLoading('fetchUsers', true)
      })

      expect(result.current.loading.operations.fetchUsers).toBe(true)

      act(() => {
        result.current.setOperationLoading('fetchProducts', true)
      })

      expect(result.current.loading.operations.fetchUsers).toBe(true)
      expect(result.current.loading.operations.fetchProducts).toBe(true)

      act(() => {
        result.current.setOperationLoading('fetchUsers', false)
      })

      expect(result.current.loading.operations.fetchUsers).toBe(false)
      expect(result.current.loading.operations.fetchProducts).toBe(true)
    })

    it('should clear operation loading', () => {
      const { result } = renderHook(() => useUIStore())

      // Set some operation loading states
      act(() => {
        result.current.setOperationLoading('operation1', true)
        result.current.setOperationLoading('operation2', true)
      })

      expect(result.current.loading.operations.operation1).toBe(true)
      expect(result.current.loading.operations.operation2).toBe(true)

      act(() => {
        result.current.clearOperationLoading('operation1')
      })

      expect(result.current.loading.operations.operation1).toBeUndefined()
      expect(result.current.loading.operations.operation2).toBe(true)
    })
  })
})