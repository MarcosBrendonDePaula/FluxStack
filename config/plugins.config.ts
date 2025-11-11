/**
 * Plugins Configuration
 * Declarative plugin management configuration
 */

import { defineConfig, config } from '@/core/utils/config-schema'
import { env } from '@/core/utils/env'
import { FLUXSTACK_VERSION } from '@/core/utils/version'

/**
 * Plugins configuration schema
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

  // Plugin-specific configurations
  // Logger plugin (handled by logger.config.ts)
  loggerEnabled: config.boolean('LOGGER_PLUGIN_ENABLED', true),

  // Swagger plugin (enable/disable via runtime.config.ts)
  swaggerTitle: config.string('SWAGGER_TITLE', 'FluxStack API'),
  swaggerVersion: config.string('SWAGGER_VERSION', FLUXSTACK_VERSION),
  swaggerDescription: config.string(
    'SWAGGER_DESCRIPTION',
    'API documentation for FluxStack application'
  ),
  swaggerPath: config.string('SWAGGER_PATH', '/swagger'),

  // Static files plugin
  staticFilesEnabled: config.boolean('STATIC_FILES_ENABLED', true),
  staticPublicDir: config.string('STATIC_PUBLIC_DIR', 'public'),
  staticUploadsDir: config.string('STATIC_UPLOADS_DIR', 'uploads'),
  staticCacheMaxAge: config.number('STATIC_CACHE_MAX_AGE', 31536000), // 1 year
  staticEnableUploads: config.boolean('STATIC_ENABLE_UPLOADS', true),
  staticEnablePublic: config.boolean('STATIC_ENABLE_PUBLIC', true),

  // CORS plugin (configuration via server.config.ts)
  // Vite plugin
  viteEnabled: config.boolean('VITE_PLUGIN_ENABLED', true)
} as const

export const pluginsConfig = defineConfig(pluginsConfigSchema)

// Export type
export type PluginsConfig = typeof pluginsConfig

// Export default
export default pluginsConfig
