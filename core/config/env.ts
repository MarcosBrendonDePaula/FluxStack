/**
 * Enhanced Environment Configuration System for FluxStack
 * Handles environment variable processing and precedence
 */

import type { FluxStackConfig, LogLevel, BuildTarget, LogFormat } from './schema'

export interface EnvironmentInfo {
  name: string
  isDevelopment: boolean
  isProduction: boolean
  isTest: boolean
  nodeEnv: string
}

export interface ConfigPrecedence {
  source: 'default' | 'file' | 'environment' | 'override'
  path: string
  value: any
  priority: number
}

/**
 * Get current environment information
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  // Import here to avoid circular dependency
  const { env } = require('../utils/env-runtime-v2')
  const nodeEnv = env.NODE_ENV

  return {
    name: nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    nodeEnv
  }
}

/**
 * Environment variable type conversion utilities
 */
export class EnvConverter {
  static toNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? defaultValue : parsed
  }

  static toBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) return defaultValue
    if (value === '') return false
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
  }

  static toArray(value: string | undefined, defaultValue: string[] = []): string[] {
    if (!value) return defaultValue
    return value.split(',').map(v => v.trim()).filter(Boolean)
  }

  static toLogLevel(value: string | undefined, defaultValue: LogLevel): LogLevel {
    if (!value) return defaultValue
    const level = value.toLowerCase() as LogLevel
    return ['debug', 'info', 'warn', 'error'].includes(level) ? level : defaultValue
  }

  static toBuildTarget(value: string | undefined, defaultValue: BuildTarget): BuildTarget {
    if (!value) return defaultValue
    const target = value.toLowerCase() as BuildTarget
    return ['bun', 'node', 'docker'].includes(target) ? target : defaultValue
  }

  static toLogFormat(value: string | undefined, defaultValue: LogFormat): LogFormat {
    if (!value) return defaultValue
    const format = value.toLowerCase() as LogFormat
    return ['json', 'pretty'].includes(format) ? format : defaultValue
  }

  static toObject<T = any>(value: string | undefined, defaultValue: T): T {
    if (!value) return defaultValue
    try {
      return JSON.parse(value)
    } catch {
      return defaultValue
    }
  }
}

/**
 * Environment variable processor with precedence handling
 */
export class EnvironmentProcessor {
  private precedenceMap: Map<string, ConfigPrecedence> = new Map()

