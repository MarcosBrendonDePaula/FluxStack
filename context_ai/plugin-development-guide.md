# FluxStack v1.4.1 - Plugin Development Guide

## Overview

FluxStack possui um sistema de plugins robusto e extensível que permite adicionar funcionalidades personalizadas ao framework. Este guia detalha como desenvolver plugins personalizados.

## Plugin Architecture

### Core Plugin System Components

```
core/plugins/
├── types.ts                  # Plugin interfaces and types
├── manager.ts               # Plugin lifecycle management
├── registry.ts              # Plugin registration and discovery
├── executor.ts              # Plugin execution engine
├── config.ts                # Plugin configuration system
├── discovery.ts             # Auto-discovery of plugins
├── built-in/                # Built-in plugins
│   ├── logger/              # Logging plugin
│   ├── swagger/             # API documentation
│   ├── vite/                # Vite integration
│   ├── static/              # Static file serving
│   └── monitoring/          # Performance monitoring
└── __tests__/               # Plugin system tests
```

## Plugin Types

### 1. Basic Plugin Interface

```typescript
interface Plugin {
  name: string
  version?: string
  description?: string
  dependencies?: string[]
  setup: (context: FluxStackContext, app: any) => void | PluginHandlers
}

interface FluxStackContext {
  config: FluxStackConfig
  isDevelopment: boolean
  isProduction: boolean
  logger: Logger
  plugins: PluginManager
}

interface PluginHandlers {
  onRequest?: (context: RequestContext) => void | Promise<void>
  onResponse?: (context: ResponseContext) => void | Promise<void>
  onError?: (context: ErrorContext) => void | Promise<void>
  onStart?: () => void | Promise<void>
  onStop?: () => void | Promise<void>
}
```

### 2. Advanced Plugin with Configuration

```typescript
interface ConfigurablePlugin<T = any> extends Plugin {
  defaultConfig?: T
  validateConfig?: (config: T) => boolean | string[]
  setup: (context: FluxStackContext & { pluginConfig: T }, app: any) => void | PluginHandlers
}
```

## Creating Custom Plugins

### Step 1: Basic Plugin Structure

```typescript
// plugins/my-custom-plugin/index.ts
import type { Plugin, FluxStackContext } from '@/core/plugins/types'

export const myCustomPlugin: Plugin = {
  name: 'my-custom-plugin',
  version: '1.0.0',
  description: 'A custom plugin that does amazing things',
  
  setup: (context: FluxStackContext, app: any) => {
    // Plugin initialization code
    context.logger.info(`Initializing ${myCustomPlugin.name}`)
    
    // Add middleware or modify app
    app.use(/* your middleware */)
    
    // Return lifecycle handlers (optional)
    return {
      onRequest: async (requestContext) => {
        // Handle incoming requests
      },
      
      onError: async (errorContext) => {
        // Handle errors
      }
    }
  }
}
```

### Step 2: Plugin with Configuration

```typescript
// plugins/analytics/index.ts
import type { ConfigurablePlugin, FluxStackContext } from '@/core/plugins/types'

interface AnalyticsConfig {
  endpoint: string
  apiKey: string
  trackRequests: boolean
  trackErrors: boolean
  batchSize: number
}

export const analyticsPlugin: ConfigurablePlugin<AnalyticsConfig> = {
  name: 'analytics',
  version: '1.0.0',
  description: 'Analytics and tracking plugin',
  
  defaultConfig: {
    endpoint: 'https://api.analytics.com/events',
    apiKey: '',
    trackRequests: true,
    trackErrors: true,
    batchSize: 100
  },
  
  validateConfig: (config: AnalyticsConfig) => {
    const errors: string[] = []
    
    if (!config.endpoint) {
      errors.push('Analytics endpoint is required')
    }
    
    if (!config.apiKey) {
      errors.push('Analytics API key is required')
    }
    
    if (config.batchSize < 1) {
      errors.push('Batch size must be at least 1')
    }
    
    return errors.length === 0 ? true : errors
  },
  
  setup: (context: FluxStackContext & { pluginConfig: AnalyticsConfig }, app: any) => {
    const { pluginConfig } = context
    const eventQueue: any[] = []
    
    const flushEvents = async () => {
      if (eventQueue.length === 0) return
      
      try {
        await fetch(pluginConfig.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pluginConfig.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ events: eventQueue.splice(0, pluginConfig.batchSize) })
        })
      } catch (error) {
        context.logger.error('Failed to send analytics events:', error)
      }
    }
    
    // Flush events every 30 seconds
    const flushInterval = setInterval(flushEvents, 30000)
    
    return {
      onRequest: async (requestContext) => {
        if (pluginConfig.trackRequests) {
          eventQueue.push({
            type: 'request',
            method: requestContext.request.method,
            url: requestContext.request.url,
            timestamp: new Date().toISOString(),
            userAgent: requestContext.request.headers.get('user-agent')
          })
        }
      },
      
      onError: async (errorContext) => {
        if (pluginConfig.trackErrors) {
          eventQueue.push({
            type: 'error',
            message: errorContext.error.message,
            stack: errorContext.error.stack,
            timestamp: new Date().toISOString(),
            request: {
              method: errorContext.request.method,
              url: errorContext.request.url
            }
          })
        }
      },
      
      onStop: async () => {
        clearInterval(flushInterval)
        await flushEvents() // Final flush
      }
    }
  }
}
```

