/**
 * Crypto Auth Middlewares
 * Middlewares Elysia para autenticação criptográfica
 *
 * Uso:
 * ```typescript
 * import { cryptoAuthRequired, cryptoAuthAdmin } from '@/plugins/crypto-auth/server'
 *
 * export const myRoutes = new Elysia()
 *   .use(cryptoAuthRequired())
 *   .get('/protected', ({ request }) => {
 *     const user = (request as any).user
 *     return { user }
 *   })
 * ```
 */

import { Elysia } from 'elysia'
import type { Logger } from '@/core/utils/logger'

export interface CryptoAuthUser {
  publicKey: string
  isAdmin: boolean
  permissions: string[]
}

export interface CryptoAuthMiddlewareOptions {
  logger?: Logger
}

/**
 * Get auth service from global
 */
function getAuthService() {
  const service = (global as any).cryptoAuthService
  if (!service) {
    throw new Error('CryptoAuthService not initialized. Make sure crypto-auth plugin is loaded.')
  }
  return service
}

/**
 * Get auth middleware from global
 */
function getAuthMiddleware() {
  const middleware = (global as any).cryptoAuthMiddleware
  if (!middleware) {
    throw new Error('AuthMiddleware not initialized. Make sure crypto-auth plugin is loaded.')
  }
  return middleware
}

/**
 * Extract and validate authentication from request
 */
async function validateAuth(request: Request, logger?: Logger): Promise<{
  success: boolean
  user?: CryptoAuthUser
  error?: string
}> {
  const authMiddleware = getAuthMiddleware()

  // Build minimal context for middleware
  const context = {
    request,
    path: new URL(request.url).pathname,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    query: {},
    params: {},
    startTime: Date.now()
  }

  // Authenticate
  const result = await authMiddleware.authenticate(context)

  if (!result.success) {
    logger?.warn('Crypto auth validation failed', {
      path: context.path,
      error: result.error
    })
  }

  return result
}

/**
 * Middleware que REQUER autenticação
 *
 * @example
 * ```typescript
 * export const protectedRoutes = new Elysia()
 *   .use(cryptoAuthRequired())
 *   .get('/users', ({ request }) => {
 *     const user = (request as any).user
 *     return { publicKey: user.publicKey }
 *   })
 * ```
 */
export const cryptoAuthRequired = (options: CryptoAuthMiddlewareOptions = {}) => {
  return new Elysia({ name: 'crypto-auth-required' })
    .derive(async ({ request, set }) => {
      const result = await validateAuth(request, options.logger)

      if (!result.success) {
        set.status = 401
        return {
          error: {
            message: result.error || 'Authentication required',
            code: 'CRYPTO_AUTH_REQUIRED',
            statusCode: 401
          }
        }
      }

      // Add user to request
      ;(request as any).user = result.user

      return {}
    })
}

/**
 * Middleware que REQUER ser administrador
 *
 * @example
 * ```typescript
 * export const adminRoutes = new Elysia()
 *   .use(cryptoAuthAdmin())
 *   .delete('/users/:id', ({ params }) => {
 *     return { deleted: params.id }
 *   })
 * ```
 */
export const cryptoAuthAdmin = (options: CryptoAuthMiddlewareOptions = {}) => {
  return new Elysia({ name: 'crypto-auth-admin' })
    .derive(async ({ request, set }) => {
      const result = await validateAuth(request, options.logger)

      if (!result.success) {
        set.status = 401
        return {
          error: {
            message: result.error || 'Authentication required',
            code: 'CRYPTO_AUTH_REQUIRED',
            statusCode: 401
          }
        }
      }

      // Check if user is admin
      if (!result.user?.isAdmin) {
        set.status = 403
        options.logger?.warn('Admin access denied', {
          publicKey: result.user?.publicKey.substring(0, 8) + '...',
          permissions: result.user?.permissions
        })
        return {
          error: {
            message: 'Admin privileges required',
            code: 'ADMIN_REQUIRED',
            statusCode: 403,
            yourPermissions: result.user?.permissions || []
          }
        }
      }

      // Add user to request
      ;(request as any).user = result.user

      return {}
    })
}

