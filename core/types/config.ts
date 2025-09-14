/**
 * Configuration-related types
 * Centralized type definitions for all configuration interfaces
 */

// Re-export all configuration types from schema
export type {
  FluxStackConfig,
  AppConfig,
  ServerConfig,
  ClientConfig,
  BuildConfig,
  LoggingConfig,
  MonitoringConfig,
  PluginConfig,
  DatabaseConfig,
  AuthConfig,
  EmailConfig,
  StorageConfig,
  LogLevel,
  BuildTarget,
  LogFormat,
  CorsConfig,
  MiddlewareConfig,
  ProxyConfig,
  ClientBuildConfig,
  OptimizationConfig,
  LogTransportConfig,
  MetricsConfig,
  ProfilingConfig
} from "../config/schema"

// Re-export configuration loading types
export type {
  // EnvironmentInfo,
  ConfigLoadOptions,
  ConfigLoadResult,
  ValidationResult,
  ValidationError as ConfigValidationError,
  ValidationWarning
} from "../config/loader"

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