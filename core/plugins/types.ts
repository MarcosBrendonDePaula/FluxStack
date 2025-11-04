import type { FluxStackConfig } from "../config/schema"
import type { Logger } from "../utils/logger/index"

/**
 * 🔄 LIFECYCLE HOOKS - Plugin and Application lifecycle
 */
export type LifecycleHook =
  // Core lifecycle
  | 'setup'
  | 'beforeSetup'
  | 'afterSetup'
  | 'onServerStart'
  | 'onServerStop'
  | 'beforeShutdown'
  | 'afterShutdown'
  // Plugin lifecycle
  | 'onPluginRegister'
  | 'onPluginUnregister'
  | 'onPluginEnable'
  | 'onPluginDisable'
  // Config lifecycle
  | 'onConfigChange'
  | 'onConfigReload'
  | 'onHealthCheck'

/**
 * 🌐 HTTP HOOKS - Request/Response lifecycle
 */
export type HttpHook =
  // Request lifecycle
  | 'onRequest'
  | 'onBeforeRequest'
  | 'onAfterRequest'
  | 'onRequestBody'
  | 'onRequestValidation'
  | 'onRequestTransform'
  | 'onRequestHeaders'
  | 'onRequestQuery'
  | 'onRequestParams'
  // Routing
  | 'onBeforeRoute'
  | 'onRouteRegister'
  | 'onRouteMatch'
  | 'onRouteNotFound'
  | 'beforeRouteHandler'
  | 'afterRouteHandler'
  // Response lifecycle
  | 'onResponse'
  | 'onBeforeResponse'
  | 'onAfterResponse'
  | 'onResponseBody'
  | 'onResponseTransform'
  | 'onResponseHeaders'
  | 'onResponseStatus'
  // Method-specific
  | 'onGET'
  | 'onPOST'
  | 'onPUT'
  | 'onPATCH'
  | 'onDELETE'
  | 'onOPTIONS'
  | 'onHEAD'

/**
 * ⚠️ ERROR HOOKS - Error handling
 */
export type ErrorHook =
  | 'onError'
  | 'onValidationError'
  | 'onAuthenticationError'
  | 'onAuthorizationError'
  | 'onNotFoundError'
  | 'onDatabaseError'
  | 'onNetworkError'
  | 'onTimeoutError'
  | 'onRateLimitError'
  | 'onServerError'
  | 'onClientError'
  | 'beforeErrorResponse'
  | 'afterErrorResponse'
  | 'onUnhandledError'
  | 'onErrorRecovery'

/**
 * 🗄️ DATABASE HOOKS - Database operations
 */
export type DatabaseHook =
  | 'onDatabaseConnect'
  | 'onDatabaseDisconnect'
  | 'onDatabaseQuery'
  | 'beforeQuery'
  | 'afterQuery'
  | 'onQueryError'
  | 'onTransaction'
  | 'onTransactionCommit'
  | 'onTransactionRollback'
  | 'onMigration'
  | 'onSeed'

/**
 * 💾 CACHE HOOKS - Caching operations
 */
export type CacheHook =
  | 'onCacheHit'
  | 'onCacheMiss'
  | 'onCacheSet'
  | 'onCacheGet'
  | 'onCacheDelete'
  | 'onCacheClear'
  | 'onCacheExpire'
  | 'beforeCacheSet'
  | 'afterCacheSet'
  | 'onCacheInvalidate'

/**
 * ✅ VALIDATION HOOKS - Data validation
 */
export type ValidationHook =
  | 'onValidate'
  | 'onValidateRequest'
  | 'onValidateResponse'
  | 'onValidateBody'
  | 'onValidateQuery'
  | 'onValidateParams'
  | 'onValidateHeaders'
  | 'onSanitize'
  | 'beforeValidation'
  | 'afterValidation'

/**
 * 📁 FILE HOOKS - File operations
 */
