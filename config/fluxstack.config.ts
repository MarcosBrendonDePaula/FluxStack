/**
 * Backward Compatibility Layer for FluxStack Configuration
 * This file maintains compatibility with existing imports while redirecting to the new system
 * @deprecated Use the configuration from the root fluxstack.config.ts instead
 */

import { getConfigSync, createLegacyConfig } from '@/core/config'
import type { FluxStackConfig } from '@/core/config'

// Load the new configuration
const newConfig = getConfigSync()

// Create legacy configuration format for backward compatibility
const legacyConfig = createLegacyConfig(newConfig)

// Export in the old format
export const config = legacyConfig

// Also export the environment config for backward compatibility
export const envConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: newConfig.server.host,
  PORT: newConfig.server.port,
  FRONTEND_PORT: newConfig.client.port,
  BACKEND_PORT: newConfig.server.port,
  VITE_API_URL: newConfig.client.proxy.target,
  API_URL: newConfig.client.proxy.target,
  CORS_ORIGINS: newConfig.server.cors.origins,
  CORS_METHODS: newConfig.server.cors.methods,
  CORS_HEADERS: newConfig.server.cors.headers,
  LOG_LEVEL: newConfig.logging.level,
  BUILD_TARGET: newConfig.build.target,
  BUILD_OUTDIR: newConfig.build.outDir,
  // Add other legacy environment variables as needed
}

// Warn about deprecated usage in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '⚠️  DEPRECATED: Importing from config/fluxstack.config.ts is deprecated.\n' +
    '   Please update your imports to use the new configuration system:\n' +
    '   import { getConfig } from "./core/config"\n' +
    '   or import config from "./fluxstack.config.ts"'
  )
}

// Export types for backward compatibility
export type { FluxStackConfig }