/**
 * Core Server Middleware
 * FluxStack middleware infrastructure exports
 */

export {
  errorHandlingMiddleware,
  notFoundMiddleware,
  createError,
  asyncHandler
} from './errorHandling.js'

export type {
  ErrorHandlingOptions,
  FluxStackError
} from './errorHandling.js'

// Elysia Middleware Helpers
export {
  createMiddleware,
  createDerive,
  createGuard,
  createRateLimit,
  composeMiddleware,
  isDevelopment,
  isProduction,
  isTest
} from './elysia-helpers.js'

export type {
  MiddlewareOptions
} from './elysia-helpers.js'