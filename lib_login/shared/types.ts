/**
 * Shared Types for Ed25519 Crypto Auth Library
 */

export interface AuthHeaders {
  'x-session-id': string
  'x-timestamp': string
  'x-nonce': string
  'x-signature': string
  [key: string]: string | undefined
}

export interface AuthResult {
  success: boolean
  sessionId?: string
  error?: string
  user?: AuthenticatedUser
}

export interface AuthenticatedUser {
  sessionId: string
  username: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

export interface SessionCache {
  sessionId: string
  publicKey: string
  createdAt: number
  lastUsed: number
}

export interface AdminSession {
  publicKey: string
  authenticated: boolean
  authenticatedAt: Date
  lastActivity: Date
  permissions: string[]
}

export interface ChallengeData {
  challenge: string
  timestamp: number
}

export interface AuthConfig {
  sessionTimeout?: number // milliseconds
  maxTimeDrift?: number // milliseconds
  adminKeys?: string[]
  storage?: 'localStorage' | 'sessionStorage' | 'memory'
  autoInit?: boolean
}

export interface ValidationResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  details?: any
  duration?: number
}

export interface ValidationSummary {
  totalTests: number
  passed: number
  failed: number
  warnings: number
  duration: number
  results: ValidationResult[]
}

// Request signing types
export interface SignedRequestOptions extends RequestInit {
  skipAuth?: boolean
}

export interface RequestSignature {
  sessionId: string
  timestamp: number
  nonce: string
  signature: string
}

// Admin auth types
export interface AdminAuthResult {
  success: boolean
  sessionId?: string
  error?: string
}

export interface AdminStats {
  totalAdminKeys: number
  activeSessions: number
  sessionTimeout: number
  adminKeys: Array<{
    keyPrefix: string
    fullKey: string
  }>
}

export interface ActiveSession {
  sessionId: string
  keyPrefix: string
  authenticatedAt: Date
  lastActivity: Date
  permissions: string[]
}