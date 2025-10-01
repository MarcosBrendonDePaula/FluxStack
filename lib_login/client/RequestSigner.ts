/**
 * Request signing utilities for Ed25519 authentication
 */

import * as ed25519 from '@noble/ed25519'
import { sha256 } from '@noble/hashes/sha2'
import { BufferUtils, generateNonce, createSignaturePayload, hashRequestBody, Logger } from '../shared/utils'
import type { AuthHeaders, SignedRequestOptions, RequestSignature } from '../shared/types'

export class RequestSigner {
  private privateKey: Uint8Array | null = null
  private sessionId: string | null = null
  private logger: Logger

  constructor(privateKey?: Uint8Array, sessionId?: string) {
    this.privateKey = privateKey || null
    this.sessionId = sessionId || null
    this.logger = new Logger('RequestSigner')
  }

  /**
   * Set keys for signing
   */
  setKeys(privateKey: Uint8Array, sessionId: string) {
    this.privateKey = privateKey
    this.sessionId = sessionId
    this.logger.debug('Keys updated', { sessionId: sessionId.slice(0, 8) + '...' })
  }

  /**
   * Clear keys
   */
  clearKeys() {
    this.privateKey = null
    this.sessionId = null
    this.logger.debug('Keys cleared')
  }

  /**
   * Check if signer is ready
   */
  isReady(): boolean {
    return !!(this.privateKey && this.sessionId)
  }

  /**
   * Sign request with authentication headers
   */
  async signRequest(
    method: string,
    path: string,
    body?: string
  ): Promise<AuthHeaders> {
    if (!this.privateKey || !this.sessionId) {
      throw new Error('Private key and session ID required for request signing')
    }

    const timestamp = Date.now()
    const nonce = generateNonce()
    
    // Create signature payload
    const bodyHash = await hashRequestBody(body)
    const payload = createSignaturePayload(method, path, this.sessionId, timestamp, nonce, bodyHash)
    
    // Sign payload
    const payloadBytes = new TextEncoder().encode(payload)
    const signature = await ed25519.signAsync(payloadBytes, this.privateKey)
    
    const headers: AuthHeaders = {
      'x-session-id': this.sessionId,
      'x-timestamp': timestamp.toString(),
      'x-nonce': nonce,
      'x-signature': BufferUtils.toString(signature, 'hex')
    }

    this.logger.debug('Request signed', { 
      method, 
      path, 
      sessionId: this.sessionId.slice(0, 8) + '...',
      timestamp,
      payloadLength: payload.length
    })

    return headers
  }

  /**
   * Create request signature object
   */
  async createSignature(
    method: string,
    path: string,
    body?: string
  ): Promise<RequestSignature> {
    const headers = await this.signRequest(method, path, body)
    
    return {
      sessionId: headers['x-session-id'],
      timestamp: parseInt(headers['x-timestamp']),
      nonce: headers['x-nonce'],
      signature: headers['x-signature']
    }
  }

  /**
   * Make authenticated request
   */
  async authenticatedFetch(
    url: string,
    options: SignedRequestOptions = {}
  ): Promise<Response> {
    // Skip auth if explicitly requested
    if (options.skipAuth) {
      const { skipAuth, ...fetchOptions } = options
      return fetch(url, fetchOptions)
    }

    if (!this.isReady()) {
      throw new Error('RequestSigner not ready. Call setKeys() first.')
    }

    const method = options.method || 'GET'
    const path = new URL(url, window.location?.origin || 'http://localhost').pathname
    const body = options.body ? options.body.toString() : undefined

    const authHeaders = await this.signRequest(method, path, body)

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...authHeaders
      }
    })

    this.logger.debug('Authenticated request completed', {
      method,
      url,
      status: response.status,
      ok: response.ok
    })

    return response
  }

  /**
   * Make authenticated JSON request
   */
  async authenticatedJson<T = any>(
    url: string,
    options: SignedRequestOptions = {}
  ): Promise<T> {
    const response = await this.authenticatedFetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  async get<T = any>(url: string, options: SignedRequestOptions = {}): Promise<T> {
    return this.authenticatedJson<T>(url, { ...options, method: 'GET' })
  }

  async post<T = any>(url: string, data?: any, options: SignedRequestOptions = {}): Promise<T> {
    return this.authenticatedJson<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T = any>(url: string, data?: any, options: SignedRequestOptions = {}): Promise<T> {
    return this.authenticatedJson<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async patch<T = any>(url: string, data?: any, options: SignedRequestOptions = {}): Promise<T> {
    return this.authenticatedJson<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T = any>(url: string, options: SignedRequestOptions = {}): Promise<T> {
    return this.authenticatedJson<T>(url, { ...options, method: 'DELETE' })
  }

  /**
   * Verify signature (for testing)
   */
  async verifySignature(
    method: string,
    path: string,
    body: string | undefined,
    signature: RequestSignature,
    publicKey: string
  ): Promise<boolean> {
    try {
      const payload = createSignaturePayload(
        method,
        path,
        signature.sessionId,
        signature.timestamp,
        signature.nonce,
        await hashRequestBody(body)
      )

      const payloadBytes = new TextEncoder().encode(payload)
      const signatureBytes = BufferUtils.from(signature.signature, 'hex')
      const publicKeyBytes = BufferUtils.from(publicKey, 'hex')

      return await ed25519.verifyAsync(signatureBytes, payloadBytes, publicKeyBytes)
    } catch (error) {
      this.logger.error('Signature verification failed', error)
      return false
    }
  }
}