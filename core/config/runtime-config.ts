/**
 * Runtime Configuration System for FluxStack
 * Uses dynamic environment loading to solve Bun build issues
 * Drop-in replacement for process.env based configuration
 */

import { env, createEnvNamespace, envValidation } from '../utils/env-runtime'
import { 
  dynamicEnvironmentProcessor, 
  createDynamicConfig, 
  validateProductionEnv,
  getDynamicEnvironmentInfo 
} from './env-dynamic'
import type { FluxStackConfig } from './schema'
import { defaultFluxStackConfig } from './schema'

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
   * Load from dynamic environment variables
   */
  private loadFromDynamicEnv(): this {
    const envConfig = createDynamicConfig()
    this.config = this.deepMerge(this.config, envConfig)
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
    if (env.get('NODE_ENV') === 'production') {
      validateProductionEnv()
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
      .override('logging.level', env.get('LOG_LEVEL', 'debug'))
      .override('logging.format', env.get('LOG_FORMAT', 'pretty'))
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
      .override('logging.level', env.get('LOG_LEVEL', 'warn'))
      .override('logging.format', env.get('LOG_FORMAT', 'json'))
      .override('build.optimization.minify', true)
      .override('build.sourceMaps', false)
      .override('monitoring.enabled', env.bool('MONITORING_ENABLED', true))
      .build()
  },

  /**
   * Create test configuration
   */
  test(): FluxStackConfig {
    return new RuntimeConfigBuilder()
      .override('logging.level', env.get('LOG_LEVEL', 'error'))
      .override('server.port', 0) // Random port for tests
      .override('client.port', 0)
      .override('monitoring.enabled', false)
      .build()
  },

  /**
   * Auto-detect environment and create appropriate config
   */
  auto(overrides?: Partial<FluxStackConfig>): FluxStackConfig {
    const environment = env.get('NODE_ENV', 'development')
    
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
  database: createEnvNamespace('DATABASE_'),
  
  /**
   * JWT environment loader
   */
  jwt: createEnvNamespace('JWT_'),
  
  /**
   * SMTP environment loader
   */
  smtp: createEnvNamespace('SMTP_'),
  
  /**
   * CORS environment loader
   */
  cors: createEnvNamespace('CORS_'),
  
  /**
   * FluxStack specific environment loader
   */
  fluxstack: createEnvNamespace('FLUXSTACK_')
}

/**
 * Configuration helpers that use dynamic env
 */
export const configHelpers = {
  /**
   * Get database URL with validation
   */
  getDatabaseUrl(): string | null {
    const url = env.get('DATABASE_URL')
    
    if (url) {
      envValidation.validate('DATABASE_URL', 
        (value) => value.includes('://'),
        'Must be a valid URL'
      )
    }
    
    return url || null
  },

  /**
   * Get CORS origins with proper defaults
   */
  getCorsOrigins(): string[] {
    const origins = env.array('CORS_ORIGINS')
    
    if (origins.length === 0) {
      const environment = env.get('NODE_ENV', 'development')
      
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
      port: env.num('PORT', 3000),
      host: env.get('HOST', 'localhost'),
      apiPrefix: env.get('API_PREFIX', '/api'),
      cors: {
        origins: this.getCorsOrigins(),
        methods: env.array('CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
        headers: env.array('CORS_HEADERS', ['Content-Type', 'Authorization']),
        credentials: env.bool('CORS_CREDENTIALS', false),
        maxAge: env.num('CORS_MAX_AGE', 86400)
      }
    }
  },

  /**
   * Get client configuration with runtime env
   */
  getClientConfig() {
    return {
      port: env.num('VITE_PORT', 5173),
      proxy: {
        target: env.get('API_URL', 'http://localhost:3000'),
        changeOrigin: env.bool('PROXY_CHANGE_ORIGIN', true)
      },
      build: {
        outDir: env.get('CLIENT_BUILD_DIR', 'dist/client'),
        sourceMaps: env.bool('CLIENT_SOURCEMAPS', env.get('NODE_ENV') === 'development'),
        minify: env.bool('CLIENT_MINIFY', env.get('NODE_ENV') === 'production'),
        target: env.get('CLIENT_TARGET', 'es2020')
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