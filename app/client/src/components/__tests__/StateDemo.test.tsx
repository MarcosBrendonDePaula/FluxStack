/**
 * StateDemo Component Tests
 * Integration tests for the state management demo component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StateDemo } from '../StateDemo'
import { useUserStore } from '../../store/slices/userSlice'
import { useUIStore } from '../../store/slices/uiSlice'

// Mock fetch globally
global.fetch = vi.fn()

describe('StateDemo Component', () => {
  beforeEach(() => {
    // Reset stores before each test
    useUserStore.setState({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    })

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

    // Reset fetch mock
    vi.resetAllMocks()
  })

  describe('Rendering', () => {
    it('should render the component', () => {
      render(<StateDemo />)
      
      expect(screen.getByText('🔄 State Management Demo')).toBeInTheDocument()
      expect(screen.getByText('Theme')).toBeInTheDocument()
      expect(screen.getByText('UI State')).toBeInTheDocument()
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('Authentication')).toBeInTheDocument()
    })

    it('should display current theme', () => {
      render(<StateDemo />)
      
      expect(screen.getByText('Current theme: system')).toBeInTheDocument()
    })

    it('should display sidebar state', () => {
      render(<StateDemo />)
      
      expect(screen.getByText('Sidebar: Open')).toBeInTheDocument()
      expect(screen.getByText('Loading: No')).toBeInTheDocument()
    })

    it('should display authentication state', () => {
      render(<StateDemo />)
      
      expect(screen.getByText('Status: Not authenticated')).toBeInTheDocument()
      expect(screen.getByText('Login (Demo)')).toBeInTheDocument()
    })
  })

  describe('Theme Management', () => {
    it('should change theme when button is clicked', () => {
      render(<StateDemo />)
      
      const darkButton = screen.getByText('Dark')
      fireEvent.click(darkButton)
      
      expect(screen.getByText('Current theme: dark')).toBeInTheDocument()
    })

    it('should highlight active theme button', () => {
      render(<StateDemo />)
      
      const systemButton = screen.getByText('System')
      expect(systemButton).toHaveClass('bg-blue-500', 'text-white')
      
      const lightButton = screen.getByText('Light')
      expect(lightButton).toHaveClass('bg-gray-200', 'text-gray-700')
    })
  })

  describe('Sidebar Management', () => {
    it('should toggle sidebar when button is clicked', () => {
      render(<StateDemo />)
      
      const toggleButton = screen.getByText('Close Sidebar')
      fireEvent.click(toggleButton)
      
      expect(screen.getByText('Sidebar: Closed')).toBeInTheDocument()
      expect(screen.getByText('Open Sidebar')).toBeInTheDocument()
    })
  })

  describe('Loading Management', () => {
    it('should toggle loading state when button is clicked', () => {
      render(<StateDemo />)
      
      const loadingButton = screen.getByText('Start Loading')
      fireEvent.click(loadingButton)
      
      expect(screen.getByText('Loading: Yes')).toBeInTheDocument()
      expect(screen.getByText('Stop Loading')).toBeInTheDocument()
    })
  })

  describe('Notifications', () => {
    it('should show notification count', () => {
      render(<StateDemo />)
      
      expect(screen.getByText('Active notifications: 0')).toBeInTheDocument()
    })

    it('should add notifications when test button is clicked', async () => {
      render(<StateDemo />)
      
      const testButton = screen.getByText('Test Notifications')
      fireEvent.click(testButton)
      
      // Wait for notifications to be added
      await waitFor(() => {
        expect(screen.getByText('Active notifications: 4')).toBeInTheDocument()
      }, { timeout: 4000 })
    })

    it('should clear notifications when clear button is clicked', async () => {
      render(<StateDemo />)
      
      // First add some notifications
      const testButton = screen.getByText('Test Notifications')
      fireEvent.click(testButton)
      
      await waitFor(() => {
        expect(screen.getByText('Active notifications: 4')).toBeInTheDocument()
      }, { timeout: 4000 })
      
      // Then clear them
      const clearButton = screen.getByText('Clear Notifications')
      fireEvent.click(clearButton)
      
      expect(screen.getByText('Active notifications: 0')).toBeInTheDocument()
    })
  })

  describe('Authentication', () => {
    it('should show login button when not authenticated', () => {
      render(<StateDemo />)
      
      expect(screen.getByText('Login (Demo)')).toBeInTheDocument()
      expect(screen.getByText('Status: Not authenticated')).toBeInTheDocument()
    })

    it('should show logout button when authenticated', () => {
      // Set authenticated state
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

      render(<StateDemo />)
      
      expect(screen.getByText('Logout')).toBeInTheDocument()
      expect(screen.getByText('Status: Authenticated')).toBeInTheDocument()
      expect(screen.getByText('User: Test User (test@example.com)')).toBeInTheDocument()
    })

    it('should attempt login when login button is clicked', async () => {
      // Mock successful login
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user'
          }
        })
      })

      render(<StateDemo />)
      
      const loginButton = screen.getByText('Login (Demo)')
      fireEvent.click(loginButton)
      
      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password'
        })
      })
    })

    it('should logout when logout button is clicked', () => {
      // Set authenticated state
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

      // Mock logout API
      ;(global.fetch as any).mockResolvedValueOnce({ ok: true })

      render(<StateDemo />)
      
      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)
      
      expect(screen.getByText('Status: Not authenticated')).toBeInTheDocument()
    })
  })

  describe('State Inspector', () => {
    it('should show state inspector', () => {
      render(<StateDemo />)
      
      expect(screen.getByText('State Inspector')).toBeInTheDocument()
      expect(screen.getByText('View Current State (Click to expand)')).toBeInTheDocument()
    })

    it('should display current state when expanded', () => {
      render(<StateDemo />)
      
      const summary = screen.getByText('View Current State (Click to expand)')
      fireEvent.click(summary)
      
      // Should show JSON representation of state
      expect(screen.getByText(/"theme": "system"/)).toBeInTheDocument()
      expect(screen.getByText(/"sidebarOpen": true/)).toBeInTheDocument()
      expect(screen.getByText(/"isAuthenticated": false/)).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should handle rapid state changes', () => {
      render(<StateDemo />)
      
      // Rapidly toggle sidebar
      const toggleButton = screen.getByText('Close Sidebar')
      fireEvent.click(toggleButton)
      fireEvent.click(screen.getByText('Open Sidebar'))
      fireEvent.click(screen.getByText('Close Sidebar'))
      
      expect(screen.getByText('Sidebar: Closed')).toBeInTheDocument()
    })

    it('should handle multiple theme changes', () => {
      render(<StateDemo />)
      
      fireEvent.click(screen.getByText('Light'))
      expect(screen.getByText('Current theme: light')).toBeInTheDocument()
      
      fireEvent.click(screen.getByText('Dark'))
      expect(screen.getByText('Current theme: dark')).toBeInTheDocument()
      
      fireEvent.click(screen.getByText('System'))
      expect(screen.getByText('Current theme: system')).toBeInTheDocument()
    })
  })
})