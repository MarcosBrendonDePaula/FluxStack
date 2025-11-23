/**
 * Enhanced Plugin System
 * Comprehensive plugin system with lifecycle hooks, dependency management, and configuration
 */

// Core plugin types and interfaces
export type {
  BuildContext,
  ErrorContext,
  FluxStack,
  HookExecutionOptions,
  PluginConfigSchema,
  PluginContext,
  PluginDiscoveryOptions,
  PluginExecutionContext,
  PluginHook,
  PluginHookResult,
  PluginInstallOptions,
  PluginLifecycleEvent,
  PluginLoadResult,
  PluginManifest,
  PluginMetrics,
  PluginPriority,
  PluginRegistryState,
  PluginValidationResult,
  RequestContext,
  ResponseContext,
} from './types'

export type Plugin = FluxStack.Plugin

export type { PluginConfigManager } from './config'
// Plugin configuration management
export {
  createPluginUtils,
  DefaultPluginConfigManager,
} from './config'
export type { PluginDiscoveryConfig } from './discovery'
// Plugin discovery
export { PluginDiscovery, pluginDiscovery } from './discovery'
export type {
  PluginExecutionPlan,
  PluginExecutionStats,
  PluginExecutionStep,
} from './executor'
// Plugin executor
export {
  calculateExecutionStats,
  PluginExecutor,
} from './executor'
export type { PluginManagerConfig } from './manager'
// Plugin manager
export {
  createBuildContext,
  createErrorContext,
  createRequestContext,
  createResponseContext,
  PluginManager,
} from './manager'
export type { ModuleResolverConfig } from './module-resolver'
// Module resolver for plugins
export { PluginModuleResolver } from './module-resolver'
export type { PluginRegistryConfig } from './registry'
// Plugin registry
export { PluginRegistry } from './registry'

// Utility functions for plugin development
export const PluginUtils = {
  /**
   * Create a simple plugin
   */
  createPlugin: (config: {
    name: string
    version?: string
    description?: string
    dependencies?: string[]
    priority?: number | PluginPriority
    setup?: (context: PluginContext) => void | Promise<void>
    onServerStart?: (context: PluginContext) => void | Promise<void>
    onServerStop?: (context: PluginContext) => void | Promise<void>
    onRequest?: (context: RequestContext) => void | Promise<void>
    onBeforeRoute?: (context: RequestContext) => void | Promise<void>
    onResponse?: (context: ResponseContext) => void | Promise<void>
    onError?: (context: ErrorContext) => void | Promise<void>
    configSchema?: any
    defaultConfig?: any
  }): Plugin => {
    const plugin = {
      name: config.name,
      ...(config.version && { version: config.version }),
      ...(config.description && { description: config.description }),
      ...(config.dependencies && { dependencies: config.dependencies }),
      ...(config.priority !== undefined && { priority: config.priority }),
      ...(config.setup && { setup: config.setup }),
      ...(config.onServerStart && { onServerStart: config.onServerStart }),
      ...(config.onServerStop && { onServerStop: config.onServerStop }),
      ...(config.onRequest && { onRequest: config.onRequest }),
      ...(config.onBeforeRoute && { onBeforeRoute: config.onBeforeRoute }),
      ...(config.onResponse && { onResponse: config.onResponse }),
      ...(config.onError && { onError: config.onError }),
      ...(config.configSchema && { configSchema: config.configSchema }),
      ...(config.defaultConfig && { defaultConfig: config.defaultConfig }),
    } as Plugin
    return plugin
  },

  /**
   * Create a plugin manifest
   */
  createManifest: (config: {
    name: string
    version: string
    description: string
    author: string
    license: string
    homepage?: string
    repository?: string
    keywords?: string[]
    dependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
    fluxstack: {
      version: string
      hooks: PluginHook[]
      config?: any
      category?: string
      tags?: string[]
    }
  }): any => {
    return {
      name: config.name,
      version: config.version || '1.0.0',
      description: config.description,
      author: config.author,
      license: config.license,
      homepage: config.homepage,
      repository: config.repository,
      keywords: config.keywords || [],
      dependencies: config.dependencies || {},
      peerDependencies: config.peerDependencies,
      fluxstack: config.fluxstack,
    }
  },

  /**
   * Validate plugin structure
   */
  validatePlugin: (plugin: any): plugin is Plugin => {
    return (
      plugin &&
      typeof plugin === 'object' &&
      typeof plugin.name === 'string' &&
      plugin.name.length > 0
    )
  },

  /**
   * Check if plugin implements hook
   */
  implementsHook: (plugin: Plugin, hook: PluginHook): boolean => {
    const hookFunction = (plugin as any)[hook]
    return hookFunction && typeof hookFunction === 'function'
  },

  /**
   * Get plugin hooks
   */
  getPluginHooks: (plugin: Plugin): PluginHook[] => {
    const hooks: PluginHook[] = []
    const possibleHooks: PluginHook[] = [
      'setup',
      'onServerStart',
      'onServerStop',
      'onRequest',
      'onResponse',
      'onError',
      'onBuild',
      'onBuildComplete',
    ]

    for (const hook of possibleHooks) {
      if (PluginUtils.implementsHook(plugin, hook)) {
        hooks.push(hook)
      }
    }

    return hooks
  },
}

// Re-export types for convenience
import type {
  ErrorContext,
  FluxStack,
  PluginContext,
  PluginHook,
  PluginPriority,
  RequestContext,
  ResponseContext,
} from './types'
