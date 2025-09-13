# Design Document

## Overview

Este documento detalha o design para otimização da arquitetura FluxStack, focando em melhorar a organização, performance, developer experience e robustez do framework. O design mantém a filosofia core do FluxStack (simplicidade, type-safety, hot reload independente) enquanto resolve inconsistências estruturais e adiciona funcionalidades essenciais para produção.

## Architecture

### Nova Estrutura de Pastas Proposta

```
FluxStack/
├── 📦 package.json                    # Monorepo unificado
├── 🔧 fluxstack.config.ts            # Configuração principal (movido do config/)
├── 🔧 vite.config.ts                 # Vite config
├── 🔧 tsconfig.json                  # TypeScript config
├── 🔧 eslint.config.js               # ESLint config
├── 
├── core/                             # 🔧 Framework Core (otimizado)
│   ├── framework/                    # Framework principal
│   │   ├── server.ts                 # FluxStackFramework class
│   │   ├── client.ts                 # Client utilities
│   │   └── types.ts                  # Core types
│   ├── plugins/                      # Sistema de plugins
│   │   ├── built-in/                 # Plugins integrados
│   │   │   ├── logger/               # Logger plugin aprimorado
│   │   │   ├── swagger/              # Swagger plugin
│   │   │   ├── vite/                 # Vite integration
│   │   │   ├── static/               # Static files
│   │   │   ├── cors/                 # CORS handling
│   │   │   └── monitoring/           # Performance monitoring
│   │   ├── registry.ts               # Plugin registry
│   │   └── types.ts                  # Plugin types
│   ├── build/                        # Build system otimizado
│   │   ├── builder.ts                # Main builder class
│   │   ├── bundler.ts                # Bundling logic
│   │   ├── optimizer.ts              # Build optimizations
│   │   └── targets/                  # Build targets (bun, node, docker)
│   ├── cli/                          # CLI aprimorado
│   │   ├── index.ts                  # Main CLI
│   │   ├── commands/                 # CLI commands
│   │   │   ├── dev.ts                # Development command
│   │   │   ├── build.ts              # Build command
│   │   │   ├── create.ts             # Project creation
│   │   │   ├── generate.ts           # Code generators
│   │   │   └── deploy.ts             # Deploy helpers
│   │   └── utils/                    # CLI utilities
│   ├── config/                       # Configuration system
│   │   ├── loader.ts                 # Config loader
│   │   ├── validator.ts              # Config validation
│   │   ├── env.ts                    # Environment handling
│   │   └── schema.ts                 # Configuration schema
│   ├── utils/                        # Core utilities
│   │   ├── logger/                   # Logging system
│   │   │   ├── index.ts              # Main logger
│   │   │   ├── formatters.ts         # Log formatters
│   │   │   └── transports.ts         # Log transports
│   │   ├── errors/                   # Error handling
│   │   │   ├── index.ts              # Error classes
│   │   │   ├── handlers.ts           # Error handlers
│   │   │   └── codes.ts              # Error codes
│   │   ├── monitoring/               # Performance monitoring
│   │   │   ├── metrics.ts            # Metrics collection
│   │   │   ├── profiler.ts           # Performance profiling
│   │   │   └── exporters.ts          # Metrics exporters
│   │   └── helpers.ts                # General utilities
│   └── types/                        # Core types
│       ├── index.ts                  # Main types export
│       ├── config.ts                 # Configuration types
│       ├── plugin.ts                 # Plugin types
│       └── api.ts                    # API types
│
├── app/                              # 👨‍💻 User Application
│   ├── server/                       # Backend
│   │   ├── controllers/              # Business logic
│   │   ├── routes/                   # API routes
│   │   ├── middleware/               # Custom middleware
│   │   ├── services/                 # Business services
│   │   ├── models/                   # Data models
│   │   ├── types/                    # Server-specific types
│   │   ├── index.ts                  # Main server entry
│   │   └── standalone.ts             # Standalone server
│   ├── client/                       # Frontend
│   │   ├── src/
│   │   │   ├── components/           # React components
│   │   │   ├── pages/                # Page components
│   │   │   ├── hooks/                # Custom hooks
│   │   │   ├── store/                # State management
│   │   │   │   ├── index.ts          # Store setup
│   │   │   │   ├── slices/           # State slices
│   │   │   │   └── middleware.ts     # Store middleware
│   │   │   ├── lib/                  # Client libraries
│   │   │   │   ├── api.ts            # Eden Treaty client
│   │   │   │   ├── errors.ts         # Error handling
│   │   │   │   └── utils.ts          # Client utilities
│   │   │   ├── types/                # Client-specific types
│   │   │   ├── assets/               # Static assets
│   │   │   ├── styles/               # Global styles
│   │   │   ├── App.tsx               # Main app component
│   │   │   └── main.tsx              # Entry point
│   │   ├── public/                   # Public assets
│   │   ├── index.html                # HTML template
│   │   └── standalone.ts             # Standalone client
│   └── shared/                       # Shared code
│       ├── types/                    # Shared types
│       │   ├── index.ts              # Main types
│       │   ├── api.ts                # API types
│       │   ├── entities.ts           # Entity types
│       │   └── common.ts             # Common types
│       ├── utils/                    # Shared utilities
│       ├── constants/                # Shared constants
│       └── schemas/                  # Validation schemas
│
├── tests/                            # 🧪 Testing
│   ├── unit/                         # Unit tests
│   ├── integration/                  # Integration tests
│   ├── e2e/                          # End-to-end tests
│   ├── fixtures/                     # Test fixtures
│   ├── mocks/                        # Test mocks
│   ├── utils/                        # Test utilities
│   └── setup.ts                      # Test setup
│
├── docs/                             # 📚 Documentation
│   ├── api/                          # API documentation
│   ├── guides/                       # User guides
│   ├── examples/                     # Code examples
│   └── README.md                     # Documentation index
│
├── scripts/                          # 🔧 Build/Deploy scripts
│   ├── build.ts                      # Build scripts
│   ├── deploy.ts                     # Deploy scripts
│   └── migrate.ts                    # Migration scripts
│
└── dist/                             # 📦 Build output
    ├── client/                       # Frontend build
    ├── server/                       # Backend build
    └── docs/                         # Documentation build
```

