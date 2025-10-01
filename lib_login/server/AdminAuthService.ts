/**
 * Admin Authentication Service
 * Uses Ed25519 signatures for secure admin authentication
 */

import { ed25519 } from '@noble/curves/ed25519'
import { NodeBufferUtils, isValidPublicKey, generateChallenge, Logger } from '../shared/utils'
import type { AdminSession, AdminAuthResult, AdminStats, ActiveSession, AuthConfig } from '../shared/types'

export class AdminAuthService {
  private adminPublicKeys: Set<string> = new Set()
  private activeSessions: Map<string, AdminSession> = new Map()
  private sessionTimeout: number
  private logger: Logger

  constructor(config: AuthConfig = {}) {
    this.sessionTimeout = config.sessionTimeout || 30 * 60 * 1000 // 30 minutes
    this.logger = new Logger('AdminAuth')
    
    this.initializeAdminKeys(config.adminKeys)
    this.startSessionCleanup()
  }

  /**
   * Public method to reinitialize admin keys (useful for dynamic updates)
   */
  initialize(adminKeys?: string[]): void {
    this.adminPublicKeys.clear()
    this.initializeAdminKeys(adminKeys)
  }

  /**
   * Initialize admin public keys from array or environment
   */
  private initializeAdminKeys(adminKeys?: string[]): void {
    const keys = adminKeys || process.env.ADMIN_PUBLIC_KEYS?.split(',').map(k => k.trim()) || []
    
    keys.forEach(key => {
      if (key && isValidPublicKey(key)) {
        this.adminPublicKeys.add(key)
        this.logger.debug('Admin key added', { 
          keyPrefix: key.substring(0, 8) + '...',
          totalKeys: this.adminPublicKeys.size 
        })
      }
    })

    if (this.adminPublicKeys.size === 0) {
      this.logger.warn('No admin keys configured')
    }

    this.logger.info('Admin auth initialized', {
      totalAdminKeys: this.adminPublicKeys.size,
      sessionTimeout: this.sessionTimeout / 1000 / 60 + ' minutes'
    })
  }

  /**
   * Generate authentication challenge
   */
  generateChallenge(): { challenge: string; timestamp: number } {
    const challengeData = generateChallenge()
    this.logger.debug('Challenge generated', { challenge: challengeData.challenge })
    return challengeData
  }

  /**
   * Authenticate admin with Ed25519 signature
   */
  authenticateAdmin(
    challenge: string,
    signature: string,
    publicKey: string,
    timestamp: number
  ): AdminAuthResult {
    try {
      const cleanPublicKey = publicKey.trim()
      
      // Verify public key is registered as admin
      if (!this.adminPublicKeys.has(cleanPublicKey)) {
        this.logger.warn('Unauthorized public key', {
          keyPrefix: cleanPublicKey.substring(0, 8) + '...'
        })
        return { success: false, error: 'Unauthorized public key' }
      }

      // Check challenge timestamp (prevent replay attacks)
      const now = Date.now()
      const challengeAge = now - timestamp
      if (challengeAge > 5 * 60 * 1000) { // 5 minutes max
        this.logger.warn('Challenge expired', { challengeAge })
        return { success: false, error: 'Challenge expired' }
      }

      // Verify Ed25519 signature
      const messageBytes = NodeBufferUtils.from(challenge, 'utf-8')
      const signatureBytes = NodeBufferUtils.from(signature, 'hex')
      const publicKeyBytes = NodeBufferUtils.from(cleanPublicKey, 'hex')

      const isValidSignature = ed25519.verify(
        signatureBytes,
        messageBytes,
        publicKeyBytes
      )

      if (!isValidSignature) {
        this.logger.warn('Invalid signature', {
          keyPrefix: cleanPublicKey.substring(0, 8) + '...'
        })
        return { success: false, error: 'Invalid signature' }
      }

      // Create admin session
      const sessionId = this.createAdminSession(cleanPublicKey)
      
      this.logger.info('Admin authentication successful', {
        keyPrefix: cleanPublicKey.substring(0, 8) + '...',
        sessionId
      })

      return { success: true, sessionId }
    } catch (error) {
      this.logger.error('Authentication failed', error)
      return { success: false, error: 'Authentication failed' }
    }
  }

  /**
   * Create admin session
   */
  private createAdminSession(publicKey: string): string {
    const sessionId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    const now = new Date()
    
    const session: AdminSession = {
      publicKey,
      authenticated: true,
      authenticatedAt: now,
      lastActivity: now,
      permissions: ['admin:cors', 'admin:system', 'admin:users'] // Default admin permissions
    }

    this.activeSessions.set(sessionId, session)
    
    return sessionId
  }

