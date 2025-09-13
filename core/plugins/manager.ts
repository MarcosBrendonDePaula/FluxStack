/**
 * Plugin Manager
 * Handles plugin lifecycle, execution, and context management
 */

import type { 
  Plugin, 
  PluginContext, 
  PluginHook, 
  PluginHookResult, 
  PluginMetrics,
  PluginExecutionContext,
  HookExecutionOptions,
  RequestContext,
  ResponseContext,
  ErrorContext,
  BuildContext
} from "./types"
import type { FluxStackConfig } from "../config/schema"
import type { Logger } from "../utils/logger/index"
import { PluginRegistry } from "./registry"
import { createPluginUtils } from "./config"
import { FluxStackError } from "../utils/errors"
import { EventEmitter } from "events"

export interface PluginManagerConfig {
  config: FluxStackConfig
  logger: Logger
  app?: any
}

export class PluginManager extends EventEmitter {
  private registry: PluginRegistry
  private config: FluxStackConfig
  private logger: Logger
  private app?: any
  private metrics: Map<string, PluginMetrics> = new Map()
  private contexts: Map<string, PluginContext> = new Map()
  private initialized = false

  constructor(options: PluginManagerConfig) {
    super()
    this.config = options.config
    this.logger = options.logger
    this.app = options.app
    
    this.registry = new PluginRegistry({
      logger: this.logger,
      config: this.config
    })
  }

  /**
   * Initialize the plugin manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    this.logger.info('Initializing plugin manager')

    try {
      // Discover and load plugins
      await this.discoverPlugins()
      
      // Setup plugin contexts
      this.setupPluginContexts()
      
      // Execute setup hooks
      await this.executeHook('setup')
      
      this.initialized = true
      this.logger.info('Plugin manager initialized successfully', {
        totalPlugins: this.registry.getStats().totalPlugins
      })
    } catch (error) {
      this.logger.error('Failed to initialize plugin manager', { error })
      throw error
    }
  }

  /**
   * Shutdown the plugin manager
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return
    }

    this.logger.info('Shutting down plugin manager')

    try {
      await this.executeHook('onServerStop')
      this.initialized = false
      this.logger.info('Plugin manager shut down successfully')
    } catch (error) {
      this.logger.error('Error during plugin manager shutdown', { error })
    }
  }

  /**
   * Get the plugin registry
   */
  getRegistry(): PluginRegistry {
    return this.registry
  }

  /**
   * Register a plugin
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    await this.registry.register(plugin)
    this.setupPluginContext(plugin)
    
    if (this.initialized && plugin.setup) {
      await this.executePluginHook(plugin, 'setup')
    }
  }

  /**
   * Unregister a plugin
   */
  unregisterPlugin(name: string): void {
    this.registry.unregister(name)
    this.contexts.delete(name)
    this.metrics.delete(name)
  }

  /**
   * Execute a hook on all plugins
   */
  async executeHook(
    hook: PluginHook, 
    context?: any, 
    options: HookExecutionOptions = {}
  ): Promise<PluginHookResult[]> {
    const {
      timeout = 30000,
      parallel = false,
      stopOnError = false,
      retries = 0
    } = options

    const results: PluginHookResult[] = []
    const loadOrder = this.registry.getLoadOrder()
    const enabledPlugins = this.getEnabledPlugins()

    this.logger.debug(`Executing hook '${hook}' on ${enabledPlugins.length} plugins`, {
      hook,
      plugins: enabledPlugins.map(p => p.name),
      parallel,
      timeout
    })

    const executePlugin = async (plugin: Plugin): Promise<PluginHookResult> => {
      if (!enabledPlugins.includes(plugin)) {
        return {
          success: true,
          duration: 0,
          plugin: plugin.name,
          hook
        }
      }

      return this.executePluginHook(plugin, hook, context, { timeout, retries })
    }

    try {
      if (parallel) {
        // Execute all plugins in parallel
        const promises = loadOrder
          .map(name => this.registry.get(name))
          .filter(Boolean)
          .map(plugin => executePlugin(plugin!))

        const settled = await Promise.allSettled(promises)
        
        for (const result of settled) {
          if (result.status === 'fulfilled') {
            results.push(result.value)
          } else {
            results.push({
              success: false,
              error: result.reason,
              duration: 0,
              plugin: 'unknown',
              hook
            })
          }
        }
      } else {
        // Execute plugins sequentially
        for (const pluginName of loadOrder) {
          const plugin = this.registry.get(pluginName)
          if (!plugin) continue

          const result = await executePlugin(plugin)
          results.push(result)

          if (!result.success && stopOnError) {
            this.logger.error(`Hook execution stopped due to error in plugin '${plugin.name}'`, {
              hook,
              plugin: plugin.name,
              error: result.error
            })
            break
          }
        }
      }

      // Emit hook completion event
      this.emit('hook:after', { hook, results, context })

      return results
    } catch (error) {
      this.logger.error(`Hook '${hook}' execution failed`, { error })
      this.emit('hook:error', { hook, error, context })
      throw error
    }
  }