### Step 3: Database Plugin Example

```typescript
// plugins/database/index.ts
import type { ConfigurablePlugin, FluxStackContext } from '@/core/plugins/types'

interface DatabaseConfig {
  type: 'sqlite' | 'postgresql' | 'mysql'
  url: string
  pool?: {
    min: number
    max: number
  }
  migrations?: {
    directory: string
    auto: boolean
  }
}

export const databasePlugin: ConfigurablePlugin<DatabaseConfig> = {
  name: 'database',
  version: '1.0.0',
  description: 'Database connection and management plugin',
  dependencies: ['logger'], // Requires logger plugin
  
  defaultConfig: {
    type: 'sqlite',
    url: 'sqlite://./data/app.db',
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './migrations',
      auto: false
    }
  },
  
  setup: (context: FluxStackContext & { pluginConfig: DatabaseConfig }, app: any) => {
    const { pluginConfig } = context
    let connection: any = null
    
    const initializeDatabase = async () => {
      try {
        // Initialize database connection based on type
        switch (pluginConfig.type) {
          case 'sqlite':
            // connection = await initSQLite(pluginConfig.url)
            break
          case 'postgresql':
            // connection = await initPostgreSQL(pluginConfig.url, pluginConfig.pool)
            break
          case 'mysql':
            // connection = await initMySQL(pluginConfig.url, pluginConfig.pool)
            break
        }
        
        context.logger.info(`Database connected: ${pluginConfig.type}`)
        
        // Run migrations if auto is enabled
        if (pluginConfig.migrations?.auto) {
          await runMigrations(connection, pluginConfig.migrations.directory)
          context.logger.info('Database migrations completed')
        }
        
        // Make connection available globally
        app.decorate('db', connection)
        
      } catch (error) {
        context.logger.error('Failed to initialize database:', error)
        throw error
      }
    }
    
    return {
      onStart: initializeDatabase,
      
      onStop: async () => {
        if (connection) {
          await connection.close?.()
          context.logger.info('Database connection closed')
        }
      },
      
      onError: async (errorContext) => {
        context.logger.error('Database error:', errorContext.error)
      }
    }
  }
}

// Helper function example
async function runMigrations(connection: any, directory: string) {
  // Implementation for running database migrations
  // This would read migration files from the directory
  // and execute them in order
}
```

## Plugin Registration

### Method 1: Direct Registration

```typescript
// app/server/index.ts
import { FluxStackFramework } from '@/core/server'
import { myCustomPlugin } from './plugins/my-custom-plugin'
import { analyticsPlugin } from './plugins/analytics'

const app = new FluxStackFramework({
  port: 3000
})

// Register plugins
app.use(myCustomPlugin)

app.use(analyticsPlugin, {
  endpoint: 'https://my-analytics.com/events',
  apiKey: process.env.ANALYTICS_API_KEY!,
  trackRequests: true,
  trackErrors: true,
  batchSize: 50
})

app.listen()
```

### Method 2: Auto-Discovery

```typescript
// config/plugins.config.ts
export const pluginConfig = {
  discovery: {
    enabled: true,
    directories: [
      './plugins',
      './node_modules/@fluxstack-plugins'
    ]
  },
  plugins: {
    'my-custom-plugin': {
      enabled: true
    },
    'analytics': {
      enabled: true,
      config: {
        endpoint: process.env.ANALYTICS_ENDPOINT,
        apiKey: process.env.ANALYTICS_API_KEY,
        trackRequests: true,
        trackErrors: true,
        batchSize: 100
      }
    },
    'database': {
      enabled: process.env.NODE_ENV === 'production',
      config: {
        type: 'postgresql',
        url: process.env.DATABASE_URL,
        pool: {
          min: 5,
          max: 20
        }
      }
    }
  }
}
```