  /**
   * Validate admin session
   */
  validateAdminSession(sessionId: string): { valid: boolean; session?: AdminSession } {
    const session = this.activeSessions.get(sessionId)
    
    if (!session) {
      return { valid: false }
    }

    const now = Date.now()
    const lastActivity = session.lastActivity.getTime()
    
    // Check if session expired
    if (now - lastActivity > this.sessionTimeout) {
      this.activeSessions.delete(sessionId)
      this.logger.info('Session expired', { sessionId })
      return { valid: false }
    }

    // Update last activity
    session.lastActivity = new Date()
    
    return { valid: true, session }
  }

  /**
   * Check if session has specific permission
   */
  hasPermission(sessionId: string, permission: string): boolean {
    const validation = this.validateAdminSession(sessionId)
    if (!validation.valid || !validation.session) {
      return false
    }

    return validation.session.permissions.includes(permission) || 
           validation.session.permissions.includes('admin:*')
  }

  /**
   * Logout admin session
   */
  logoutAdmin(sessionId: string): boolean {
    const removed = this.activeSessions.delete(sessionId)
    if (removed) {
      this.logger.info('Admin logged out', { sessionId })
    }
    return removed
  }

  /**
   * Add admin public key (can be called programmatically)
   */
  addAdminPublicKey(publicKey: string, description?: string): boolean {
    try {
      const cleanKey = publicKey.trim()
      
      if (!isValidPublicKey(cleanKey)) {
        this.logger.warn('Invalid public key format', { publicKey: cleanKey.substring(0, 16) + '...' })
        return false
      }

      this.adminPublicKeys.add(cleanKey)
      
      this.logger.info('Admin public key added', {
        keyPrefix: cleanKey.substring(0, 8) + '...',
        description: description || 'Programmatically added',
        totalKeys: this.adminPublicKeys.size
      })

      return true
    } catch (error) {
      this.logger.error('Failed to add admin public key', error)
      return false
    }
  }

  /**
   * Remove admin public key
   */
  removeAdminPublicKey(publicKey: string): boolean {
    const cleanKey = publicKey.trim()
    const removed = this.adminPublicKeys.delete(cleanKey)
    
    if (removed) {
      // Invalidate any sessions using this key
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.publicKey === cleanKey) {
          this.activeSessions.delete(sessionId)
          this.logger.info('Session invalidated due to key removal', { sessionId })
        }
      }

      this.logger.info('Admin public key removed', {
        keyPrefix: cleanKey.substring(0, 8) + '...',
        totalKeys: this.adminPublicKeys.size
      })
    }

    return removed
  }

  /**
   * Get admin statistics
   */
  getAdminStats(): AdminStats {
    return {
      totalAdminKeys: this.adminPublicKeys.size,
      activeSessions: this.activeSessions.size,
      sessionTimeout: this.sessionTimeout,
      adminKeys: Array.from(this.adminPublicKeys).map(key => ({
        keyPrefix: key.substring(0, 8) + '...',
        fullKey: key
      }))
    }
  }

  /**
   * List active admin sessions
   */
  getActiveSessions(): ActiveSession[] {
    const sessions = []
    for (const [sessionId, session] of this.activeSessions.entries()) {
      sessions.push({
        sessionId,
        keyPrefix: session.publicKey.substring(0, 8) + '...',
        authenticatedAt: session.authenticatedAt,
        lastActivity: session.lastActivity,
        permissions: session.permissions
      })
    }
    return sessions
  }

  /**
   * Check if user session has admin permissions
   */
  isUserSessionAdmin(userSessionId: string): boolean {
    return this.adminPublicKeys.has(userSessionId)
  }

  /**
   * Promote user session to admin
   */
  promoteUserSession(userSessionId: string, description?: string): boolean {
    return this.addAdminPublicKey(userSessionId, description || 'Promoted user session')
  }

  /**
   * Cleanup expired sessions (runs every 5 minutes)
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      let cleanedCount = 0

      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now - session.lastActivity.getTime() > this.sessionTimeout) {
          this.activeSessions.delete(sessionId)
          cleanedCount++
        }
      }

      if (cleanedCount > 0) {
        this.logger.info('Expired sessions cleaned', {
          cleanedSessions: cleanedCount,
          activeSessions: this.activeSessions.size
        })
      }
    }, 5 * 60 * 1000) // Every 5 minutes
  }
}