  /**
   * Execute a specific hook on a specific plugin
   */
  async executePluginHook(
    plugin: Plugin,
    hook: PluginHook,
    context?: any,
    options: { timeout?: number; retries?: number } = {}
  ): Promise<PluginHookResult> {
    const { timeout = 30000, retries = 0 } = options
    const startTime = Date.now()

    // Check if plugin implements this hook
    const hookFunction = plugin[hook]
    if (!hookFunction || typeof hookFunction !== 'function') {
      return {
        success: true,
        duration: 0,
        plugin: plugin.name,
        hook
      }
    }

    this.emit('hook:before', { plugin: plugin.name, hook, context })

    let attempt = 0
    let lastError: Error | undefined

    while (attempt <= retries) {
      try {
        const pluginContext = this.getPluginContext(plugin.name)
        const executionContext: PluginExecutionContext = {
          plugin,
          hook,
          startTime: Date.now(),
          timeout,
          retries
        }

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new FluxStackError(
              `Plugin '${plugin.name}' hook '${hook}' timed out after ${timeout}ms`,
              'PLUGIN_TIMEOUT',
              408
            ))
          }, timeout)
        })

        // Execute the hook with appropriate context
        let hookPromise: Promise<any>
        
        switch (hook) {
          case 'setup':
          case 'onServerStart':
          case 'onServerStop':
            hookPromise = Promise.resolve(hookFunction(pluginContext as any))
            break
          case 'onRequest':
          case 'onResponse':
          case 'onError':
            hookPromise = Promise.resolve(hookFunction(context as any))
            break
          case 'onBuild':
          case 'onBuildComplete':
            hookPromise = Promise.resolve(hookFunction(context as any))
            break
          default:
            hookPromise = Promise.resolve(hookFunction(context || pluginContext))
        }

        // Race between hook execution and timeout
        await Promise.race([hookPromise, timeoutPromise])

        const duration = Date.now() - startTime
        
        // Update metrics
        this.updatePluginMetrics(plugin.name, hook, duration, true)

        this.logger.debug(`Plugin '${plugin.name}' hook '${hook}' completed successfully`, {
          plugin: plugin.name,
          hook,
          duration,
          attempt: attempt + 1
        })

        return {
          success: true,
          duration,
          plugin: plugin.name,
          hook,
          context: executionContext
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        attempt++

        this.logger.warn(`Plugin '${plugin.name}' hook '${hook}' failed (attempt ${attempt}/${retries + 1})`, {
          plugin: plugin.name,
          hook,
          error: lastError.message,
          attempt
        })

        if (attempt <= retries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000))
        }
      }
    }

    const duration = Date.now() - startTime
    
    // Update metrics
    this.updatePluginMetrics(plugin.name, hook, duration, false)

    this.emit('plugin:error', { plugin: plugin.name, hook, error: lastError })

    return {
      success: false,
      error: lastError,
      duration,
      plugin: plugin.name,
      hook
    }
  }

  /**
   * Get plugin metrics
   */
  getPluginMetrics(pluginName?: string): PluginMetrics | Map<string, PluginMetrics> {
    if (pluginName) {
      return this.metrics.get(pluginName) || {
        loadTime: 0,
        setupTime: 0,
        hookExecutions: new Map(),
        errors: 0,
        warnings: 0
      }
    }
    return this.metrics
  }

  /**
   * Get enabled plugins
   */
  private getEnabledPlugins(): Plugin[] {
    const allPlugins = this.registry.getAll()
    const enabledNames = this.config.plugins.enabled
    const disabledNames = this.config.plugins.disabled

    return allPlugins.filter(plugin => {
      // If explicitly disabled, exclude
      if (disabledNames.includes(plugin.name)) {
        return false
      }
      
      // If enabled list is empty, include all non-disabled
      if (enabledNames.length === 0) {
        return true
      }
      
      // Otherwise, only include if explicitly enabled
      return enabledNames.includes(plugin.name)
    })
  }

  /**
   * Discover and load plugins
   */
  private async discoverPlugins(): Promise<void> {
    try {
      const results = await this.registry.discoverPlugins({
        includeBuiltIn: true,
        includeExternal: true
      })

      let loaded = 0
      let failed = 0

      for (const result of results) {
        if (result.success) {
          loaded++
          if (result.warnings && result.warnings.length > 0) {
            this.logger.warn(`Plugin '${result.plugin?.name}' loaded with warnings`, {
              warnings: result.warnings
            })
          }
        } else {
          failed++
          this.logger.error(`Failed to load plugin: ${result.error}`)
        }
      }

      this.logger.info('Plugin discovery completed', { loaded, failed })
    } catch (error) {
      this.logger.error('Plugin discovery failed', { error })
      throw error
    }
  }

  /**
   * Setup plugin contexts for all plugins
   */
  private setupPluginContexts(): void {
    const plugins = this.registry.getAll()
    
    for (const plugin of plugins) {
      this.setupPluginContext(plugin)
    }
  }

  /**
   * Setup context for a specific plugin
   */
  private setupPluginContext(plugin: Plugin): void {
    const pluginConfig = this.config.plugins.config[plugin.name] || {}
    const mergedConfig = { ...plugin.defaultConfig, ...pluginConfig }

    const context: PluginContext = {
      config: this.config,
      logger: this.logger.child({ plugin: plugin.name }),
      app: this.app,
      utils: createPluginUtils(this.logger),
      registry: this.registry
    }

    this.contexts.set(plugin.name, context)

    // Initialize metrics
    this.metrics.set(plugin.name, {
      loadTime: 0,
      setupTime: 0,
      hookExecutions: new Map(),
      errors: 0,
      warnings: 0
    })
  }

  /**
   * Get plugin context
   */
  private getPluginContext(pluginName: string): PluginContext {
    const context = this.contexts.get(pluginName)
    if (!context) {
      throw new FluxStackError(
        `Plugin context not found for '${pluginName}'`,
        'PLUGIN_CONTEXT_NOT_FOUND',
        500
      )
    }
    return context
  }

  /**
   * Update plugin metrics
   */
  private updatePluginMetrics(
    pluginName: string,
    hook: PluginHook,
    duration: number,
    success: boolean
  ): void {
    const metrics = this.metrics.get(pluginName)
    if (!metrics) return

    // Update hook execution count
    const currentCount = metrics.hookExecutions.get(hook) || 0
    metrics.hookExecutions.set(hook, currentCount + 1)

    // Update error/success counts
    if (success) {
      if (hook === 'setup') {
        metrics.setupTime = duration
      }
    } else {
      metrics.errors++
    }

    metrics.lastExecution = new Date()
  }
}

