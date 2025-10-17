// 🔥 Sidebar Navigation Live Component

import { LiveComponent } from '@/core/types/types'

export interface SidebarNavigationState {
  currentPage: 'dashboard' | 'profile' | 'settings' | 'files' | 'analytics' | 'config'
  isCollapsed: boolean
  theme: 'light' | 'dark'
  notifications: {
    profile: number
    settings: number
    files: number
    analytics: number
    config: number
  }
  lastNavigation: number
}

export class SidebarNavigation extends LiveComponent<SidebarNavigationState> {
  constructor(initialState: SidebarNavigationState, ws: any, options?: any) {
    super(initialState, ws, options)
    
    // Set default state if needed
    this.state = {
      currentPage: 'dashboard',
      isCollapsed: false,
      theme: 'light',
      notifications: {
        profile: 0,
        settings: 0,
        files: 0,
        analytics: 0,
        config: 0
      },
      lastNavigation: Date.now(),
      ...initialState
    }
  }

  // Navigate to a different page
  async navigateTo(data: { page: string }) {
    const validPages = ['dashboard', 'profile', 'settings', 'files', 'analytics', 'config']
    
    if (!validPages.includes(data.page)) {
      throw new Error(`Invalid page: ${data.page}`)
    }

    this.setState({
      currentPage: data.page as any,
      lastNavigation: Date.now()
    })

    // Clear notification for the page we're navigating to
    this.setState({
      notifications: {
        ...this.state.notifications,
        [data.page]: 0
      }
    })

    this.emit('PAGE_CHANGED', {
      page: data.page,
      timestamp: Date.now()
    })

    console.log(`📍 Navigation: Changed to ${data.page}`)
  }

  // Toggle sidebar collapsed state
  async toggleSidebar() {
    this.setState({
      isCollapsed: !this.state.isCollapsed
    })

    this.emit('SIDEBAR_TOGGLED', {
      collapsed: this.state.isCollapsed,
      timestamp: Date.now()
    })

    console.log(`📱 Sidebar: ${this.state.isCollapsed ? 'Collapsed' : 'Expanded'}`)
  }

  // Change theme
  async setTheme(data: { theme: 'light' | 'dark' }) {
    if (!['light', 'dark'].includes(data.theme)) {
      throw new Error(`Invalid theme: ${data.theme}`)
    }

    this.setState({
      theme: data.theme
    })

    this.emit('THEME_CHANGED', {
      theme: data.theme,
      timestamp: Date.now()
    })

    console.log(`🎨 Theme: Changed to ${data.theme}`)
  }

  // Add notification to a page
  async addNotification(data: { page: string; count?: number }) {
    const validPages = ['profile', 'settings', 'files', 'analytics']
    
    if (!validPages.includes(data.page)) {
      throw new Error(`Invalid notification page: ${data.page}`)
    }

    const currentCount = this.state.notifications[data.page as keyof typeof this.state.notifications] || 0
    const incrementBy = data.count || 1

    this.setState({
      notifications: {
        ...this.state.notifications,
        [data.page]: currentCount + incrementBy
      }
    })

    this.emit('NOTIFICATION_ADDED', {
      page: data.page,
      count: currentCount + incrementBy,
      timestamp: Date.now()
    })

    console.log(`🔔 Notification: Added ${incrementBy} to ${data.page} (total: ${currentCount + incrementBy})`)
  }

  // Clear all notifications
  async clearAllNotifications() {
    this.setState({
      notifications: {
        profile: 0,
        settings: 0,
        files: 0,
        analytics: 0,
        config: 0
      }
    })

    this.emit('NOTIFICATIONS_CLEARED', {
      timestamp: Date.now()
    })

    console.log(`🔕 Notifications: All cleared`)
  }

  // Get navigation history (mock for now)
  async getNavigationHistory() {
    // In a real app, this would fetch from database
    return {
      history: [
        { page: this.state.currentPage, timestamp: this.state.lastNavigation }
      ],
      timestamp: Date.now()
    }
  }
}