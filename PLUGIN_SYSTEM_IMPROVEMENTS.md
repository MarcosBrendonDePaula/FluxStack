# 🚀 FluxStack Plugin System - Major Improvements

## 📋 Overview

The FluxStack plugin system has been significantly enhanced with **60+ hooks**, a **filter system**, and **improved dependency validation**. This document outlines all improvements and how to use them.

---

## ✨ What's New

### **1. Expanded Hook System (9 → 60+ hooks)**

The plugin system now supports **60+ hooks** organized into **13 categories**:

| Category | Hooks | Description |
|----------|-------|-------------|
| 🔄 **Lifecycle** | 13 hooks | Plugin and app lifecycle management |
| 🌐 **HTTP** | 27 hooks | Complete HTTP request/response lifecycle |
| ⚠️ **Error** | 14 hooks | Granular error handling by type |
| 🗄️ **Database** | 11 hooks | Database operations and transactions |
| 💾 **Cache** | 10 hooks | Caching operations |
| ✅ **Validation** | 10 hooks | Data validation and sanitization |
| 📁 **File** | 10 hooks | File upload and storage operations |
| 🔌 **WebSocket** | 8 hooks | Real-time communication |
| 🔐 **Auth** | 12 hooks | Authentication and authorization |
| 🛠️ **Build** | 10 hooks | Build process integration |
| 💻 **CLI** | 9 hooks | Command-line interface |
| 🔄 **Transform** | 9 hooks | Data transformation |
| 📊 **Monitoring** | 5 hooks | Metrics and monitoring |

**Total: 148 hooks available!**

### **2. Filter System (WordPress-inspired)**

Plugins can now **transform data** using filters:

```typescript
export const myPlugin: Plugin = {
  name: 'my-plugin',
  filters: {
    // Modify request body before processing
    filterRequestBody: async (data, ctx) => {
      return { ...data, timestamp: Date.now() }
    },

    // Modify response body before sending
    filterResponseBody: async (data, ctx) => {
      return { success: true, data }
    },

    // Sanitize HTML content
    filterHTML: async (html, ctx) => {
      return DOMPurify.sanitize(html)
    }
  }
}
```

Available filters:
- `filterRequestBody`, `filterResponseBody`
- `filterQueryParams`, `filterHeaders`, `filterRouteParams`
- `filterUserData`, `filterQueryResults`
- `filterConfig`, `filterEnvironment`
- `filterHTML`, `filterJSON`, `filterMarkdown`

### **3. Enhanced Dependency Validation**

New `PluginDependencyValidator` provides:

✅ **Helpful error messages**
```
❌ Plugin 'my-plugin' depends on 'logger-plugin' which is not installed

Suggestions:
  💡 Did you mean one of these? 'log-plugin', 'logger-utils'
  💡 Try installing: bun add fluxstack-plugin-logger-plugin
```

✅ **Circular dependency detection**
```
❌ Circular dependency detected: auth → session → cache → auth
  💡 Break the circular dependency by removing one of these dependencies
```

✅ **Version conflict detection**
```
❌ Multiple versions of plugin 'cache' detected: 1.0.0, 2.0.0
  💡 Uninstall conflicting versions and keep only one version
```

### **4. Improved Context Types**

All hooks now have **strongly-typed contexts**:

- `DatabaseContext` - For database operations
- `CacheContext` - For cache operations
- `ValidationContext` - For validation
- `FileContext` - For file operations
- `WebSocketContext` - For WebSocket events
- `AuthContext` - For authentication
- `TransformContext` - For data transformation
- `MonitoringContext` - For metrics

---

## 📖 Usage Examples

### **Example 1: Cache Plugin with Multiple Hooks**

```typescript
export const cachePlugin: Plugin = {
  name: 'redis-cache',

  // ✅ Check cache before request
  onBeforeRequest: async (ctx: RequestContext) => {
    if (ctx.method !== 'GET') return

    const cached = await redis.get(ctx.path)
    if (cached) {
      ctx.response = new Response(cached, {
        headers: { 'X-Cache': 'HIT' }
      })
      ctx.handled = true
    }
  },

  // ✅ Cache response after request
  onAfterResponse: async (ctx: ResponseContext) => {
    if (ctx.method === 'GET' && ctx.statusCode === 200) {
      const body = await ctx.response.clone().text()
      await redis.set(ctx.path, body, 'EX', 3600)
    }
  },

  // ✅ Cache-specific hooks
  onCacheHit: async (ctx: CacheContext) => {
    console.log(`Cache HIT: ${ctx.key}`)
  },

  onCacheMiss: async (ctx: CacheContext) => {
    console.log(`Cache MISS: ${ctx.key}`)
  }
}
```

### **Example 2: Validation Plugin with Filters**

