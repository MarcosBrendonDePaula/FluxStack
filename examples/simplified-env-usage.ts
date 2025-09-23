/**
 * Exemplos da API simplificada de Environment Variables
 * Mais elegante, intuitiva e com menos código
 */

import { env, createNamespace, validate, helpers } from '../core/utils/env-runtime-v2'

// ========================================
// 1. CASTING AUTOMÁTICO INTELIGENTE
// ========================================

// ✅ NOVO - API super simples com casting automático
const config = {
  port: env.get('PORT', 3000),              // -> number (baseado no default)
  debug: env.get('DEBUG', false),           // -> boolean (baseado no default)
  origins: env.get('CORS_ORIGINS', ['*']),  // -> string[] (baseado no default)
  host: env.get('HOST', 'localhost'),       // -> string (baseado no default)
  dbUrl: env.get('DATABASE_URL'),           // -> string | undefined
  retries: env.get('MAX_RETRIES', 3),       // -> number
  features: env.get('FEATURES', ['api'])    // -> string[]
}

// ❌ ANTES - API verbosa com métodos específicos
const oldConfig = {
  port: env.num('PORT', 3000),
  debug: env.bool('DEBUG', false),
  origins: env.array('CORS_ORIGINS', ['*']),
  host: env.get('HOST', 'localhost'),
  dbUrl: env.get('DATABASE_URL'),
  retries: env.num('MAX_RETRIES', 3),
  features: env.array('FEATURES', ['api'])
}

// ========================================
// 2. ACESSO DIRETO COMO PROPRIEDADES
// ========================================

console.log(`🚀 Starting on ${env.HOST}:${env.PORT}`)           // Direto!
console.log(`📊 Environment: ${env.NODE_ENV}`)                  // Direto!  
console.log(`🐛 Debug mode: ${env.DEBUG}`)                      // Direto!
console.log(`📋 Swagger: ${env.ENABLE_SWAGGER}`)                // Direto!
console.log(`💾 Database: ${env.DATABASE_URL || 'not configured'}`) // Direto!

// Todos com tipos corretos automaticamente!

// ========================================
// 3. CONFIGURAÇÃO DE SERVIDOR SIMPLIFICADA
// ========================================

export function createSimpleServer() {
  return {
    // Casting automático baseado no tipo do default
    server: {
      port: env.get('PORT', 3000),           // number
      host: env.get('HOST', 'localhost'),    // string
      timeout: env.get('TIMEOUT', 30000),    // number
      keepAlive: env.get('KEEP_ALIVE', true) // boolean
    },
    
    // Ou acesso direto
    database: {
      url: env.DATABASE_URL,          // string
      ssl: env.DB_SSL,               // boolean 
      port: env.DB_PORT,             // number
      maxConnections: env.get('DB_MAX_CONNECTIONS', 10) // number
    },
    
    cors: {
      origins: env.CORS_ORIGINS,              // string[]
      credentials: env.get('CORS_CREDENTIALS', false), // boolean
      maxAge: env.get('CORS_MAX_AGE', 86400)  // number
    }
  }
}

// ========================================
// 4. NAMESPACES PARA ORGANIZAÇÃO
// ========================================

// Criar namespaces especializados
const db = createNamespace('DATABASE_')
const redis = createNamespace('REDIS_')
const smtp = createNamespace('SMTP_')

const databaseConfig = {
  url: db.get('URL'),                    // DATABASE_URL
  host: db.get('HOST', 'localhost'),     // DATABASE_HOST  
  port: db.get('PORT', 5432),           // DATABASE_PORT (number)
  ssl: db.get('SSL', false),            // DATABASE_SSL (boolean)
  poolSize: db.get('POOL_SIZE', 10),    // DATABASE_POOL_SIZE (number)
  timeout: db.get('TIMEOUT', 30000)     // DATABASE_TIMEOUT (number)
}

const redisConfig = {
  url: redis.get('URL'),                // REDIS_URL
  host: redis.get('HOST', 'localhost'), // REDIS_HOST
  port: redis.get('PORT', 6379),       // REDIS_PORT (number)
  password: redis.get('PASSWORD')       // REDIS_PASSWORD
}

// ========================================
// 5. CONFIGURAÇÃO CONDICIONAL ELEGANTE  
// ========================================