## Built-in Plugin Examples

### Logger Plugin Structure

```typescript
// core/plugins/built-in/logger/index.ts
export const loggerPlugin: Plugin = {
  name: 'logger',
  version: '1.0.0',
  description: 'Request/response logging plugin',
  
  setup: (context: FluxStackContext, app: any) => {
    return {
      onRequest: async (requestContext) => {
        const start = Date.now()
        requestContext.startTime = start
        
        console.log(`→ ${requestContext.request.method} ${requestContext.request.url}`)
      },
      
      onResponse: async (responseContext) => {
        const duration = Date.now() - (responseContext.startTime || 0)
        const status = responseContext.response.status
        
        console.log(`← ${status} ${duration}ms`)
      },
      
      onError: async (errorContext) => {
        console.error(`✗ ${errorContext.error.message}`)
        console.error(errorContext.error.stack)
      }
    }
  }
}
```

### Monitoring Plugin

```typescript
// core/plugins/built-in/monitoring/index.ts
export const monitoringPlugin: ConfigurablePlugin = {
  name: 'monitoring',
  version: '1.0.0',
  description: 'Performance monitoring and metrics collection',
  
  setup: (context: FluxStackContext, app: any) => {
    const metrics = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      responseTimes: [] as number[]
    }
    
    // Add metrics endpoint
    app.get('/metrics', () => ({
      ...metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }))
    
    return {
      onRequest: async (requestContext) => {
        metrics.requests++
        requestContext.startTime = Date.now()
      },
      
      onResponse: async (responseContext) => {
        if (responseContext.startTime) {
          const responseTime = Date.now() - responseContext.startTime
          metrics.responseTimes.push(responseTime)
          
          // Keep only last 100 response times for average calculation
          if (metrics.responseTimes.length > 100) {
            metrics.responseTimes.shift()
          }
          
          metrics.avgResponseTime = 
            metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
        }
      },
      
      onError: async () => {
        metrics.errors++
      }
    }
  }
}
```

## Plugin Testing

### Unit Testing Plugins

```typescript
// plugins/analytics/__tests__/analytics.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { analyticsPlugin } from '../index'
import type { FluxStackContext } from '@/core/plugins/types'

describe('Analytics Plugin', () => {
  const mockContext: FluxStackContext = {
    config: {},
    isDevelopment: true,
    isProduction: false,
    logger: {
      info: vi.fn(),
      error: vi.fn()
    },
    plugins: {} as any,
    pluginConfig: {
      endpoint: 'https://test.com/events',
      apiKey: 'test-key',
      trackRequests: true,
      trackErrors: true,
      batchSize: 10
    }
  }
  
  const mockApp = {
    use: vi.fn(),
    get: vi.fn(),
    post: vi.fn()
  }
  
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })
  
  it('should initialize with correct configuration', () => {
    const handlers = analyticsPlugin.setup(mockContext, mockApp)
    
    expect(handlers).toBeDefined()
    expect(typeof handlers?.onRequest).toBe('function')
    expect(typeof handlers?.onError).toBe('function')
  })
  
  it('should track requests when enabled', async () => {
    const handlers = analyticsPlugin.setup(mockContext, mockApp)
    
    const mockRequest = {
      method: 'GET',
      url: 'http://test.com/api/users',
      headers: new Map([['user-agent', 'test-agent']])
    }
    
    await handlers?.onRequest?.({ request: mockRequest } as any)
    
    // Verify request was tracked
    // This would depend on your actual implementation
  })
  
  it('should validate configuration correctly', () => {
    const validConfig = {
      endpoint: 'https://api.test.com',
      apiKey: 'valid-key',
      trackRequests: true,
      trackErrors: true,
      batchSize: 50
    }
    
    const result = analyticsPlugin.validateConfig?.(validConfig)
    expect(result).toBe(true)
  })
  
  it('should reject invalid configuration', () => {
    const invalidConfig = {
      endpoint: '',
      apiKey: '',
      trackRequests: true,
      trackErrors: true,
      batchSize: 0
    }
    
    const result = analyticsPlugin.validateConfig?.(invalidConfig)
    expect(Array.isArray(result)).toBe(true)
    expect((result as string[]).length).toBeGreaterThan(0)
  })
})
```

### Integration Testing

