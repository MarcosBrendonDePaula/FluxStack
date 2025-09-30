/**
 * UI Store with Zustand
 * Manages global UI state like modals, notifications, theme, etc.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  timestamp: number
}

export interface Modal {
  id: string
  component: string
  props?: Record<string, any>
  closable?: boolean
}

interface UIState {
  // State
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  notifications: Notification[]
  modals: Modal[]
  loading: {
    global: boolean
    operations: Record<string, boolean>
  }

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Modals
  openModal: (modal: Omit<Modal, 'id'>) => void
  closeModal: (id: string) => void
  closeAllModals: () => void
  
  // Loading
  setGlobalLoading: (loading: boolean) => void
  setOperationLoading: (operation: string, loading: boolean) => void
  clearOperationLoading: (operation: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      sidebarOpen: true,
      notifications: [],
      modals: [],
      loading: {
        global: false,
        operations: {}
      },

      // Theme actions
      setTheme: (theme) => set({ theme }),

      // Sidebar actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Notification actions
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now()
        }
        
        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }))

        // Auto-remove notification after duration
        if (notification.duration !== 0) {
          setTimeout(() => {
            get().removeNotification(newNotification.id)
          }, notification.duration || 5000)
        }
      },

      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),

      clearNotifications: () => set({ notifications: [] }),

      // Modal actions
      openModal: (modal) => {
        const newModal: Modal = {
          ...modal,
          id: Math.random().toString(36).substr(2, 9)
        }
        
        set((state) => ({
          modals: [...state.modals, newModal]
        }))
      },

      closeModal: (id) => set((state) => ({
        modals: state.modals.filter(m => m.id !== id)
      })),

      closeAllModals: () => set({ modals: [] }),

      // Loading actions
      setGlobalLoading: (loading) => set((state) => ({
        loading: { ...state.loading, global: loading }
      })),

      setOperationLoading: (operation, loading) => set((state) => ({
        loading: {
          ...state.loading,
          operations: {
            ...state.loading.operations,
            [operation]: loading
          }
        }
      })),

      clearOperationLoading: (operation) => set((state) => {
        const { [operation]: _, ...operations } = state.loading.operations
        return {
          loading: { ...state.loading, operations }
        }
      })
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen
      })
    }
  )
)