export function createConditionalConfig() {
  const config: any = {
    app: {
      name: env.FLUXSTACK_APP_NAME,     // 'FluxStack'
      version: env.FLUXSTACK_APP_VERSION // '1.0.0'
    },
    
    server: {
      port: env.PORT,                   // 3000
      host: env.HOST                    // 'localhost'
    }
  }
  
  // Adicionar database se configurado
  if (env.has('DATABASE_URL')) {
    config.database = {
      url: env.DATABASE_URL,
      ssl: env.get('DB_SSL', env.NODE_ENV === 'production') // smart default
    }
  }
  
  // Features opcionais
  if (env.ENABLE_MONITORING) {
    config.monitoring = {
      metrics: env.ENABLE_METRICS,
      interval: env.get('METRICS_INTERVAL', 30000)
    }
  }
  
  return config
}

// ========================================
// 6. VALIDAÇÃO SIMPLIFICADA
// ========================================

export function validateEnvironment() {
  // Vars obrigatórias
  validate.require(['NODE_ENV'])
  
  // Produção precisa de mais vars
  if (helpers.isProduction()) {
    validate.require(['DATABASE_URL', 'JWT_SECRET'])
  }
  
  // Validar valores específicos
  validate.oneOf('NODE_ENV', ['development', 'production', 'test'])
  validate.oneOf('LOG_LEVEL', ['debug', 'info', 'warn', 'error'])
}

// ========================================
// 7. HELPERS ÚTEIS
// ========================================

export function printConfiguration() {
  console.log('🔧 Configuration loaded:')
  console.log(`   Environment: ${env.NODE_ENV}`)
  console.log(`   Server: ${helpers.getServerUrl()}`)
  console.log(`   Client: ${helpers.getClientUrl()}`) 
  console.log(`   Database: ${helpers.getDatabaseUrl() || 'not configured'}`)
  console.log(`   Debug: ${env.DEBUG ? 'enabled' : 'disabled'}`)
  console.log(`   Swagger: ${env.ENABLE_SWAGGER ? 'enabled' : 'disabled'}`)
}

// ========================================
// 8. FLUXSTACK INTEGRATION SIMPLIFICADA
// ========================================

import { FluxStackFramework } from '../core/framework/server'

export function createSimpleFluxStack() {
  validateEnvironment()
  
  const app = new FluxStackFramework({
    app: {
      name: env.FLUXSTACK_APP_NAME,        // Direto!
      version: env.FLUXSTACK_APP_VERSION   // Direto!
    },
    
    server: {
      port: env.PORT,                      // Direto! (number)
      host: env.HOST,                      // Direto! (string)
      apiPrefix: env.API_PREFIX,           // Direto! (string)
      cors: {
        origins: env.CORS_ORIGINS,         // Direto! (string[])
        credentials: env.get('CORS_CREDENTIALS', false) // boolean
      }
    },
    
    client: {
      port: env.VITE_PORT,                 // Direto! (number)
      proxy: {
        target: helpers.getServerUrl()     // Helper!
      }
    }
  })
  
  // Plugins condicionais
  if (env.ENABLE_SWAGGER) {
    console.log('📋 Swagger enabled')
    // app.use(swaggerPlugin)  
  }
  
  if (env.ENABLE_MONITORING) {
    console.log('📊 Monitoring enabled')
    // app.use(monitoringPlugin)
  }
  
  return app
}

// ========================================  
// 9. COMPARAÇÃO ANTES vs DEPOIS
// ========================================

// ❌ ANTES - Verboso
const beforeConfig = {
  port: env.num('PORT', 3000),
  debug: env.bool('DEBUG', false),
  origins: env.array('CORS_ORIGINS', ['*']),
  retries: env.num('MAX_RETRIES', 3),
  timeout: env.num('TIMEOUT', 30000)
}

// ✅ DEPOIS - Limpo e elegante  
const afterConfig = {
  port: env.get('PORT', 3000),        // casting automático
  debug: env.get('DEBUG', false),     // casting automático
  origins: env.get('CORS_ORIGINS', ['*']), // casting automático
  retries: env.get('MAX_RETRIES', 3), // casting automático
  timeout: env.get('TIMEOUT', 30000)  // casting automático
}

// Ou ainda mais simples com propriedades diretas:
const simpleConfig = {
  port: env.PORT,           // Direto da propriedade
  debug: env.DEBUG,         // Direto da propriedade
  origins: env.CORS_ORIGINS // Direto da propriedade
}

export default {
  createSimpleServer,
  createConditionalConfig,
  validateEnvironment,
  printConfiguration,
  createSimpleFluxStack
}