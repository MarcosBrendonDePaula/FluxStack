/**
 * Example: Redis Cache Plugin
 * Demonstrates use of new HTTP and Cache hooks
 */

import type { FluxStack, RequestContext, ResponseContext, CacheContext } from "@/core/plugins/types"

type Plugin = FluxStack.Plugin

// Mock Redis client (in production, use real Redis)
const redis = {
  async get(key: string): Promise<string | null> {
    // Mock implementation
    return null
  },
  async set(key: string, value: string, ex: string, ttl: number): Promise<void> {
    // Mock implementation
  },
  async del(key: string): Promise<void> {
    // Mock implementation
  }
}

export const redisCachePlugin: Plugin = {
  name: 'redis-cache',
  version: '1.0.0',
  description: 'Redis-based HTTP caching plugin',
  author: 'FluxStack Team',
  category: 'cache',
  tags: ['cache', 'redis', 'performance'],
  priority: 'high', // High priority to check cache early

  // ✅ Setup hook - initialize Redis connection
  setup: async (context) => {
    context.logger.info('🚀 Redis cache plugin initialized')
    // In production: await redis.connect()
  },

  // ✅ Before request hook - check cache
  onBeforeRequest: async (ctx: RequestContext) => {
    // Only cache GET requests
    if (ctx.method !== 'GET') return

    const cacheKey = `http:${ctx.method}:${ctx.path}`

    try {
      const cached = await redis.get(cacheKey)

      if (cached) {
        // ✅ Cache hit - return cached response
        ctx.response = new Response(cached, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey
          }
        })

        // Mark as handled to skip route processing
        ctx.handled = true
      }
    } catch (error) {
      console.error('Cache read error:', error)
    }
  },

  // ✅ After response hook - cache successful responses
  onAfterResponse: async (ctx: ResponseContext) => {
    // Only cache successful GET requests
    if (ctx.method !== 'GET' || ctx.statusCode !== 200) return

    const cacheKey = `http:${ctx.method}:${ctx.path}`

    try {
      const body = await ctx.response.clone().text()
      await redis.set(cacheKey, body, 'EX', 3600) // 1 hour TTL
    } catch (error) {
      console.error('Cache write error:', error)
    }
  },

  // ✅ Cache-specific hooks
  onCacheHit: async (ctx: CacheContext) => {
    console.log(`📦 Cache HIT: ${ctx.key}`)
  },

  onCacheMiss: async (ctx: CacheContext) => {
    console.log(`❌ Cache MISS: ${ctx.key}`)
  },

  onCacheSet: async (ctx: CacheContext) => {
    console.log(`✅ Cache SET: ${ctx.key} (TTL: ${ctx.ttl}s)`)
  },

  onCacheInvalidate: async (ctx: CacheContext) => {
    console.log(`🗑️  Cache INVALIDATE: ${ctx.key}`)
    await redis.del(ctx.key)
  },

  // ✅ Health check
  onHealthCheck: async (context) => {
    try {
      // In production: await redis.ping()
      context.logger.info('Redis cache is healthy')
    } catch (error) {
      context.logger.error('Redis cache is unhealthy', { error })
    }
  }
}

export default redisCachePlugin
