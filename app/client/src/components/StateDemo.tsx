/**
 * State Management Demo Component
 * Demonstrates the usage of FluxStack state management system with Zustand
 */

import React from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../hooks/useAuth'
import { useUIStore } from '../store/slices/uiSlice'

export function StateDemo() {
  const {
    theme,
    sidebarOpen,
    notifications,
    loading,
    setTheme,
    toggleSidebar,
    setGlobalLoading
  } = useUIStore()

  const { success, error, warning, info, clearNotifications } = useNotifications()
  const { currentUser, isAuthenticated, login, logout } = useAuth()

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
  }

  const handleToggleSidebar = () => {
    toggleSidebar()
  }

  const handleToggleLoading = () => {
    setGlobalLoading(!loading.global)
  }

  const handleTestNotifications = () => {
    success('Success!', 'This is a success notification')
    setTimeout(() => error('Error!', 'This is an error notification'), 1000)
    setTimeout(() => warning('Warning!', 'This is a warning notification'), 2000)
    setTimeout(() => info('Info!', 'This is an info notification'), 3000)
  }

  const handleTestAuth = async () => {
    if (isAuthenticated) {
      await logout()
    } else {
      try {
        await login({ email: 'test@example.com', password: 'password' })
      } catch (error) {
        // Error is handled by the hook
      }
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🔄 State Management Demo
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theme Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Theme</h3>
          <div className="flex space-x-2">
            {(['light', 'dark', 'system'] as const).map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => handleThemeChange(themeOption)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${theme === themeOption
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600">Current theme: {theme}</p>
        </div>

        {/* UI Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">UI State</h3>
          <div className="space-y-2">
            <button
              onClick={handleToggleSidebar}
              className="block w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              {sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
            </button>
            <button
              onClick={handleToggleLoading}
              className="block w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
              {loading.global ? 'Stop Loading' : 'Start Loading'}
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <p>Sidebar: {sidebarOpen ? 'Open' : 'Closed'}</p>
            <p>Loading: {loading.global ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Notifications</h3>
          <div className="space-y-2">
            <button
              onClick={handleTestNotifications}
              className="block w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              Test Notifications
            </button>
            <button
              onClick={clearNotifications}
              className="block w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Clear Notifications
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Active notifications: {notifications.length}
          </p>
        </div>

        {/* Authentication */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Authentication</h3>
          <button
            onClick={handleTestAuth}
            className={`block w-full px-4 py-2 rounded-md transition-colors ${isAuthenticated
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
          >
            {isAuthenticated ? 'Logout' : 'Login (Demo)'}
          </button>
          <div className="text-sm text-gray-600">
            <p>Status: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
            {currentUser && (
              <p>User: {currentUser.name} ({currentUser.email})</p>
            )}
          </div>
        </div>
      </div>

      {/* State Inspector */}
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h4 className="text-md font-semibold text-gray-700 mb-2">State Inspector</h4>
        <details className="text-sm">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
            View Current State (Click to expand)
          </summary>
          <pre className="mt-2 p-2 bg-white rounded border text-xs overflow-auto">
            {JSON.stringify({
              ui: {
                theme,
                sidebarOpen,
                notificationCount: notifications.length,
                globalLoading: loading.global
              },
              user: {
                isAuthenticated,
                currentUser: currentUser ? {
                  id: currentUser.id,
                  name: currentUser.name,
                  email: currentUser.email
                } : null
              }
            }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}