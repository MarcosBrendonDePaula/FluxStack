/**
 * Global instances for convenience
 */

import { AdminAuthService } from './AdminAuthService'
import { AuthMiddleware } from './AuthMiddleware'

/**
 * Global admin auth instance
 */
export const adminAuth = new AdminAuthService()

/**
 * Global auth middleware instance
 */
export const authMiddleware = new AuthMiddleware()