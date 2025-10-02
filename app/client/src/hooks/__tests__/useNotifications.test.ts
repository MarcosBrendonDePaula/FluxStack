/**
 * useNotifications Hook Tests
 * Tests for notifications utility hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNotifications } from '../useNotifications'
import { useUIStore } from '../../store/slices/uiSlice'

describe('useNotifications', () => {
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
    it('should return empty notifications initially', () => {
      const { result } = renderHook(() => useNotifications())
      
      expect(result.current.notifications).toEqual([])
    })
  })

  describe('Notification Management', () => {
    it('should add notification', () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.addNotification({
          type: 'success',
          title: 'Success',
          message: 'Operation completed'
        })
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0]).toMatchObject({
        type: 'success',
        title: 'Success',
        message: 'Operation completed'
      })
    })

    it('should remove notification', () => {
      const { result } = renderHook(() => useNotifications())

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
      const { result } = renderHook(() => useNotifications())

      // Add multiple notifications
      act(() => {
        result.current.addNotification({
          type: 'success',
          title: 'Success',
          message: 'Success message'
        })
        result.current.addNotification({
          type: 'error',
          title: 'Error',
          message: 'Error message'
        })
      })

      expect(result.current.notifications).toHaveLength(2)

      act(() => {
        result.current.clearNotifications()
      })

      expect(result.current.notifications).toHaveLength(0)
    })
  })

  describe('Convenience Methods', () => {
    it('should add success notification', () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.success('Success Title', 'Success message')
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0]).toMatchObject({
        type: 'success',
        title: 'Success Title',
        message: 'Success message'
      })
    })

    it('should add error notification', () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.error('Error Title', 'Error message')
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0]).toMatchObject({
        type: 'error',
        title: 'Error Title',
        message: 'Error message'
      })
    })

    it('should add warning notification', () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.warning('Warning Title', 'Warning message')
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0]).toMatchObject({
        type: 'warning',
        title: 'Warning Title',
        message: 'Warning message'
      })
    })

    it('should add info notification', () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.info('Info Title', 'Info message')
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0]).toMatchObject({
        type: 'info',
        title: 'Info Title',
        message: 'Info message'
      })
    })

    it('should add notification with custom duration', () => {
      const { result } = renderHook(() => useNotifications())

      act(() => {
        result.current.success('Success', 'Message', 3000)
      })

      expect(result.current.notifications[0].duration).toBe(3000)
    })
  })

  describe('State Reactivity', () => {
    it('should react to store changes', () => {
      const { result } = renderHook(() => useNotifications())

      // Initially empty
      expect(result.current.notifications).toHaveLength(0)

      // Update store directly
      act(() => {
        useUIStore.setState({
          theme: 'system',
          sidebarOpen: true,
          notifications: [{
            id: '1',
            type: 'success',
            title: 'Test',
            message: 'Test message',
            timestamp: Date.now()
          }],
          modals: [],
          loading: {
            global: false,
            operations: {}
          }
        })
      })

      // Hook should reflect the change
      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].title).toBe('Test')
    })
  })

  describe('Function Stability', () => {
    it('should have stable function references', () => {
      const { result, rerender } = renderHook(() => useNotifications())

      const firstRender = {
        addNotification: result.current.addNotification,
        removeNotification: result.current.removeNotification,
        clearNotifications: result.current.clearNotifications,
        success: result.current.success,
        error: result.current.error,
        warning: result.current.warning,
        info: result.current.info
      }

      rerender()

      const secondRender = {
        addNotification: result.current.addNotification,
        removeNotification: result.current.removeNotification,
        clearNotifications: result.current.clearNotifications,
        success: result.current.success,
        error: result.current.error,
        warning: result.current.warning,
        info: result.current.info
      }

      // Functions should be stable (same reference)
      expect(firstRender.addNotification).toBe(secondRender.addNotification)
      expect(firstRender.removeNotification).toBe(secondRender.removeNotification)
      expect(firstRender.clearNotifications).toBe(secondRender.clearNotifications)
      expect(firstRender.success).toBe(secondRender.success)
      expect(firstRender.error).toBe(secondRender.error)
      expect(firstRender.warning).toBe(secondRender.warning)
      expect(firstRender.info).toBe(secondRender.info)
    })
  })
})