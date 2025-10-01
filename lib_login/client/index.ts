/**
 * Ed25519 Crypto Auth Library - Client Side
 * 
 * Main exports for browser/frontend usage
 */

export { CryptoSessionManager } from './CryptoSessionManager'
export { RequestSigner } from './RequestSigner'
export { SessionValidator } from './SessionValidator'

// React integration
export { useSession } from './react/useSession'

// Utilities
export { initializeSessionSafely, initializeSessionInBackground } from './sessionInit'

// Types
export type {
  AuthHeaders,
  AuthResult,
  AuthenticatedUser,
  SessionCache,
  ChallengeData,
  AuthConfig,
  SignedRequestOptions,
  RequestSignature
} from '../shared/types'

// Default instances for convenience
export { sessionManager, requestSigner } from './instances'