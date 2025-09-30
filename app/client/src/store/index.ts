/**
 * FluxStack Store Index
 * Re-exports all Zustand stores and utilities
 */

// Stores
export { useUserStore } from './slices/userSlice'
export { useUIStore } from './slices/uiSlice'

// Types
export type { User, LoginCredentials, RegisterData } from './slices/userSlice'
export type { Notification, Modal } from './slices/uiSlice'

// Utility hooks
export { useAuth } from '../hooks/useAuth'
export { useNotifications } from '../hooks/useNotifications'