/**
 * Framework-agnostic authentication middleware factories
 */

import { AuthMiddleware } from '../AuthMiddleware'
import { AdminAuthService } from '../AdminAuthService'
import type { AuthConfig, AuthHeaders } from '../../shared/types'

/**
 * Create Express.js middleware
 */
export function createExpressAuthMiddleware(config: AuthConfig = {}) {
  const authMiddleware = new AuthMiddleware(config.maxTimeDrift)
  
  if (config.adminKeys) {
    // Set up user lookup to check admin status
    authMiddleware.setUserLookup((sessionId) => {
      const isAdmin = config.adminKeys!.includes(sessionId)
      return {
        sessionId,
        username: isAdmin ? 'admin' : 'user',
        isAdmin,
        isSuperAdmin: isAdmin
      }
    })
  }

  return async (req: any, res: any, next: any) => {
    try {
      const headers = req.headers as AuthHeaders
      const method = req.method
      const path = req.path || req.url
      const body = req.body ? JSON.stringify(req.body) : undefined

      const result = await authMiddleware.authenticateRequest(headers, method, path, body)

      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: result.error
        })
      }

      // Add auth info to request
      req.auth = {
        sessionId: result.sessionId,
        user: result.user
      }

      next()
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Authentication middleware error'
      })
    }
  }
}

/**
 * Create Fastify plugin
 */
export function createFastifyAuthPlugin(config: AuthConfig = {}) {
  const authMiddleware = new AuthMiddleware(config.maxTimeDrift)
  
  if (config.adminKeys) {
    authMiddleware.setUserLookup((sessionId) => {
      const isAdmin = config.adminKeys!.includes(sessionId)
      return {
        sessionId,
        username: isAdmin ? 'admin' : 'user',
        isAdmin,
        isSuperAdmin: isAdmin
      }
    })
  }

  return async function (fastify: any) {
    fastify.addHook('preHandler', async (request: any, reply: any) => {
      try {
        const headers = request.headers as AuthHeaders
        const method = request.method
        const path = request.url
        const body = request.body ? JSON.stringify(request.body) : undefined

        const result = await authMiddleware.authenticateRequest(headers, method, path, body)

        if (!result.success) {
          reply.status(401).send({
            success: false,
            error: result.error
          })
          return
        }

        // Add auth info to request
        request.auth = {
          sessionId: result.sessionId,
          user: result.user
        }
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: 'Authentication middleware error'
        })
      }
    })
  }
}

/**
 * Create Elysia plugin
 */
export function createElysiaAuthPlugin(config: AuthConfig = {}) {
  const authMiddleware = new AuthMiddleware(config.maxTimeDrift)
  
  if (config.adminKeys) {
    authMiddleware.setUserLookup((sessionId) => {
      const isAdmin = config.adminKeys!.includes(sessionId)
      return {
        sessionId,
        username: isAdmin ? 'admin' : 'user',
        isAdmin,
        isSuperAdmin: isAdmin
      }
    })
  }

  return (app: any) => {
    return app.derive(async ({ headers, request, set }: any) => {
      try {
        const method = request.method
        const path = new URL(request.url).pathname
        const body = request.body ? JSON.stringify(request.body) : undefined

        const result = await authMiddleware.authenticateRequest(headers as AuthHeaders, method, path, body)

        if (!result.success) {
          set.status = 401
          return {
            success: false,
            error: result.error
          }
        }

        return {
          auth: {
            sessionId: result.sessionId,
            user: result.user
          }
        }
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: 'Authentication middleware error'
        }
      }
    })
  }
}

/**
 * Generic middleware function for custom frameworks
 */
export function createGenericAuthMiddleware(config: AuthConfig = {}) {
  const authMiddleware = new AuthMiddleware(config.maxTimeDrift)
  
  if (config.adminKeys) {
    authMiddleware.setUserLookup((sessionId) => {
      const isAdmin = config.adminKeys!.includes(sessionId)
      return {
        sessionId,
        username: isAdmin ? 'admin' : 'user',
        isAdmin,
        isSuperAdmin: isAdmin
      }
    })
  }

  return {
    authenticate: authMiddleware.authenticateRequest.bind(authMiddleware),
    verifySignature: authMiddleware.verifySignature.bind(authMiddleware),
    setUserLookup: authMiddleware.setUserLookup.bind(authMiddleware)
  }
}