  /**
   * Process environment variables with type conversion and precedence tracking
   */
  processEnvironmentVariables(): Partial<FluxStackConfig> {
    const config: any = {}

    // App configuration
    this.setConfigValue(config, 'app.name',
      process.env.FLUXSTACK_APP_NAME || process.env.APP_NAME, 'string')
    this.setConfigValue(config, 'app.version',
      process.env.FLUXSTACK_APP_VERSION || process.env.APP_VERSION, 'string')
    this.setConfigValue(config, 'app.description',
      process.env.FLUXSTACK_APP_DESCRIPTION || process.env.APP_DESCRIPTION, 'string')

    // Server configuration
    this.setConfigValue(config, 'server.port',
      process.env.PORT || process.env.FLUXSTACK_PORT, 'number')
    this.setConfigValue(config, 'server.host',
      process.env.HOST || process.env.FLUXSTACK_HOST, 'string')
    this.setConfigValue(config, 'server.apiPrefix',
      process.env.FLUXSTACK_API_PREFIX || process.env.API_PREFIX, 'string')

    // CORS configuration
    this.setConfigValue(config, 'server.cors.origins',
      process.env.CORS_ORIGINS || process.env.FLUXSTACK_CORS_ORIGINS, 'array')
    this.setConfigValue(config, 'server.cors.methods',
      process.env.CORS_METHODS || process.env.FLUXSTACK_CORS_METHODS, 'array')
    this.setConfigValue(config, 'server.cors.headers',
      process.env.CORS_HEADERS || process.env.FLUXSTACK_CORS_HEADERS, 'array')
    this.setConfigValue(config, 'server.cors.credentials',
      process.env.CORS_CREDENTIALS || process.env.FLUXSTACK_CORS_CREDENTIALS, 'boolean')
    this.setConfigValue(config, 'server.cors.maxAge',
      process.env.CORS_MAX_AGE || process.env.FLUXSTACK_CORS_MAX_AGE, 'number')

    // Client configuration
    this.setConfigValue(config, 'client.port',
      process.env.VITE_PORT || process.env.CLIENT_PORT || process.env.FLUXSTACK_CLIENT_PORT, 'number')
    this.setConfigValue(config, 'client.proxy.target',
      process.env.VITE_API_URL || process.env.API_URL || process.env.FLUXSTACK_PROXY_TARGET, 'string')
    this.setConfigValue(config, 'client.build.sourceMaps',
      process.env.FLUXSTACK_CLIENT_SOURCEMAPS, 'boolean')
    this.setConfigValue(config, 'client.build.minify',
      process.env.FLUXSTACK_CLIENT_MINIFY, 'boolean')

    // Build configuration
    this.setConfigValue(config, 'build.target',
      process.env.BUILD_TARGET || process.env.FLUXSTACK_BUILD_TARGET, 'buildTarget')
    this.setConfigValue(config, 'build.outDir',
      process.env.BUILD_OUTDIR || process.env.FLUXSTACK_BUILD_OUTDIR, 'string')
    this.setConfigValue(config, 'build.sourceMaps',
      process.env.BUILD_SOURCEMAPS || process.env.FLUXSTACK_BUILD_SOURCEMAPS, 'boolean')
    this.setConfigValue(config, 'build.clean',
      process.env.BUILD_CLEAN || process.env.FLUXSTACK_BUILD_CLEAN, 'boolean')

    // Build optimization
    this.setConfigValue(config, 'build.optimization.minify',
      process.env.BUILD_MINIFY || process.env.FLUXSTACK_BUILD_MINIFY, 'boolean')
    this.setConfigValue(config, 'build.optimization.treeshake',
      process.env.BUILD_TREESHAKE || process.env.FLUXSTACK_BUILD_TREESHAKE, 'boolean')
    this.setConfigValue(config, 'build.optimization.compress',
      process.env.BUILD_COMPRESS || process.env.FLUXSTACK_BUILD_COMPRESS, 'boolean')
    this.setConfigValue(config, 'build.optimization.splitChunks',
      process.env.BUILD_SPLIT_CHUNKS || process.env.FLUXSTACK_BUILD_SPLIT_CHUNKS, 'boolean')
    this.setConfigValue(config, 'build.optimization.bundleAnalyzer',
      process.env.BUILD_ANALYZER || process.env.FLUXSTACK_BUILD_ANALYZER, 'boolean')

    // Logging configuration
    this.setConfigValue(config, 'logging.level',
      process.env.LOG_LEVEL || process.env.FLUXSTACK_LOG_LEVEL, 'logLevel')
    this.setConfigValue(config, 'logging.format',
      process.env.LOG_FORMAT || process.env.FLUXSTACK_LOG_FORMAT, 'logFormat')

    // Monitoring configuration
    this.setConfigValue(config, 'monitoring.enabled',
      process.env.MONITORING_ENABLED || process.env.FLUXSTACK_MONITORING_ENABLED, 'boolean')
    this.setConfigValue(config, 'monitoring.metrics.enabled',
      process.env.METRICS_ENABLED || process.env.FLUXSTACK_METRICS_ENABLED, 'boolean')
    this.setConfigValue(config, 'monitoring.metrics.collectInterval',
      process.env.METRICS_INTERVAL || process.env.FLUXSTACK_METRICS_INTERVAL, 'number')
    this.setConfigValue(config, 'monitoring.profiling.enabled',
      process.env.PROFILING_ENABLED || process.env.FLUXSTACK_PROFILING_ENABLED, 'boolean')
    this.setConfigValue(config, 'monitoring.profiling.sampleRate',
      process.env.PROFILING_SAMPLE_RATE || process.env.FLUXSTACK_PROFILING_SAMPLE_RATE, 'number')

    // Database configuration
    this.setConfigValue(config, 'database.url', process.env.DATABASE_URL, 'string')
    this.setConfigValue(config, 'database.host', process.env.DATABASE_HOST, 'string')
    this.setConfigValue(config, 'database.port', process.env.DATABASE_PORT, 'number')
    this.setConfigValue(config, 'database.database', process.env.DATABASE_NAME, 'string')
    this.setConfigValue(config, 'database.user', process.env.DATABASE_USER, 'string')
    this.setConfigValue(config, 'database.password', process.env.DATABASE_PASSWORD, 'string')
    this.setConfigValue(config, 'database.ssl', process.env.DATABASE_SSL, 'boolean')
    this.setConfigValue(config, 'database.poolSize', process.env.DATABASE_POOL_SIZE, 'number')

    // Auth configuration
    this.setConfigValue(config, 'auth.secret', process.env.JWT_SECRET, 'string')
    this.setConfigValue(config, 'auth.expiresIn', process.env.JWT_EXPIRES_IN, 'string')
    this.setConfigValue(config, 'auth.algorithm', process.env.JWT_ALGORITHM, 'string')
    this.setConfigValue(config, 'auth.issuer', process.env.JWT_ISSUER, 'string')

    // Email configuration
    this.setConfigValue(config, 'email.host', process.env.SMTP_HOST, 'string')
    this.setConfigValue(config, 'email.port', process.env.SMTP_PORT, 'number')
    this.setConfigValue(config, 'email.user', process.env.SMTP_USER, 'string')
    this.setConfigValue(config, 'email.password', process.env.SMTP_PASSWORD, 'string')
    this.setConfigValue(config, 'email.secure', process.env.SMTP_SECURE, 'boolean')
    this.setConfigValue(config, 'email.from', process.env.SMTP_FROM, 'string')

    // Storage configuration
    this.setConfigValue(config, 'storage.uploadPath', process.env.UPLOAD_PATH, 'string')
    this.setConfigValue(config, 'storage.maxFileSize', process.env.MAX_FILE_SIZE, 'number')
    this.setConfigValue(config, 'storage.provider', process.env.STORAGE_PROVIDER, 'string')

    // Plugin configuration
    this.setConfigValue(config, 'plugins.enabled',
      process.env.FLUXSTACK_PLUGINS_ENABLED, 'array')
    this.setConfigValue(config, 'plugins.disabled',
      process.env.FLUXSTACK_PLUGINS_DISABLED, 'array')

    return this.cleanEmptyObjects(config)
  }

