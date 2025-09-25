# 🔌 FluxStack Plugins Guide

> Complete guide for adding and creating plugins in FluxStack applications

## 🎯 Overview

FluxStack provides a powerful plugin system that allows developers to extend their applications with custom functionality. Plugins can hook into various parts of the application lifecycle and provide reusable features.

## 📦 Built-in Plugins

FluxStack comes with several built-in plugins:

- **🪵 Logger Plugin**: Structured logging with customizable levels
- **📋 Swagger Plugin**: Auto-generated API documentation  
- **🌐 Static Plugin**: Serves static files in production
- **⚡ Vite Plugin**: Dev server integration with hot reload
- **📊 Monitoring Plugin**: Performance metrics and health checks

## 🚀 Using Built-in Plugins

### Basic Plugin Usage

```typescript
// app/server/index.ts
import { 
  FluxStackFramework, 
  loggerPlugin, 
  swaggerPlugin,
  staticPlugin,
  vitePlugin 
} from "@/core/server"

const app = new FluxStackFramework({ /* config */ })

// Add built-in plugins
app.use(loggerPlugin)
app.use(swaggerPlugin)

// Conditional plugin loading
if (isDevelopment()) {
  app.use(vitePlugin)
} else {
  app.use(staticPlugin)
}
```

### Plugin Configuration

```typescript
// Configure plugins with options
app.use(loggerPlugin, {
  level: 'debug',
  format: 'pretty',
  timestamp: true
})

app.use(swaggerPlugin, {
  title: 'My API',
  version: '2.0.0',
  description: 'Custom API documentation'
})
```

## 🛠️ Creating Custom Plugins

### 1. Simple Plugin Structure

Create plugins in your application directory:

```typescript
// app/server/plugins/auth.ts
import { Elysia } from 'elysia'

export const authPlugin = new Elysia({ name: 'auth' })
  .derive(({ headers }) => ({
    user: getUserFromToken(headers.authorization)
  }))
  .guard({
    beforeHandle({ user, set }) {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized' }
      }
    }
  })

// Usage in app/server/index.ts
import { authPlugin } from './plugins/auth'
app.use(authPlugin)
```

### 2. Advanced Plugin with Lifecycle Hooks

```typescript
// app/server/plugins/monitoring.ts
import { Elysia } from 'elysia'
import type { PluginContext, FluxStackPlugin } from '@/core/plugins/types'

export interface MonitoringConfig {
  metricsEndpoint?: string
  enableHealthCheck?: boolean
  collectMetrics?: boolean
}

export const createMonitoringPlugin = (config: MonitoringConfig): FluxStackPlugin => ({
  name: 'monitoring',
  version: '1.0.0',
  dependencies: [],
  
  setup: async (context: PluginContext) => {
    context.logger.info('Setting up monitoring plugin')
    
    // Initialize metrics collection
    const metrics = {
      requests: 0,
      errors: 0,
      startTime: Date.now()
    }
    
    return { metrics }
  },

  onServerStart: async (context: PluginContext) => {
    context.logger.info('Monitoring plugin started')
    // Start periodic health checks, metrics collection
  },

  onRequest: async (context: PluginContext) => {
    context.metrics.requests++
  },

  plugin: new Elysia({ name: 'monitoring' })
    .get('/metrics', () => ({
      requests: context.metrics.requests,
      errors: context.metrics.errors,
      uptime: Date.now() - context.metrics.startTime
    }))
    .get('/health', () => ({
      status: 'healthy',
      timestamp: new Date().toISOString()
    }))
})

// Usage
import { createMonitoringPlugin } from './plugins/monitoring'

const monitoringPlugin = createMonitoringPlugin({
  metricsEndpoint: '/metrics',
  enableHealthCheck: true,
  collectMetrics: true
})

app.use(monitoringPlugin)
```

### 3. Plugin with Configuration Schema

```typescript
// app/server/plugins/cache.ts
import { Elysia } from 'elysia'
import type { FluxStackPlugin } from '@/core/plugins/types'

export interface CacheConfig {
  provider: 'redis' | 'memory'
  ttl: number
  maxSize?: number
  redis?: {
    host: string
    port: number
    password?: string
  }
}

export const createCachePlugin = (config: CacheConfig): FluxStackPlugin => {
  const cache = config.provider === 'redis' 
    ? new RedisCache(config.redis!)
    : new MemoryCache({ maxSize: config.maxSize })

  return {
    name: 'cache',
    version: '1.0.0',
    
    setup: async (context) => {
      await cache.connect()
      context.logger.info('Cache plugin initialized', { provider: config.provider })
      
      return { cache }
    },

    plugin: new Elysia({ name: 'cache' })
      .derive(() => ({
        cache: {
          get: (key: string) => cache.get(key),
          set: (key: string, value: any, ttl = config.ttl) => 
            cache.set(key, value, ttl),
          del: (key: string) => cache.del(key),
          flush: () => cache.flush()
        }
      }))
  }
}

// Usage in routes
// app/server/routes/posts.routes.ts
export const postsRoutes = new Elysia({ prefix: '/posts' })
  .get('/', async ({ cache }) => {
    const cached = await cache.get('posts:all')
    if (cached) return cached

    const posts = await getAllPosts()
    await cache.set('posts:all', posts, 300) // 5 minutes
    return posts
  })
```

