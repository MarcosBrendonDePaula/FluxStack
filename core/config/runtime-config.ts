/**
 * Runtime Configuration System for FluxStack
 * Uses declarative configuration system
 */

import { env, createNamespace } from '../utils/env'
import type { FluxStackConfig } from './schema'
import { defaultFluxStackConfig } from './schema'
import { loggerConfig } from '@/config/logger.config'
import { clientConfig } from '@/config/client.config'
import { serverConfig } from '@/config/server.config'
import { monitoringConfig } from '@/config/monitoring.config'
import { appConfig } from '@/config/app.config'

/**
 * Runtime Configuration Builder
 * Creates configuration that works with dynamic env loading
 */
export class RuntimeConfigBuilder {
  private config: Partial<FluxStackConfig> = {}
  
  constructor() {
    this.loadFromDefaults()
    this.loadFromDynamicEnv()
  }

  /**
   * Load default configuration
   */
  private loadFromDefaults(): this {
    this.config = { ...defaultFluxStackConfig }
    return this
  }

  /**
   * Load from environment variables
   */
  private loadFromDynamicEnv(): this {
    // Environment vars are loaded automatically by env loader
    // Just merge common overrides here
    const envOverrides: Partial<FluxStackConfig> = {}

    if (env.has('PORT')) {
      envOverrides.server = { ...this.config.server, port: env.PORT }
    }
    if (env.has('LOG_LEVEL')) {
      envOverrides.logging = { ...this.config.logging, level: env.LOG_LEVEL }
    }

    this.config = this.deepMerge(this.config, envOverrides)
    return this
  }

  /**
   * Override specific configuration section
   */
  override(section: string, values: any): this {
    this.setNestedProperty(this.config, section, values)
    return this
  }

  /**
   * Set individual configuration value
   */
  set(path: string, value: any): this {
    this.setNestedProperty(this.config, path, value)
    return this
  }

  /**
   * Build final configuration
   */
  build(): FluxStackConfig {
    // Validate production environment if needed
    if (env.NODE_ENV === 'production') {
      env.require(['NODE_ENV'])
    }

    return this.config as FluxStackConfig
  }

  /**
   * Get current configuration state
   */
  current(): Partial<FluxStackConfig> {
    return { ...this.config }
  }

  private deepMerge(target: any, source: any): any {
    if (!source || typeof source !== 'object') return target
    if (!target || typeof target !== 'object') return source

    const result = { ...target }

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (Array.isArray(source[key])) {
          result[key] = [...source[key]]
        } else if (typeof source[key] === 'object' && source[key] !== null) {
          result[key] = this.deepMerge(target[key], source[key])
        } else {
          result[key] = source[key]
        }
      }
    }

    return result
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
}

/**
 * Create runtime configuration that works with Bun build
 */
export function createRuntimeConfig(overrides?: Partial<FluxStackConfig>): FluxStackConfig {
  const builder = new RuntimeConfigBuilder()
  
  if (overrides) {
    // Apply overrides
    for (const [key, value] of Object.entries(overrides)) {
      builder.override(key, value)
    }
  }
  
  return builder.build()
}

/**
 * Environment-specific configuration factory
 */
export const runtimeConfig = {
  /**
   * Create development configuration
   */
  development(): FluxStackConfig {
    return new RuntimeConfigBuilder()
      .override('logging.level', loggerConfig.level)
      .override('logging.format', 'pretty')
      .override('build.optimization.minify', false)
      .override('build.sourceMaps', true)
      .override('monitoring.enabled', false)
      .build()
  },

  /**
   * Create production configuration
   */
  production(): FluxStackConfig {
    return new RuntimeConfigBuilder()
      .override('logging.level', loggerConfig.level)
      .override('logging.format', 'json')
      .override('build.optimization.minify', true)
      .override('build.sourceMaps', false)
      .override('monitoring.enabled', monitoringConfig.monitoring.enabled)
      .build()
  },

  /**
   * Create test configuration
   */
  test(): FluxStackConfig {
    return new RuntimeConfigBuilder()
      .override('logging.level', loggerConfig.level)
      .override('server.port', 0) // Random port for tests
      .override('client.port', 0)
      .override('monitoring.enabled', false)
      .build()
  },

  /**
   * Auto-detect environment and create appropriate config
   */
  auto(overrides?: Partial<FluxStackConfig>): FluxStackConfig {
    const environment = appConfig.env
    
    let config: FluxStackConfig
    
    switch (environment) {
      case 'production':
        config = this.production()
        break
      case 'test':
        config = this.test()
        break
      default:
        config = this.development()
    }
    
    if (overrides) {
      const builder = new RuntimeConfigBuilder()
      ;(builder as any).config = config
      
      for (const [key, value] of Object.entries(overrides)) {
        builder.override(key, value)
      }
      
      config = builder.build()
    }
    
    return config
  }
}

/**
 * Specialized environment loaders for different domains
 */
export const envLoaders = {
  /**
   * Database environment loader
   */
  database: createNamespace('DATABASE_'),

  /**
   * JWT environment loader
   */
  jwt: createNamespace('JWT_'),

  /**
   * SMTP environment loader
   */
  smtp: createNamespace('SMTP_'),

  /**
   * CORS environment loader
   */
  cors: createNamespace('CORS_'),

  /**
   * FluxStack specific environment loader
   */
  fluxstack: createNamespace('FLUXSTACK_')
}

/**
 * Configuration helpers that use dynamic env
 */
export const configHelpers = {
  /**
   * Get database URL with validation
   */
  getDatabaseUrl(): string | null {
    const url = env.DATABASE_URL

    if (url && !url.includes('://')) {
      throw new Error('DATABASE_URL must be a valid URL')
    }

    return url || null
  },

  /**
   * Get CORS origins with proper defaults
   */
  getCorsOrigins(): string[] {
    const origins = env.CORS_ORIGINS

    if (origins.length === 0 || (origins.length === 1 && origins[0] === '*')) {
      const environment = env.NODE_ENV

      if (environment === 'development') {
        return ['http://localhost:3000', 'http://localhost:5173']
      } else if (environment === 'production') {
        return [] // Must be explicitly configured in production
      }
    }

    return origins
  },

  /**
   * Get server configuration with runtime env
   */
  getServerConfig() {
    return {
      port: env.PORT,
      host: env.HOST,
      apiPrefix: env.API_PREFIX,
      cors: {
        origins: this.getCorsOrigins(),
        methods: env.CORS_METHODS,
        headers: env.CORS_HEADERS,
        credentials: env.CORS_CREDENTIALS,
        maxAge: env.CORS_MAX_AGE
      }
    }
  },

  /**
   * Get client configuration with runtime env
   */
  getClientConfig() {
    return {
      port: env.VITE_PORT,
      proxy: {
        target: clientConfig.proxy.target,
        changeOrigin: clientConfig.proxy.changeOrigin
      },
      build: {
        outDir: clientConfig.build.outDir,
        sourceMaps: clientConfig.build.sourceMaps,
        minify: clientConfig.build.minify,
        target: clientConfig.build.target
      }
    }
  }
}

/**
 * Export main configuration function
 */
export default function getRuntimeConfig(overrides?: Partial<FluxStackConfig>): FluxStackConfig {
  return runtimeConfig.auto(overrides)
}