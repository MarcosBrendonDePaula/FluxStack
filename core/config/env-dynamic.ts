/**
 * Dynamic Environment Configuration Adapter for FluxStack
 * Integrates runtime env loader with existing configuration system
 * Solves Bun build issue by using dynamic environment access
 */

import { env, runtimeEnv, envValidation } from '../utils/env-runtime'
import type { FluxStackConfig, LogLevel, BuildTarget, LogFormat } from './schema'

/**
 * Enhanced Environment Processor that uses dynamic env access
 * Replaces the original EnvironmentProcessor from env.ts
 */
export class DynamicEnvironmentProcessor {
  private precedenceMap: Map<string, any> = new Map()

  /**
   * Process environment variables using dynamic runtime access
   * This prevents Bun from fixing env values during build
   */
  processEnvironmentVariables(): Partial<FluxStackConfig> {
    const config: any = {}

    // App configuration
    this.setConfigValue(config, 'app.name', 
      env.get('FLUXSTACK_APP_NAME') || env.get('APP_NAME'), 'string')
    this.setConfigValue(config, 'app.version',
      env.get('FLUXSTACK_APP_VERSION') || env.get('APP_VERSION'), 'string')
    this.setConfigValue(config, 'app.description',
      env.get('FLUXSTACK_APP_DESCRIPTION') || env.get('APP_DESCRIPTION'), 'string')

    // Server configuration
    this.setConfigValue(config, 'server.port',
      env.get('PORT') || env.get('FLUXSTACK_PORT'), 'number')
    this.setConfigValue(config, 'server.host',
      env.get('HOST') || env.get('FLUXSTACK_HOST'), 'string')
    this.setConfigValue(config, 'server.apiPrefix',
      env.get('FLUXSTACK_API_PREFIX') || env.get('API_PREFIX'), 'string')

    // CORS configuration
    this.setConfigValue(config, 'server.cors.origins',
      env.get('CORS_ORIGINS') || env.get('FLUXSTACK_CORS_ORIGINS'), 'array')
    this.setConfigValue(config, 'server.cors.methods',
      env.get('CORS_METHODS') || env.get('FLUXSTACK_CORS_METHODS'), 'array')
    this.setConfigValue(config, 'server.cors.headers',
      env.get('CORS_HEADERS') || env.get('FLUXSTACK_CORS_HEADERS'), 'array')
    this.setConfigValue(config, 'server.cors.credentials',
      env.get('CORS_CREDENTIALS') || env.get('FLUXSTACK_CORS_CREDENTIALS'), 'boolean')
    this.setConfigValue(config, 'server.cors.maxAge',
      env.get('CORS_MAX_AGE') || env.get('FLUXSTACK_CORS_MAX_AGE'), 'number')

    // Client configuration
    this.setConfigValue(config, 'client.port',
      env.get('VITE_PORT') || env.get('CLIENT_PORT') || env.get('FLUXSTACK_CLIENT_PORT'), 'number')
    this.setConfigValue(config, 'client.proxy.target',
      env.get('VITE_API_URL') || env.get('API_URL') || env.get('FLUXSTACK_PROXY_TARGET'), 'string')
    this.setConfigValue(config, 'client.build.sourceMaps',
      env.get('FLUXSTACK_CLIENT_SOURCEMAPS'), 'boolean')
    this.setConfigValue(config, 'client.build.minify',
      env.get('FLUXSTACK_CLIENT_MINIFY'), 'boolean')

    // Build configuration
    this.setConfigValue(config, 'build.target',
      env.get('BUILD_TARGET') || env.get('FLUXSTACK_BUILD_TARGET'), 'buildTarget')
    this.setConfigValue(config, 'build.outDir',
      env.get('BUILD_OUTDIR') || env.get('FLUXSTACK_BUILD_OUTDIR'), 'string')
    this.setConfigValue(config, 'build.sourceMaps',
      env.get('BUILD_SOURCEMAPS') || env.get('FLUXSTACK_BUILD_SOURCEMAPS'), 'boolean')
    this.setConfigValue(config, 'build.clean',
      env.get('BUILD_CLEAN') || env.get('FLUXSTACK_BUILD_CLEAN'), 'boolean')

    // Build optimization
    this.setConfigValue(config, 'build.optimization.minify',
      env.get('BUILD_MINIFY') || env.get('FLUXSTACK_BUILD_MINIFY'), 'boolean')
    this.setConfigValue(config, 'build.optimization.treeshake',
      env.get('BUILD_TREESHAKE') || env.get('FLUXSTACK_BUILD_TREESHAKE'), 'boolean')
    this.setConfigValue(config, 'build.optimization.compress',
      env.get('BUILD_COMPRESS') || env.get('FLUXSTACK_BUILD_COMPRESS'), 'boolean')
    this.setConfigValue(config, 'build.optimization.splitChunks',
      env.get('BUILD_SPLIT_CHUNKS') || env.get('FLUXSTACK_BUILD_SPLIT_CHUNKS'), 'boolean')
    this.setConfigValue(config, 'build.optimization.bundleAnalyzer',
      env.get('BUILD_ANALYZER') || env.get('FLUXSTACK_BUILD_ANALYZER'), 'boolean')

    // Logging configuration
    this.setConfigValue(config, 'logging.level',
      env.get('LOG_LEVEL') || env.get('FLUXSTACK_LOG_LEVEL'), 'logLevel')
    this.setConfigValue(config, 'logging.format',
      env.get('LOG_FORMAT') || env.get('FLUXSTACK_LOG_FORMAT'), 'logFormat')

    // Monitoring configuration
    this.setConfigValue(config, 'monitoring.enabled',
      env.get('MONITORING_ENABLED') || env.get('FLUXSTACK_MONITORING_ENABLED'), 'boolean')
    this.setConfigValue(config, 'monitoring.metrics.enabled',
      env.get('METRICS_ENABLED') || env.get('FLUXSTACK_METRICS_ENABLED'), 'boolean')
    this.setConfigValue(config, 'monitoring.metrics.collectInterval',
      env.get('METRICS_INTERVAL') || env.get('FLUXSTACK_METRICS_INTERVAL'), 'number')
    this.setConfigValue(config, 'monitoring.profiling.enabled',
      env.get('PROFILING_ENABLED') || env.get('FLUXSTACK_PROFILING_ENABLED'), 'boolean')
    this.setConfigValue(config, 'monitoring.profiling.sampleRate',
      env.get('PROFILING_SAMPLE_RATE') || env.get('FLUXSTACK_PROFILING_SAMPLE_RATE'), 'number')

    // Database configuration
    this.setConfigValue(config, 'database.url', env.get('DATABASE_URL'), 'string')
    this.setConfigValue(config, 'database.host', env.get('DATABASE_HOST'), 'string')
    this.setConfigValue(config, 'database.port', env.get('DATABASE_PORT'), 'number')
    this.setConfigValue(config, 'database.database', env.get('DATABASE_NAME'), 'string')
    this.setConfigValue(config, 'database.user', env.get('DATABASE_USER'), 'string')
    this.setConfigValue(config, 'database.password', env.get('DATABASE_PASSWORD'), 'string')
    this.setConfigValue(config, 'database.ssl', env.get('DATABASE_SSL'), 'boolean')
    this.setConfigValue(config, 'database.poolSize', env.get('DATABASE_POOL_SIZE'), 'number')

    // Auth configuration
    this.setConfigValue(config, 'auth.secret', env.get('JWT_SECRET'), 'string')
    this.setConfigValue(config, 'auth.expiresIn', env.get('JWT_EXPIRES_IN'), 'string')
    this.setConfigValue(config, 'auth.algorithm', env.get('JWT_ALGORITHM'), 'string')
    this.setConfigValue(config, 'auth.issuer', env.get('JWT_ISSUER'), 'string')

    // Email configuration
    this.setConfigValue(config, 'email.host', env.get('SMTP_HOST'), 'string')
    this.setConfigValue(config, 'email.port', env.get('SMTP_PORT'), 'number')
    this.setConfigValue(config, 'email.user', env.get('SMTP_USER'), 'string')
    this.setConfigValue(config, 'email.password', env.get('SMTP_PASSWORD'), 'string')
    this.setConfigValue(config, 'email.secure', env.get('SMTP_SECURE'), 'boolean')
    this.setConfigValue(config, 'email.from', env.get('SMTP_FROM'), 'string')

    // Storage configuration
    this.setConfigValue(config, 'storage.uploadPath', env.get('UPLOAD_PATH'), 'string')
    this.setConfigValue(config, 'storage.maxFileSize', env.get('MAX_FILE_SIZE'), 'number')
    this.setConfigValue(config, 'storage.provider', env.get('STORAGE_PROVIDER'), 'string')

    // Plugin configuration
    this.setConfigValue(config, 'plugins.enabled',
      env.get('FLUXSTACK_PLUGINS_ENABLED'), 'array')
    this.setConfigValue(config, 'plugins.disabled',
      env.get('FLUXSTACK_PLUGINS_DISABLED'), 'array')

    return this.cleanEmptyObjects(config)
  }