```typescript
export const validatorPlugin: Plugin = {
  name: 'auto-validator',

  // ✅ Validate request body
  onRequestBody: async (ctx: RequestContext) => {
    const validation = validateSchema(ctx.body, schema)
    if (!validation.valid) {
      throw new ValidationError(validation.errors)
    }
  },

  // ✅ Handle validation errors
  onValidationError: async (ctx: ErrorContext) => {
    ctx.response = new Response(
      JSON.stringify({ error: 'Validation failed', errors: ctx.error }),
      { status: 422 }
    )
    ctx.handled = true
  },

  // ✅ Sanitize data with filter
  filters: {
    filterRequestBody: async (data, ctx) => {
      // Remove sensitive fields
      const { password, token, ...safe } = data
      return safe
    }
  }
}
```

### **Example 3: Rate Limiting Plugin**

```typescript
export const rateLimiterPlugin: Plugin = {
  name: 'rate-limiter',
  priority: 'highest', // Execute first

  // ✅ Check rate limit before request
  onBeforeRequest: async (ctx: RequestContext) => {
    const clientId = getClientId(ctx)
    const requests = await incrementCounter(clientId)

    if (requests > 100) {
      throw new RateLimitError('Rate limit exceeded')
    }

    ctx.metadata = { remaining: 100 - requests }
  },

  // ✅ Add rate limit headers
  onResponseHeaders: async (ctx: ResponseContext) => {
    ctx.response.headers.set('X-RateLimit-Limit', '100')
    ctx.response.headers.set('X-RateLimit-Remaining', ctx.metadata.remaining)
  },

  // ✅ Handle rate limit errors
  onRateLimitError: async (ctx: ErrorContext) => {
    ctx.response = new Response('Rate limit exceeded', {
      status: 429,
      headers: { 'Retry-After': '60' }
    })
    ctx.handled = true
  }
}
```

### **Example 4: Database Query Logger**

```typescript
export const queryLoggerPlugin: Plugin = {
  name: 'query-logger',

  // ✅ Log before query execution
  beforeQuery: async (ctx: DatabaseContext) => {
    ctx.metadata = { startTime: Date.now() }
    console.log(`[DB] Executing: ${ctx.query}`)
  },

  // ✅ Log after query with duration
  afterQuery: async (ctx: DatabaseContext) => {
    const duration = Date.now() - ctx.metadata.startTime
    console.log(`[DB] Completed in ${duration}ms`)

    if (duration > 1000) {
      console.warn(`[DB] Slow query detected!`)
    }
  },

  // ✅ Handle database errors
  onDatabaseError: async (ctx: DatabaseContext) => {
    console.error(`[DB] Query failed: ${ctx.query}`, ctx.error)
  }
}
```

---

## 🎯 Hook Categories Reference

### **🔄 Lifecycle Hooks**

```typescript
setup              // Plugin initialization
beforeSetup        // Before setup
afterSetup         // After setup
onServerStart      // Server started
onServerStop       // Server stopping
beforeShutdown     // Before app shutdown
afterShutdown      // After app shutdown
onPluginRegister   // Plugin registered
onPluginUnregister // Plugin removed
onPluginEnable     // Plugin enabled
onPluginDisable    // Plugin disabled
onConfigChange     // Config changed
onConfigReload     // Config reloaded
onHealthCheck      // Health check
```

### **🌐 HTTP Hooks**

```typescript
// Request lifecycle
onRequest, onBeforeRequest, onAfterRequest
onRequestBody, onRequestValidation, onRequestTransform
onRequestHeaders, onRequestQuery, onRequestParams

// Routing
onBeforeRoute, onRouteRegister, onRouteMatch, onRouteNotFound
beforeRouteHandler, afterRouteHandler

// Response lifecycle
onResponse, onBeforeResponse, onAfterResponse
onResponseBody, onResponseTransform, onResponseHeaders, onResponseStatus

// Method-specific
onGET, onPOST, onPUT, onPATCH, onDELETE, onOPTIONS, onHEAD
```

### **⚠️ Error Hooks**

```typescript
onError                  // Generic error
onValidationError        // Validation failed
onAuthenticationError    // Auth failed
onAuthorizationError     // Permission denied
onNotFoundError          // 404
onDatabaseError          // Database error
onNetworkError           // Network error
onTimeoutError           // Timeout
onRateLimitError         // Rate limit exceeded
onServerError            // 500 error
onClientError            // 4xx error
beforeErrorResponse      // Before error response
afterErrorResponse       // After error response
onUnhandledError         // Unhandled error
onErrorRecovery          // Error recovery attempt
```

### **🗄️ Database Hooks**

