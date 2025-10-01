/**
 * Admin Authentication Routes - Framework Agnostic
 * Handles admin login, logout, and session management
 */

import { AdminAuthService } from './AdminAuthService'
import { Logger } from '../shared/utils'

export class AdminRoutes {
  private adminAuth: AdminAuthService
  private logger: Logger

  constructor(adminAuth?: AdminAuthService) {
    this.adminAuth = adminAuth || new AdminAuthService()
    this.logger = new Logger('AdminRoutes')
  }

  /**
   * Check if user session has admin permissions
   */
  async handleCheckUserSession(headers: Record<string, string | undefined>) {
    try {
      const userSessionId = headers['x-session-id']
      
      if (!userSessionId) {
        return {
          success: false,
          error: 'No user session provided'
        }
      }

      const isUserAdmin = this.adminAuth.isUserSessionAdmin(userSessionId)
      
      this.logger.info('User session admin check', { 
        sessionId: userSessionId.slice(0, 8), 
        isAdmin: isUserAdmin 
      })
      
      return {
        success: true,
        data: {
          sessionId: userSessionId,
          isAdmin: isUserAdmin,
          adminType: isUserAdmin ? 'user-session' : null
        }
      }
    } catch (error) {
      this.logger.error('Failed to check admin status', error)
      return {
        success: false,
        error: 'Failed to check admin status'
      }
    }
  }

  /**
   * Promote current session to admin
   */
  async handlePromoteCurrentSession(headers: Record<string, string | undefined>) {
    try {
      const userSessionId = headers['x-session-id']
      
      if (!userSessionId) {
        return {
          success: false,
          error: 'No user session provided'
        }
      }

      // Check if session is already admin
      if (this.adminAuth.isUserSessionAdmin(userSessionId)) {
        return {
          success: true,
          message: 'Session is already an admin'
        }
      }
      
      // Promote the session
      const promoted = this.adminAuth.promoteUserSession(userSessionId, 'Promoted via API')
      
      if (promoted) {
        this.logger.info('Session promoted to admin', { sessionId: userSessionId.slice(0, 8) })
        
        return {
          success: true,
          message: 'Current session has been promoted to admin',
          data: {
            sessionId: userSessionId,
            totalAdminKeys: this.adminAuth.getAdminStats().totalAdminKeys
          }
        }
      } else {
        return {
          success: false,
          error: 'Failed to promote session'
        }
      }
    } catch (error) {
      this.logger.error('Failed to promote session', error)
      return {
        success: false,
        error: 'Failed to promote session'
      }
    }
  }

  /**
   * Get all admin users
   */
  async handleGetAdminUsers(headers: Record<string, string | undefined>) {
    try {
      const userSessionId = headers['x-session-id']
      if (!userSessionId) {
        return {
          success: false,
          error: 'Session ID required'
        }
      }

      // Check if user is admin
      if (!this.adminAuth.isUserSessionAdmin(userSessionId)) {
        return {
          success: false,
          error: 'Admin access required'
        }
      }

      const stats = this.adminAuth.getAdminStats()
      const admins = stats.adminKeys.map(key => ({
        key: key.fullKey.length > 20 ? `${key.fullKey.slice(0, 8)}...${key.fullKey.slice(-8)}` : key.fullKey,
        fullKey: key.fullKey,
        description: key.fullKey === userSessionId ? 'Current Session (You)' : 
                    key.fullKey.includes('demo-session') ? 'Demo Session' :
                    key.fullKey.length === 64 ? 'Ed25519 Public Key' : 'Session ID',
        isCurrentUser: key.fullKey === userSessionId,
        addedAt: new Date().toISOString()
      }))

      return {
        success: true,
        data: {
          admins,
          total: admins.length,
          currentUser: userSessionId.slice(0, 8) + '...'
        }
      }
    } catch (error) {
      this.logger.error('Failed to get admin users', error)
      return {
        success: false,
        error: 'Failed to get admin users'
      }
    }
  }

  /**
   * Add new admin user
   */
  async handleAddAdminUser(
    headers: Record<string, string | undefined>, 
    body: { adminSessionId: string, description: string }
  ) {
    try {
      const userSessionId = headers['x-session-id']
      if (!userSessionId) {
        return {
          success: false,
          error: 'Session ID required'
        }
      }

      // Check if user is admin
      if (!this.adminAuth.isUserSessionAdmin(userSessionId)) {
        return {
          success: false,
          error: 'Admin access required'
        }
      }

      const { adminSessionId, description } = body
      
      if (!adminSessionId || !description) {
        return {
          success: false,
          error: 'Admin session ID and description are required'
        }
      }

      // Check if admin already exists
      if (this.adminAuth.isUserSessionAdmin(adminSessionId)) {
        return {
          success: false,
          error: 'User is already an admin'
        }
      }

      // Add new admin
      const added = this.adminAuth.addAdminPublicKey(adminSessionId, description)
      
      if (added) {
        this.logger.info('Admin user added', { 
          adminSessionId: adminSessionId.slice(0, 8),
          addedBy: userSessionId.slice(0, 8),
          description 
        })
        
        return {
          success: true,
          message: 'Admin user added successfully',
          data: {
            adminSessionId,
            description,
            totalAdmins: this.adminAuth.getAdminStats().totalAdminKeys
          }
        }
      } else {
        return {
          success: false,
          error: 'Failed to add admin user'
        }
      }
    } catch (error) {
      this.logger.error('Failed to add admin user', error)
      return {
        success: false,
        error: 'Failed to add admin user'
      }
    }
  }