### Principais Mudanças Estruturais

1. **Configuração Principal Movida**: `fluxstack.config.ts` no root para melhor descoberta
2. **Core Reorganizado**: Estrutura mais clara por funcionalidade
3. **Plugin System Expandido**: Plugins built-in organizados e registry centralizado
4. **Build System Modular**: Separação clara entre builder, bundler e optimizer
5. **Utilities Estruturados**: Logger, errors e monitoring como módulos independentes
6. **App Structure Melhorada**: Separação clara entre controllers, services e models
7. **State Management**: Pasta dedicada para gerenciamento de estado no client
8. **Documentation**: Pasta dedicada para documentação estruturada

## Components and Interfaces

### 1. Enhanced Configuration System

```typescript
// core/config/schema.ts
export interface FluxStackConfig {
  // Core settings
  app: {
    name: string
    version: string
    description?: string
  }
  
  // Server configuration
  server: {
    port: number
    host: string
    apiPrefix: string
    cors: CorsConfig
    middleware: MiddlewareConfig[]
  }
  
  // Client configuration
  client: {
    port: number
    proxy: ProxyConfig
    build: ClientBuildConfig
  }
  
  // Build configuration
  build: {
    target: 'bun' | 'node' | 'docker'
    outDir: string
    optimization: OptimizationConfig
    sourceMaps: boolean
  }
  
  // Plugin configuration
  plugins: {
    enabled: string[]
    disabled: string[]
    config: Record<string, any>
  }
  
  // Logging configuration
  logging: {
    level: LogLevel
    format: 'json' | 'pretty'
    transports: LogTransport[]
  }
  
  // Monitoring configuration
  monitoring: {
    enabled: boolean
    metrics: MetricsConfig
    profiling: ProfilingConfig
  }
  
  // Environment-specific overrides
  environments: {
    development?: Partial<FluxStackConfig>
    production?: Partial<FluxStackConfig>
    test?: Partial<FluxStackConfig>
  }
}
```

### 2. Enhanced Plugin System

```typescript
// core/plugins/types.ts
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

export interface PluginContext {
  config: FluxStackConfig
  logger: Logger
  app: Elysia
  utils: PluginUtils
}

// core/plugins/registry.ts
export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map()
  private loadOrder: string[] = []
  
  register(plugin: Plugin): void
  unregister(name: string): void
  get(name: string): Plugin | undefined
  getAll(): Plugin[]
  getLoadOrder(): string[]
  validateDependencies(): void
}
```

### 3. Enhanced Logging System

