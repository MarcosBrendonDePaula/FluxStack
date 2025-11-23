/**
 * Configuration-related types
 * Centralized type definitions for all configuration interfaces
 */

// Re-export configuration loading types
export type {
  // EnvironmentInfo,
  ConfigLoadOptions,
  ConfigLoadResult,
  ValidationError as ConfigValidationError,
  ValidationResult,
  ValidationWarning,
} from '../config/loader'
// Re-export all configuration types from schema
export type {
  AppConfig,
  AuthConfig,
  BuildConfig,
  BuildTarget,
  ClientBuildConfig,
  ClientConfig,
  CorsConfig,
  DatabaseConfig,
  EmailConfig,
  FluxStackConfig,
  LogFormat,
  LoggingConfig,
  LogLevel,
  LogTransportConfig,
  MetricsConfig,
  MiddlewareConfig,
  MonitoringConfig,
  OptimizationConfig,
  PluginConfig,
  ProfilingConfig,
  ProxyConfig,
  ServerConfig,
  StorageConfig,
} from '../config/schema'

// Additional configuration utility types
export interface ConfigOverride {
  path: string
  value: any
  source: 'env' | 'file' | 'runtime'
}

export interface ConfigMergeOptions {
  deep?: boolean
  arrays?: 'replace' | 'merge' | 'concat'
  overrideArrays?: boolean
}

export interface ConfigValidationOptions {
  strict?: boolean
  allowUnknown?: boolean
  stripUnknown?: boolean
  warnings?: boolean
}

export interface ConfigSource {
  type: 'file' | 'env' | 'default' | 'override'
  path?: string
  priority: number
  data: any
}
