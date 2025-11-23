/**
 * Exportações do servidor de autenticação
 */

export type { AuthMiddlewareConfig, AuthMiddlewareResult } from './AuthMiddleware'
export { AuthMiddleware } from './AuthMiddleware'
export type { AuthResult, CryptoAuthConfig } from './CryptoAuthService'
export { CryptoAuthService } from './CryptoAuthService'
export type { CryptoAuthMiddlewareOptions, CryptoAuthUser } from './middlewares'
// Middlewares Elysia
export {
  cryptoAuthAdmin,
  cryptoAuthOptional,
  cryptoAuthPermissions,
  cryptoAuthRequired,
  getCryptoAuthUser,
  hasCryptoAuthPermission,
  isCryptoAuthAdmin,
  isCryptoAuthAuthenticated,
} from './middlewares'
