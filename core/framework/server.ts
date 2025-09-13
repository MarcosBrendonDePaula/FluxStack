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
      isDevelopment
    }

    this.pluginContext = {
      config: fullConfig,
      logger: logger, // Use the main logger for now
      app: this.app,
      utils: pluginUtils
    }

    this.setupCors()
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

  private setupErrorHandling() {
    const errorHandler = createErrorHandler({
      logger: logger, // Use the main logger for now
      isDevelopment: this.context.isDevelopment
    })

    this.app.onError(({ error, request, path }) => {
      // Convert Elysia error to standard Error if needed
      const standardError = error instanceof Error ? error : new Error(String(error))
      return errorHandler(standardError, request, path)
    })
  }

  use(plugin: Plugin) {
    try {
      this.pluginRegistry.register(plugin)
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
      // Validate plugin dependencies
      this.pluginRegistry.validateDependencies()
      
      // Load plugins in correct order
      const loadOrder = this.pluginRegistry.getLoadOrder()
      
      for (const pluginName of loadOrder) {
        const plugin = this.pluginRegistry.get(pluginName)!
        
        // Call setup hook
        if (plugin.setup) {
          await plugin.setup(this.pluginContext)
          logger.framework(`Plugin '${pluginName}' setup completed`)
        }
      }

      // Call onServerStart hooks
      for (const pluginName of loadOrder) {
        const plugin = this.pluginRegistry.get(pluginName)!
        
        if (plugin.onServerStart) {
          await plugin.onServerStart(this.pluginContext)
          logger.framework(`Plugin '${pluginName}' server start hook completed`)
        }
      }

      this.isStarted = true
      logger.framework('All plugins loaded successfully', {
        pluginCount: loadOrder.length,
        loadOrder
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