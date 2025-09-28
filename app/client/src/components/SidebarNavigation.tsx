// 🔥 Sidebar Navigation Component

import React from 'react'
import { useHybridLiveComponent } from '../../../../core/client/hooks/useHybridLiveComponent'
import { 
  FaHome, 
  FaUser, 
  FaCog, 
  FaFolder, 
  FaChartBar,
  FaBars,
  FaTimes,
  FaMoon,
  FaSun,
  FaBell
} from 'react-icons/fa'

export interface SidebarNavigationState {
  currentPage: 'dashboard' | 'profile' | 'settings' | 'files' | 'analytics'
  isCollapsed: boolean
  theme: 'light' | 'dark'
  notifications: {
    profile: number
    settings: number
    files: number
    analytics: number
  }
  lastNavigation: number
}

const initialState: SidebarNavigationState = {
  currentPage: 'dashboard',
  isCollapsed: false,
  theme: 'light',
  notifications: {
    profile: 0,
    settings: 0,
    files: 0,
    analytics: 0
  },
  lastNavigation: Date.now()
}

interface SidebarNavigationProps {
  onPageChange: (page: string) => void
}

export function SidebarNavigation({ onPageChange }: SidebarNavigationProps) {
  const { state, call, connected, status, error } = useHybridLiveComponent<SidebarNavigationState>(
    'SidebarNavigation', 
    initialState,
    { debug: true }
  )

  // Show loading state
  if (!connected || status !== 'synced') {
    const getStatusMessage = () => {
      switch (status) {
        case 'connecting':
          return '🔄 Conectando navegação...'
        case 'reconnecting':
          return '🔄 Reconectando menu...'
        case 'mounting':
          return '🚀 Carregando menu...'
        case 'loading':
          return '⏳ Carregando...'
        case 'error':
          return '❌ Erro na navegação'
        default:
          return '🔄 Preparando menu...'
      }
    }

    return (
      <div style={{
        width: '280px',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <FaBars size={32} style={{ marginBottom: '1rem' }} />
        <p>{getStatusMessage()}</p>
        {error && (
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
            {error}
          </p>
        )}
      </div>
    )
  }

  const isDark = state.theme === 'dark'
  const sidebarWidth = state.isCollapsed ? '80px' : '280px'
  
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: FaHome,
      notifications: 0
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: FaUser,
      notifications: state.notifications.profile
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: FaCog,
      notifications: state.notifications.settings
    },
    {
      id: 'files',
      label: 'Arquivos',
      icon: FaFolder,
      notifications: state.notifications.files
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: FaChartBar,
      notifications: state.notifications.analytics
    }
  ]

  const handleNavigate = async (page: string) => {
    try {
      await call('navigateTo', { page })
      onPageChange(page)
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }

  const handleToggleSidebar = async () => {
    try {
      await call('toggleSidebar')
    } catch (error) {
      console.error('Toggle sidebar error:', error)
    }
  }

  const handleToggleTheme = async () => {
    try {
      const newTheme = state.theme === 'light' ? 'dark' : 'light'
      await call('setTheme', { theme: newTheme })
    } catch (error) {
      console.error('Theme toggle error:', error)
    }
  }

  const handleClearNotifications = async () => {
    try {
      await call('clearAllNotifications')
    } catch (error) {
      console.error('Clear notifications error:', error)
    }
  }

  return (
    <div style={{
      width: sidebarWidth,
      height: '100vh',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRight: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
      boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {!state.isCollapsed && (
          <h2 style={{
            color: isDark ? '#f9fafb' : '#111827',
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 'bold'
          }}>
            🔥 FluxStack
          </h2>
        )}
        
        <button
          onClick={handleToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: isDark ? '#9ca3af' : '#6b7280',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem'
          }}
        >
          {state.isCollapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav style={{
        flex: 1,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = state.currentPage === item.id
          const hasNotifications = item.notifications > 0
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: isActive 
                  ? (isDark ? '#3b82f6' : '#2563eb')
                  : 'transparent',
                color: isActive
                  ? '#ffffff'
                  : (isDark ? '#d1d5db' : '#374151'),
                position: 'relative',
                justifyContent: state.isCollapsed ? 'center' : 'flex-start',
                minHeight: '3rem'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <Icon size={20} />
              
              {!state.isCollapsed && (
                <>
                  <span style={{ 
                    fontSize: '0.95rem',
                    fontWeight: isActive ? 'bold' : 'normal'
                  }}>
                    {item.label}
                  </span>
                  
                  {hasNotifications && (
                    <span style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      marginLeft: 'auto'
                    }}>
                      {item.notifications}
                    </span>
                  )}
                </>
              )}
              
              {state.isCollapsed && hasNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  backgroundColor: '#ef4444',
                  borderRadius: '50%',
                  width: '12px',
                  height: '12px',
                  border: '2px solid white'
                }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer Actions */}
      <div style={{
        padding: '1rem',
        borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        display: 'flex',
        flexDirection: state.isCollapsed ? 'column' : 'row',
        gap: '0.5rem'
      }}>
        {/* Theme Toggle */}
        <button
          onClick={handleToggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: state.isCollapsed ? 0 : '0.5rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: isDark ? '#374151' : '#f3f4f6',
            color: isDark ? '#d1d5db' : '#374151',
            flex: state.isCollapsed ? 'none' : 1,
            fontSize: '0.9rem'
          }}
        >
          {isDark ? <FaSun /> : <FaMoon />}
          {!state.isCollapsed && (
            <span>{isDark ? 'Claro' : 'Escuro'}</span>
          )}
        </button>

        {/* Clear Notifications */}
        {!state.isCollapsed && (
          <button
            onClick={handleClearNotifications}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: isDark ? '#374151' : '#f3f4f6',
              color: isDark ? '#d1d5db' : '#374151',
              flex: 1,
              fontSize: '0.9rem'
            }}
          >
            <FaBell />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* Connection Status (when collapsed) */}
      {state.isCollapsed && (
        <div style={{
          padding: '0.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: isDark ? '#6b7280' : '#9ca3af'
        }}>
          {connected ? '🟢' : '🔴'}
        </div>
      )}
    </div>
  )
}