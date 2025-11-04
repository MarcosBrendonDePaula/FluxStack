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

// ... Continue with Plugin interface and other exports