/**
 * Middleware que REQUER permissões específicas
 *
 * @example
 * ```typescript
 * export const writeRoutes = new Elysia()
 *   .use(cryptoAuthPermissions(['write']))
 *   .post('/posts', ({ body }) => {
 *     return { created: body }
 *   })
 * ```
 */
export const cryptoAuthPermissions = (
  requiredPermissions: string[],
  options: CryptoAuthMiddlewareOptions = {}
) => {
  return new Elysia({ name: 'crypto-auth-permissions' })
    .derive(async ({ request, set }) => {
      const result = await validateAuth(request, options.logger)

      if (!result.success) {
        set.status = 401
        return {
          error: {
            message: result.error || 'Authentication required',
            code: 'CRYPTO_AUTH_REQUIRED',
            statusCode: 401
          }
        }
      }

      // Check permissions
      const userPermissions = result.user?.permissions || []
      const hasAllPermissions = requiredPermissions.every(
        perm => userPermissions.includes(perm) || userPermissions.includes('admin')
      )

      if (!hasAllPermissions) {
        set.status = 403
        options.logger?.warn('Permission denied', {
          publicKey: result.user?.publicKey.substring(0, 8) + '...',
          required: requiredPermissions,
          has: userPermissions
        })
        return {
          error: {
            message: 'Insufficient permissions',
            code: 'PERMISSION_DENIED',
            statusCode: 403,
            required: requiredPermissions,
            yours: userPermissions
          }
        }
      }

      // Add user to request
      ;(request as any).user = result.user

      return {}
    })
}

/**
 * Middleware OPCIONAL - adiciona user se autenticado, mas não requer
 * Útil para rotas que têm comportamento diferente se autenticado
 *
 * @example
 * ```typescript
 * export const mixedRoutes = new Elysia()
 *   .use(cryptoAuthOptional())
 *   .get('/posts/:id', ({ request, params }) => {
 *     const user = (request as any).user
 *     return {
 *       post: { id: params.id },
 *       canEdit: user?.isAdmin || false
 *     }
 *   })
 * ```
 */
export const cryptoAuthOptional = (options: CryptoAuthMiddlewareOptions = {}) => {
  return new Elysia({ name: 'crypto-auth-optional' })
    .derive(async ({ request }) => {
      try {
        const result = await validateAuth(request, options.logger)

        if (result.success && result.user) {
          // Add user to request if authentication succeeded
          ;(request as any).user = result.user
        }
        // If authentication failed, just continue without user
      } catch (error) {
        // Silently fail - this is optional auth
        options.logger?.debug('Optional auth failed (expected)', { error })
      }

      return {}
    })
}

/**
 * Helper: Obter usuário autenticado do request
 *
 * @example
 * ```typescript
 * .get('/me', ({ request }) => {
 *   const user = getCryptoAuthUser(request)
 *   return { user }
 * })
 * ```
 */
export function getCryptoAuthUser(request: Request): CryptoAuthUser | null {
  return (request as any).user || null
}

/**
 * Helper: Verificar se request está autenticado
 */
export function isCryptoAuthAuthenticated(request: Request): boolean {
  return !!(request as any).user
}

/**
 * Helper: Verificar se usuário é admin
 */
export function isCryptoAuthAdmin(request: Request): boolean {
  const user = getCryptoAuthUser(request)
  return user?.isAdmin || false
}

/**
 * Helper: Verificar se usuário tem permissão específica
 */
export function hasCryptoAuthPermission(request: Request, permission: string): boolean {
  const user = getCryptoAuthUser(request)
  if (!user) return false
  return user.permissions.includes(permission) || user.permissions.includes('admin')
}
