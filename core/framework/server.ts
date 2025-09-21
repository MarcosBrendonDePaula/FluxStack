import { Elysia } from "elysia"
import type { FluxStackConfig, FluxStackContext } from "../types"
import type { Plugin, PluginContext, PluginUtils } from "../plugins/types"
import { PluginRegistry } from "../plugins/registry"
import { getConfigSync, getEnvironmentInfo } from "../config"
import { logger } from "../utils/logger"
import { createErrorHandler } from "../utils/errors/handlers"
import { createTimer, formatBytes, isProduction, isDevelopment } from "../utils/helpers"

export class FluxStackFramework {
  private app: Elysia
  private context: FluxStackContext
  private pluginRegistry: PluginRegistry
  private pluginContext: PluginContext
  private isStarted: boolean = false

  constructor(config?: Partial<FluxStackConfig>) {
    // Load the full configuration
    const fullConfig = config ? { ...getConfigSync(), ...config } : getConfigSync()
    const envInfo = getEnvironmentInfo()

    this.context = {
      config: fullConfig,
      isDevelopment: envInfo.isDevelopment,
      isProduction: envInfo.isProduction,
      isTest: envInfo.isTest,
      environment: envInfo.name
    }

    this.app = new Elysia()
    this.pluginRegistry = new PluginRegistry()

    // Create plugin utilities
    const pluginUtils: PluginUtils = {
      createTimer,
      formatBytes,
      isProduction,
      isDevelopment,
      getEnvironment: () => envInfo.name,
      createHash: (data: string) => {
        const crypto = require('crypto')
        return crypto.createHash('sha256').update(data).digest('hex')
      },
      deepMerge: (target: any, source: any) => {
        const result = { ...target }
        for (const key in source) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = pluginUtils.deepMerge(result[key] || {}, source[key])
          } else {
            result[key] = source[key]
          }
        }
        return result
      },
      validateSchema: (_data: any, _schema: any) => {
        // Simple validation - in a real implementation you'd use a proper schema validator
        try {
          // Basic validation logic
          return { valid: true, errors: [] }
        } catch (error) {
          return { valid: false, errors: [error instanceof Error ? error.message : 'Validation failed'] }
        }
      }
    }

    // Create a logger wrapper that implements the full Logger interface
    const pluginLogger = {
      debug: (message: string, meta?: any) => logger.debug(message, meta),
      info: (message: string, meta?: any) => logger.info(message, meta),
      warn: (message: string, meta?: any) => logger.warn(message, meta),
      error: (message: string, meta?: any) => logger.error(message, meta),
      child: (context: any) => (logger as any).child(context),
      time: (label: string) => (logger as any).time(label),
      timeEnd: (label: string) => (logger as any).timeEnd(label),
      request: (method: string, path: string, status?: number, duration?: number) =>
        logger.request(method, path, status, duration)
    }

    this.pluginContext = {
      config: fullConfig,
      logger: pluginLogger,
      app: this.app,
      utils: pluginUtils
    }

    this.setupCors()
    this.setupHooks()
    this.setupErrorHandling()

    logger.framework('FluxStack framework initialized', {
      environment: envInfo.name,
      port: fullConfig.server.port
    })
  }

  private setupCors() {
    const { cors } = this.context.config.server

    this.app
      .onRequest(({ set }) => {
        set.headers["Access-Control-Allow-Origin"] = cors.origins.join(", ") || "*"
        set.headers["Access-Control-Allow-Methods"] = cors.methods.join(", ") || "*"
        set.headers["Access-Control-Allow-Headers"] = cors.headers.join(", ") || "*"
        if (cors.credentials) {
          set.headers["Access-Control-Allow-Credentials"] = "true"
        }
      })
      .options("*", ({ set }) => {
        set.status = 200
        return ""
      })
  }

  private setupHooks() {
    // Setup onRequest hook and onBeforeRoute hook
    this.app.onRequest(async ({ request, set }) => {
      const startTime = Date.now()
      const url = new URL(request.url)
      
      const requestContext = {
        request,
        path: url.pathname,
        method: request.method,
        headers: (() => {
          const headers: Record<string, string> = {}
          request.headers.forEach((value: string, key: string) => {
            headers[key] = value
          })
          return headers
        })(),
        query: Object.fromEntries(url.searchParams.entries()),
        params: {},
        startTime,
        handled: false,
        response: undefined
      }
      
      // Execute onRequest hooks for all plugins first (logging, auth, etc.)
      await this.executePluginHooks('onRequest', requestContext)
      
      // Execute onBeforeRoute hooks - allow plugins to handle requests before routing
      const handledResponse = await this.executePluginBeforeRouteHooks(requestContext)
      
      // If a plugin handled the request, return the response
      if (handledResponse) {
        return handledResponse
      }
    })

    // Setup onResponse hook  
    this.app.onAfterHandle(async ({ request, response, set }) => {
      const startTime = Date.now()
      const url = new URL(request.url)
      
      const responseContext = {
        request,
        path: url.pathname,
        method: request.method,
        headers: (() => {
          const headers: Record<string, string> = {}
          request.headers.forEach((value: string, key: string) => {
            headers[key] = value
          })
          return headers
        })(),
        query: Object.fromEntries(url.searchParams.entries()),
        params: {},
        response,
        statusCode: (response as any)?.status || set.status || 200,
        duration: Date.now() - startTime,
        startTime
      }
      
      // Execute onResponse hooks for all plugins
      await this.executePluginHooks('onResponse', responseContext)
    })
  }

  private setupErrorHandling() {
    const errorHandler = createErrorHandler({
      logger: this.pluginContext.logger,
      isDevelopment: this.context.isDevelopment
    })

    this.app.onError(async ({ error, request, path, set }) => {
      const startTime = Date.now()
      const url = new URL(request.url)
      
      const errorContext = {
        request,
        path: url.pathname,
        method: request.method,
        headers: (() => {
          const headers: Record<string, string> = {}
          request.headers.forEach((value: string, key: string) => {
            headers[key] = value
          })
          return headers
        })(),
        query: Object.fromEntries(url.searchParams.entries()),
        params: {},
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime,
        handled: false,
        startTime
      }
      
      // Execute onError hooks for all plugins - allow them to handle the error
      const handledResponse = await this.executePluginErrorHooks(errorContext)
      
      // If a plugin handled the error, return the response
      if (handledResponse) {
        return handledResponse
      }
      
      // Vite proxy logic is now handled by the Vite plugin via onBeforeRoute hook
      
      // Convert Elysia error to standard Error if needed
      const standardError = error instanceof Error ? error : new Error(String(error))
      return errorHandler(standardError, request, path)
    })
  }

  private async executePluginHooks(hookName: string, context: any): Promise<void> {
    const loadOrder = this.pluginRegistry.getLoadOrder()
    
    for (const pluginName of loadOrder) {
      const plugin = this.pluginRegistry.get(pluginName)
      if (!plugin) continue
      
      const hookFn = (plugin as any)[hookName]
      if (typeof hookFn === 'function') {
        try {
          await hookFn(context)
        } catch (error) {
          logger.error(`Plugin '${pluginName}' ${hookName} hook failed`, { 
            error: (error as Error).message 
          })
        }
      }
    }
  }

  private async executePluginBeforeRouteHooks(requestContext: any): Promise<Response | null> {
    const loadOrder = this.pluginRegistry.getLoadOrder()
    
    for (const pluginName of loadOrder) {
      const plugin = this.pluginRegistry.get(pluginName)
      if (!plugin) continue
      
      const onBeforeRouteFn = (plugin as any).onBeforeRoute
      if (typeof onBeforeRouteFn === 'function') {
        try {
          await onBeforeRouteFn(requestContext)
          
          // If this plugin handled the request, return the response
          if (requestContext.handled && requestContext.response) {
            return requestContext.response
          }
        } catch (error) {
          logger.error(`Plugin '${pluginName}' onBeforeRoute hook failed`, { 
            error: (error as Error).message 
          })
        }
      }
    }
    
    return null
  }

  private async executePluginErrorHooks(errorContext: any): Promise<Response | null> {
    const loadOrder = this.pluginRegistry.getLoadOrder()
    
    for (const pluginName of loadOrder) {
      const plugin = this.pluginRegistry.get(pluginName)
      if (!plugin) continue
      
      const onErrorFn = (plugin as any).onError
      if (typeof onErrorFn === 'function') {
        try {
          await onErrorFn(errorContext)
          
          // If this plugin handled the error, check if it provides a response
          if (errorContext.handled) {
            // For Vite plugin, we'll handle the proxy here
            if (pluginName === 'vite' && errorContext.error.constructor.name === 'NotFoundError') {
              return await this.handleViteProxy(errorContext)
            }
            
            // For other plugins, return a basic success response
            return new Response('OK', { status: 200 })
          }
        } catch (error) {
          logger.error(`Plugin '${pluginName}' onError hook failed`, { 
            error: (error as Error).message 
          })
        }
      }
    }
    
    return null
  }

  private async handleViteProxy(errorContext: any): Promise<Response> {
    const vitePort = this.context.config.client?.port || 5173
    const url = new URL(errorContext.request.url)
    
    try {
      const viteUrl = `http://localhost:${vitePort}${url.pathname}${url.search}`
      
      // Forward request to Vite
      const response = await fetch(viteUrl, {
        method: errorContext.method,
        headers: errorContext.headers
      })
      
      // Return a proper Response object with all headers and status
      const body = await response.arrayBuffer()
      
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      })
      
    } catch (viteError) {
      // If Vite fails, return error response
      return new Response(`Vite server not ready on port ${vitePort}. Error: ${viteError}`, {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
  }

  use(plugin: Plugin) {
    try {
      // Use the registry's public register method, but don't await it since we need sync operation
      if (this.pluginRegistry.has(plugin.name)) {
        throw new Error(`Plugin '${plugin.name}' is already registered`)
      }
      
      // Store plugin without calling setup - setup will be called in start()
      // We need to manually set the plugin since register() is async but we need sync
      (this.pluginRegistry as any).plugins.set(plugin.name, plugin)
      
      // Update dependencies tracking
      if (plugin.dependencies) {
        (this.pluginRegistry as any).dependencies.set(plugin.name, plugin.dependencies)
      }
      
      // Update load order by calling the private method
      try {
        (this.pluginRegistry as any).updateLoadOrder()
      } catch (error) {
        // Fallback: create basic load order
        const plugins = (this.pluginRegistry as any).plugins as Map<string, Plugin>
        const loadOrder = Array.from(plugins.keys())
        ;(this.pluginRegistry as any).loadOrder = loadOrder
      }
      
      logger.framework(`Plugin '${plugin.name}' registered`, {
        version: plugin.version,
        dependencies: plugin.dependencies
      })
      return this
    } catch (error) {
      logger.error(`Failed to register plugin '${plugin.name}'`, { error: (error as Error).message })
      throw error
    }
  }

  routes(routeModule: any) {
    this.app.use(routeModule)
    return this
  }

  async start(): Promise<void> {
    if (this.isStarted) {
      logger.warn('Framework is already started')
      return
    }

    try {
      // Validate plugin dependencies before starting
      const plugins = (this.pluginRegistry as any).plugins as Map<string, Plugin>
      for (const [pluginName, plugin] of plugins) {
        if (plugin.dependencies) {
          for (const depName of plugin.dependencies) {
            if (!plugins.has(depName)) {
              throw new Error(`Plugin '${pluginName}' depends on '${depName}' which is not registered`)
            }
          }
        }
      }

      // Get load order
      const loadOrder = this.pluginRegistry.getLoadOrder()

      // Call setup hooks for all plugins
      for (const pluginName of loadOrder) {
        const plugin = this.pluginRegistry.get(pluginName)!

        // Call setup hook if it exists and hasn't been called
        if (plugin.setup) {
          await plugin.setup(this.pluginContext)
        }
      }

      // Call onServerStart hooks
      for (const pluginName of loadOrder) {
        const plugin = this.pluginRegistry.get(pluginName)!

        if (plugin.onServerStart) {
          await plugin.onServerStart(this.pluginContext)
        }
      }

      this.isStarted = true
      logger.framework('All plugins loaded successfully', {
        pluginCount: loadOrder.length
      })

    } catch (error) {
      logger.error('Failed to start framework', { error: (error as Error).message })
      throw error
    }
  }

  async stop(): Promise<void> {
    if (!this.isStarted) {
      return
    }

    try {
      // Call onServerStop hooks in reverse order
      const loadOrder = this.pluginRegistry.getLoadOrder().reverse()

      for (const pluginName of loadOrder) {
        const plugin = this.pluginRegistry.get(pluginName)!

        if (plugin.onServerStop) {
          await plugin.onServerStop(this.pluginContext)
          logger.framework(`Plugin '${pluginName}' server stop hook completed`)
        }
      }

      this.isStarted = false
      logger.framework('Framework stopped successfully')

    } catch (error) {
      logger.error('Error during framework shutdown', { error: (error as Error).message })
      throw error
    }
  }

  getApp() {
    return this.app
  }

  getContext() {
    return this.context
  }

  getPluginRegistry() {
    return this.pluginRegistry
  }

  async listen(callback?: () => void) {
    // Start the framework (load plugins)
    await this.start()

    const port = this.context.config.server.port
    const apiPrefix = this.context.config.server.apiPrefix

    this.app.listen(port, () => {
      logger.framework(`Server started on port ${port}`, {
        apiPrefix,
        environment: this.context.environment,
        pluginCount: this.pluginRegistry.getAll().length
      })

      console.log(`🚀 API ready at http://localhost:${port}${apiPrefix}`)
      console.log(`📋 Health check: http://localhost:${port}${apiPrefix}/health`)
      console.log()
      callback?.()
    })

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.framework('Received SIGTERM, shutting down gracefully')
      await this.stop()
      process.exit(0)
    })

    process.on('SIGINT', async () => {
      logger.framework('Received SIGINT, shutting down gracefully')
      await this.stop()
      process.exit(0)
    })
  }
}