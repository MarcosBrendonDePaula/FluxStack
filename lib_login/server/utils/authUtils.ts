/**
 * Authentication utility functions
 */

import { AuthMiddleware } from '../AuthMiddleware'
import type { AuthHeaders, AuthResult } from '../../shared/types'

// Global auth middleware instance
const globalAuthMiddleware = new AuthMiddleware()

/**
 * Authenticate request using global middleware
 */
export async function authenticateRequest(
  headers: AuthHeaders,
  method: string = 'GET',
  path: string = '',
  body?: string
): Promise<AuthResult> {
  return globalAuthMiddleware.authenticateRequest(headers, method, path, body)
}

/**
 * Verify signature using global middleware
 */
export async function verifySignature(
  method: string,
  path: string,
  sessionId: string,
  timestamp: number,
  nonce: string,
  signature: string,
  body?: string
): Promise<boolean> {
  return globalAuthMiddleware.verifySignature(method, path, sessionId, timestamp, nonce, signature, body)
}

/**
 * Set custom user lookup function
 */
export function setUserLookup(lookupFn: (sessionId: string) => any): void {
  globalAuthMiddleware.setUserLookup(lookupFn)
}

/**
 * Create new auth middleware instance with custom config
 */
export function createAuthMiddleware(maxTimeDrift?: number): AuthMiddleware {
  return new AuthMiddleware(maxTimeDrift)
}