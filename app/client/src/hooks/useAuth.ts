/**
 * Authentication hooks
 * App-specific authentication hook using FluxStack core
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