/**
 * Ed25519 Request Authentication Middleware
 * Core authentication logic for server-side request validation
 */

import { ed25519 } from '@noble/curves/ed25519'
import { sha256 } from '@noble/hashes/sha2'
import { NodeBufferUtils, isValidTimestamp, createSignaturePayload, Logger } from '../shared/utils'
import type { AuthHeaders, AuthResult, AuthenticatedUser } from '../shared/types'

export class AuthMiddleware {
  private logger: Logger
  private maxTimeDrift: number

  constructor(maxTimeDrift: number = 5 * 60 * 1000) {
    this.logger = new Logger('AuthMiddleware')
    this.maxTimeDrift = maxTimeDrift
  }

  /**
   * Authenticate Ed25519 signed request
   */
  async authenticateRequest(
    headers: AuthHeaders,
    method: string = 'GET',
    path: string = '',
    body?: string
  ): Promise<AuthResult> {
    const startTime = Date.now()
    
    try {
      // Extract required headers
      const sessionId = headers['x-session-id']
      const timestamp = headers['x-timestamp']
      const nonce = headers['x-nonce']
      const signature = headers['x-signature']

      this.logger.debug('Authenticating request', {
        method,
        path,
        sessionId: sessionId?.substring(0, 8) + '...',
        hasHeaders: { sessionId: !!sessionId, timestamp: !!timestamp, nonce: !!nonce, signature: !!signature }
      })

      if (!sessionId || !timestamp || !nonce || !signature) {
        this.logger.warn('Missing authentication headers', { 
          method, 
          path, 
          missingHeaders: { 
            sessionId: !sessionId, 
            timestamp: !timestamp, 
            nonce: !nonce, 
            signature: !signature 
          } 
        })
        return {
          success: false,
          error: 'Missing required authentication headers'
        }
      }

      // Validate timestamp (within configured time drift)
      const requestTime = parseInt(timestamp)
      if (!isValidTimestamp(requestTime, this.maxTimeDrift)) {
        const timeDiff = Math.abs(Date.now() - requestTime)
        this.logger.warn('Request timestamp too old', { 
          method, 
          path, 
          sessionId: sessionId.substring(0, 8) + '...', 
          timeDiff, 
          maxDrift: this.maxTimeDrift 
        })
        return {
          success: false,
          error: 'Request timestamp too old'
        }
      }

      // Validate session ID format (should be 64 char hex - Ed25519 public key)
      if (!sessionId.match(/^[0-9a-f]{64}$/i)) {
        this.logger.warn('Invalid session ID format', { 
          method, 
          path, 
          sessionIdLength: sessionId.length 
        })
        return {
          success: false,
          error: 'Invalid session ID format'
        }
      }

      // Reconstruct signed payload
      const bodyHash = body ? 
        Array.from(sha256(new TextEncoder().encode(body)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('') : ''
          
      const payload = createSignaturePayload(method, path, sessionId, requestTime, nonce, bodyHash)
      
      // Convert hex strings to Uint8Arrays
      const publicKeyBytes = this.hexToBytes(sessionId)
      const signatureBytes = this.hexToBytes(signature)
      const payloadBytes = new TextEncoder().encode(payload)

      // Verify Ed25519 signature
      const isValid = ed25519.verify(signatureBytes, payloadBytes, publicKeyBytes)
      const duration = Date.now() - startTime

      if (!isValid) {
        this.logger.warn('Invalid signature', { 
          method, 
          path, 
          sessionId: sessionId.substring(0, 8) + '...', 
          duration,
          payloadLength: payload.length
        })
        return {
          success: false,
          error: 'Invalid signature'
        }
      }

      this.logger.info('Request authenticated successfully', { 
        method, 
        path, 
        sessionId: sessionId.substring(0, 8) + '...', 
        duration,
        timeDrift: Math.abs(Date.now() - requestTime)
      })

      // Get user info
      const user = this.getUserFromSessionId(sessionId)
      
      return {
        success: true,
        sessionId,
        user: user || { 
          sessionId, 
          username: 'anonymous', 
          isAdmin: false, 
          isSuperAdmin: false 
        }
      }

    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.error('Authentication failed', { 
        method, 
        path, 
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return {
        success: false,
        error: 'Authentication failed'
      }
    }
  }

  /**
   * Verify signature without full authentication flow
   */
  async verifySignature(
    method: string,
    path: string,
    sessionId: string,
    timestamp: number,
    nonce: string,
    signature: string,
    body?: string
  ): Promise<boolean> {
    try {
      // Reconstruct signed payload
      const bodyHash = body ? 
        Array.from(sha256(new TextEncoder().encode(body)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('') : ''
          
      const payload = createSignaturePayload(method, path, sessionId, timestamp, nonce, bodyHash)
      
      // Convert hex strings to Uint8Arrays
      const publicKeyBytes = this.hexToBytes(sessionId)
      const signatureBytes = this.hexToBytes(signature)
      const payloadBytes = new TextEncoder().encode(payload)

      // Verify Ed25519 signature
      return ed25519.verify(signatureBytes, payloadBytes, publicKeyBytes)
    } catch (error) {
      this.logger.error('Signature verification failed', error)
      return false
    }
  }

  /**
   * Convert hex string to Uint8Array
   */
  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
    }
    return bytes
  }

  /**
   * Get user info from session ID
   * Override this method to implement custom user lookup
   */
  protected getUserFromSessionId(sessionId: string): AuthenticatedUser | null {
    // Default implementation - override in subclass for custom user lookup
    return {
      sessionId,
      username: 'anonymous',
      isAdmin: false,
      isSuperAdmin: false
    }
  }

  /**
   * Set custom user lookup function
   */
  setUserLookup(lookupFn: (sessionId: string) => AuthenticatedUser | null): void {
    this.getUserFromSessionId = lookupFn
  }
}