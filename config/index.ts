/**
 * ⚡ FluxStack Configuration Index
 *
 * Centralized configuration using Laravel-style declarative schemas
 *
 * @example
 * ```ts
 * import { appConfig, serverConfig, databaseConfig } from '@/config'
 *
 * // All configs are type-safe and validated!
 * console.log(appConfig.name)                    // string
 * console.log(serverConfig.server.port)          // number
 * console.log(clientConfig.vite.port)            // number
 *
 * // Nested configs
 * console.log(servicesConfig.email.host)         // string
 * console.log(monitoringConfig.metrics.enabled)  // boolean
 * ```
 */

// ============================================================================
// 📦 CONFIG EXPORTS
// ============================================================================

export { appConfig } from './app.config'
export { serverConfig } from './server.config'
export { clientConfig } from './client.config'
export { databaseConfig } from './database.config'
export { servicesConfig } from './services.config'
export { loggerConfig } from './logger.config'
export { pluginsConfig } from './plugins.config'
export { monitoringConfig } from './monitoring.config'
export { appRuntimeConfig } from './runtime.config'
export { systemConfig, systemRuntimeInfo } from './system.config'

// Plugin configs (re-exported for convenience)
export { cryptoAuthConfig } from '../plugins/crypto-auth/config'

// ============================================================================
// 📝 TYPE EXPORTS
// ============================================================================

// Core types
export type { AppConfig, Environment } from './app.config'
export type {
  ServerConfig,
  CorsConfig,
  ServerFullConfig
} from './server.config'
export type {
  ClientConfig,
  ViteConfig,
  ProxyConfig,
  ClientBuildConfig
} from './client.config'
export type { DatabaseConfig } from './database.config'
export type {
  EmailConfig,
  JWTConfig,
  StorageConfig,
  RedisConfig
} from './services.config'
export type { LoggerConfig } from './logger.config'
export type { PluginsConfig } from './plugins.config'
export type {
  MonitoringConfig,
  MetricsConfig,
  ProfilingConfig,
  MonitoringFullConfig
} from './monitoring.config'
export type { SystemConfig, SystemRuntimeInfo } from './system.config'

// Plugin types
export type { CryptoAuthConfig } from '../plugins/crypto-auth/config'

// ============================================================================
// 🎯 UNIFIED CONFIG OBJECT
// ============================================================================

import { appConfig } from './app.config'
import { serverConfig } from './server.config'
import { clientConfig } from './client.config'
import { databaseConfig } from './database.config'
import { servicesConfig } from './services.config'
import { loggerConfig } from './logger.config'
import { pluginsConfig } from './plugins.config'
import { monitoringConfig } from './monitoring.config'
import { appRuntimeConfig } from './runtime.config'
import { systemConfig, systemRuntimeInfo } from './system.config'
import { cryptoAuthConfig } from '../plugins/crypto-auth/config'

/**
 * All configs in one object
 * Use this when you need access to multiple configs at once
 */
export const config = {
  app: appConfig,
  server: serverConfig,
  client: clientConfig,
  database: databaseConfig,
  services: servicesConfig,
  logger: loggerConfig,
  plugins: pluginsConfig,
  monitoring: monitoringConfig,
  runtime: appRuntimeConfig,
  system: systemConfig,
  systemRuntime: systemRuntimeInfo,
  cryptoAuth: cryptoAuthConfig
} as const

export default config