```typescript
// core/utils/logger/index.ts
export interface Logger {
  debug(message: string, meta?: any): void
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, meta?: any): void
  
  // Contextual logging
  child(context: any): Logger
  
  // Performance logging
  time(label: string): void
  timeEnd(label: string): void
  
  // Request logging
  request(req: Request, res?: Response, duration?: number): void
}

export interface LogTransport {
  name: string
  level: LogLevel
  format: LogFormatter
  output: LogOutput
}

export class FluxStackLogger implements Logger {
  private transports: LogTransport[] = []
  private context: any = {}
  
  constructor(config: LoggingConfig) {
    this.setupTransports(config)
  }
  
  // Implementation methods...
}
```

### 4. Enhanced Error Handling

```typescript
// core/utils/errors/index.ts
export class FluxStackError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly context?: any
  public readonly timestamp: Date
  
  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    context?: any
  ) {
    super(message)
    this.name = 'FluxStackError'
    this.code = code
    this.statusCode = statusCode
    this.context = context
    this.timestamp = new Date()
  }
}

export class ValidationError extends FluxStackError {
  constructor(message: string, context?: any) {
    super(message, 'VALIDATION_ERROR', 400, context)
  }
}

export class NotFoundError extends FluxStackError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

// Error handler middleware
export const errorHandler = (error: Error, context: any) => {
  const logger = context.logger
  
  if (error instanceof FluxStackError) {
    logger.error(error.message, {
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
      stack: error.stack
    })
    
    return {
      error: {
        message: error.message,
        code: error.code,
        ...(error.context && { details: error.context })
      }
    }
  }
  
  // Handle unknown errors
  logger.error('Unhandled error', { error: error.message, stack: error.stack })
  
  return {
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  }
}
```

### 5. Performance Monitoring

```typescript
// core/utils/monitoring/metrics.ts
export interface Metrics {
  // HTTP metrics
  httpRequestsTotal: Counter
  httpRequestDuration: Histogram
  httpRequestSize: Histogram
  httpResponseSize: Histogram
  
  // System metrics
  memoryUsage: Gauge
  cpuUsage: Gauge
  eventLoopLag: Histogram
  
  // Custom metrics
  custom: Map<string, Metric>
}

export class MetricsCollector {
  private metrics: Metrics
  private exporters: MetricsExporter[] = []
  
  constructor(config: MetricsConfig) {
    this.setupMetrics(config)
    this.setupExporters(config)
  }
  
  // Metric collection methods
  recordHttpRequest(method: string, path: string, statusCode: number, duration: number): void
  recordMemoryUsage(): void
  recordCpuUsage(): void
  
  // Custom metrics
  createCounter(name: string, help: string, labels?: string[]): Counter
  createGauge(name: string, help: string, labels?: string[]): Gauge
  createHistogram(name: string, help: string, buckets?: number[]): Histogram
  
  // Export metrics
  export(): Promise<string>
}
```

### 6. Enhanced Build System

```typescript
// core/build/builder.ts
export class FluxStackBuilder {
  private config: FluxStackConfig
  private bundler: Bundler
  private optimizer: Optimizer
  
  constructor(config: FluxStackConfig) {
    this.config = config
    this.bundler = new Bundler(config.build)
    this.optimizer = new Optimizer(config.build.optimization)
  }
  
  async build(target?: BuildTarget): Promise<BuildResult> {
    const startTime = Date.now()
    
    try {
      // Validate configuration
      await this.validateConfig()
      
      // Clean output directory
      await this.clean()
      
      // Build client
      const clientResult = await this.buildClient()
      
      // Build server
      const serverResult = await this.buildServer()
      
      // Optimize build
      await this.optimize()
      
      // Generate build manifest
      const manifest = await this.generateManifest()
      
      const duration = Date.now() - startTime
      
      return {
        success: true,
        duration,
        client: clientResult,
        server: serverResult,
        manifest
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      }
    }
  }
  
  // Individual build methods...
}
```

### 7. State Management Integration

```typescript
// app/client/src/store/index.ts
export interface AppState {
  user: UserState
  ui: UIState
  api: APIState
}

export interface StoreConfig {
  persist?: {
    key: string
    storage: 'localStorage' | 'sessionStorage'
    whitelist?: string[]
  }
  middleware?: Middleware[]
  devtools?: boolean
}

export class FluxStackStore {
  private store: Store<AppState>
  private config: StoreConfig
  
  constructor(config: StoreConfig) {
    this.config = config
    this.store = this.createStore()
  }
  
  private createStore(): Store<AppState> {
    // Store creation logic with middleware, persistence, etc.
  }
  
  // Store methods
  getState(): AppState
  dispatch(action: Action): void
  subscribe(listener: () => void): () => void
}

// React integration
export const useAppStore = () => {
  const store = useContext(StoreContext)
  return store
}

export const useAppSelector = <T>(selector: (state: AppState) => T) => {
  const store = useAppStore()
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState())
  )
}
```

