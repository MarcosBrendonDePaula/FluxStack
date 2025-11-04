import type { FluxStackConfig } from "../config/schema"
import type { Logger } from "../utils/logger/index"

/**
 * LIFECYCLE HOOKS - Plugin lifecycle
 */
export type LifecycleHook =
  // Plugin lifecycle
  | 'setup'
  | 'beforeSetup'
  | 'afterSetup'
  | 'onPluginRegister'
  | 'onPluginUnregister'
  | 'onPluginEnable'
  | 'onPluginDisable'
  // Config lifecycle
  | 'onConfigChange'
  | 'onConfigReload'
  | 'onHealthCheck'

/**
 * SERVER LIFECYCLE HOOKS - Granular server initialization and shutdown
 */
export type ServerLifecycleHook =
  // Server initialization phase
  | 'beforeServerInit'        // Before any server initialization
  | 'onServerInit'            // During server initialization
  | 'afterServerInit'         // After server initialized, before routes
  // Routes registration phase
  | 'beforeRoutesLoad'        // Before loading route files
  | 'onRouteFileLoad'         // When each route file is loaded
  | 'afterRoutesLoad'         // After all route files loaded
  | 'beforeRoutesRegister'    // Before registering routes
  | 'onRouteRegister'         // When each route is registered
  | 'afterRoutesRegister'     // After all routes registered
  // Middleware setup phase
  | 'beforeMiddlewareSetup'   // Before setting up middlewares
  | 'onMiddlewareRegister'    // When each middleware is registered
  | 'afterMiddlewareSetup'    // After middlewares configured
  // Plugin initialization phase
  | 'beforePluginsLoad'       // Before loading plugins
  | 'onPluginLoad'            // When each plugin is loaded
  | 'afterPluginsLoad'        // After all plugins loaded
  | 'beforePluginsInit'       // Before initializing plugins
  | 'onPluginInit'            // When each plugin is initialized
  | 'afterPluginsInit'        // After all plugins initialized
  // Server listening phase
  | 'beforeServerListen'      // Before server.listen()
  | 'onServerStart'           // Server started listening
  | 'onServerListening'       // Server is actively listening
  | 'onServerReady'           // Server ready to accept requests
  | 'onFirstRequest'          // First HTTP request received
  // Server shutdown phase
  | 'onGracefulShutdownStart' // Graceful shutdown initiated
  | 'beforeServerStop'        // Before stopping server
  | 'onServerStop'            // Server stopping
  | 'afterServerStop'         // After server stopped
  | 'beforeShutdown'          // Before app shutdown
  | 'onShutdown'              // During shutdown
  | 'afterShutdown'           // After app shutdown complete

/**
 * BUILD LIFECYCLE HOOKS - Granular build process control
 */