  private setConfigValue(
    config: any,
    path: string,
    value: string | undefined,
    type: string
  ): void {
    if (value === undefined) return

    const convertedValue = this.convertValue(value, type)
    if (convertedValue !== undefined) {
      this.setNestedProperty(config, path, convertedValue)

      // Track precedence
      this.precedenceMap.set(path, {
        source: 'environment',
        path,
        value: convertedValue,
        priority: 3 // Environment variables have high priority
      })
    }
  }

  private convertValue(value: string, type: string): any {
    switch (type) {
      case 'string':
        return value
      case 'number':
        return EnvConverter.toNumber(value, 0)
      case 'boolean':
        const boolValue = EnvConverter.toBoolean(value, false)
        return boolValue
      case 'array':
        return EnvConverter.toArray(value)
      case 'logLevel':
        return EnvConverter.toLogLevel(value, 'info')
      case 'buildTarget':
        return EnvConverter.toBuildTarget(value, 'bun')
      case 'logFormat':
        return EnvConverter.toLogFormat(value, 'pretty')
      case 'object':
        return EnvConverter.toObject(value, {})
      default:
        return value
    }
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key]
    }

    current[keys[keys.length - 1]] = value
  }

  private cleanEmptyObjects(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj

    const cleaned: any = {}

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const cleanedValue = this.cleanEmptyObjects(value)
        if (Object.keys(cleanedValue).length > 0) {
          cleaned[key] = cleanedValue
        }
      } else if (value !== undefined && value !== null) {
        cleaned[key] = value
      }
    }

    return cleaned
  }

  /**
   * Get precedence information for configuration values
   */
  getPrecedenceInfo(): Map<string, ConfigPrecedence> {
    return new Map(this.precedenceMap)
  }

  /**
   * Clear precedence tracking
   */
  clearPrecedence(): void {
    this.precedenceMap.clear()
  }
}

/**
 * Configuration merger with precedence handling
 */
export class ConfigMerger {
  private precedenceOrder = ['default', 'file', 'environment', 'override']

  /**
   * Merge configurations with precedence handling
   * Higher precedence values override lower ones
   */
  merge(...configs: Array<{ config: Partial<FluxStackConfig>, source: string }>): FluxStackConfig {
    let result: any = {}
    const precedenceMap: Map<string, ConfigPrecedence> = new Map()

    // Process configs in precedence order
    for (const { config, source } of configs) {
      this.deepMergeWithPrecedence(result, config, source, precedenceMap)
    }

    return result as FluxStackConfig
  }

  private deepMergeWithPrecedence(
    target: any,
    source: any,
    sourceName: string,
    precedenceMap: Map<string, ConfigPrecedence>,
    currentPath = ''
  ): void {
    if (!source || typeof source !== 'object') return

    for (const [key, value] of Object.entries(source)) {
      const fullPath = currentPath ? `${currentPath}.${key}` : key
      const sourcePriority = this.precedenceOrder.indexOf(sourceName)

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Ensure target has the nested object
        if (!(key in target) || typeof target[key] !== 'object') {
          target[key] = {}
        }

        // Recursively merge nested objects
        this.deepMergeWithPrecedence(target[key], value, sourceName, precedenceMap, fullPath)
      } else {
        // Check precedence before overriding
        const existingPrecedence = precedenceMap.get(fullPath)

        if (!existingPrecedence || sourcePriority >= existingPrecedence.priority) {
          target[key] = value
          precedenceMap.set(fullPath, {
            source: sourceName as any,
            path: fullPath,
            value,
            priority: sourcePriority
          })
        }
      }
    }
  }
}

/**
 * Environment-specific configuration applier
 */