  private setConfigValue(
    config: any,
    path: string,
    value: string | undefined,
    type: string
  ): void {
    if (value === undefined || value === '') return

    const convertedValue = this.convertValue(value, type)
    if (convertedValue !== undefined) {
      this.setNestedProperty(config, path, convertedValue)

      // Track precedence
      this.precedenceMap.set(path, {
        source: 'environment',
        path,
        value: convertedValue,
        priority: 3
      })
    }
  }

  private convertValue(value: string, type: string): any {
    switch (type) {
      case 'string':
        return value
      case 'number':
        const num = parseInt(value, 10)
        return isNaN(num) ? undefined : num
      case 'boolean':
        return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
      case 'array':
        return value.split(',').map(v => v.trim()).filter(Boolean)
      case 'logLevel':
        const level = value.toLowerCase() as LogLevel
        return ['debug', 'info', 'warn', 'error'].includes(level) ? level : 'info'
      case 'buildTarget':
        const target = value.toLowerCase() as BuildTarget
        return ['bun', 'node', 'docker'].includes(target) ? target : 'bun'
      case 'logFormat':
        const format = value.toLowerCase() as LogFormat
        return ['json', 'pretty'].includes(format) ? format : 'pretty'
      case 'object':
        try {
          return JSON.parse(value)
        } catch {
          return {}
        }
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

  getPrecedenceInfo(): Map<string, any> {
    return new Map(this.precedenceMap)
  }

  clearPrecedence(): void {
    this.precedenceMap.clear()
  }
}

/**
 * Enhanced environment info with dynamic access
 */
export function getDynamicEnvironmentInfo() {
  const nodeEnv = env.get('NODE_ENV', 'development')

  return {
    name: nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    nodeEnv
  }
}

/**
 * Runtime configuration loader that uses dynamic env access
 */
export function loadConfigFromDynamicEnv(): Partial<FluxStackConfig> {
  const processor = new DynamicEnvironmentProcessor()
  return processor.processEnvironmentVariables()
}

/**
 * Utility functions for backward compatibility
 */
export function isDevelopment(): boolean {
  return getDynamicEnvironmentInfo().isDevelopment
}

export function isProduction(): boolean {
  return getDynamicEnvironmentInfo().isProduction
}

export function isTest(): boolean {
  return getDynamicEnvironmentInfo().isTest
}

/**
 * Validate critical environment variables for production
 */
export function validateProductionEnv(): void {
  if (isProduction()) {
    const requiredVars = ['NODE_ENV']
    const missingVars = requiredVars.filter(key => !env.has(key))
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required production environment variables: ${missingVars.join(', ')}`)
    }

    // Validate LOG_LEVEL for production
    const logLevel = env.get('LOG_LEVEL')
    if (logLevel === 'debug') {
      console.warn('⚠️  Production environment should not use debug logging')
    }
  }
}

/**
 * Create environment-aware configuration
 */
export function createDynamicConfig(): Partial<FluxStackConfig> {
  const envInfo = getDynamicEnvironmentInfo()
  const envConfig = loadConfigFromDynamicEnv()

  // Add environment-specific defaults
  const config: any = { ...envConfig }

  // Ensure proper defaults based on environment
  if (envInfo.isDevelopment) {
    config.logging = {
      level: env.get('LOG_LEVEL', 'debug'),
      format: env.get('LOG_FORMAT', 'pretty'),
      ...config.logging
    }
  } else if (envInfo.isProduction) {
    config.logging = {
      level: env.get('LOG_LEVEL', 'warn'),
      format: env.get('LOG_FORMAT', 'json'),
      ...config.logging
    }
  }

  return config
}

// Export singleton instance
export const dynamicEnvironmentProcessor = new DynamicEnvironmentProcessor()

// Export runtime environment access
export { env, runtimeEnv, envValidation } from '../utils/env-runtime'