export type BuildLifecycleHook =
  // Pre-build phase
  | 'beforeBuildStart'        // Before build process starts
  | 'onBuildConfigLoad'       // When build config is loaded
  | 'afterBuildConfigLoad'    // After build config loaded
  | 'onBuildEnvSetup'         // When build environment is set up

  // Dependency phase
  | 'beforeDependencyInstall' // Before installing dependencies
  | 'onDependencyInstall'     // During dependency installation
  | 'afterDependencyInstall'  // After dependencies installed
  | 'onDependencyCheck'       // When checking dependencies

  // Pre-compilation phase
  | 'beforeCompilation'       // Before any compilation
  | 'onTypeCheck'             // During TypeScript type checking
  | 'afterTypeCheck'          // After type checking
  | 'onLint'                  // During linting
  | 'afterLint'               // After linting

  // Compilation phase
  | 'beforeCompile'           // Before compilation starts
  | 'onCompileFile'           // When each file is compiled
  | 'onCompileStart'          // Compilation started
  | 'onCompileProgress'       // Compilation progress update
  | 'afterCompile'            // After compilation complete

  // Plugin compilation phase
  | 'beforePluginCompile'     // Before compiling plugins
  | 'onPluginCompile'         // When each plugin is compiled
  | 'afterPluginCompile'      // After all plugins compiled

  // Asset processing phase
  | 'beforeAssetProcess'      // Before processing assets
  | 'onAssetProcess'          // When each asset is processed
  | 'afterAssetProcess'       // After all assets processed
  | 'onAssetCopy'             // When static assets are copied
  | 'onAssetTransform'        // When assets are transformed

  // Bundling phase
  | 'beforeBundle'            // Before bundling
  | 'onBundleStart'           // Bundling started
  | 'onBundleChunk'           // When creating each chunk
  | 'onBundleProgress'        // Bundling progress
  | 'afterBundle'             // After bundling complete

  // Code optimization phase
  | 'beforeOptimize'          // Before optimization
  | 'onTreeShake'             // During tree shaking
  | 'afterTreeShake'          // After tree shaking
  | 'onMinify'                // During minification
  | 'afterMinify'             // After minification
  | 'onCompress'              // During compression
  | 'afterCompress'           // After compression
  | 'afterOptimize'           // After all optimization

  // Code generation phase
  | 'beforeCodeGen'           // Before code generation
  | 'onCodeGen'               // During code generation
  | 'afterCodeGen'            // After code generation
  | 'onSourceMapGen'          // When generating source maps

  // Output phase
  | 'beforeOutput'            // Before writing output
  | 'onOutputFile'            // When each file is written
  | 'onOutputChunk'           // When each chunk is written
  | 'afterOutput'             // After all files written

  // Post-build phase
  | 'onBuildComplete'         // Build completed successfully
  | 'afterBuild'              // After build process ends
  | 'onBuildSuccess'          // Build succeeded
  | 'onBuildError'            // Build failed
  | 'onBuildWarning'          // Build warning

  // Build cleanup phase
  | 'beforeBuildCleanup'      // Before cleaning build artifacts
  | 'afterBuildCleanup'       // After cleanup complete

  // Build stats phase
  | 'onBuildStats'            // When build stats are generated
  | 'onBuildReport'           // When build report is created

/**
 * DEVELOPMENT LIFECYCLE HOOKS - Development mode hooks
 */
export type DevelopmentLifecycleHook =
  // Dev server lifecycle
  | 'beforeDevStart'          // Before dev server starts
  | 'onDevStart'              // Dev server started
  | 'afterDevStart'           // After dev server ready
  | 'onDevReady'              // Dev environment ready

  // Hot reload lifecycle
  | 'beforeHotReload'         // Before hot reload
  | 'onFileChange'            // When file changes detected
  | 'onFileAdd'               // When file is added
  | 'onFileDelete'            // When file is deleted
  | 'onFileRename'            // When file is renamed
  | 'afterHotReload'          // After hot reload complete

  // HMR (Hot Module Replacement)
  | 'beforeHMR'               // Before HMR update
  | 'onHMRUpdate'             // During HMR update
  | 'afterHMR'                // After HMR complete
  | 'onHMRError'              // HMR error

  // Dev rebuild
  | 'beforeDevRebuild'        // Before rebuild in dev
  | 'onDevRebuild'            // During dev rebuild
  | 'afterDevRebuild'         // After dev rebuild

  // Dev tools
  | 'onDevToolsInit'          // Dev tools initialized
  | 'onInspectorConnect'      // Inspector connected
  | 'onInspectorDisconnect'   // Inspector disconnected

/**
 * TESTING LIFECYCLE HOOKS - Test execution hooks
 */
export type TestLifecycleHook =
  // Test suite lifecycle
  | 'beforeTestSuite'         // Before test suite runs
  | 'onTestSuiteStart'        // Test suite started
  | 'afterTestSuite'          // After test suite complete

  // Test file lifecycle
  | 'beforeTestFile'          // Before each test file
  | 'onTestFileStart'         // Test file started
  | 'afterTestFile'           // After test file complete

  // Individual test lifecycle
  | 'beforeTest'              // Before each test
  | 'onTestStart'             // Test started
  | 'onTestPass'              // Test passed
  | 'onTestFail'              // Test failed
  | 'onTestSkip'              // Test skipped
  | 'afterTest'               // After each test

  // Test coverage
  | 'beforeCoverage'          // Before collecting coverage
  | 'onCoverageCollect'       // During coverage collection
  | 'afterCoverage'           // After coverage complete
  | 'onCoverageReport'        // Coverage report generated

  // Test results
  | 'onTestResults'           // Test results available
  | 'onTestSummary'           // Test summary generated