export type FileHook =
  | 'onFileUpload'
  | 'beforeFileUpload'
  | 'afterFileUpload'
  | 'onFileDelete'
  | 'onFileRead'
  | 'onFileWrite'
  | 'onFileTransform'
  | 'onFileValidate'
  | 'onFileProcessing'
  | 'onStorageChange'

/**
 * 🔌 WEBSOCKET HOOKS - Real-time communication
 */
export type WebSocketHook =
  | 'onWSConnect'
  | 'onWSDisconnect'
  | 'onWSMessage'
  | 'onWSError'
  | 'onWSBroadcast'
  | 'beforeWSMessage'
  | 'afterWSMessage'
  | 'onWSRoom'

/**
 * 🔐 AUTH HOOKS - Authentication & Authorization
 */
export type AuthHook =
  | 'onLogin'
  | 'onLogout'
  | 'onRegister'
  | 'onPasswordReset'
  | 'onTokenGenerate'
  | 'onTokenValidate'
  | 'onTokenRefresh'
  | 'onTokenExpire'
  | 'onPermissionCheck'
  | 'onRoleAssign'
  | 'beforeAuth'
  | 'afterAuth'

/**
 * 🛠️ BUILD HOOKS - Build process
 */
export type BuildHook =
  | 'onBuild'
  | 'onBuildComplete'
  | 'beforeBuild'
  | 'afterBuild'
  | 'onBuildError'
  | 'onBuildAsset'
  | 'onBuildOptimize'
  | 'onBuildBundle'
  | 'onBuildMinify'
  | 'onBuildTreeshake'

/**
 * 💻 CLI HOOKS - Command line interface
 */
export type CliHook =
  | 'onCommand'
  | 'beforeCommand'
  | 'afterCommand'
  | 'onCommandError'
  | 'onCommandHelp'
  | 'onCommandValidate'
  | 'onGenerate'
  | 'onMigrate'
  | 'onTest'

/**
 * 🔄 DATA TRANSFORM HOOKS - Data transformation
 */
export type TransformHook =
  | 'onTransform'
  | 'onSerialize'
  | 'onDeserialize'
  | 'onEncode'
  | 'onDecode'
  | 'onCompress'
  | 'onDecompress'
  | 'onEncrypt'
  | 'onDecrypt'

/**
 * 📊 MONITORING HOOKS - Monitoring & Metrics
 */
export type MonitoringHook =
  | 'onMetric'
  | 'onLog'
  | 'onTrace'
  | 'onPerformance'
  | 'onAlert'

/**
 * 🔗 ALL HOOKS - Union type of all hook categories
 */
export type PluginHook =
  | LifecycleHook
  | HttpHook
  | ErrorHook
  | DatabaseHook
  | CacheHook
  | ValidationHook
  | FileHook
  | WebSocketHook
  | AuthHook
  | BuildHook
  | CliHook
  | TransformHook
  | MonitoringHook

/**
 * 🎯 PLUGIN FILTERS - Modify data (inspired by WordPress)
 */
export type PluginFilter =
  // Data filters
  | 'filterRequestBody'
  | 'filterResponseBody'
  | 'filterQueryParams'
  | 'filterHeaders'
  | 'filterRouteParams'
  // Entity filters
  | 'filterUserData'
  | 'filterQueryResults'
  // Config filters
  | 'filterConfig'
  | 'filterEnvironment'
  // Content filters
  | 'filterHTML'
  | 'filterJSON'
  | 'filterMarkdown'

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
  errorType?: 'validation' | 'authentication' | 'authorization' | 'notFound' | 'database' | 'network' | 'timeout' | 'rateLimit' | 'server' | 'client' | 'unhandled'
  recovery?: {
    attempted: boolean
    successful?: boolean
    strategy?: string
  }
}

export interface BuildContext {
  target: string
  outDir: string
  mode: 'development' | 'production'
  config: FluxStackConfig
  assets?: Array<{ file: string; size: number }>
  stats?: {
    duration: number
    bundleSize: number
    chunkCount: number
  }
}