## Data Models

### Configuration Schema

```typescript
// Configuração principal com validação
export const configSchema = {
  type: 'object',
  properties: {
    app: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
        version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+' },
        description: { type: 'string' }
      },
      required: ['name', 'version']
    },
    server: {
      type: 'object',
      properties: {
        port: { type: 'number', minimum: 1, maximum: 65535 },
        host: { type: 'string' },
        apiPrefix: { type: 'string', pattern: '^/' }
      },
      required: ['port', 'host', 'apiPrefix']
    }
    // ... resto do schema
  },
  required: ['app', 'server']
}
```

### Plugin Metadata

```typescript
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
    hooks: string[]
    config?: any
  }
}
```

### Build Manifest

```typescript
export interface BuildManifest {
  version: string
  timestamp: string
  target: BuildTarget
  client: {
    entryPoints: string[]
    assets: AssetManifest[]
    chunks: ChunkManifest[]
  }
  server: {
    entryPoint: string
    dependencies: string[]
  }
  optimization: {
    minified: boolean
    treeshaken: boolean
    compressed: boolean
  }
  metrics: {
    buildTime: number
    bundleSize: number
    chunkCount: number
  }
}
```

## Error Handling

### Centralized Error Management

1. **Error Classification**: Diferentes tipos de erro com códigos específicos
2. **Context Preservation**: Manter contexto da requisição em todos os erros
3. **User-Friendly Messages**: Mensagens apropriadas para diferentes audiências
4. **Logging Integration**: Todos os erros são logados com contexto completo
5. **Recovery Strategies**: Tentativas de recuperação automática quando possível

### Error Flow

```
Request → Validation → Business Logic → Response
    ↓         ↓              ↓           ↓
Error Handler ← Error Handler ← Error Handler ← Error Handler
    ↓
Logger → Metrics → User Response
```

## Testing Strategy

### Test Organization

1. **Unit Tests**: Testam componentes individuais isoladamente
2. **Integration Tests**: Testam interação entre componentes
3. **E2E Tests**: Testam fluxos completos da aplicação
4. **Performance Tests**: Testam performance e carga
5. **Plugin Tests**: Testam plugins individualmente e em conjunto

### Test Infrastructure

```typescript
// Enhanced test utilities
export class FluxStackTestUtils {
  static createTestApp(config?: Partial<FluxStackConfig>): FluxStackFramework
  static createTestClient(app: FluxStackFramework): TestClient
  static mockPlugin(name: string, hooks?: Partial<Plugin>): Plugin
  static createTestStore(initialState?: Partial<AppState>): Store
  static waitForCondition(condition: () => boolean, timeout?: number): Promise<void>
}

// Test fixtures
export const testFixtures = {
  users: [/* test users */],
  config: {/* test config */},
  plugins: [/* test plugins */]
}
```

### Performance Testing

```typescript
// Performance benchmarks
export class PerformanceBenchmarks {
  static async benchmarkStartupTime(): Promise<number>
  static async benchmarkRequestThroughput(): Promise<number>
  static async benchmarkMemoryUsage(): Promise<MemoryMetrics>
  static async benchmarkBuildTime(): Promise<number>
}
```

## Implementation Notes

### Migration Strategy

1. **Backward Compatibility**: Manter compatibilidade com projetos existentes
2. **Gradual Migration**: Permitir migração gradual de funcionalidades
3. **Migration Scripts**: Scripts automáticos para migrar estrutura de pastas
4. **Documentation**: Guias detalhados de migração

### Performance Considerations

1. **Lazy Loading**: Carregar plugins e módulos apenas quando necessário
2. **Caching**: Cache inteligente para builds e configurações
3. **Bundle Optimization**: Tree-shaking e code splitting automático
4. **Memory Management**: Monitoramento e otimização de uso de memória

### Security Considerations

1. **Input Validation**: Validação rigorosa de todas as entradas
2. **Error Information**: Não vazar informações sensíveis em erros
3. **Plugin Security**: Sandboxing e validação de plugins
4. **Dependency Security**: Auditoria automática de dependências

Este design mantém a simplicidade e poder do FluxStack atual enquanto resolve as inconsistências identificadas e adiciona funcionalidades essenciais para um framework de produção robusto.