/**
 * Rate Limiting Middleware
 * Implements rate limiting to prevent abuse
 */

import type { Context } from 'elysia'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (context: Context) => string // Custom key generator
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  message?: string // Custom error message
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

/**
 * In-memory rate limit store
 * In production, you'd want to use Redis or another distributed store
 */
class MemoryStore {
  private store = new Map<string, RateLimitEntry>()

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key)
    
    // Clean up expired entries
    if (entry && entry.resetTime < Date.now()) {
      this.store.delete(key)
      return undefined
    }
    
    return entry
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry)
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now()
    const existing = this.get(key)
    
    if (existing) {
      existing.count++
      return existing
    } else {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs
      }
      this.set(key, newEntry)
      return newEntry
    }
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key)
      }
    }
  }
}

const store = new MemoryStore()

// Cleanup expired entries every minute
setInterval(() => {
  store.cleanup()
}, 60000)

/**
 * Create rate limiting middleware
 */
export const rateLimitMiddleware = (config: RateLimitConfig) => ({
  name: 'rate-limit',
  
  beforeHandle: async (context: Context) => {
    const key = config.keyGenerator 
      ? config.keyGenerator(context)
      : getDefaultKey(context)
    
    const entry = store.increment(key, config.windowMs)
    
    // Add rate limit headers
    const headers = {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, config.maxRequests - entry.count).toString(),
      'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString()
    }

    // Check if rate limit exceeded
    if (entry.count > config.maxRequests) {
      return new Response(
        JSON.stringify({
          error: config.message || 'Too many requests',
          retryAfter: Math.ceil((entry.resetTime - Date.now()) / 1000)
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((entry.resetTime - Date.now()) / 1000).toString(),
            ...headers
          }
        }
      )
    }

    // Add headers to successful responses
    context.set.headers = { ...context.set.headers, ...headers }
  }
})

/**
 * Default key generator (IP-based)
 */
function getDefaultKey(context: Context): string {
  // Try to get real IP from various headers
  const forwarded = context.headers['x-forwarded-for']
  const realIp = context.headers['x-real-ip']
  const cfConnectingIp = context.headers['cf-connecting-ip']
  
  let ip = 'unknown'
  
  if (forwarded) {
    ip = forwarded.split(',')[0].trim()
  } else if (realIp) {
    ip = realIp
  } else if (cfConnectingIp) {
    ip = cfConnectingIp
  }
  
  return `rate_limit:${ip}`
}

/**
 * User-based key generator
 */
export const userKeyGenerator = (context: any): string => {
  const userId = context.user?.id
  return userId ? `rate_limit:user:${userId}` : getDefaultKey(context)
}

/**
 * Endpoint-based key generator
 */
export const endpointKeyGenerator = (context: Context): string => {
  const ip = getDefaultKey(context)
  const path = context.path
  return `${ip}:${path}`
}

/**
 * Common rate limit configurations
 */
export const rateLimitConfigs = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later'
  },

  // Strict rate limit for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later'
  },

  // Lenient rate limit for public endpoints
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'Rate limit exceeded for public API'
  },

  // Per-user rate limit
  perUser: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyGenerator: userKeyGenerator,
    message: 'Too many requests, please slow down'
  }
}