/**
 * 🗄️ DATABASE CONTEXT - Database operation context
 */
export interface DatabaseContext {
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'RAW' | 'TRANSACTION'
  table?: string
  query: string
  params?: any[]
  result?: any
  duration?: number
  connection: any
  transaction?: {
    id: string
    state: 'active' | 'committed' | 'rolled_back'
  }
  metadata?: Record<string, any>
}

/**
 * 💾 CACHE CONTEXT - Cache operation context
 */
export interface CacheContext {
  key: string
  value?: any
  ttl?: number
  operation: 'get' | 'set' | 'delete' | 'clear' | 'invalidate'
  hit?: boolean
  namespace?: string
  tags?: string[]
  metadata?: Record<string, any>
}

/**
 * ✅ VALIDATION CONTEXT - Data validation context
 */
export interface ValidationContext {
  data: any
  schema?: any
  errors: Array<{
    field: string
    message: string
    value?: any
    rule?: string
  }>
  valid: boolean
  sanitized?: any
  validationType?: 'request' | 'response' | 'body' | 'query' | 'params' | 'headers'
}

/**
 * 📁 FILE CONTEXT - File operation context
 */
export interface FileContext {
  file: File | Buffer | Blob
  filename: string
  mimetype: string
  size: number
  path?: string
  url?: string
  transformation?: string
  metadata?: Record<string, any>
  storage?: {
    provider: string
    bucket?: string
    key?: string
  }
}

/**
 * 🔌 WEBSOCKET CONTEXT - WebSocket event context
 */
export interface WebSocketContext {
  socket: any
  event: string
  data: any
  room?: string
  broadcast?: boolean
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

/**
 * 🔐 AUTH CONTEXT - Authentication context
 */
export interface AuthContext {
  user?: any
  token?: string
  credentials?: any
  permissions?: string[]
  roles?: string[]
  session?: any
  provider?: string
  metadata?: Record<string, any>
  authType?: 'login' | 'logout' | 'register' | 'reset' | 'token' | 'permission'
}

/**
 * 💻 CLI CONTEXT - Command line context
 */
export interface CliContext {
  command: string
  args: string[]
  options: Record<string, any>
  workingDir: string
  config: FluxStackConfig
  logger: Logger
  utils: PluginUtils
  packageInfo: {
    name: string
    version: string
  }
}

/**
 * 🔄 TRANSFORM CONTEXT - Data transformation context
 */
export interface TransformContext {
  data: any
  transformed?: any
  operation: 'serialize' | 'deserialize' | 'encode' | 'decode' | 'compress' | 'decompress' | 'encrypt' | 'decrypt'
  format?: string
  encoding?: string
  options?: Record<string, any>
}

/**
 * 📊 MONITORING CONTEXT - Monitoring event context
 */
export interface MonitoringContext {
  metric?: {
    name: string
    value: number
    labels?: Record<string, string>
  }
  log?: {
    level: 'debug' | 'info' | 'warn' | 'error'
    message: string
    context?: any
  }
  trace?: {
    spanId: string
    traceId: string
    operation: string
    duration: number
  }
  performance?: {
    operation: string
    duration: number
    memory?: number
    cpu?: number
  }
  alert?: {
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
  }
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

  // 🔄 LIFECYCLE HOOKS
  setup?: (context: PluginContext) => void | Promise<void>
  beforeSetup?: (context: PluginContext) => void | Promise<void>
  afterSetup?: (context: PluginContext) => void | Promise<void>
  onServerStart?: (context: PluginContext) => void | Promise<void>
  onServerStop?: (context: PluginContext) => void | Promise<void>
  beforeShutdown?: (context: PluginContext) => void | Promise<void>
  afterShutdown?: (context: PluginContext) => void | Promise<void>
  onPluginRegister?: (context: PluginContext) => void | Promise<void>
  onPluginUnregister?: (context: PluginContext) => void | Promise<void>
  onPluginEnable?: (context: PluginContext) => void | Promise<void>
  onPluginDisable?: (context: PluginContext) => void | Promise<void>
  onConfigChange?: (context: PluginContext) => void | Promise<void>
  onConfigReload?: (context: PluginContext) => void | Promise<void>
  onHealthCheck?: (context: PluginContext) => void | Promise<void>

