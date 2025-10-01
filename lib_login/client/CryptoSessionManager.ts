/**
 * Frontend Crypto Session Manager
 * 
 * Manages Ed25519 keypairs for anonymous sessions
 * Private key stored locally, public key = sessionId
 */

import * as ed25519 from '@noble/ed25519'
import { sha256 } from '@noble/hashes/sha2'
import { BufferUtils, Environment, Logger, generateNonce } from '../shared/utils'
import type { SessionCache, AuthConfig } from '../shared/types'

const PRIVATE_KEY_STORAGE_KEY = 'crypto-auth-private-key'
const SESSION_CACHE_KEY = 'crypto-auth-session-cache'

export class CryptoSessionManager {
  private privateKey: Uint8Array | null = null
  private publicKey: Uint8Array | null = null
  private sessionId: string | null = null
  private config: AuthConfig
  private storage: ReturnType<typeof Environment.getStorageAdapter>
  private logger: Logger

  constructor(config: AuthConfig = {}) {
    this.config = {
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      maxTimeDrift: 5 * 60 * 1000, // 5 minutes
      storage: 'localStorage',
      autoInit: true,
      ...config
    }
    
    this.storage = Environment.getStorageAdapter()
    this.logger = new Logger('SessionManager')
  }

  /**
   * Initialize session - generate new or recover from storage
   */
  async initialize(): Promise<{ sessionId: string; isNew: boolean }> {
    const stored = this.getStoredPrivateKey()
    
    if (stored) {
      // Recover existing session
      this.privateKey = BufferUtils.from(stored, 'hex')
      this.publicKey = await ed25519.getPublicKeyAsync(this.privateKey)
      this.sessionId = BufferUtils.toString(this.publicKey, 'hex').toLowerCase()
      
      this.updateSessionCache()
      this.logger.info('Session recovered', { sessionId: this.sessionId.slice(0, 8) + '...' })
      return { sessionId: this.sessionId, isNew: false }
    } else {
      // Generate new session
      return this.generateNewSession()
    }
  }

  /**
   * Generate completely new session
   */
  async generateNewSession(): Promise<{ sessionId: string; isNew: boolean }> {
    // Generate random 32-byte private key using Web Crypto API
    this.privateKey = crypto.getRandomValues(new Uint8Array(32))
    
    this.logger.debug('Generating public key with Ed25519.getPublicKeyAsync...')
    this.publicKey = await ed25519.getPublicKeyAsync(this.privateKey)
    this.sessionId = BufferUtils.toString(this.publicKey, 'hex').toLowerCase()
    
    // Store private key
    this.storage.set(PRIVATE_KEY_STORAGE_KEY, BufferUtils.toString(this.privateKey, 'hex'))
    
    this.updateSessionCache()
    this.logger.info('New session generated', { sessionId: this.sessionId.slice(0, 8) + '...' })
    return { sessionId: this.sessionId, isNew: true }
  }

