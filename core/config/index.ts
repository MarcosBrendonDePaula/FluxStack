/**
 * FluxStack Configuration System
 * Unified interface for configuration loading, validation, and management
 */

// Re-export all configuration types and utilities
export type {
  FluxStackConfig,
  AppConfig,
  ServerConfig,
  ClientConfig,
  BuildConfig,
  LoggingConfig,
  MonitoringConfig,
  PluginConfig,
  DatabaseConfig,
  AuthConfig,
  EmailConfig,
  StorageConfig,
  LogLevel,
  BuildTarget,
  LogFormat
} from './schema'

export {
  defaultFluxStackConfig,
  environmentDefaults,
  fluxStackConfigSchema
} from './schema'

export interface ConfigLoadOptions {
  configPath?: string
  environment?: string
  envPrefix?: string
  validateSchema?: boolean
}

export interface ConfigLoadResult {
  config: FluxStackConfig
  sources: string[]
  warnings: string[]
  errors: string[]
}

import { 
  loadConfig as _loadConfig,
  loadConfigSync as _loadConfigSync,
  getConfigValue,
  hasConfigValue,
  createConfigSubset
} from './loader'

import { environmentDefaults } from './schema'

export {
  _loadConfig as loadConfig,
  _loadConfigSync as loadConfigSync,
  getConfigValue,
  hasConfigValue,
  createConfigSubset
}

export type {
  ValidationResult,
  ValidationError,
  ValidationWarning
} from './validator'

export {
  validateConfig,
  validateConfigStrict,
  createEnvironmentValidator,
  validatePartialConfig,
  getConfigSuggestions
} from './validator'

export type {
  EnvironmentInfo,
  ConfigPrecedence
} from './env'

export {
  getEnvironmentInfo,
  EnvConverter,
  EnvironmentProcessor,
  ConfigMerger,
  EnvironmentConfigApplier,
  environmentProcessor,
  configMerger,
  environmentConfigApplier,
  isDevelopment,
  isProduction,
  isTest,
  getEnvironmentRecommendations
} from './env'

// Main configuration loader with caching
let cachedConfig: FluxStackConfig | null = null
let configPromise: Promise<FluxStackConfig> | null = null

/**
 * Get the current FluxStack configuration
 * This function loads and caches the configuration on first call
 */
export async function getConfig(options?: ConfigLoadOptions): Promise<FluxStackConfig> {
  if (cachedConfig && !options) {
    return cachedConfig
  }
  
  if (configPromise && !options) {
    return configPromise
  }
  
  configPromise = loadConfiguration(options)
  cachedConfig = await configPromise
  
  return cachedConfig
}

/**
 * Get configuration synchronously (limited functionality)
 * Only loads from environment variables and defaults
 */
export function getConfigSync(options?: ConfigLoadOptions): FluxStackConfig {
  const result = _loadConfigSync(options)
  
  if (result.errors.length > 0) {
    console.warn('Configuration errors:', result.errors)
  }
  
  if (result.warnings.length > 0) {
    console.warn('Configuration warnings:', result.warnings)
  }
  
  return result.config
}

/**
 * Reload configuration (clears cache)
 */
export async function reloadConfig(options?: ConfigLoadOptions): Promise<FluxStackConfig> {
  cachedConfig = null
  configPromise = null
  return getConfig(options)
}

/**
 * Internal configuration loader with error handling
 */
