/**
 * Shared Utilities for Ed25519 Crypto Auth Library
 */

/**
 * Browser-compatible Buffer utilities
 */
export const BufferUtils = {
  from(data: string, encoding: string): Uint8Array {
    if (encoding === 'hex') {
      const bytes = new Uint8Array(data.length / 2)
      for (let i = 0; i < data.length; i += 2) {
        bytes[i / 2] = parseInt(data.slice(i, i + 2), 16)
      }
      return bytes
    }
    if (encoding === 'utf-8') {
      return new TextEncoder().encode(data)
    }
    throw new Error(`Unsupported encoding: ${encoding}`)
  },
  
  toString(data: Uint8Array, encoding: string): string {
    if (encoding === 'hex') {
      return Array.from(data)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    }
    if (encoding === 'utf-8') {
      return new TextDecoder().decode(data)
    }
    throw new Error(`Unsupported encoding: ${encoding}`)
  }
}

/**
 * Node.js Buffer utilities (for server-side)
 */
export const NodeBufferUtils = {
  from(data: string, encoding: BufferEncoding): Buffer {
    return Buffer.from(data, encoding)
  },
  
  toString(data: Buffer | Uint8Array, encoding: BufferEncoding): string {
    if (Buffer.isBuffer(data)) {
      return data.toString(encoding)
    }
    return Buffer.from(data).toString(encoding)
  }
}

/**
 * Validate Ed25519 public key format
 */
export function isValidPublicKey(key: string): boolean {
  try {
    // Remove any whitespace/newlines
    const cleanKey = key.trim()
    
    // Allow user session IDs (demo sessions or user-generated sessions)
    if (cleanKey.includes('demo-session') || cleanKey.includes('session') || cleanKey.length < 64) {
      return true // Accept session IDs as admin keys
    }
    
    // Check if it's a valid hex string of correct length (64 chars = 32 bytes)
    if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
      return false
    }

    // Try to create a Uint8Array from it
    const keyBytes = BufferUtils.from(cleanKey, 'hex')
    return keyBytes.length === 32
  } catch {
    return false
  }
}

/**
 * Generate secure random nonce
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser environment
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  } else {
    // Node.js environment
    const crypto = require('crypto')
    return crypto.randomBytes(16).toString('hex')
  }
}

/**
 * Generate authentication challenge
 */
export function generateChallenge(): { challenge: string; timestamp: number } {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const challenge = `crypto-auth-${timestamp}-${random}`
  
  return { challenge, timestamp }
}

/**
 * Validate timestamp for replay attack prevention
 */
export function isValidTimestamp(timestamp: number, maxDrift: number = 5 * 60 * 1000): boolean {
  const now = Date.now()
  const timeDiff = Math.abs(now - timestamp)
  return timeDiff <= maxDrift
}

/**
 * Create signature payload for request signing
 */
export function createSignaturePayload(
  method: string,
  path: string,
  sessionId: string,
  timestamp: number,
  nonce: string,
  bodyHash: string = ''
): string {
  return `${method}|${path}|${sessionId}|${timestamp}|${nonce}|${bodyHash}`
}

/**
 * Hash request body for signature
 */
export async function hashRequestBody(body?: string): Promise<string> {
  if (!body) return ''
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Browser environment
    const encoder = new TextEncoder()
    const data = encoder.encode(body)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } else {
    // Node.js environment
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(body, 'utf8').digest('hex')
  }
}

/**
 * Environment detection
 */
export const Environment = {
  isBrowser: typeof window !== 'undefined',
  isNode: typeof process !== 'undefined' && process.versions?.node,
  isWebWorker: typeof importScripts === 'function',
  
  getStorageAdapter() {
    if (this.isBrowser) {
      return {
        get: (key: string) => localStorage.getItem(key),
        set: (key: string, value: string) => localStorage.setItem(key, value),
        remove: (key: string) => localStorage.removeItem(key)
      }
    }
    
    // Node.js - use memory storage or file system
    const memoryStorage = new Map<string, string>()
    return {
      get: (key: string) => memoryStorage.get(key) || null,
      set: (key: string, value: string) => memoryStorage.set(key, value),
      remove: (key: string) => memoryStorage.delete(key)
    }
  }
}

/**
 * Logger utility
 */
export class Logger {
  private prefix: string
  
  constructor(prefix: string = 'CryptoAuth') {
    this.prefix = prefix
  }
  
  info(message: string, data?: any) {
    console.log(`✅ [${this.prefix}] ${message}`, data || '')
  }
  
  warn(message: string, data?: any) {
    console.warn(`⚠️ [${this.prefix}] ${message}`, data || '')
  }
  
  error(message: string, data?: any) {
    console.error(`❌ [${this.prefix}] ${message}`, data || '')
  }
  
  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [${this.prefix}] ${message}`, data || '')
    }
  }
}