/**
 * DEPLOYMENT LIFECYCLE HOOKS - Deployment process hooks
 */
export type DeploymentLifecycleHook =
  // Pre-deployment phase
  | 'beforeDeploy'            // Before deployment starts
  | 'onDeployStart'           // Deployment started
  | 'onDeployConfigLoad'      // Deployment config loaded

  // Build for deployment
  | 'beforeDeployBuild'       // Before building for deploy
  | 'onDeployBuild'           // During deploy build
  | 'afterDeployBuild'        // After deploy build

  // Asset preparation
  | 'beforeAssetUpload'       // Before uploading assets
  | 'onAssetUpload'           // During asset upload
  | 'afterAssetUpload'        // After assets uploaded

  // Database migration
  | 'beforeMigrationRun'      // Before running migrations
  | 'onMigrationRun'          // During migration
  | 'afterMigrationRun'       // After migrations complete

  // Deployment execution
  | 'onDeployExecute'         // During deployment
  | 'onDeployProgress'        // Deployment progress

  // Post-deployment
  | 'afterDeploy'             // After deployment complete
  | 'onDeploySuccess'         // Deployment succeeded
  | 'onDeployError'           // Deployment failed
  | 'onDeployRollback'        // Deployment rolled back

  // Health check
  | 'onDeployHealthCheck'     // Health check after deploy
  | 'onDeployVerify'          // Verify deployment

/**
 * HTTP HOOKS - Request/Response lifecycle
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
 * ERROR HOOKS - Error handling
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
 * DATABASE HOOKS - Database operations
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
 * CACHE HOOKS - Caching operations
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
 * VALIDATION HOOKS - Data validation
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
 * FILE HOOKS - File operations
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
 * WEBSOCKET HOOKS - Real-time communication
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
 * AUTH HOOKS - Authentication & Authorization
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
 * CLI HOOKS - Command line interface
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
 * DATA TRANSFORM HOOKS - Data transformation
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
 * MONITORING HOOKS - Monitoring & Metrics
 */
export type MonitoringHook =
  | 'onMetric'
  | 'onLog'
  | 'onTrace'
  | 'onPerformance'
  | 'onAlert'

/**
 * ALL HOOKS - Union type of all hook categories
 */
export type PluginHook =
  | LifecycleHook
  | ServerLifecycleHook
  | BuildLifecycleHook
  | DevelopmentLifecycleHook
  | TestLifecycleHook
  | DeploymentLifecycleHook
  | HttpHook
  | ErrorHook
  | DatabaseHook
  | CacheHook
  | ValidationHook
  | FileHook
  | WebSocketHook
  | AuthHook
  | CliHook
  | TransformHook
  | MonitoringHook

/**
 * PLUGIN FILTERS - Modify data
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
  phase?: 'pre-build' | 'compilation' | 'bundling' | 'optimization' | 'output' | 'post-build'
  progress?: {
    current: number
    total: number
    percentage: number
  }
}

// Export all other context types from original file
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

export interface TransformContext {
  data: any
  transformed?: any
  operation: 'serialize' | 'deserialize' | 'encode' | 'decode' | 'compress' | 'decompress' | 'encrypt' | 'decrypt'
  format?: string
  encoding?: string
  options?: Record<string, any>
}

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

/**
 * Combined hook type - All possible hooks
 */
export type PluginHook =
  | LifecycleHook
  | ServerLifecycleHook
  | HttpHook
  | ErrorHook
  | DatabaseHook
  | CacheHook
  | ValidationHook
  | FileHook
  | WebSocketHook
  | AuthHook
  | BuildLifecycleHook
  | DevelopmentLifecycleHook
  | TestingLifecycleHook
  | DeploymentLifecycleHook
  | CliHook
  | TransformHook
  | MonitoringHook

/**
 * Plugin filter type - Data transformation filters
 */
export type PluginFilter =
  | 'filterRequestBody'
  | 'filterResponseBody'
  | 'filterQueryParams'
  | 'filterHeaders'
  | 'filterRouteParams'
  | 'filterUserData'
  | 'filterQueryResults'
  | 'filterConfig'
  | 'filterEnvironment'
  | 'filterHTML'
  | 'filterJSON'
  | 'filterMarkdown'