  // 🌐 HTTP HOOKS
  onRequest?: (context: RequestContext) => void | Promise<void>
  onBeforeRequest?: (context: RequestContext) => void | Promise<void>
  onAfterRequest?: (context: RequestContext) => void | Promise<void>
  onRequestBody?: (context: RequestContext) => void | Promise<void>
  onRequestValidation?: (context: RequestContext) => void | Promise<void>
  onRequestTransform?: (context: RequestContext) => void | Promise<void>
  onRequestHeaders?: (context: RequestContext) => void | Promise<void>
  onRequestQuery?: (context: RequestContext) => void | Promise<void>
  onRequestParams?: (context: RequestContext) => void | Promise<void>
  onBeforeRoute?: (context: RequestContext) => void | Promise<void>
  onRouteRegister?: (context: RequestContext) => void | Promise<void>
  onRouteMatch?: (context: RequestContext) => void | Promise<void>
  onRouteNotFound?: (context: RequestContext) => void | Promise<void>
  beforeRouteHandler?: (context: RequestContext) => void | Promise<void>
  afterRouteHandler?: (context: RequestContext) => void | Promise<void>
  onResponse?: (context: ResponseContext) => void | Promise<void>
  onBeforeResponse?: (context: ResponseContext) => void | Promise<void>
  onAfterResponse?: (context: ResponseContext) => void | Promise<void>
  onResponseBody?: (context: ResponseContext) => void | Promise<void>
  onResponseTransform?: (context: ResponseContext) => void | Promise<void>
  onResponseHeaders?: (context: ResponseContext) => void | Promise<void>
  onResponseStatus?: (context: ResponseContext) => void | Promise<void>
  onGET?: (context: RequestContext) => void | Promise<void>
  onPOST?: (context: RequestContext) => void | Promise<void>
  onPUT?: (context: RequestContext) => void | Promise<void>
  onPATCH?: (context: RequestContext) => void | Promise<void>
  onDELETE?: (context: RequestContext) => void | Promise<void>
  onOPTIONS?: (context: RequestContext) => void | Promise<void>
  onHEAD?: (context: RequestContext) => void | Promise<void>

  // ⚠️ ERROR HOOKS
  onError?: (context: ErrorContext) => void | Promise<void>
  onValidationError?: (context: ErrorContext) => void | Promise<void>
  onAuthenticationError?: (context: ErrorContext) => void | Promise<void>
  onAuthorizationError?: (context: ErrorContext) => void | Promise<void>
  onNotFoundError?: (context: ErrorContext) => void | Promise<void>
  onDatabaseError?: (context: ErrorContext) => void | Promise<void>
  onNetworkError?: (context: ErrorContext) => void | Promise<void>
  onTimeoutError?: (context: ErrorContext) => void | Promise<void>
  onRateLimitError?: (context: ErrorContext) => void | Promise<void>
  onServerError?: (context: ErrorContext) => void | Promise<void>
  onClientError?: (context: ErrorContext) => void | Promise<void>
  beforeErrorResponse?: (context: ErrorContext) => void | Promise<void>
  afterErrorResponse?: (context: ErrorContext) => void | Promise<void>
  onUnhandledError?: (context: ErrorContext) => void | Promise<void>
  onErrorRecovery?: (context: ErrorContext) => void | Promise<void>