## 🎨 Plugin Patterns

### 1. Middleware Plugin

```typescript
// app/server/plugins/cors.ts
import { Elysia } from 'elysia'

export interface CorsConfig {
  origins: string[]
  methods: string[]
  headers: string[]
}

export const createCorsPlugin = (config: CorsConfig) => 
  new Elysia({ name: 'cors' })
    .onBeforeHandle(({ set, request }) => {
      const origin = request.headers.get('origin')
      
      if (config.origins.includes(origin || '')) {
        set.headers['Access-Control-Allow-Origin'] = origin
        set.headers['Access-Control-Allow-Methods'] = config.methods.join(', ')
        set.headers['Access-Control-Allow-Headers'] = config.headers.join(', ')
      }
    })
```

### 2. Validation Plugin

```typescript
// app/server/plugins/validation.ts
import { Elysia } from 'elysia'
import { z } from 'zod'

export const validationPlugin = new Elysia({ name: 'validation' })
  .macro(({ onBeforeHandle }) => ({
    validate: (schema: z.ZodSchema) => onBeforeHandle(({ body, set }) => {
      try {
        return schema.parse(body)
      } catch (error) {
        set.status = 400
        return { error: 'Validation failed', details: error.errors }
      }
    })
  }))

// Usage
const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
})

export const usersRoutes = new Elysia({ prefix: '/users' })
  .use(validationPlugin)
  .post('/', ({ body }) => {
    // body is now validated and typed
    return createUser(body)
  }, {
    validate: userSchema
  })
```

### 3. Rate Limiting Plugin

```typescript
// app/server/plugins/rate-limit.ts
import { Elysia } from 'elysia'

interface RateLimitConfig {
  max: number
  window: number // milliseconds
  keyGenerator?: (request: Request) => string
}

export const createRateLimitPlugin = (config: RateLimitConfig) => {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return new Elysia({ name: 'rate-limit' })
    .onBeforeHandle(({ request, set }) => {
      const key = config.keyGenerator?.(request) ?? 
        request.headers.get('x-forwarded-for') ?? 'default'
      
      const now = Date.now()
      const record = requests.get(key)

      if (!record || now > record.resetTime) {
        requests.set(key, { count: 1, resetTime: now + config.window })
        return
      }

      if (record.count >= config.max) {
        set.status = 429
        return { error: 'Rate limit exceeded' }
      }

      record.count++
    })
}

// Usage
const rateLimitPlugin = createRateLimitPlugin({
  max: 100,
  window: 60 * 1000, // 1 minute
  keyGenerator: (req) => req.headers.get('x-api-key') ?? 'anonymous'
})

app.use(rateLimitPlugin)
```

## 📂 Plugin Organization

### Recommended Structure

```
app/server/plugins/
├── auth/
│   ├── index.ts          # Main auth plugin
│   ├── strategies/       # Different auth strategies
│   │   ├── jwt.ts
│   │   └── oauth.ts
│   └── middleware/       # Auth-related middleware
├── cache/
│   ├── index.ts          # Cache plugin
│   ├── providers/       # Different cache providers
│   │   ├── redis.ts
│   │   └── memory.ts
├── monitoring/
│   ├── index.ts          # Monitoring plugin
│   ├── metrics.ts        # Custom metrics
│   └── health.ts         # Health checks
└── validation/
    ├── index.ts          # Validation plugin
    ├── schemas/          # Validation schemas
    └── middleware/       # Validation middleware
```

### Plugin Registration

```typescript
// app/server/plugins/index.ts
export { authPlugin } from './auth'
export { createCachePlugin } from './cache'
export { createMonitoringPlugin } from './monitoring'
export { validationPlugin } from './validation'

// app/server/index.ts
import {
  authPlugin,
  createCachePlugin,
  createMonitoringPlugin,
  validationPlugin
} from './plugins'

// Register plugins in order of dependency
app.use(validationPlugin)
app.use(createCachePlugin({ provider: 'memory', ttl: 300 }))
app.use(authPlugin)
app.use(createMonitoringPlugin({ enableHealthCheck: true }))
```

## 🔧 Plugin Configuration

### Environment-based Plugin Loading

