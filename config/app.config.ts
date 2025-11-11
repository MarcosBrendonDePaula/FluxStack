/**
 * Application Configuration
 * Core application metadata and global settings
 */

import { defineConfig, config } from '@/core/utils/config-schema'
import { FLUXSTACK_VERSION } from '@/core/utils/version'

/**
 * App configuration schema
 * Contains only app-level metadata and global feature flags
 */
const appConfigSchema = {
  // App basics
  name: config.string('APP_NAME', 'FluxStack', true),

  version: {
    type: 'string' as const,
    env: 'APP_VERSION',
    default: FLUXSTACK_VERSION,
    validate: (value: string) => /^\d+\.\d+\.\d+$/.test(value) || 'Version must be semver format (e.g., 1.0.0)'
  },

  description: config.string('APP_DESCRIPTION', 'A FluxStack application'),

  // Environment
  env: config.enum('NODE_ENV', ['development', 'production', 'test'] as const, 'development', true),

  // URLs
  url: config.string('APP_URL', undefined, false),

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

// Export default
export default appConfig