async function loadConfiguration(options?: ConfigLoadOptions): Promise<FluxStackConfig> {
  try {
    const result = await _loadConfig(options)
    
    // Log warnings if any
    if (result.warnings.length > 0) {
      console.warn('Configuration warnings:')
      result.warnings.forEach(warning => console.warn(`  - ${warning}`))
    }
    
    // Throw on errors
    if (result.errors.length > 0) {
      const errorMessage = [
        'Configuration loading failed:',
        ...result.errors.map(e => `  - ${e}`)
      ].join('\n')
      
      throw new Error(errorMessage)
    }
    
    return result.config
  } catch (error) {
    console.error('Failed to load FluxStack configuration:', error)
    
    // Fall back to default configuration with environment variables and environment defaults
    const fallbackResult = _loadConfigSync(options)
    console.warn('Using fallback configuration with environment variables only')
    
    // Apply environment defaults to fallback configuration
    const environment = process.env.NODE_ENV || 'development'
    const envDefaults = environmentDefaults[environment as keyof typeof environmentDefaults]
    
    if (envDefaults) {
      // Simple merge for fallback with proper type casting
      const configWithDefaults = {
        ...fallbackResult.config,
        logging: {
          ...fallbackResult.config.logging,
          ...((envDefaults as any).logging || {})
        },
        server: (envDefaults as any).server ? {
          ...fallbackResult.config.server,
          ...(envDefaults as any).server
        } : fallbackResult.config.server,
        client: (envDefaults as any).client ? {
          ...fallbackResult.config.client,
          ...(envDefaults as any).client
        } : fallbackResult.config.client,
        build: (envDefaults as any).build ? {
          ...fallbackResult.config.build,
          optimization: {
            ...fallbackResult.config.build.optimization,
            ...((envDefaults as any).build.optimization || {})
          }
        } : fallbackResult.config.build,
        monitoring: (envDefaults as any).monitoring ? {
          ...fallbackResult.config.monitoring,
          ...(envDefaults as any).monitoring
        } : fallbackResult.config.monitoring
      } as FluxStackConfig
      return configWithDefaults
    }
    
    return fallbackResult.config
  }
}

/**
 * Create a configuration subset for plugins or modules
 */
export function createPluginConfig<T = any>(
  config: FluxStackConfig,
  pluginName: string
): T {
  const pluginConfig = config.plugins.config[pluginName] || {}
  const customConfig = config.custom?.[pluginName] || {}
  
  return { ...pluginConfig, ...customConfig } as T
}

/**
 * Check if a feature is enabled based on configuration
 */
export function isFeatureEnabled(config: FluxStackConfig, feature: string): boolean {
  // Check plugin configuration
  if (config.plugins.enabled.includes(feature)) {
    return !config.plugins.disabled.includes(feature)
  }
  
  // Check monitoring features
  if (feature === 'monitoring') {
    return config.monitoring.enabled
  }
  
  if (feature === 'metrics') {
    return config.monitoring.enabled && config.monitoring.metrics.enabled
  }
  
  if (feature === 'profiling') {
    return config.monitoring.enabled && config.monitoring.profiling.enabled
  }
  
  // Check custom features
  return config.custom?.[feature] === true
}

/**
 * Get database configuration if available
 */
export function getDatabaseConfig(config: FluxStackConfig) {
  return config.database || null
}

/**
 * Get authentication configuration if available
 */
export function getAuthConfig(config: FluxStackConfig) {
  return config.auth || null
}

/**
 * Get email configuration if available
 */
export function getEmailConfig(config: FluxStackConfig) {
  return config.email || null
}

/**
 * Get storage configuration if available
 */
export function getStorageConfig(config: FluxStackConfig) {
  return config.storage || null
}

/**
 * Backward compatibility function for legacy configuration
 */
export function createLegacyConfig(config: FluxStackConfig) {
  return {
    port: config.server.port,
    vitePort: config.client.port,
    clientPath: 'app/client', // Fixed path for backward compatibility
    apiPrefix: config.server.apiPrefix,
    cors: {
      origins: config.server.cors.origins,
      methods: config.server.cors.methods,
      headers: config.server.cors.headers
    },
    build: {
      outDir: config.build.outDir,
      target: config.build.target
    }
  }
}

/**
 * Environment configuration utilities
 */
import { getEnvironmentInfo as _getEnvironmentInfo } from './env'
import type { FluxStackConfig } from './schema'

export const env = {
  isDevelopment: () => _getEnvironmentInfo().isDevelopment,
  isProduction: () => _getEnvironmentInfo().isProduction,
  isTest: () => _getEnvironmentInfo().isTest,
  getName: () => _getEnvironmentInfo().name,
  getInfo: () => _getEnvironmentInfo()
}