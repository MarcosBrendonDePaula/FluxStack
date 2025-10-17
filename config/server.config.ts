/**
 * Server Configuration
 * Declarative server config using FluxStack config system
 */

import { defineConfig, config } from '@/core/utils/config-schema'
import { FLUXSTACK_VERSION } from '@/core/utils/version'

const serverConfigSchema = {
  // Server basics
  port: config.number('PORT', 3000, true),
  host: config.string('HOST', 'localhost', true),
  apiPrefix: config.string('API_PREFIX', '/api'),

  // CORS configuration
  corsOrigins: config.array('CORS_ORIGINS', ['http://localhost:3000', 'http://localhost:5173']),
  corsMethods: config.array('CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
  corsHeaders: config.array('CORS_HEADERS', ['Content-Type', 'Authorization']),
  corsCredentials: config.boolean('CORS_CREDENTIALS', false),
  corsMaxAge: config.number('CORS_MAX_AGE', 86400),

  // Client config
  clientPort: config.number('VITE_PORT', 5173),
  clientTarget: config.string('CLIENT_TARGET', 'es2020'),
  clientOutDir: config.string('CLIENT_OUTDIR', 'dist'),
  clientSourceMaps: config.boolean('CLIENT_SOURCEMAPS', false),

  // Backend-only mode
  backendPort: config.number('BACKEND_PORT', 3001),

  // App info
  appName: config.string('FLUXSTACK_APP_NAME', 'FluxStack'),
  appVersion: config.string('FLUXSTACK_APP_VERSION', FLUXSTACK_VERSION),

  // Features
  enableSwagger: config.boolean('ENABLE_SWAGGER', true),
  enableMetrics: config.boolean('ENABLE_METRICS', false),
  enableMonitoring: config.boolean('ENABLE_MONITORING', false),
  enableRequestLogging: config.boolean('ENABLE_REQUEST_LOGGING', true),

  // Vite/Development
  enableViteProxyLogs: config.boolean('ENABLE_VITE_PROXY_LOGS', false)
} as const

export const serverConfig = defineConfig(serverConfigSchema)

export type ServerConfig = typeof serverConfig
export default serverConfig