export type PluginPriority = 'highest' | 'high' | 'normal' | 'low' | 'lowest' | number

/**
 * FluxStack Plugin System
 */
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

    // LIFECYCLE HOOKS
    setup?: (context: PluginContext) => void | Promise<void>
    beforeSetup?: (context: PluginContext) => void | Promise<void>
    afterSetup?: (context: PluginContext) => void | Promise<void>
    onPluginRegister?: (context: PluginContext) => void | Promise<void>
    onPluginUnregister?: (context: PluginContext) => void | Promise<void>
    onPluginEnable?: (context: PluginContext) => void | Promise<void>
    onPluginDisable?: (context: PluginContext) => void | Promise<void>
    onConfigChange?: (context: PluginContext) => void | Promise<void>
    onConfigReload?: (context: PluginContext) => void | Promise<void>
    onHealthCheck?: (context: PluginContext) => void | Promise<void>

    // SERVER LIFECYCLE HOOKS
    beforeServerInit?: (context: PluginContext) => void | Promise<void>
    onServerInit?: (context: PluginContext) => void | Promise<void>
    afterServerInit?: (context: PluginContext) => void | Promise<void>
    beforeRoutesLoad?: (context: PluginContext) => void | Promise<void>
    onRouteFileLoad?: (context: PluginContext & { file: string }) => void | Promise<void>
    afterRoutesLoad?: (context: PluginContext) => void | Promise<void>
    beforeRoutesRegister?: (context: PluginContext) => void | Promise<void>
    onRouteRegister?: (context: RequestContext) => void | Promise<void>
    afterRoutesRegister?: (context: PluginContext) => void | Promise<void>
    beforeMiddlewareSetup?: (context: PluginContext) => void | Promise<void>
    onMiddlewareRegister?: (context: PluginContext & { middleware: any }) => void | Promise<void>
    afterMiddlewareSetup?: (context: PluginContext) => void | Promise<void>
    beforePluginsLoad?: (context: PluginContext) => void | Promise<void>
    onPluginLoad?: (context: PluginContext & { plugin: Plugin }) => void | Promise<void>
    afterPluginsLoad?: (context: PluginContext) => void | Promise<void>
    beforePluginsInit?: (context: PluginContext) => void | Promise<void>
    onPluginInit?: (context: PluginContext & { plugin: Plugin }) => void | Promise<void>
    afterPluginsInit?: (context: PluginContext) => void | Promise<void>
    beforeServerListen?: (context: PluginContext) => void | Promise<void>
    onServerStart?: (context: PluginContext) => void | Promise<void>
    onServerListening?: (context: PluginContext) => void | Promise<void>
    onServerReady?: (context: PluginContext) => void | Promise<void>
    onServerPort?: (context: PluginContext & { port: number }) => void | Promise<void>
    onServerHost?: (context: PluginContext & { host: string }) => void | Promise<void>
    beforeShutdown?: (context: PluginContext) => void | Promise<void>
    onShutdown?: (context: PluginContext) => void | Promise<void>
    onShutdownStart?: (context: PluginContext) => void | Promise<void>
    onGracefulShutdown?: (context: PluginContext) => void | Promise<void>
    afterShutdown?: (context: PluginContext) => void | Promise<void>
    onServerStop?: (context: PluginContext) => void | Promise<void>
    onServerCrash?: (context: ErrorContext) => void | Promise<void>
    onServerRestart?: (context: PluginContext) => void | Promise<void>

    // HTTP HOOKS
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

    // ERROR HOOKS
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

    // DATABASE HOOKS
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

    // CACHE HOOKS
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

    // VALIDATION HOOKS
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

    // FILE HOOKS
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

    // WEBSOCKET HOOKS
    onWSConnect?: (context: WebSocketContext) => void | Promise<void>
    onWSDisconnect?: (context: WebSocketContext) => void | Promise<void>
    onWSMessage?: (context: WebSocketContext) => void | Promise<void>
    onWSError?: (context: WebSocketContext) => void | Promise<void>
    onWSBroadcast?: (context: WebSocketContext) => void | Promise<void>
    beforeWSMessage?: (context: WebSocketContext) => void | Promise<void>
    afterWSMessage?: (context: WebSocketContext) => void | Promise<void>
    onWSRoom?: (context: WebSocketContext) => void | Promise<void>

    // AUTH HOOKS
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

    // BUILD LIFECYCLE HOOKS
    beforeBuildStart?: (context: BuildContext) => void | Promise<void>
    onBuildConfigLoad?: (context: BuildContext) => void | Promise<void>
    afterBuildConfigLoad?: (context: BuildContext) => void | Promise<void>
    onBuildEnvSetup?: (context: BuildContext) => void | Promise<void>
    beforeCompile?: (context: BuildContext) => void | Promise<void>
    onCompileFile?: (context: BuildContext & { file: string }) => void | Promise<void>
    onCompileProgress?: (context: BuildContext) => void | Promise<void>
    afterCompile?: (context: BuildContext) => void | Promise<void>
    beforePluginCompile?: (context: BuildContext) => void | Promise<void>
    onPluginCompile?: (context: BuildContext & { plugin: string }) => void | Promise<void>
    afterPluginCompile?: (context: BuildContext) => void | Promise<void>
    beforeAssetProcess?: (context: BuildContext) => void | Promise<void>
    onAssetProcess?: (context: BuildContext & { asset: string }) => void | Promise<void>
    afterAssetProcess?: (context: BuildContext) => void | Promise<void>
    beforeTypeCheck?: (context: BuildContext) => void | Promise<void>
    onTypeCheck?: (context: BuildContext) => void | Promise<void>
    afterTypeCheck?: (context: BuildContext) => void | Promise<void>
    onTypeError?: (context: BuildContext & { errors: any[] }) => void | Promise<void>
    beforeBundle?: (context: BuildContext) => void | Promise<void>
    onBundleChunk?: (context: BuildContext & { chunk: string }) => void | Promise<void>
    afterBundle?: (context: BuildContext) => void | Promise<void>
    beforeCodeSplit?: (context: BuildContext) => void | Promise<void>
    onCodeSplit?: (context: BuildContext) => void | Promise<void>
    afterCodeSplit?: (context: BuildContext) => void | Promise<void>
    beforeOptimize?: (context: BuildContext) => void | Promise<void>
    onOptimize?: (context: BuildContext) => void | Promise<void>
    afterOptimize?: (context: BuildContext) => void | Promise<void>
    beforeMinify?: (context: BuildContext) => void | Promise<void>
    onMinify?: (context: BuildContext) => void | Promise<void>
    afterMinify?: (context: BuildContext) => void | Promise<void>
    beforeTreeshake?: (context: BuildContext) => void | Promise<void>
    onTreeshake?: (context: BuildContext) => void | Promise<void>
    afterTreeshake?: (context: BuildContext) => void | Promise<void>
    beforeCompress?: (context: BuildContext) => void | Promise<void>
    onCompress?: (context: BuildContext) => void | Promise<void>
    afterCompress?: (context: BuildContext) => void | Promise<void>
    beforeSourceMap?: (context: BuildContext) => void | Promise<void>
    onSourceMap?: (context: BuildContext) => void | Promise<void>
    afterSourceMap?: (context: BuildContext) => void | Promise<void>
    beforeBuildOutput?: (context: BuildContext) => void | Promise<void>
    onBuildOutputFile?: (context: BuildContext & { file: string }) => void | Promise<void>
    afterBuildOutput?: (context: BuildContext) => void | Promise<void>
    onBuildStats?: (context: BuildContext) => void | Promise<void>
    onBuildAnalysis?: (context: BuildContext) => void | Promise<void>
    beforeBuildCleanup?: (context: BuildContext) => void | Promise<void>
    onBuildCleanup?: (context: BuildContext) => void | Promise<void>
    afterBuildCleanup?: (context: BuildContext) => void | Promise<void>
    onBuild?: (context: BuildContext) => void | Promise<void>
    onBuildComplete?: (context: BuildContext) => void | Promise<void>
    beforeBuild?: (context: BuildContext) => void | Promise<void>
    afterBuild?: (context: BuildContext) => void | Promise<void>
    onBuildError?: (context: BuildContext & { error: Error }) => void | Promise<void>
    onBuildAsset?: (context: BuildContext & { asset: string }) => void | Promise<void>
    onBuildOptimize?: (context: BuildContext) => void | Promise<void>
    onBuildBundle?: (context: BuildContext) => void | Promise<void>
    onBuildMinify?: (context: BuildContext) => void | Promise<void>
    onBuildTreeshake?: (context: BuildContext) => void | Promise<void>

    // DEVELOPMENT LIFECYCLE HOOKS
    beforeDevStart?: (context: PluginContext) => void | Promise<void>
    onDevStart?: (context: PluginContext) => void | Promise<void>
    onDevReady?: (context: PluginContext) => void | Promise<void>
    afterDevStart?: (context: PluginContext) => void | Promise<void>
    beforeHotReload?: (context: PluginContext) => void | Promise<void>
    onHotReload?: (context: PluginContext) => void | Promise<void>
    afterHotReload?: (context: PluginContext) => void | Promise<void>
    onFileChange?: (context: PluginContext & { file: string; event: string }) => void | Promise<void>
    onFileAdd?: (context: PluginContext & { file: string }) => void | Promise<void>
    onFileDelete?: (context: PluginContext & { file: string }) => void | Promise<void>
    beforeHMRUpdate?: (context: PluginContext) => void | Promise<void>
    onHMRUpdate?: (context: PluginContext & { modules: string[] }) => void | Promise<void>
    afterHMRUpdate?: (context: PluginContext) => void | Promise<void>
    onHMRError?: (context: ErrorContext) => void | Promise<void>
    beforeDevRebuild?: (context: BuildContext) => void | Promise<void>
    onDevRebuild?: (context: BuildContext) => void | Promise<void>
    afterDevRebuild?: (context: BuildContext) => void | Promise<void>
    onDevCompile?: (context: BuildContext) => void | Promise<void>
    onDevCompileError?: (context: ErrorContext) => void | Promise<void>
    onDevServerReload?: (context: PluginContext) => void | Promise<void>
    onDevClientReload?: (context: PluginContext) => void | Promise<void>

    // TESTING LIFECYCLE HOOKS
    beforeTestSuite?: (context: PluginContext) => void | Promise<void>
    afterTestSuite?: (context: PluginContext & { results: any }) => void | Promise<void>
    beforeTestFile?: (context: PluginContext & { file: string }) => void | Promise<void>
    afterTestFile?: (context: PluginContext & { file: string; results: any }) => void | Promise<void>
    onTestStart?: (context: PluginContext & { test: string }) => void | Promise<void>
    onTestPass?: (context: PluginContext & { test: string }) => void | Promise<void>
    onTestFail?: (context: PluginContext & { test: string; error: Error }) => void | Promise<void>
    onTestSkip?: (context: PluginContext & { test: string }) => void | Promise<void>
    beforeTestSetup?: (context: PluginContext) => void | Promise<void>
    afterTestSetup?: (context: PluginContext) => void | Promise<void>
    beforeTestTeardown?: (context: PluginContext) => void | Promise<void>
    afterTestTeardown?: (context: PluginContext) => void | Promise<void>
    onCoverageCollect?: (context: PluginContext & { coverage: any }) => void | Promise<void>
    onCoverageReport?: (context: PluginContext & { report: any }) => void | Promise<void>
    onTestTimeout?: (context: PluginContext & { test: string }) => void | Promise<void>
    onTestRetry?: (context: PluginContext & { test: string; attempt: number }) => void | Promise<void>
    onTestEnvironmentSetup?: (context: PluginContext) => void | Promise<void>
    onTestEnvironmentTeardown?: (context: PluginContext) => void | Promise<void>

    // DEPLOYMENT LIFECYCLE HOOKS
    beforeDeploy?: (context: PluginContext) => void | Promise<void>
    onDeployStart?: (context: PluginContext) => void | Promise<void>
    afterDeploy?: (context: PluginContext) => void | Promise<void>
    beforeDeployBuild?: (context: BuildContext) => void | Promise<void>
    onDeployBuild?: (context: BuildContext) => void | Promise<void>
    afterDeployBuild?: (context: BuildContext) => void | Promise<void>
    beforeAssetUpload?: (context: PluginContext & { assets: any[] }) => void | Promise<void>
    onAssetUpload?: (context: PluginContext & { asset: string }) => void | Promise<void>
    afterAssetUpload?: (context: PluginContext) => void | Promise<void>
    beforeMigrationRun?: (context: DatabaseContext) => void | Promise<void>
    onMigrationRun?: (context: DatabaseContext & { migration: string }) => void | Promise<void>
    afterMigrationRun?: (context: DatabaseContext) => void | Promise<void>
    onDeployHealthCheck?: (context: PluginContext & { status: string }) => void | Promise<void>
    onDeploySuccess?: (context: PluginContext) => void | Promise<void>
    onDeployFailure?: (context: ErrorContext) => void | Promise<void>
    onDeployRollback?: (context: PluginContext) => void | Promise<void>
    beforeCacheWarm?: (context: CacheContext) => void | Promise<void>
    afterCacheWarm?: (context: CacheContext) => void | Promise<void>

    // CLI HOOKS
    onCommand?: (context: CliContext) => void | Promise<void>
    beforeCommand?: (context: CliContext) => void | Promise<void>
    afterCommand?: (context: CliContext) => void | Promise<void>
    onCommandError?: (context: CliContext & { error: Error }) => void | Promise<void>
    onCommandHelp?: (context: CliContext) => void | Promise<void>
    onCommandValidate?: (context: CliContext) => void | Promise<void>
    onGenerate?: (context: CliContext) => void | Promise<void>
    onMigrate?: (context: CliContext) => void | Promise<void>
    onTest?: (context: CliContext) => void | Promise<void>

    // TRANSFORM HOOKS
    onTransform?: (context: TransformContext) => void | Promise<void>
    onSerialize?: (context: TransformContext) => void | Promise<void>
    onDeserialize?: (context: TransformContext) => void | Promise<void>
    onEncode?: (context: TransformContext) => void | Promise<void>
    onDecode?: (context: TransformContext) => void | Promise<void>
    onCompress?: (context: TransformContext) => void | Promise<void>
    onDecompress?: (context: TransformContext) => void | Promise<void>
    onEncrypt?: (context: TransformContext) => void | Promise<void>
    onDecrypt?: (context: TransformContext) => void | Promise<void>

    // MONITORING HOOKS
    onMetric?: (context: MonitoringContext) => void | Promise<void>
    onLog?: (context: MonitoringContext) => void | Promise<void>
    onTrace?: (context: MonitoringContext) => void | Promise<void>
    onPerformance?: (context: MonitoringContext) => void | Promise<void>
    onAlert?: (context: MonitoringContext) => void | Promise<void>

    // FILTERS - Transform data (WordPress-inspired)
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

    // Plugin configuration
    configSchema?: PluginConfigSchema
    defaultConfig?: Record<string, any>
  }
}

