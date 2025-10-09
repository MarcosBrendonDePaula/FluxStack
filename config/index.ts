/**
 * ⚡ FluxStack Configuration Index
 *
 * Centralized configuration using Laravel-style declarative schemas
 *
 * @example
 * ```ts
 * import { appConfig, databaseConfig, servicesConfig } from '@/config'
 *
 * // All configs are type-safe and validated!
 * console.log(appConfig.name)        // string
 * console.log(appConfig.port)        // number
 * console.log(appConfig.debug)       // boolean
 *
 * // Nested configs
 * console.log(servicesConfig.email.host)  // string
 * console.log(servicesConfig.jwt.secret)  // string
 * ```
 */

export { appConfig } from './app.config'
export { databaseConfig } from './database.config'
export { servicesConfig } from './services.config'
export { serverConfig } from './server.config'
export { loggerConfig } from './logger.config'
export { buildConfig } from './build.config'
export { appRuntimeConfig } from './runtime.config'
export { systemConfig, systemRuntimeInfo } from './system.config'

// Re-export types
export type { AppConfig } from './app.config'
export type { DatabaseConfig } from './database.config'
export type { ServerConfig } from './server.config'
export type { LoggerConfig } from './logger.config'
export type { BuildConfig } from './build.config'
export type { SystemConfig, SystemRuntimeInfo } from './system.config'
export type {
  EmailConfig,
  JWTConfig,
  StorageConfig,
  RedisConfig
} from './services.config'

/**
 * All configs in one object
 */
import { appConfig } from './app.config'
import { databaseConfig } from './database.config'
import { servicesConfig } from './services.config'
import { serverConfig } from './server.config'
import { loggerConfig } from './logger.config'
import { buildConfig } from './build.config'
import { appRuntimeConfig } from './runtime.config'
import { systemConfig, systemRuntimeInfo } from './system.config'

export const config = {
  app: appConfig,
  database: databaseConfig,
  services: servicesConfig,
  server: serverConfig,
  logger: loggerConfig,
  build: buildConfig,
  runtime: appRuntimeConfig,
  system: systemConfig,
  systemRuntime: systemRuntimeInfo
}

export default config
