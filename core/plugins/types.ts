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

export namespace FluxStack {
  export interface Plugin {
  name: string
  version?: string
  description?: string
  author?: string
  dependencies?: string[]
  priority?: number | PluginPriority
  category?: string
  tags?: string[]
  
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
  
  // CLI commands
  commands?: CliCommand[]
  }
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
  plugin?: FluxStack.Plugin
  error?: string
  warnings?: string[]
}

export interface PluginRegistryState {
  plugins: Map<string, FluxStack.Plugin>
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
  plugin: FluxStack.Plugin
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

// CLI Command interfaces
export interface CliArgument {
  name: string
  description: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean'
  default?: any
  choices?: string[]
}

export interface CliOption {
  name: string
  short?: string
  description: string
  type?: 'string' | 'number' | 'boolean' | 'array'
  default?: any
  required?: boolean
  choices?: string[]
}

export interface CliCommand {
  name: string
  description: string
  usage?: string
  examples?: string[]
  arguments?: CliArgument[]
  options?: CliOption[]
  aliases?: string[]
  category?: string
  hidden?: boolean
  handler: (args: any[], options: any, context: CliContext) => Promise<void> | void
}

export interface CliContext {
  config: FluxStackConfig
  logger: Logger
  utils: PluginUtils
  workingDir: string
  packageInfo: {
    name: string
    version: string
  }
}

// Live Components Types
export interface LiveComponent<TState = any> {
  id: string
  name: string
  state: TState
  mounted: boolean
  socket?: any
  userId?: string
  destroy?: () => void
  executeAction?: (action: string, payload?: any) => Promise<any>
  setState?: (newState: Partial<TState>) => void
  getSerializableState?: () => TState
}

export interface LiveMessage {
  type: string
  componentId: string
  data?: any
  payload?: any
  action?: string
  property?: string
  userId?: string
  expectResponse?: boolean
  timestamp?: number
  requestId?: string
  room?: string
}

export interface BroadcastMessage {
  type: string
  data?: any
  channel?: string
  room?: string
  payload?: any
  excludeUser?: string
}

export interface ComponentDefinition<TState = any> {
  name: string
  initialState: TState
  handlers?: Record<string, Function>
  component?: any
}

export interface WebSocketData {
  componentId?: string
  userId?: string
  sessionId?: string
}

// File Upload Types
export interface ActiveUpload {
  uploadId: string
  componentId?: string
  filename: string
  fileType?: string
  fileSize?: number
  totalChunks: number
  receivedChunks: Map<number, any>
  startTime: number
  lastChunkTime?: number
}

export interface FileUploadStartMessage {
  type: 'upload:start' | 'FILE_UPLOAD_START'
  uploadId: string
  filename: string
  totalChunks: number
  fileSize: number
  componentId?: string
  fileType?: string
  chunkSize?: number
  requestId?: string
}

export interface FileUploadChunkMessage {
  type: 'upload:chunk' | 'FILE_UPLOAD_CHUNK'
  uploadId: string
  chunkIndex: number
  data: string | ArrayBuffer
  totalChunks?: number
  componentId?: string
  requestId?: string
}

export interface FileUploadCompleteMessage {
  type: 'upload:complete' | 'FILE_UPLOAD_COMPLETE'
  uploadId: string
  requestId?: string
}

export interface FileUploadProgressResponse {
  type: 'upload:progress' | 'FILE_UPLOAD_PROGRESS'
  uploadId: string
  receivedChunks?: number
  totalChunks?: number
  percentage?: number
  componentId?: string
  chunkIndex?: number
  bytesUploaded?: number
  totalBytes?: number
  progress?: number
  timestamp?: number
}

export interface FileUploadCompleteResponse {
  type: 'upload:complete' | 'FILE_UPLOAD_COMPLETE'
  uploadId: string
  url?: string
  filename?: string
  size?: number
  componentId?: string
  success?: boolean
  error?: string
  message?: string
  fileUrl?: string
  timestamp?: number
}

// Plugin Type Export
export type Plugin = FluxStack.Plugin