```typescript
// app/server/index.ts
import { env } from '@/core/utils/env-runtime-v2'

// Conditional plugin loading based on environment
if (env.ENABLE_AUTH) {
  app.use(authPlugin)
}

if (env.ENABLE_CACHE) {
  app.use(createCachePlugin({
    provider: env.CACHE_PROVIDER,
    ttl: env.CACHE_TTL
  }))
}

if (env.ENABLE_MONITORING) {
  app.use(monitoringPlugin)
}
```

### Plugin Configuration File

```typescript
// app/server/config/plugins.ts
import type { PluginConfig } from '@/core/plugins/types'

export const pluginConfig: PluginConfig = {
  auth: {
    enabled: true,
    strategy: 'jwt',
    secret: process.env.JWT_SECRET,
    expiresIn: '24h'
  },
  cache: {
    enabled: true,
    provider: 'redis',
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    },
    ttl: 300
  },
  monitoring: {
    enabled: process.env.NODE_ENV === 'production',
    metrics: true,
    healthChecks: true,
    profiling: false
  }
}
```

## 🧪 Testing Plugins

### Plugin Unit Tests

```typescript
// app/server/plugins/__tests__/auth.test.ts
import { describe, it, expect } from 'bun:test'
import { Elysia } from 'elysia'
import { authPlugin } from '../auth'

describe('Auth Plugin', () => {
  const app = new Elysia().use(authPlugin)

  it('should authenticate valid token', async () => {
    const response = await app.handle(
      new Request('http://localhost/protected', {
        headers: { Authorization: 'Bearer valid-token' }
      })
    )
    
    expect(response.status).toBe(200)
  })

  it('should reject invalid token', async () => {
    const response = await app.handle(
      new Request('http://localhost/protected', {
        headers: { Authorization: 'Bearer invalid-token' }
      })
    )
    
    expect(response.status).toBe(401)
  })
})
```

### Integration Testing

```typescript
// tests/integration/plugins.test.ts
import { describe, it, expect } from 'bun:test'
import { FluxStackFramework } from '@/core/server'
import { authPlugin, createCachePlugin } from '@/app/server/plugins'

describe('Plugin Integration', () => {
  const app = new FluxStackFramework()
    .use(authPlugin)
    .use(createCachePlugin({ provider: 'memory', ttl: 100 }))

  it('should work with multiple plugins', async () => {
    // Test plugin interactions
  })
})
```

## 🚀 Best Practices

### 1. Plugin Design Principles

- **Single Responsibility**: Each plugin should have a clear, focused purpose
- **Minimal Dependencies**: Avoid heavy dependencies when possible
- **Configuration**: Make plugins configurable rather than hardcoded
- **Error Handling**: Graceful error handling and fallbacks
- **Logging**: Proper logging for debugging and monitoring

### 2. Performance Considerations

```typescript
// Good: Lazy loading of heavy dependencies
export const createDatabasePlugin = (config: DatabaseConfig) => {
  let db: Database | null = null

  return {
    name: 'database',
    setup: async () => {
      if (!db) {
        db = await import('./database').then(m => m.connect(config))
      }
      return { db }
    }
  }
}

// Good: Efficient middleware
export const createAuthPlugin = () => new Elysia()
  .derive(({ headers }) => {
    // Only parse token if Authorization header exists
    const auth = headers.authorization
    return auth ? { user: parseToken(auth) } : { user: null }
  })
```

### 3. Type Safety

```typescript
// Define strong types for plugin configuration
export interface DatabasePluginConfig {
  readonly url: string
  readonly poolSize?: number
  readonly ssl?: boolean
  readonly timeout?: number
}

// Use branded types for better type safety
type UserId = string & { readonly brand: unique symbol }
type DatabaseConnection = object & { readonly brand: unique symbol }

export const createDatabasePlugin = (
  config: DatabasePluginConfig
): FluxStackPlugin<{ db: DatabaseConnection }> => {
  // Implementation with strong typing
}
```

## 📚 Plugin Examples

### Real-world Plugin Examples

See the built-in plugins for reference:
- **Logger Plugin**: `core/plugins/built-in/logger/index.ts`
- **Swagger Plugin**: `core/plugins/built-in/swagger/index.ts`  
- **Static Plugin**: `core/plugins/built-in/static/index.ts`
- **Vite Plugin**: `core/plugins/built-in/vite/index.ts`
- **Monitoring Plugin**: `core/plugins/built-in/monitoring/index.ts`

## 🎯 Summary

FluxStack's plugin system provides:

1. **🔌 Easy Integration**: Simple API for adding functionality
2. **🎨 Flexible Architecture**: Support for various plugin patterns
3. **⚡ Performance**: Efficient plugin loading and execution
4. **🔒 Type Safety**: Full TypeScript support
5. **🧪 Testability**: Easy unit and integration testing
6. **📦 Built-in Plugins**: Ready-to-use common functionality

Start with built-in plugins, then create custom ones as your application grows!

---

**Need help with plugins? Check the troubleshooting guide or FluxStack documentation.**