/**
 * Built-in Plugins for FluxStack
 * Core plugins that provide essential functionality
 */

// Import all built-in plugins
import { loggerPlugin } from './logger'
import { swaggerPlugin } from './swagger'
import { vitePlugin } from './vite'
import { staticPlugin } from './static'
import { monitoringPlugin } from './monitoring'

// Export individual plugins
export { loggerPlugin } from './logger'
export { swaggerPlugin } from './swagger'
export { vitePlugin } from './vite'
export { staticPlugin } from './static'
export { monitoringPlugin } from './monitoring'

// Export as a collection
export const builtInPlugins = {
  logger: loggerPlugin,
  swagger: swaggerPlugin,
  vite: vitePlugin,
  static: staticPlugin,
  monitoring: monitoringPlugin
} as const

// Export as an array for easy registration
export const builtInPluginsList = [
  loggerPlugin,
  swaggerPlugin,
  vitePlugin,
  staticPlugin,
  monitoringPlugin
] as const

// Plugin categories
export const pluginCategories = {
  core: [loggerPlugin, staticPlugin],
  development: [vitePlugin],
  documentation: [swaggerPlugin],
  monitoring: [loggerPlugin, monitoringPlugin]
} as const

// Default plugin configuration
export const defaultPluginConfig = {
  logger: {
    logRequests: true,
    logResponses: true,
    logErrors: true,
    includeHeaders: false,
    includeBody: false,
    slowRequestThreshold: 1000
  },
  swagger: {
    enabled: true,
    path: '/swagger',
    title: 'FluxStack API',
    description: 'Modern full-stack TypeScript framework with type-safe API endpoints'
  },
  vite: {
    enabled: true,
    port: 5173,
    host: 'localhost',
    checkInterval: 2000,
    maxRetries: 10,
    timeout: 5000
  },
  static: {
    enabled: true,
    publicDir: 'public',
    distDir: 'dist/client',
    indexFile: 'index.html',
    spa: {
      enabled: true,
      fallback: 'index.html'
    }
  },
  monitoring: {
    enabled: false, // Disabled by default to avoid overhead
    httpMetrics: true,
    systemMetrics: true,
    customMetrics: true,
    collectInterval: 5000,
    retentionPeriod: 300000,
    exporters: [
      {
        type: 'console',
        interval: 30000,
        enabled: false
      }
    ],
    thresholds: {
      responseTime: 1000,
      errorRate: 0.05,
      memoryUsage: 0.8,
      cpuUsage: 0.8
    }
  }
} as const

/**
 * Get default plugins for a specific environment
 */
export function getDefaultPlugins(environment: 'development' | 'production' | 'test' = 'development') {
  const basePlugins = [loggerPlugin, staticPlugin]
  
  switch (environment) {
    case 'development':
      return [...basePlugins, vitePlugin, swaggerPlugin, monitoringPlugin]
    case 'production':
      return [...basePlugins, monitoringPlugin]
    case 'test':
      return [loggerPlugin] // Minimal plugins for testing
    default:
      return basePlugins
  }
}

/**
 * Get plugin by name
 */
export function getBuiltInPlugin(name: string) {
  return builtInPlugins[name as keyof typeof builtInPlugins]
}

/**
 * Check if a plugin is built-in
 */
export function isBuiltInPlugin(name: string): boolean {
  return name in builtInPlugins
}

/**
 * Get plugins by category
 */
export function getPluginsByCategory(category: keyof typeof pluginCategories) {
  return pluginCategories[category] || []
}

export default builtInPlugins