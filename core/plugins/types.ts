import type { FluxStackConfig } from "../config/schema"
import type { Logger } from "../utils/logger/index"

export type PluginHook = 
  | 'setup'
  | 'onServerStart'
  | 'onServerStop'
  | 'onRequest'
  | 'onBeforeRoute'
  | 'onResponse'
  | 'onError'
  | 'onBuild'
  | 'onBuildComplete'

export type PluginPriority = 'highest' | 'high' | 'normal' | 'low' | 'lowest' | number

export interface PluginContext {
  config: FluxStackConfig
  logger: Logger
  app: any // Elysia app
  utils: PluginUtils
  registry?: any // Plugin registry reference
}

export interface PluginUtils {
  // Utility functions that plugins can use
  createTimer: (label: string) => { end: () => number }
  formatBytes: (bytes: number) => string
  isProduction: () => boolean
  isDevelopment: () => boolean
  getEnvironment: () => string
  createHash: (data: string) => string
  deepMerge: (target: any, source: any) => any
  validateSchema: (data: any, schema: any) => { valid: boolean; errors: string[] }
}

export interface RequestContext {
  request: Request
  path: string
  method: string
  headers: Record<string, string>
  query: Record<string, string>
  params: Record<string, string>
  body?: any
  user?: any
  startTime: number
  handled?: boolean
  response?: Response
}

export interface ResponseContext extends RequestContext {
  response: Response
  statusCode: number
  duration: number
  size?: number
}

export interface ErrorContext extends RequestContext {
  error: Error
  duration: number
  handled: boolean
}

export interface BuildContext {
  target: string
  outDir: string
  mode: 'development' | 'production'
  config: FluxStackConfig
}

export interface PluginConfigSchema {
  type: 'object'
  properties: Record<string, any>
  required?: string[]
  additionalProperties?: boolean
}

export interface Plugin {
  name: string
  version?: string
  description?: string
  author?: string
  dependencies?: string[]
  priority?: number | PluginPriority
  
  // Lifecycle hooks
  setup?: (context: PluginContext) => void | Promise<void>
  onServerStart?: (context: PluginContext) => void | Promise<void>
  onServerStop?: (context: PluginContext) => void | Promise<void>
  onRequest?: (context: RequestContext) => void | Promise<void>
  onBeforeRoute?: (context: RequestContext) => void | Promise<void>
  onResponse?: (context: ResponseContext) => void | Promise<void>
  onError?: (context: ErrorContext) => void | Promise<void>
  onBuild?: (context: BuildContext) => void | Promise<void>
  onBuildComplete?: (context: BuildContext) => void | Promise<void>
  
  // Configuration
  configSchema?: PluginConfigSchema
  defaultConfig?: any
  
  // Plugin metadata
  enabled?: boolean
  tags?: string[]
  category?: string
}

export interface PluginManifest {
  name: string
  version: string
  description: string
  author: string
  license: string
  homepage?: string
  repository?: string
  keywords: string[]
  dependencies: Record<string, string>
  peerDependencies?: Record<string, string>
  fluxstack: {
    version: string
    hooks: PluginHook[]
    config?: PluginConfigSchema
    category?: string
    tags?: string[]
  }
}

export interface PluginLoadResult {
  success: boolean
  plugin?: Plugin
  error?: string
  warnings?: string[]
}

export interface PluginRegistryState {
  plugins: Map<string, Plugin>
  manifests: Map<string, PluginManifest>
  loadOrder: string[]
  dependencies: Map<string, string[]>
  conflicts: string[]
}

export interface PluginHookResult {
  success: boolean
  error?: Error
  duration: number
  plugin: string
  hook: PluginHook
  context?: any
}

export interface PluginMetrics {
  loadTime: number
  setupTime: number
  hookExecutions: Map<PluginHook, number>
  errors: number
  warnings: number
  lastExecution?: Date
}

export interface PluginDiscoveryOptions {
  directories?: string[]
  patterns?: string[]
  includeBuiltIn?: boolean
  includeExternal?: boolean
  includeNpm?: boolean
}

export interface PluginInstallOptions {
  version?: string
  registry?: string
  force?: boolean
  dev?: boolean
  source?: 'npm' | 'git' | 'local'
}

export interface PluginExecutionContext {
  plugin: Plugin
  hook: PluginHook
  startTime: number
  timeout?: number
  retries?: number
}

export interface PluginValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Plugin hook execution options
export interface HookExecutionOptions {
  timeout?: number
  parallel?: boolean
  stopOnError?: boolean
  retries?: number
}

// Plugin lifecycle events
export type PluginLifecycleEvent = 
  | 'plugin:registered'
  | 'plugin:unregistered'
  | 'plugin:enabled'
  | 'plugin:disabled'
  | 'plugin:error'
  | 'hook:before'
  | 'hook:after'
  | 'hook:error'