/**
 * Create request context from HTTP request
 */
export function createRequestContext(request: Request, additionalData: any = {}): RequestContext {
  const url = new URL(request.url)
  
  return {
    request,
    path: url.pathname,
    method: request.method,
    headers: (() => {
      const headers: Record<string, string> = {}
      request.headers.forEach((value, key) => {
        headers[key] = value
      })
      return headers
    })(),
    query: Object.fromEntries(url.searchParams.entries()),
    params: {},
    startTime: Date.now(),
    ...additionalData
  }
}

/**
 * Create response context from request context and response
 */
export function createResponseContext(
  requestContext: RequestContext,
  response: Response,
  additionalData: any = {}
): ResponseContext {
  return {
    ...requestContext,
    response,
    statusCode: response.status,
    duration: Date.now() - requestContext.startTime,
    size: parseInt(response.headers.get('content-length') || '0'),
    ...additionalData
  }
}

/**
 * Create error context from request context and error
 */
export function createErrorContext(
  requestContext: RequestContext,
  error: Error,
  additionalData: any = {}
): ErrorContext {
  return {
    ...requestContext,
    error,
    duration: Date.now() - requestContext.startTime,
    handled: false,
    ...additionalData
  }
}

/**
 * Create build context
 */
export function createBuildContext(
  target: string,
  outDir: string,
  mode: 'development' | 'production',
  config: FluxStackConfig
): BuildContext {
  return {
    target,
    outDir,
    mode,
    config
  }
}