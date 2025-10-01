/**
 * Basic Session Routes - Framework Agnostic
 * Provides session management endpoints
 */

import { generateChallenge, Logger } from '../shared/utils'

export class SessionRoutes {
  private logger: Logger

  constructor() {
    this.logger = new Logger('SessionRoutes')
  }

  /**
   * Test endpoint
   */
  async handleTest() {
    this.logger.info('Session test endpoint called')
    
    return {
      message: 'Crypto session system is ready',
      timestamp: new Date().toISOString(),
      features: [
        'Ed25519 Cryptographic Sessions',
        'Request Signature Authentication',
        'Anonymous User Sessions',
        'Admin Authentication System'
      ]
    }
  }

  /**
   * Generate challenge for authentication
   */
  async handleChallenge(body: { publicKey: string }) {
    const { publicKey } = body
    const startTime = Date.now()
    
    this.logger.info('Challenge requested', { publicKey: publicKey?.substring(0, 8) + '...' })
    
    if (!publicKey || !/^[0-9a-f]{64}$/i.test(publicKey)) {
      const duration = Date.now() - startTime
      this.logger.warn('Invalid public key format', { 
        publicKey: publicKey?.substring(0, 16) + '...', 
        length: publicKey?.length,
        duration
      })
      
      return {
        error: 'Invalid public key format. Expected 64 hex characters (32 bytes)',
        code: 'INVALID_PUBLIC_KEY'
      }
    }
    
    const challengeData = generateChallenge()
    const expiresAt = Date.now() + (5 * 60 * 1000) // 5 minutes
    const duration = Date.now() - startTime
    
    this.logger.info('Challenge generated', {
      publicKey: publicKey.substring(0, 8) + '...',
      challengeId: challengeData.challenge.split('-')[2],
      expiresIn: 5 * 60 * 1000,
      duration
    })
    
    return {
      challenge: challengeData.challenge,
      timestamp: challengeData.timestamp,
      expiresAt,
      instructions: 'Sign this challenge with your private key and send to /session/auth',
      publicKey
    }
  }

  /**
   * Mock authentication (for testing)
   */
  async handleAuth(body: { 
    publicKey: string
    signature: string
    challenge: string
    timestamp?: number 
  }) {
    const { publicKey, signature, challenge } = body
    const startTime = Date.now()
    
    this.logger.info('Authentication attempt', { 
      publicKey: publicKey?.substring(0, 8) + '...',
      hasSignature: !!signature,
      hasChallenge: !!challenge
    })
    
    // Basic validation
    if (!publicKey || !signature || !challenge) {
      const duration = Date.now() - startTime
      this.logger.warn('Missing authentication parameters', {
        missing: { publicKey: !publicKey, signature: !signature, challenge: !challenge },
        duration
      })
      
      return {
        error: 'Missing required parameters',
        code: 'MISSING_PARAMS'
      }
    }
    
    const duration = Date.now() - startTime
    const sessionId = publicKey.toLowerCase()
    
    this.logger.info('Authentication successful (mock)', {
      sessionId: sessionId.substring(0, 8) + '...',
      duration,
      expiresIn: 24 * 60 * 60 * 1000
    })
    
    // Mock successful auth (in real implementation, verify signature)
    return {
      success: true,
      sessionId,
      message: 'Session authenticated successfully (mock)',
      expiresIn: 24 * 60 * 60 * 1000 // 24 hours
    }
  }

  /**
   * Get session info
   */
  async handleSessionInfo(sessionId: string) {
    const startTime = Date.now()
    
    this.logger.info('Session info requested', { sessionId: sessionId?.substring(0, 8) + '...' })
    
    if (!sessionId || !/^[0-9a-f]{64}$/i.test(sessionId)) {
      const duration = Date.now() - startTime
      this.logger.warn('Invalid session ID format', { 
        sessionId: sessionId?.substring(0, 16) + '...',
        length: sessionId?.length,
        duration
      })
      
      return {
        error: 'Invalid session ID format',
        code: 'INVALID_SESSION'
      }
    }
    
    const duration = Date.now() - startTime
    const sessionInfo = {
      sessionId,
      status: 'active',
      type: 'cryptographic',
      algorithm: 'Ed25519',
      orders: [],
      stats: {
        totalOrders: 0,
        completedOrders: 0,
        totalSpent: 0
      }
    }
    
    this.logger.info('Session info retrieved', {
      sessionId: sessionId.substring(0, 8) + '...',
      duration,
      status: sessionInfo.status,
      algorithm: sessionInfo.algorithm
    })
    
    return sessionInfo
  }

  /**
   * Create Express.js routes
   */
  createExpressRoutes() {
    const express = require('express')
    const router = express.Router()

    router.get('/test', async (req: any, res: any) => {
      try {
        const result = await this.handleTest()
        res.json(result)
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
      }
    })

    router.post('/challenge', async (req: any, res: any) => {
      try {
        const result = await this.handleChallenge(req.body)
        res.json(result)
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
      }
    })

    router.post('/auth', async (req: any, res: any) => {
      try {
        const result = await this.handleAuth(req.body)
        res.json(result)
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
      }
    })

    router.get('/info/:sessionId', async (req: any, res: any) => {
      try {
        const result = await this.handleSessionInfo(req.params.sessionId)
        res.json(result)
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
      }
    })

    return router
  }

  /**
   * Create Fastify routes
   */
  createFastifyRoutes() {
    return async (fastify: any) => {
      fastify.get('/test', async () => {
        return await this.handleTest()
      })

      fastify.post('/challenge', async (request: any) => {
        return await this.handleChallenge(request.body)
      })

      fastify.post('/auth', async (request: any) => {
        return await this.handleAuth(request.body)
      })

      fastify.get('/info/:sessionId', async (request: any) => {
        return await this.handleSessionInfo(request.params.sessionId)
      })
    }
  }

  /**
   * Create Elysia routes
   */
  createElysiaRoutes() {
    const { Elysia, t } = require('elysia')
    
    return new Elysia({ prefix: '/session' })
      .get('/test', async () => {
        return await this.handleTest()
      })
      
      .post('/challenge', async ({ body }) => {
        return await this.handleChallenge(body)
      }, {
        body: t.Object({
          publicKey: t.String()
        })
      })
      
      .post('/auth', async ({ body }) => {
        return await this.handleAuth(body)
      }, {
        body: t.Object({
          publicKey: t.String(),
          signature: t.String(),
          challenge: t.String(),
          timestamp: t.Optional(t.Number())
        })
      })
      
      .get('/info/:sessionId', async ({ params }) => {
        return await this.handleSessionInfo(params.sessionId)
      }, {
        params: t.Object({
          sessionId: t.String()
        })
      })
  }
}