  // 🗄️ DATABASE HOOKS
  onDatabaseConnect?: (context: DatabaseContext) => void | Promise<void>
  onDatabaseDisconnect?: (context: DatabaseContext) => void | Promise<void>
  onDatabaseQuery?: (context: DatabaseContext) => void | Promise<void>
  beforeQuery?: (context: DatabaseContext) => void | Promise<void>
  afterQuery?: (context: DatabaseContext) => void | Promise<void>
  onQueryError?: (context: DatabaseContext) => void | Promise<void>
  onTransaction?: (context: DatabaseContext) => void | Promise<void>
  onTransactionCommit?: (context: DatabaseContext) => void | Promise<void>
  onTransactionRollback?: (context: DatabaseContext) => void | Promise<void>
  onMigration?: (context: DatabaseContext) => void | Promise<void>
  onSeed?: (context: DatabaseContext) => void | Promise<void>

  // 💾 CACHE HOOKS
  onCacheHit?: (context: CacheContext) => void | Promise<void>
  onCacheMiss?: (context: CacheContext) => void | Promise<void>
  onCacheSet?: (context: CacheContext) => void | Promise<void>
  onCacheGet?: (context: CacheContext) => void | Promise<void>
  onCacheDelete?: (context: CacheContext) => void | Promise<void>
  onCacheClear?: (context: CacheContext) => void | Promise<void>
  onCacheExpire?: (context: CacheContext) => void | Promise<void>
  beforeCacheSet?: (context: CacheContext) => void | Promise<void>
  afterCacheSet?: (context: CacheContext) => void | Promise<void>
  onCacheInvalidate?: (context: CacheContext) => void | Promise<void>

  // ✅ VALIDATION HOOKS
  onValidate?: (context: ValidationContext) => void | Promise<void>
  onValidateRequest?: (context: ValidationContext) => void | Promise<void>
  onValidateResponse?: (context: ValidationContext) => void | Promise<void>
  onValidateBody?: (context: ValidationContext) => void | Promise<void>
  onValidateQuery?: (context: ValidationContext) => void | Promise<void>
  onValidateParams?: (context: ValidationContext) => void | Promise<void>
  onValidateHeaders?: (context: ValidationContext) => void | Promise<void>
  onSanitize?: (context: ValidationContext) => void | Promise<void>
  beforeValidation?: (context: ValidationContext) => void | Promise<void>
  afterValidation?: (context: ValidationContext) => void | Promise<void>

  // 📁 FILE HOOKS
  onFileUpload?: (context: FileContext) => void | Promise<void>
  beforeFileUpload?: (context: FileContext) => void | Promise<void>
  afterFileUpload?: (context: FileContext) => void | Promise<void>
  onFileDelete?: (context: FileContext) => void | Promise<void>
  onFileRead?: (context: FileContext) => void | Promise<void>
  onFileWrite?: (context: FileContext) => void | Promise<void>
  onFileTransform?: (context: FileContext) => void | Promise<void>
  onFileValidate?: (context: FileContext) => void | Promise<void>
  onFileProcessing?: (context: FileContext) => void | Promise<void>
  onStorageChange?: (context: FileContext) => void | Promise<void>

  // 🔌 WEBSOCKET HOOKS
  onWSConnect?: (context: WebSocketContext) => void | Promise<void>
  onWSDisconnect?: (context: WebSocketContext) => void | Promise<void>
  onWSMessage?: (context: WebSocketContext) => void | Promise<void>
  onWSError?: (context: WebSocketContext) => void | Promise<void>
  onWSBroadcast?: (context: WebSocketContext) => void | Promise<void>
  beforeWSMessage?: (context: WebSocketContext) => void | Promise<void>
  afterWSMessage?: (context: WebSocketContext) => void | Promise<void>
  onWSRoom?: (context: WebSocketContext) => void | Promise<void>

  // 🔐 AUTH HOOKS
  onLogin?: (context: AuthContext) => void | Promise<void>
  onLogout?: (context: AuthContext) => void | Promise<void>
  onRegister?: (context: AuthContext) => void | Promise<void>
  onPasswordReset?: (context: AuthContext) => void | Promise<void>
  onTokenGenerate?: (context: AuthContext) => void | Promise<void>
  onTokenValidate?: (context: AuthContext) => void | Promise<void>
  onTokenRefresh?: (context: AuthContext) => void | Promise<void>
  onTokenExpire?: (context: AuthContext) => void | Promise<void>
  onPermissionCheck?: (context: AuthContext) => void | Promise<void>
  onRoleAssign?: (context: AuthContext) => void | Promise<void>
  beforeAuth?: (context: AuthContext) => void | Promise<void>
  afterAuth?: (context: AuthContext) => void | Promise<void>

