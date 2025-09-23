/**
 * Estratégia Híbrida: Env Fixado + Env Dinâmico
 * Use o melhor de cada abordagem conforme necessário
 */

import { env } from '@/core/utils/env-runtime'

// ========================================
// CONFIGURAÇÕES FIXADAS (Build-time)
// ========================================
// Use para valores que nunca mudam ou precisam de máxima performance

// App metadata - fixado é OK
const APP_NAME = process.env.FLUXSTACK_APP_NAME || 'FluxStack'
const APP_VERSION = process.env.FLUXSTACK_APP_VERSION || '1.0.0'

// Feature flags - fixado é OK  
const ENABLE_SWAGGER = process.env.ENABLE_SWAGGER !== 'false'
const ENABLE_CORS = process.env.ENABLE_CORS !== 'false'

// Build configuration - fixado é ideal
const BUILD_TARGET = process.env.BUILD_TARGET || 'bun'
const CLIENT_OUTDIR = process.env.CLIENT_OUTDIR || 'dist/client'

// ========================================  
// CONFIGURAÇÕES DINÂMICAS (Runtime)
// ========================================
// Use para valores que precisam mudar em diferentes deploys

// Server config - deve ser dinâmico
const getServerConfig = () => ({
  port: env.num('PORT', 3000),           // 🔄 Dinâmico
  host: env.get('HOST', 'localhost'),    // 🔄 Dinâmico
  apiPrefix: env.get('API_PREFIX', '/api')
})

// Database - deve ser dinâmico
const getDatabaseConfig = () => ({
  url: env.get('DATABASE_URL'),          // 🔄 Dinâmico
  maxConnections: env.num('DB_MAX_CONNECTIONS', 10),
  ssl: env.bool('DB_SSL', env.get('NODE_ENV') === 'production')
})

// Secrets - deve ser dinâmico
const getSecrets = () => ({
  jwtSecret: env.get('JWT_SECRET'),      // 🔄 Dinâmico
  apiKey: env.get('API_KEY'),
  encryptionKey: env.get('ENCRYPTION_KEY')
})

// Environment specific - dinâmico
const getEnvironmentConfig = () => ({
  nodeEnv: env.get('NODE_ENV', 'development'),  // 🔄 Dinâmico
  logLevel: env.get('LOG_LEVEL', 'info'),
  debug: env.bool('DEBUG', false)
})

// ========================================
// CONFIGURAÇÃO HÍBRIDA
// ========================================

export const hybridConfig = {
  // Fixado no build (performance máxima)
  app: {
    name: APP_NAME,                    // ⚡ Fixado
    version: APP_VERSION,              // ⚡ Fixado
    enableSwagger: ENABLE_SWAGGER,     // ⚡ Fixado
    enableCors: ENABLE_CORS           // ⚡ Fixado
  },

  build: {
    target: BUILD_TARGET,              // ⚡ Fixado
    clientOutDir: CLIENT_OUTDIR        // ⚡ Fixado
  },

  // Dinâmico no runtime (flexibilidade máxima)
  runtime: {
    server: getServerConfig(),         // 🔄 Dinâmico
    database: getDatabaseConfig(),     // 🔄 Dinâmico
    secrets: getSecrets(),             // 🔄 Dinâmico
    environment: getEnvironmentConfig() // 🔄 Dinâmico
  }
}

// ========================================
// EXEMPLO DE USO PRÁTICO
// ========================================

export function createHybridServer() {
  console.log(`🚀 Starting ${hybridConfig.app.name} v${hybridConfig.app.version}`)
  
  const { server, database, environment } = hybridConfig.runtime
  
  console.log(`📊 Environment: ${environment.nodeEnv}`)
  console.log(`🌐 Server: ${server.host}:${server.port}`)
  console.log(`💾 Database: ${database.url ? '✅ Connected' : '❌ Not configured'}`)
  
  // Configuração do FluxStack
  const config = {
    // Valores fixados (build-time) - performance máxima
    app: hybridConfig.app,
    build: hybridConfig.build,
    
    // Valores dinâmicos (runtime) - flexibilidade máxima
    server: {
      port: server.port,        // 🔄 Pode mudar sem rebuild
      host: server.host,        // 🔄 Pode mudar sem rebuild
      apiPrefix: server.apiPrefix,
      cors: {
        origins: env.array('CORS_ORIGINS', ['*']),
        enabled: hybridConfig.app.enableCors  // ⚡ Fixado no build
      }
    },
    
    logging: {
      level: environment.logLevel,  // 🔄 Pode mudar sem rebuild
      debug: environment.debug
    }
  }
  
  return config
}

// ========================================
// OTIMIZAÇÃO POR AMBIENTE
// ========================================

export function createOptimizedConfig() {
  const nodeEnv = env.get('NODE_ENV', 'development')
  
  switch (nodeEnv) {
    case 'development':
      return {
        // Development: tudo dinâmico para flexibilidade
        port: env.num('PORT', 3000),           // 🔄
        debug: env.bool('DEBUG', true),        // 🔄
        logLevel: env.get('LOG_LEVEL', 'debug'), // 🔄
        hotReload: env.bool('HOT_RELOAD', true)  // 🔄
      }
      
    case 'production':
      return {
        // Production: mix de fixado e dinâmico
        appName: APP_NAME,                     // ⚡ Fixado (performance)
        version: APP_VERSION,                  // ⚡ Fixado (performance)
        port: env.num('PORT', 3000),           // 🔄 Dinâmico (deploy)
        dbUrl: env.get('DATABASE_URL'),        // 🔄 Dinâmico (deploy)
        logLevel: env.get('LOG_LEVEL', 'warn') // 🔄 Dinâmico (ops)
      }
      
    default:
      return createHybridServer()
  }
}

// ========================================
// PERFORMANCE COMPARISON
// ========================================

export const performanceComparison = {
  // ⚡ ULTRA RÁPIDO - Fixado no build
  fixedConfig: {
    port: 3000,                    // Literal number
    dbUrl: "postgres://...",       // Literal string  
    debug: false                   // Literal boolean
  },
  
  // 🔄 LIGEIRAMENTE MAIS LENTO - Dinâmico
  dynamicConfig: {
    port: env.num('PORT', 3000),           // Function call
    dbUrl: env.get('DATABASE_URL'),        // Function call
    debug: env.bool('DEBUG', false)        // Function call
  }
}

// ========================================
// MIGRAÇÃO GRADUAL
// ========================================

export const migrationStrategy = {
  // Passo 1: Identifique configurações críticas
  critical: {
    // Use dinâmico para configs que DEVEM mudar
    port: env.num('PORT', 3000),
    dbUrl: env.get('DATABASE_URL'),
    secrets: env.get('JWT_SECRET')
  },
  
  // Passo 2: Mantenha fixado o que não precisa mudar
  static: {
    appName: process.env.APP_NAME || 'MyApp',
    version: process.env.APP_VERSION || '1.0.0',
    features: process.env.FEATURES?.split(',') || []
  },
  
  // Passo 3: Migre gradualmente conforme necessário
  gradually: {
    // Comece com fixado...
    logLevel: process.env.LOG_LEVEL || 'info',
    
    // ...depois mude para dinâmico quando precisar
    // logLevel: env.get('LOG_LEVEL', 'info')
  }
}

export default {
  hybridConfig,
  createHybridServer,
  createOptimizedConfig,
  performanceComparison,
  migrationStrategy
}