```typescript
onDatabaseConnect, onDatabaseDisconnect
onDatabaseQuery, beforeQuery, afterQuery
onQueryError
onTransaction, onTransactionCommit, onTransactionRollback
onMigration, onSeed
```

### **💾 Cache Hooks**

```typescript
onCacheHit, onCacheMiss
onCacheSet, onCacheGet, onCacheDelete
onCacheClear, onCacheExpire
beforeCacheSet, afterCacheSet
onCacheInvalidate
```

---

## 🔧 API Reference

### **PluginFilterManager**

Manages filter execution across plugins.

```typescript
const filterManager = new PluginFilterManager({ logger })

// Register plugin
filterManager.registerPlugin(myPlugin)

// Apply filter
const result = await filterManager.applyFilter('filterRequestBody', data, ctx)
console.log(result.data) // Transformed data
console.log(result.transformations) // Array of transformations applied

// Check if filter exists
if (filterManager.hasFilter('filterHTML')) {
  // ...
}

// Get stats
const stats = filterManager.getStats()
```

### **PluginDependencyValidator**

Validates plugin dependencies with helpful messages.

```typescript
const validator = new PluginDependencyValidator(logger)

// Validate all plugins
const result = validator.validate(plugins)

if (!result.valid) {
  console.log(validator.formatResult(result))
  // Shows errors, warnings, and suggestions
}

// Get load order
const loadOrder = validator.getLoadOrder(plugins)
```

---

## 📊 Migration Guide

### **Before (9 hooks)**

```typescript
export const oldPlugin: Plugin = {
  name: 'my-plugin',
  onRequest: async (ctx) => {
    // Had to handle everything here
    if (ctx.method === 'POST') {
      // validate
      // transform
      // cache check
    }
  }
}
```

### **After (60+ hooks + filters)**

```typescript
export const newPlugin: Plugin = {
  name: 'my-plugin',

  // ✅ Specific hooks for each phase
  onBeforeRequest: async (ctx) => { /* cache check */ },
  onRequestBody: async (ctx) => { /* validate */ },
  onPOST: async (ctx) => { /* POST-specific logic */ },
  onAfterResponse: async (ctx) => { /* cache write */ },

  // ✅ Filters for data transformation
  filters: {
    filterRequestBody: async (data, ctx) => {
      return transformData(data)
    }
  }
}
```

---

## 🎯 Best Practices

### **1. Use Specific Hooks**

❌ **Don't:**
```typescript
onRequest: async (ctx) => {
  if (ctx.method === 'POST') {
    if (ctx.path === '/api/users') {
      // complex logic
    }
  }
}
```

✅ **Do:**
```typescript
onPOST: async (ctx) => {
  // Automatically only for POST
},
onRouteMatch: async (ctx) => {
  if (ctx.route.path === '/api/users') {
    // Route-specific logic
  }
}
```

### **2. Use Filters for Data Transformation**

❌ **Don't:**
```typescript
onResponse: async (ctx) => {
  const body = await ctx.response.json()
  const modified = transformBody(body)
  ctx.response = new Response(JSON.stringify(modified))
}
```

✅ **Do:**
```typescript
filters: {
  filterResponseBody: async (data, ctx) => {
    return transformBody(data)
  }
}
```

### **3. Set Appropriate Priorities**

```typescript
// Security/rate limiting first
priority: 'highest'

// Caching early
priority: 'high'

// Business logic
priority: 'normal'

// Logging/monitoring last
priority: 'low'
```

### **4. Handle Errors Gracefully**

```typescript
onValidationError: async (ctx) => {
  ctx.response = new Response(/* error response */)
  ctx.handled = true // Mark as handled
  ctx.errorType = 'validation' // Set error type
}
```

---

## 🚀 Performance Tips

1. **Use `onBeforeRequest` for early exits** - Check cache, rate limits, etc before processing
2. **Mark requests as handled** - Set `ctx.handled = true` to skip route processing
3. **Use specific hooks** - They execute only when needed
4. **Cache filter results** - Filters run on every request
5. **Use async filters carefully** - They add latency

---

## 📝 Examples Directory

Check out `/examples/plugins/` for complete working examples:

- `cache-plugin.example.ts` - Redis caching with hooks
- `validator-plugin.example.ts` - Validation with filters
- `rate-limit-plugin.example.ts` - Rate limiting
- More examples coming soon!

---

## 🎉 Summary

The FluxStack plugin system now rivals the flexibility of **WordPress** with the type safety of **TypeScript** and the performance of **modern frameworks**!

**Key improvements:**
- ✅ **60+ hooks** across 13 categories
- ✅ **Filter system** for data transformation
- ✅ **Enhanced validation** with helpful suggestions
- ✅ **Strongly-typed contexts** for all hooks
- ✅ **Better error handling** with specific error hooks

Happy coding! 🚀