  // 🛠️ BUILD HOOKS
  onBuild?: (context: BuildContext) => void | Promise<void>
  onBuildComplete?: (context: BuildContext) => void | Promise<void>
  beforeBuild?: (context: BuildContext) => void | Promise<void>
  afterBuild?: (context: BuildContext) => void | Promise<void>
  onBuildError?: (context: BuildContext) => void | Promise<void>
  onBuildAsset?: (context: BuildContext) => void | Promise<void>
  onBuildOptimize?: (context: BuildContext) => void | Promise<void>
  onBuildBundle?: (context: BuildContext) => void | Promise<void>
  onBuildMinify?: (context: BuildContext) => void | Promise<void>
  onBuildTreeshake?: (context: BuildContext) => void | Promise<void>

  // 💻 CLI HOOKS
  onCommand?: (context: CliContext) => void | Promise<void>
  beforeCommand?: (context: CliContext) => void | Promise<void>
  afterCommand?: (context: CliContext) => void | Promise<void>
  onCommandError?: (context: CliContext) => void | Promise<void>
  onCommandHelp?: (context: CliContext) => void | Promise<void>
  onCommandValidate?: (context: CliContext) => void | Promise<void>
  onGenerate?: (context: CliContext) => void | Promise<void>
  onMigrate?: (context: CliContext) => void | Promise<void>
  onTest?: (context: CliContext) => void | Promise<void>

  // 🔄 TRANSFORM HOOKS
  onTransform?: (context: TransformContext) => void | Promise<void>
  onSerialize?: (context: TransformContext) => void | Promise<void>
  onDeserialize?: (context: TransformContext) => void | Promise<void>
  onEncode?: (context: TransformContext) => void | Promise<void>
  onDecode?: (context: TransformContext) => void | Promise<void>
  onCompress?: (context: TransformContext) => void | Promise<void>
  onDecompress?: (context: TransformContext) => void | Promise<void>
  onEncrypt?: (context: TransformContext) => void | Promise<void>
  onDecrypt?: (context: TransformContext) => void | Promise<void>

  // 📊 MONITORING HOOKS
  onMetric?: (context: MonitoringContext) => void | Promise<void>
  onLog?: (context: MonitoringContext) => void | Promise<void>
  onTrace?: (context: MonitoringContext) => void | Promise<void>
  onPerformance?: (context: MonitoringContext) => void | Promise<void>
  onAlert?: (context: MonitoringContext) => void | Promise<void>

  // 🎯 FILTERS - Transform data (inspired by WordPress)
  filters?: {
    filterRequestBody?: (data: any, context: RequestContext) => any | Promise<any>
    filterResponseBody?: (data: any, context: ResponseContext) => any | Promise<any>
    filterQueryParams?: (data: any, context: RequestContext) => any | Promise<any>
    filterHeaders?: (data: any, context: RequestContext | ResponseContext) => any | Promise<any>
    filterRouteParams?: (data: any, context: RequestContext) => any | Promise<any>
    filterUserData?: (data: any, context: any) => any | Promise<any>
    filterQueryResults?: (data: any, context: DatabaseContext) => any | Promise<any>
    filterConfig?: (data: any, context: PluginContext) => any | Promise<any>
    filterEnvironment?: (data: any, context: PluginContext) => any | Promise<any>
    filterHTML?: (data: string, context: any) => string | Promise<string>
    filterJSON?: (data: any, context: any) => any | Promise<any>
    filterMarkdown?: (data: string, context: any) => string | Promise<string>
  }

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