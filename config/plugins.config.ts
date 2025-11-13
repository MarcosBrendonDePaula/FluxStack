/**
 * Plugins Configuration
 * Declarative plugin management configuration
 */

import { defineConfig, config } from '@/core/utils/config-schema'
import { env } from '@/core/utils/env'
import { FLUXSTACK_VERSION } from '@/core/utils/version'

/**
 * Plugins configuration schema (flat structure for defineConfig)
 */
const pluginsConfigSchema = {
  // Plugin management
  enabled: config.array(
    'FLUXSTACK_PLUGINS_ENABLED',
    ['logger', 'swagger', 'vite', 'cors', 'static-files', 'crypto-auth']
  ),

  disabled: config.array('FLUXSTACK_PLUGINS_DISABLED', []),

  // Auto-discovery
  autoDiscover: config.boolean('PLUGINS_AUTO_DISCOVER', true),

  pluginsDir: config.string('PLUGINS_DIR', 'plugins'),

  // Logger plugin
  loggerEnabled: config.boolean('LOGGER_PLUGIN_ENABLED', true),

  // Swagger plugin
  swaggerEnabled: config.boolean('SWAGGER_ENABLED', true),
  swaggerTitle: config.string('SWAGGER_TITLE', 'FluxStack API'),
  swaggerVersion: config.string('SWAGGER_VERSION', FLUXSTACK_VERSION),
  swaggerDescription: config.string(
    'SWAGGER_DESCRIPTION',
    'API documentation for FluxStack application'
  ),
  swaggerPath: config.string('SWAGGER_PATH', '/swagger'),
  swaggerExcludePaths: config.array('SWAGGER_EXCLUDE_PATHS', []),
  swaggerServers: config.string('SWAGGER_SERVERS', ''),

  // Swagger UI options
  swaggerPersistAuthorization: config.boolean('SWAGGER_PERSIST_AUTH', true),
  swaggerDisplayRequestDuration: config.boolean('SWAGGER_DISPLAY_DURATION', true),
  swaggerEnableFilter: config.boolean('SWAGGER_ENABLE_FILTER', true),
  swaggerShowExtensions: config.boolean('SWAGGER_SHOW_EXTENSIONS', true),
  swaggerTryItOutEnabled: config.boolean('SWAGGER_TRY_IT_OUT', true),

  // Swagger authentication
  swaggerAuthEnabled: config.boolean('SWAGGER_AUTH_ENABLED', false),
  swaggerAuthUsername: config.string('SWAGGER_AUTH_USERNAME', 'admin'),
  swaggerAuthPassword: config.string('SWAGGER_AUTH_PASSWORD', ''),

  // Static files plugin
  staticEnabled: config.boolean('STATIC_FILES_ENABLED', true),
  staticPublicDir: config.string('STATIC_PUBLIC_DIR', 'public'),
  staticUploadsDir: config.string('STATIC_UPLOADS_DIR', 'uploads'),
  staticCacheMaxAge: config.number('STATIC_CACHE_MAX_AGE', 31536000), // 1 year
  staticEnableUploads: config.boolean('STATIC_ENABLE_UPLOADS', true),
  staticEnablePublic: config.boolean('STATIC_ENABLE_PUBLIC', true),

  // Vite plugin
  viteEnabled: config.boolean('VITE_PLUGIN_ENABLED', true)
} as const

// Internal flat config
const flatConfig = defineConfig(pluginsConfigSchema)

/**
 * Transform flat config into nested structure for better DX
 */
export const pluginsConfig = {
  // Top-level properties
  enabled: flatConfig.enabled,
  disabled: flatConfig.disabled,
  autoDiscover: flatConfig.autoDiscover,
  pluginsDir: flatConfig.pluginsDir,

  // Logger (nested)
  logger: {
    enabled: flatConfig.loggerEnabled
  },

  // Swagger (nested)
  swagger: {
    enabled: flatConfig.swaggerEnabled,
    title: flatConfig.swaggerTitle,
    version: flatConfig.swaggerVersion,
    description: flatConfig.swaggerDescription,
    path: flatConfig.swaggerPath,
    excludePaths: flatConfig.swaggerExcludePaths,
    servers: flatConfig.swaggerServers,

    ui: {
      persistAuthorization: flatConfig.swaggerPersistAuthorization,
      displayRequestDuration: flatConfig.swaggerDisplayRequestDuration,
      enableFilter: flatConfig.swaggerEnableFilter,
      showExtensions: flatConfig.swaggerShowExtensions,
      tryItOutEnabled: flatConfig.swaggerTryItOutEnabled
    },

    auth: {
      enabled: flatConfig.swaggerAuthEnabled,
      username: flatConfig.swaggerAuthUsername,
      password: flatConfig.swaggerAuthPassword
    }
  },

  // Static (nested)
  static: {
    enabled: flatConfig.staticEnabled,
    publicDir: flatConfig.staticPublicDir,
    uploadsDir: flatConfig.staticUploadsDir,
    cacheMaxAge: flatConfig.staticCacheMaxAge,
    enableUploads: flatConfig.staticEnableUploads,
    enablePublic: flatConfig.staticEnablePublic
  },

  // Vite (nested)
  vite: {
    enabled: flatConfig.viteEnabled
  }
} as const

// Export type
export type PluginsConfig = typeof pluginsConfig

// Export default
export default pluginsConfig