export class EnvironmentConfigApplier {
  /**
   * Apply environment-specific configuration overrides
   */
  applyEnvironmentConfig(
    baseConfig: FluxStackConfig,
    environment: string
  ): FluxStackConfig {
    const envConfig = baseConfig.environments?.[environment]

    if (!envConfig) {
      return baseConfig
    }

    const merger = new ConfigMerger()
    return merger.merge(
      { config: baseConfig, source: 'base' },
      { config: envConfig, source: `environment:${environment}` }
    )
  }

  /**
   * Get available environments from configuration
   */
  getAvailableEnvironments(config: FluxStackConfig): string[] {
    return config.environments ? Object.keys(config.environments) : []
  }

  /**
   * Validate environment-specific configuration
   */
  validateEnvironmentConfig(
    config: FluxStackConfig,
    environment: string
  ): { valid: boolean; errors: string[] } {
    const envConfig = config.environments?.[environment]

    if (!envConfig) {
      return { valid: true, errors: [] }
    }

    const errors: string[] = []

    // Check for conflicting configurations
    if (envConfig.server?.port === config.server.port && environment !== 'development') {
      errors.push(`Environment ${environment} uses same port as base configuration`)
    }

    // Check for missing required overrides in production
    if (environment === 'production') {
      if (!envConfig.logging?.level || envConfig.logging.level === 'debug') {
        errors.push('Production environment should not use debug logging')
      }

      if (!envConfig.monitoring?.enabled) {
        errors.push('Production environment should enable monitoring')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Singleton instances for global use
export const environmentProcessor = new EnvironmentProcessor()
export const configMerger = new ConfigMerger()
export const environmentConfigApplier = new EnvironmentConfigApplier()

/**
 * Utility functions for backward compatibility
 */
export function isDevelopment(): boolean {
  return getEnvironmentInfo().isDevelopment
}

export function isProduction(): boolean {
  return getEnvironmentInfo().isProduction
}

export function isTest(): boolean {
  return getEnvironmentInfo().isTest
}

/**
 * Get environment-specific configuration recommendations
 */
export function getEnvironmentRecommendations(environment: string): Partial<FluxStackConfig> {
  switch (environment) {
    case 'development':
      return {
        logging: {
          level: 'debug' as const,
          format: 'pretty' as const,
          transports: [{ type: 'console' as const, level: 'debug' as const, format: 'pretty' as const }]
        },
        build: {
          target: 'bun' as const,
          outDir: 'dist',
          clean: true,
          optimization: {
            minify: false,
            compress: false,
            treeshake: false,
            splitChunks: false,
            bundleAnalyzer: false
          },
          sourceMaps: true
        },
        monitoring: {
          enabled: false,
          metrics: {
            enabled: false,
            collectInterval: 60000,
            httpMetrics: true,
            systemMetrics: true,
            customMetrics: false
          },
          profiling: {
            enabled: false,
            sampleRate: 0.1,
            memoryProfiling: false,
            cpuProfiling: false
          },
          exporters: []
        }
      }

    case 'production':
      return {
        logging: {
          level: 'warn' as const,
          format: 'json' as const,
          transports: [
            { type: 'console' as const, level: 'warn' as const, format: 'json' as const },
            { type: 'file' as const, level: 'warn' as const, format: 'json' as const, options: { filename: 'app.log' } }
          ]
        },
        build: {
          target: 'bun' as const,
          outDir: 'dist',
          clean: true,
          optimization: {
            minify: true,
            compress: true,
            treeshake: true,
            splitChunks: true,
            bundleAnalyzer: false
          },
          sourceMaps: false
        },
        monitoring: {
          enabled: true,
          metrics: {
            enabled: true,
            collectInterval: 30000,
            httpMetrics: true,
            systemMetrics: true,
            customMetrics: false
          },
          profiling: {
            enabled: true,
            sampleRate: 0.01,
            memoryProfiling: true,
            cpuProfiling: true
          },
          exporters: ['prometheus']
        }
      }

    case 'test':
      return {
        logging: {
          level: 'error' as const,
          format: 'json' as const,
          transports: [{ type: 'console' as const, level: 'error' as const, format: 'json' as const }]
        },
        server: {
          port: 0, // Random port
          host: 'localhost',
          apiPrefix: '/api',
          cors: {
            origins: ['*'],
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            headers: ['Content-Type', 'Authorization'],
            credentials: false,
            maxAge: 86400
          },
          middleware: []
        },
        client: {
          port: 0,
          proxy: { target: 'http://localhost:3000' },
          build: {
            target: 'es2020' as const,
            outDir: 'dist/client',
            sourceMaps: false,
            minify: false
          }
        },
        monitoring: {
          enabled: false,
          metrics: {
            enabled: false,
            collectInterval: 60000,
            httpMetrics: true,
            systemMetrics: true,
            customMetrics: false
          },
          profiling: {
            enabled: false,
            sampleRate: 0.1,
            memoryProfiling: false,
            cpuProfiling: false
          },
          exporters: []
        }
      }

    default:
      return {}
  }
}