  /**
   * Generate new session and reload page (for clean start)
   */
  async generateNewSessionAndReload(): Promise<void> {
    this.logger.info('Generating new session and reloading page...')
    
    // Clear existing session first
    this.clearSession()
    
    // Generate new session
    await this.generateNewSession()
    
    // Force page reload for clean start (only in browser)
    if (Environment.isBrowser) {
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  }

  /**
   * Import session from private key (recovery)
   */
  async importFromPrivateKey(privateKeyHex: string): Promise<{ sessionId: string }> {
    try {
      this.privateKey = BufferUtils.from(privateKeyHex, 'hex')
      this.publicKey = await ed25519.getPublicKeyAsync(this.privateKey)
      this.sessionId = BufferUtils.toString(this.publicKey, 'hex').toLowerCase()
      
      // Store the imported key
      this.storage.set(PRIVATE_KEY_STORAGE_KEY, privateKeyHex)
      
      this.updateSessionCache()
      
      this.logger.info('Private key imported successfully')
      
      // Force page reload to ensure all components recognize the new session (only in browser)
      if (Environment.isBrowser) {
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
      
      return { sessionId: this.sessionId }
    } catch (error) {
      throw new Error(`Invalid private key: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Export private key (for backup)
   */
  exportPrivateKey(): string | null {
    if (!this.privateKey) return null
    return BufferUtils.toString(this.privateKey, 'hex')
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId
  }

  /**
   * Get private key (for internal use)
   */
  getPrivateKey(): Uint8Array | null {
    return this.privateKey
  }

  /**
   * Sign challenge for authentication
   */
  async signChallenge(challenge: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error('No private key available. Initialize session first.')
    }
    
    const messageBytes = BufferUtils.from(challenge, 'utf-8')
    const signature = await ed25519.signAsync(messageBytes, this.privateKey)
    
    return BufferUtils.toString(signature, 'hex')
  }

  /**
   * Sign arbitrary message
   */
  async signMessage(message: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error('No private key available. Initialize session first.')
    }
    
    const messageBytes = BufferUtils.from(message, 'utf-8')
    const signature = await ed25519.signAsync(messageBytes, this.privateKey)
    
    return BufferUtils.toString(signature, 'hex')
  }

  /**
   * Authenticate with backend
   */
  async authenticate(baseUrl: string = ''): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.sessionId) {
        throw new Error('No session initialized')
      }

      // Get challenge
      const challengeResponse = await fetch(`${baseUrl}/api/session/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: this.sessionId })
      })
      
      const challengeData = await challengeResponse.json()
      
      if (!challengeResponse.ok || challengeData.error) {
        throw new Error(challengeData.error || 'Failed to get challenge')
      }

      // Sign challenge
      const signature = await this.signChallenge(challengeData.challenge)

      // Authenticate
      const authResponse = await fetch(`${baseUrl}/api/session/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: this.sessionId,
          signature,
          challenge: challengeData.challenge,
          timestamp: Date.now()
        })
      })

      const authData = await authResponse.json()
      
      if (!authResponse.ok || !authData.success) {
        throw new Error(authData.error || 'Authentication failed')
      }

      this.updateSessionCache()
      this.logger.info('Authentication successful')
      return { success: true }

    } catch (error) {
      this.logger.error('Authentication failed', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Clear session (logout)
   */
  clearSession() {
    this.storage.remove(PRIVATE_KEY_STORAGE_KEY)
    this.storage.remove(SESSION_CACHE_KEY)
    this.privateKey = null
    this.publicKey = null
    this.sessionId = null
    this.logger.info('Session cleared')
  }

  /**
   * Check if session exists
   */
  hasSession(): boolean {
    return this.sessionId !== null
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    if (!this.sessionId) return null
    
    const cache = this.getSessionCache()
    return {
      sessionId: this.sessionId,
      publicKey: this.sessionId,
      hasPrivateKey: !!this.privateKey,
      createdAt: cache?.createdAt || Date.now(),
      lastUsed: cache?.lastUsed || Date.now()
    }
  }

  /**
   * Generate seed phrase for backup (optional feature)
   */
  generateSeedPhrase(): string[] {
    if (!this.privateKey) {
      throw new Error('No private key available')
    }
    
    // Simple word encoding (in production, use proper BIP39)
    const privateKeyHex = BufferUtils.toString(this.privateKey, 'hex')
    const words = []
    
    for (let i = 0; i < privateKeyHex.length; i += 4) {
      const chunk = privateKeyHex.slice(i, i + 4)
      const wordIndex = parseInt(chunk, 16) % 2048 // Simple mapping
      words.push(`word${wordIndex}`) // Placeholder - use real BIP39 wordlist
    }
    
    return words
  }

  /**
   * Private methods
   */
  private getStoredPrivateKey(): string | null {
    return this.storage.get(PRIVATE_KEY_STORAGE_KEY)
  }

  private updateSessionCache() {
    if (!this.sessionId) return
    
    const cache: SessionCache = {
      sessionId: this.sessionId,
      publicKey: this.sessionId,
      createdAt: Date.now(),
      lastUsed: Date.now()
    }
    
    this.storage.set(SESSION_CACHE_KEY, JSON.stringify(cache))
  }

  private getSessionCache(): SessionCache | null {
    const cached = this.storage.get(SESSION_CACHE_KEY)
    if (!cached) return null
    
    try {
      return JSON.parse(cached)
    } catch {
      return null
    }
  }
}