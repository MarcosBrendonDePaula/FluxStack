/**
 * Notification management hooks
 * Provides easy-to-use hooks for managing notifications using Zustand
 */

import { useCallback } from 'react'
import { useUIStore } from '../store/slices/uiSlice'

export function useNotifications() {
  const {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications
  } = useUIStore()

  // Convenience methods for different notification types
  const success = useCallback(
    (title: string, message: string, duration?: number) => {
      addNotification({ type: 'success', title, message, duration })
    },
    [addNotification]
  )

  const error = useCallback(
    (title: string, message: string, duration?: number) => {
      addNotification({ type: 'error', title, message, duration })
    },
    [addNotification]
  )

  const warning = useCallback(
    (title: string, message: string, duration?: number) => {
      addNotification({ type: 'warning', title, message, duration })
    },
    [addNotification]
  )

  const info = useCallback(
    (title: string, message: string, duration?: number) => {
      addNotification({ type: 'info', title, message, duration })
    },
    [addNotification]
  )

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    success,
    error,
    warning,
    info
  }
}