// Other plugin-related types
export interface PluginManifest {
  name: string
  version: string
  description: string
  author: string
  license: string
  homepage?: string
  repository?: string
  keywords?: string[]
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  fluxstack: {
    version: string
    hooks: PluginHook[]
    config?: any
    category?: string
    tags?: string[]
  }
}

export interface PluginLoadResult {
  plugin: FluxStack.Plugin
  manifest?: PluginManifest
  path: string
  loadTime: number
  errors: string[]
  warnings: string[]
}

export interface PluginRegistryState {
  plugins: Map<string, FluxStack.Plugin>
  manifests: Map<string, PluginManifest>
  loadOrder: string[]
  dependencies: Map<string, string[]>
  enabled: Set<string>
  disabled: Set<string>
}

export interface PluginHookResult {
  plugin: string
  hook: PluginHook
  success: boolean
  duration: number
  error?: Error
  result?: any
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

export interface HookExecutionOptions {
  timeout?: number
  parallel?: boolean
  stopOnError?: boolean
  retries?: number
}

export type PluginLifecycleEvent =
  | 'plugin:registered'
  | 'plugin:unregistered'
  | 'plugin:enabled'
  | 'plugin:disabled'
  | 'plugin:error'
  | 'hook:before'
  | 'hook:after'
  | 'hook:error'
