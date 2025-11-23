// Re-export all configuration types

// Ensure critical types are explicitly exported
export type {
  AppConfig,
  BuildConfig,
  ClientConfig,
  FluxStackConfig,
  LoggingConfig,
  MonitoringConfig,
  PluginConfig,
  ServerConfig,
} from '../config/schema'
// Re-export framework types
export type {
  FluxStackFrameworkOptions,
  FrameworkContext,
  FrameworkHooks,
  FrameworkStats,
  MiddlewareDefinition,
  RouteDefinition,
  ServiceDefinition,
} from '../framework/types'
// Re-export additional plugin types from core plugins
export type {
  ErrorContext as CoreErrorContext,
  FluxStack as CorePlugin,
  PluginContext as CorePluginContext,
  PluginUtils as CorePluginUtils,
  RequestContext as CoreRequestContext,
  ResponseContext as CoreResponseContext,
} from '../plugins/types'
export type {
  ConflictError,
  FluxStackError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
} from '../utils/errors'
// Re-export utility types
export type { Logger } from '../utils/logger/index'
export type {
  Counter,
  Gauge,
  Histogram,
  HttpMetrics,
  Metric,
  SystemMetrics,
} from '../utils/monitoring'
// Re-export API types
export type {
  ApiEndpoint,
  ApiError,
  ApiMeta,
  ApiResponse,
  ApiSchema,
  HttpMethod,
  PaginationMeta,
  TimingMeta,
} from './api'
// Re-export build types (explicitly handle BuildTarget conflict)
export type {
  BuildError,
  BuildMode,
  BuildOptions,
  BuildOutputFile,
  BuildResult,
  BuildStats,
  BuildTarget,
  BuildWarning,
  BundleFormat,
} from './build'
export * from './config'
// Re-export plugin types (explicitly handling conflicts)
export type {
  ErrorContext,
  Plugin,
  PluginContext,
  PluginDiscoveryOptions,
  // PluginHooks,
  // PluginConfig as PluginConfigOptions,
  PluginHook,
  PluginLoadResult,
  PluginManifest,
  PluginPriority,
  PluginUtils,
  RequestContext,
  ResponseContext,
} from './plugin'

// Legacy configuration interface for backward compatibility
export interface LegacyFluxStackConfig {
  port?: number
  vitePort?: number
  clientPath?: string
  apiPrefix?: string
  cors?: {
    origins?: string[]
    methods?: string[]
    headers?: string[]
  }
  build?: {
    outDir?: string
    target?: string
  }
}

export interface FluxStackContext {
  config: any // Use any to avoid circular dependency
  isDevelopment: boolean
  isProduction: boolean
  isTest: boolean
  environment: string
}
