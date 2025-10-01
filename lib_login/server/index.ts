/**
 * Ed25519 Crypto Auth Library - Server Side
 * 
 * Main exports for backend/server usage
 */

export { AdminAuthService } from './AdminAuthService'
export { AuthMiddleware } from './AuthMiddleware'
export { SessionRoutes } from './SessionRoutes'
export { AdminRoutes } from './AdminRoutes'

// Middleware factories
export { createAuthMiddleware } from './middleware/authMiddleware'
export { createAdminMiddleware } from './middleware/adminMiddleware'

// Utilities
export { authenticateRequest, verifySignature } from './utils/authUtils'

// Types
export type {
  AuthHeaders,
  AuthResult,
  AuthenticatedUser,
  AdminSession,
  AdminAuthResult,
  AdminStats,
  ActiveSession,
  AuthConfig
} from '../shared/types'

// Default instances for convenience
export { adminAuth } from './instances'