```typescript
// plugins/__tests__/integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { FluxStackFramework } from '@/core/server'
import { analyticsPlugin } from '../analytics'

describe('Plugin Integration', () => {
  let app: FluxStackFramework
  
  beforeEach(() => {
    app = new FluxStackFramework({ port: 3001 })
  })
  
  it('should register plugin successfully', () => {
    expect(() => {
      app.use(analyticsPlugin, {
        endpoint: 'https://test.com/events',
        apiKey: 'test-key',
        trackRequests: true,
        trackErrors: true,
        batchSize: 10
      })
    }).not.toThrow()
  })
  
  it('should handle requests with plugin enabled', async () => {
    app.use(analyticsPlugin, {
      endpoint: 'https://test.com/events',
      apiKey: 'test-key',
      trackRequests: true,
      trackErrors: true,
      batchSize: 10
    })
    
    app.getApp().get('/test', () => ({ message: 'test' }))
    
    const response = await app.getApp().handle(
      new Request('http://localhost:3001/test')
    )
    
    expect(response.status).toBe(200)
  })
})
```

## Plugin Best Practices

### 1. Error Handling

```typescript
export const robustPlugin: Plugin = {
  name: 'robust-plugin',
  
  setup: (context: FluxStackContext, app: any) => {
    return {
      onRequest: async (requestContext) => {
        try {
          // Plugin logic here
        } catch (error) {
          context.logger.error(`Plugin ${robustPlugin.name} error:`, error)
          // Don't throw - let the request continue
        }
      }
    }
  }
}
```

### 2. Configuration Validation

```typescript
validateConfig: (config: PluginConfig) => {
  const errors: string[] = []
  
  // Validate required fields
  if (!config.requiredField) {
    errors.push('requiredField is required')
  }
  
  // Validate types
  if (typeof config.numericField !== 'number') {
    errors.push('numericField must be a number')
  }
  
  // Validate ranges
  if (config.port < 1 || config.port > 65535) {
    errors.push('port must be between 1 and 65535')
  }
  
  return errors.length === 0 ? true : errors
}
```

### 3. Resource Cleanup

```typescript
setup: (context: FluxStackContext, app: any) => {
  const resources: any[] = []
  
  return {
    onStart: async () => {
      const resource = await initializeResource()
      resources.push(resource)
    },
    
    onStop: async () => {
      // Clean up all resources
      await Promise.all(
        resources.map(resource => resource.close?.())
      )
      resources.length = 0
    }
  }
}
```

### 4. Performance Considerations

```typescript
export const performantPlugin: Plugin = {
  name: 'performant-plugin',
  
  setup: (context: FluxStackContext, app: any) => {
    // Use async operations sparingly
    // Cache expensive computations
    const cache = new Map()
    
    return {
      onRequest: async (requestContext) => {
        // Avoid blocking operations
        setImmediate(() => {
          // Background processing
        })
        
        // Use caching
        const cacheKey = requestContext.request.url
        if (!cache.has(cacheKey)) {
          cache.set(cacheKey, computeExpensiveValue())
        }
      }
    }
  }
}
```

## Plugin Distribution

### Publishing to npm

```json
{
  "name": "@your-org/fluxstack-analytics-plugin",
  "version": "1.0.0",
  "description": "Analytics plugin for FluxStack",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": ["fluxstack", "plugin", "analytics"],
  "peerDependencies": {
    "@fluxstack/core": "^1.4.0"
  },
  "files": [
    "dist",
    "README.md"
  ]
}
```

### Plugin Marketplace Structure

```
my-fluxstack-plugin/
├── package.json
├── README.md
├── src/
│   ├── index.ts              # Main plugin export
│   ├── types.ts              # Plugin-specific types
│   └── __tests__/            # Plugin tests
├── dist/                     # Built files
└── examples/                 # Usage examples
    └── basic-usage.ts
```

## Debugging Plugins

### Debug Mode

```typescript
export const debuggablePlugin: Plugin = {
  name: 'debuggable-plugin',
  
  setup: (context: FluxStackContext, app: any) => {
    const debug = context.isDevelopment
    
    return {
      onRequest: async (requestContext) => {
        if (debug) {
          console.log('[DEBUG] Plugin processing request:', requestContext.request.url)
        }
        
        // Plugin logic
      }
    }
  }
}
```

### Plugin Logging

```typescript
setup: (context: FluxStackContext, app: any) => {
  const logger = context.logger.child({ plugin: 'my-plugin' })
  
  return {
    onRequest: async (requestContext) => {
      logger.info('Processing request', {
        method: requestContext.request.method,
        url: requestContext.request.url
      })
    }
  }
}
```

Esta documentação fornece um guia completo para desenvolver plugins personalizados no FluxStack v1.4.1, incluindo exemplos práticos, testes e melhores práticas.