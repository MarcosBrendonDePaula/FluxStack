import type { FluxStackConfig } from "../types"
import type { Logger } from "../utils/logger"

export interface PluginContext {
  config: FluxStackConfig
  logger: Logger
  app: any // Elysia app
  utils: PluginUtils
}

export interface PluginUtils {
  // Utility functions that plugins can use
  createTimer: (label: string) => { end: () => number }
  formatBytes: (bytes: number) => string
  isProduction: () => boolean
  isDevelopment: () => boolean
}

export interface RequestContext {
  request: Request
  path: string
  method: string
  headers: Record<string, string>
  query: Record<string, string>
  params: Record<string, string>
}

export interface ResponseContext extends RequestContext {
  response: Response
  statusCode: number
  duration: number
}

export interface ErrorContext extends RequestContext {
  error: Error
  duration: number
}

export interface Plugin {
  name: string
  version?: string
  description?: string
  dependencies?: string[]
  priority?: number
  
  // Lifecycle hooks
  setup?: (context: PluginContext) => void | Promise<void>
  onServerStart?: (context: PluginContext) => void | Promise<void>
  onServerStop?: (context: PluginContext) => void | Promise<void>
  onRequest?: (context: RequestContext) => void | Promise<void>
  onResponse?: (context: ResponseContext) => void | Promise<void>
  onError?: (context: ErrorContext) => void | Promise<void>
  
  // Configuration
  configSchema?: any
  defaultConfig?: any
}