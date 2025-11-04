/**
 * Example: Rate Limiter Plugin
 * Demonstrates use of HTTP hooks and Error hooks
 */

import type { FluxStack, RequestContext, ResponseContext, ErrorContext } from "@/core/plugins/types"

type Plugin = FluxStack.Plugin

// In-memory store (in production, use Redis)
const rateLimitStore = new Map<string, { requests: number; resetTime: number }>()

export const rateLimiterPlugin: Plugin = {
  name: 'rate-limiter',
  version: '1.0.0',
  description: 'Rate limiting plugin to prevent abuse',
  author: 'FluxStack Team',
  category: 'security',
  tags: ['rate-limit', 'security', 'throttling'],
  priority: 'highest', // Highest priority to block early

  configSchema: {
    type: 'object',
    properties: {
      maxRequests: { type: 'number' },
      windowMs: { type: 'number' },
      blockDuration: { type: 'number' }
    }
  },

  defaultConfig: {
    maxRequests: 100,      // Max requests per window
    windowMs: 60000,       // Time window (1 minute)
    blockDuration: 300000  // Block duration (5 minutes)
  },

  // ✅ Before request - check rate limit
  onBeforeRequest: async (ctx: RequestContext) => {
    const clientId = getClientId(ctx)
    const now = Date.now()

    let clientData = rateLimitStore.get(clientId)

    // Initialize or reset if window expired
    if (!clientData || now > clientData.resetTime) {
      clientData = {
        requests: 0,
        resetTime: now + 60000 // 1 minute
      }
      rateLimitStore.set(clientId, clientData)
    }

    // Increment request count
    clientData.requests++

    // Check if limit exceeded
    if (clientData.requests > 100) {
      // Rate limit exceeded
      throw new RateLimitError('Rate limit exceeded', {
        limit: 100,
        remaining: 0,
        reset: clientData.resetTime,
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      })
    }

    // Add rate limit info to context
    (ctx as any).rateLimit = {
      limit: 100,
      remaining: 100 - clientData.requests,
      reset: clientData.resetTime
    }
  },

  // ✅ After response - add rate limit headers
  onAfterResponse: async (ctx: ResponseContext) => {
    const rateLimit = (ctx as any).rateLimit

    if (rateLimit && ctx.response) {
      // Add rate limit headers
      ctx.response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString())
      ctx.response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
      ctx.response.headers.set('X-RateLimit-Reset', new Date(rateLimit.reset).toISOString())
    }
  },

  // ✅ Handle rate limit error
  onRateLimitError: async (ctx: ErrorContext) => {
    const error = ctx.error as any

    ctx.response = new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: error.message,
        limit: error.info?.limit,
        remaining: 0,
        reset: error.info?.reset,
        retryAfter: error.info?.retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': error.info?.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': error.info?.limit?.toString() || '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(error.info?.reset || Date.now()).toISOString()
        }
      }
    )

    ctx.handled = true
    ctx.errorType = 'rateLimit'
  },

  // ✅ Response status hook - log rate limit violations
  onResponseStatus: async (ctx: ResponseContext) => {
    if (ctx.statusCode === 429) {
      console.warn(`⚠️  Rate limit exceeded: ${ctx.path}`, {
        clientId: getClientId(ctx),
        method: ctx.method,
        path: ctx.path
      })
    }
  },

  // ✅ Filters - modify request to add rate limit info
  filters: {
    filterResponseBody: async (data: any, ctx: ResponseContext) => {
      // Add rate limit info to all responses
      const rateLimit = (ctx as any).rateLimit

      if (rateLimit && data && typeof data === 'object') {
        return {
          ...data,
          _rateLimit: {
            limit: rateLimit.limit,
            remaining: rateLimit.remaining,
            reset: new Date(rateLimit.reset).toISOString()
          }
        }
      }

      return data
    }
  },

  // ✅ Health check - clean up old entries
  onHealthCheck: async (context) => {
    const now = Date.now()
    let cleaned = 0

    for (const [clientId, data] of rateLimitStore.entries()) {
      if (now > data.resetTime + 300000) { // 5 minutes after reset
        rateLimitStore.delete(clientId)
        cleaned++
      }
    }

    context.logger.info('Rate limiter health check', {
      activeClients: rateLimitStore.size,
      cleaned
    })
  }
}

// Helper functions
function getClientId(ctx: RequestContext | ResponseContext): string {
  // Try to get client ID from headers
  const clientIdHeader = ctx.headers['x-client-id']
  if (clientIdHeader) return clientIdHeader

  // Fallback to IP address (in production, handle proxies)
  const forwardedFor = ctx.headers['x-forwarded-for']
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Fallback to a hash of user agent + path
  const userAgent = ctx.headers['user-agent'] || 'unknown'
  return `${ctx.path}:${hashString(userAgent)}`
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}

class RateLimitError extends Error {
  info: any

  constructor(message: string, info: any) {
    super(message)
    this.name = 'RateLimitError'
    this.info = info
  }
}

export default rateLimiterPlugin
