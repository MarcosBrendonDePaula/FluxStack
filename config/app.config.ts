/**
 * Application Configuration
 * Laravel-style declarative config with validation
 */

import { defineConfig, config } from '@/core/utils/config-schema'

/**
 * App configuration schema
 */
const appConfigSchema = {
  // App basics
  name: config.string('APP_NAME', 'FluxStack', true),

  version: {
    type: 'string' as const,
    env: 'APP_VERSION',
    default: '1.0.0',
    validate: (value: string) => /^\d+\.\d+\.\d+$/.test(value) || 'Version must be semver format (e.g., 1.0.0)'
  },

  description: config.string('APP_DESCRIPTION', 'A FluxStack application'),

  // Environment
  env: config.enum('NODE_ENV', ['development', 'production', 'test'] as const, 'development', true),

  debug: config.boolean('DEBUG', false),

  // Server
  port: {
    type: 'number' as const,
    env: 'PORT',
    default: 3000,
    required: true,
    validate: (value: number) => {
      if (value < 1 || value > 65535) {
        return 'Port must be between 1 and 65535'
      }
      return true
    }
  },

  host: config.string('HOST', 'localhost', true),

  apiPrefix: {
    type: 'string' as const,
    env: 'API_PREFIX',
    default: '/api',
    validate: (value: string) => value.startsWith('/') || 'API prefix must start with /'
  },

  // URLs
  url: config.string('APP_URL', undefined, false),

  // Features
  enableSwagger: config.boolean('ENABLE_SWAGGER', true),
  enableMetrics: config.boolean('ENABLE_METRICS', false),
  enableMonitoring: config.boolean('ENABLE_MONITORING', false),

  // Client
  clientPort: config.number('VITE_PORT', 5173),

  // Logging
  logLevel: config.enum('LOG_LEVEL', ['debug', 'info', 'warn', 'error'] as const, 'info'),
  logFormat: config.enum('LOG_FORMAT', ['json', 'pretty'] as const, 'pretty'),

  // CORS
  corsOrigins: config.array('CORS_ORIGINS', ['*']),
  corsMethods: config.array('CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
  corsHeaders: config.array('CORS_HEADERS', ['Content-Type', 'Authorization']),
  corsCredentials: config.boolean('CORS_CREDENTIALS', false),

  // Security
  trustProxy: config.boolean('TRUST_PROXY', false),

  sessionSecret: {
    type: 'string' as const,
    env: 'SESSION_SECRET',
    default: undefined,
    required: false,
    validate: (value: string) => {
      if (!value) return true // Optional
      if (value.length < 32) {
        return 'Session secret must be at least 32 characters'
      }
      return true
    }
  }
} as const

export const appConfig = defineConfig(appConfigSchema)

// Export type for use in other files
export type AppConfig = typeof appConfig

/**
 * Type-safe environment type
 * Use this when you need the literal type explicitly
 */
export type Environment = typeof appConfig.env

/**
 * Type-safe log level type
 */
export type LogLevel = typeof appConfig.logLevel

/**
 * Type-safe log format type
 */
export type LogFormat = typeof appConfig.logFormat

// Export default
export default appConfig
