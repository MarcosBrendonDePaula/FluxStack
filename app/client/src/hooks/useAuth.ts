/**
 * Authentication hooks
 * Provides hooks for user authentication and profile management using Zustand
 */

import { useUserStore } from '../store/slices/userSlice'

export function useAuth() {
  const {
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError
  } = useUserStore()

  // Computed values
  const isAdmin = currentUser?.role === 'admin'

  return {
    // State
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    clearError
  }
}