// Re-export all configuration types
export * from "./config"

// Re-export all plugin types
export * from "./plugin"

// Re-export all API types
export * from "./api"

// Re-export all build types
export * from "./build"

// Re-export framework types
export type {
  FluxStackFrameworkOptions,
  FrameworkContext,
  FrameworkStats,
  FrameworkHooks,
  RouteDefinition,
  MiddlewareDefinition,
  ServiceDefinition
} from "../framework/types"

// Re-export utility types
export type {
  Logger
} from "../utils/logger"

export type {
  FluxStackError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
  ServiceUnavailableError
} from "../utils/errors"

export type {
  Metric,
  Counter,
  Gauge,
  Histogram,
  SystemMetrics,
  HttpMetrics
} from "../utils/monitoring"

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