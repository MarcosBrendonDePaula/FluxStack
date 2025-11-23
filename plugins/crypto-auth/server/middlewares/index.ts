/**
 * Crypto Auth Middlewares
 * Exports centralizados de todos os middlewares
 */

export { cryptoAuthAdmin } from './cryptoAuthAdmin'
export { cryptoAuthOptional } from './cryptoAuthOptional'
export { cryptoAuthPermissions } from './cryptoAuthPermissions'
// Types
export type { CryptoAuthMiddlewareOptions } from './cryptoAuthRequired'
// Middlewares
export { cryptoAuthRequired } from './cryptoAuthRequired'
// Helpers
export {
  type CryptoAuthUser,
  getCryptoAuthUser,
  hasCryptoAuthPermission,
  isCryptoAuthAdmin,
  isCryptoAuthAuthenticated,
} from './helpers'