  /**
   * Remove admin user
   */
  async handleRemoveAdminUser(
    headers: Record<string, string | undefined>, 
    adminKey: string
  ) {
    try {
      const userSessionId = headers['x-session-id']
      
      if (!userSessionId) {
        return {
          success: false,
          error: 'Session ID required'
        }
      }

      // Check if user is admin
      if (!this.adminAuth.isUserSessionAdmin(userSessionId)) {
        return {
          success: false,
          error: 'Admin access required'
        }
      }

      // Prevent removing self
      if (adminKey === userSessionId) {
        return {
          success: false,
          error: 'Cannot remove yourself as admin'
        }
      }

      // Remove the admin
      const removed = this.adminAuth.removeAdminPublicKey(adminKey)
      
      if (removed) {
        this.logger.info('Admin user removed', { 
          removedKey: adminKey.slice(0, 8),
          removedBy: userSessionId.slice(0, 8)
        })
        
        return {
          success: true,
          message: 'Admin user removed successfully',
          data: {
            removedKey: adminKey,
            remainingAdmins: this.adminAuth.getAdminStats().totalAdminKeys
          }
        }
      } else {
        return {
          success: false,
          error: 'Admin user not found'
        }
      }
    } catch (error) {
      this.logger.error('Failed to remove admin user', error)
      return {
        success: false,
        error: 'Failed to remove admin user'
      }
    }
  }

  /**
   * Generate authentication challenge
   */
  async handleGenerateChallenge() {
    try {
      const challenge = this.adminAuth.generateChallenge()
      
      return {
        success: true,
        data: challenge
      }
    } catch (error) {
      this.logger.error('Failed to generate challenge', error)
      return {
        success: false,
        error: 'Failed to generate challenge'
      }
    }
  }

  /**
   * Authenticate with Ed25519 signature
   */
  async handleLogin(body: {
    challenge: string
    signature: string
    publicKey: string
    timestamp: number
  }) {
    try {
      const { challenge, signature, publicKey, timestamp } = body

      if (!challenge || !signature || !publicKey || !timestamp) {
        return {
          success: false,
          error: 'Missing required fields'
        }
      }

      const result = this.adminAuth.authenticateAdmin(challenge, signature, publicKey, timestamp)
      
      if (result.success) {
        return {
          success: true,
          data: {
            sessionId: result.sessionId,
            message: 'Authentication successful'
          }
        }
      } else {
        return {
          success: false,
          error: result.error
        }
      }
    } catch (error) {
      this.logger.error('Login failed', error)
      return {
        success: false,
        error: 'Login failed'
      }
    }
  }

  /**
   * Validate current session
   */
  async handleValidateSession(headers: Record<string, string | undefined>) {
    try {
      const sessionId = headers['x-admin-session']
      
      if (!sessionId) {
        return {
          success: false,
          error: 'No session provided'
        }
      }

      const validation = this.adminAuth.validateAdminSession(sessionId)
      
      if (validation.valid && validation.session) {
        return {
          success: true,
          data: {
            valid: true,
            session: {
              authenticatedAt: validation.session.authenticatedAt,
              lastActivity: validation.session.lastActivity,
              permissions: validation.session.permissions,
              keyPrefix: validation.session.publicKey.substring(0, 8) + '...'
            }
          }
        }
      } else {
        return {
          success: true,
          data: {
            valid: false
          }
        }
      }
    } catch (error) {
      this.logger.error('Session validation failed', error)
      return {
        success: false,
        error: 'Session validation failed'
      }
    }
  }

  /**
   * Logout admin
   */
  async handleLogout(headers: Record<string, string | undefined>) {
    try {
      const sessionId = headers['x-admin-session']
      
      if (!sessionId) {
        return {
          success: false,
          error: 'No session provided'
        }
      }

      const loggedOut = this.adminAuth.logoutAdmin(sessionId)
      
      return {
        success: true,
        data: {
          loggedOut,
          message: 'Logged out successfully'
        }
      }
    } catch (error) {
      this.logger.error('Logout failed', error)
      return {
        success: false,
        error: 'Logout failed'
      }
    }
  }

  /**
   * Get admin statistics
   */
  async handleGetStats(headers: Record<string, string | undefined>) {
    try {
      const sessionId = headers['x-admin-session']
      
      if (!sessionId) {
        return {
          success: false,
          error: 'Admin authentication required'
        }
      }

      const validation = this.adminAuth.validateAdminSession(sessionId)
      if (!validation.valid) {
        return {
          success: false,
          error: 'Invalid or expired admin session'
        }
      }

      const stats = this.adminAuth.getAdminStats()
      const sessions = this.adminAuth.getActiveSessions()
      
      return {
        success: true,
        data: {
          ...stats,
          activeSessions: sessions
        }
      }
    } catch (error) {
      this.logger.error('Failed to retrieve admin statistics', error)
      return {
        success: false,
        error: 'Failed to retrieve admin statistics'
      }
    }
  }
}