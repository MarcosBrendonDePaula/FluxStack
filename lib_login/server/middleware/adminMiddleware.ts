/**
 * Admin authentication middleware factories
 */

import { AdminAuthService } from '../AdminAuthService'
import type { AuthConfig } from '../../shared/types'

/**
 * Create Express.js admin middleware
 */
export function createExpressAdminMiddleware(config: AuthConfig = {}) {
  const adminAuth = new AdminAuthService(config)

  return (req: any, res: any, next: any) => {
    try {
      const sessionId = req.headers['x-admin-session']
      
      if (!sessionId) {
        return res.status(401).json({
          success: false,
          error: 'Admin session required'
        })
      }

      const validation = adminAuth.validateAdminSession(sessionId)
      if (!validation.valid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired admin session'
        })
      }

      // Add admin info to request
      req.admin = {
        sessionId,
        session: validation.session
      }

      next()
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Admin middleware error'
      })
    }
  }
}

/**
 * Create Fastify admin plugin
 */
export function createFastifyAdminPlugin(config: AuthConfig = {}) {
  const adminAuth = new AdminAuthService(config)

  return async function (fastify: any) {
    fastify.addHook('preHandler', async (request: any, reply: any) => {
      try {
        const sessionId = request.headers['x-admin-session']
        
        if (!sessionId) {
          reply.status(401).send({
            success: false,
            error: 'Admin session required'
          })
          return
        }

        const validation = adminAuth.validateAdminSession(sessionId)
        if (!validation.valid) {
          reply.status(401).send({
            success: false,
            error: 'Invalid or expired admin session'
          })
          return
        }

        // Add admin info to request
        request.admin = {
          sessionId,
          session: validation.session
        }
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: 'Admin middleware error'
        })
      }
    })
  }
}

/**
 * Create Elysia admin plugin
 */
export function createElysiaAdminPlugin(config: AuthConfig = {}) {
  const adminAuth = new AdminAuthService(config)

  return (app: any) => {
    return app.derive(({ headers, set }: any) => {
      try {
        const sessionId = headers['x-admin-session']
        
        if (!sessionId) {
          set.status = 401
          return {
            success: false,
            error: 'Admin session required'
          }
        }

        const validation = adminAuth.validateAdminSession(sessionId)
        if (!validation.valid) {
          set.status = 401
          return {
            success: false,
            error: 'Invalid or expired admin session'
          }
        }

        return {
          admin: {
            sessionId,
            session: validation.session
          }
        }
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: 'Admin middleware error'
        }
      }
    })
  }
}

/**
 * Generic admin middleware function
 */
export function createGenericAdminMiddleware(config: AuthConfig = {}) {
  const adminAuth = new AdminAuthService(config)

  return {
    validateSession: adminAuth.validateAdminSession.bind(adminAuth),
    authenticate: adminAuth.authenticateAdmin.bind(adminAuth),
    generateChallenge: adminAuth.generateChallenge.bind(adminAuth),
    addAdminKey: adminAuth.addAdminPublicKey.bind(adminAuth),
    removeAdminKey: adminAuth.removeAdminPublicKey.bind(adminAuth),
    getStats: adminAuth.getAdminStats.bind(adminAuth),
    getActiveSessions: adminAuth.getActiveSessions.bind(adminAuth)
  }
}