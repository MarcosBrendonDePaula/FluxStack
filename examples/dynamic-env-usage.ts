/**
 * Exemplos de como usar o sistema de Environment Variables dinâmico
 * Solução para o problema do Bun build fixar valores de process.env
 */

// ========================================
// 1. IMPORT DO SISTEMA DINÂMICO
// ========================================

import { env, runtimeEnv, envValidation } from '../core/utils/env-runtime'
import { createRuntimeConfig, runtimeConfig, configHelpers } from '../core/config/runtime-config'
import { dynamicEnvironmentProcessor } from '../core/config/env-dynamic'

// ========================================
// 2. USO BÁSICO - Substituir process.env
// ========================================

// ❌ ANTES (fixado pelo Bun build):
// const port = process.env.PORT || 3000
// const dbUrl = process.env.DATABASE_URL

// ✅ DEPOIS (dinâmico em runtime):
const port = env.num('PORT', 3000)
const dbUrl = env.get('DATABASE_URL')
const isDebug = env.bool('DEBUG', false)
const corsOrigins = env.array('CORS_ORIGINS', ['*'])

console.log('🚀 Server will start on port:', port) // Valor dinâmico!

// ========================================
// 3. CONFIGURAÇÃO DE SERVIDOR DINÂMICA
// ========================================

export function createDynamicServer() {
  // Configuração que funciona em produção sem rebuild
  const serverConfig = {
    port: env.num('PORT', 3000),
    host: env.get('HOST', 'localhost'),
    
    // Database dinâmico
    database: {
      url: env.get('DATABASE_URL'),
      maxConnections: env.num('DB_MAX_CONNECTIONS', 10),
      ssl: env.bool('DB_SSL', env.get('NODE_ENV') === 'production')
    },
    
    // CORS dinâmico
    cors: {
      origins: env.array('CORS_ORIGINS', ['*']),
      credentials: env.bool('CORS_CREDENTIALS', false)
    },
    
    // JWT dinâmico
    jwt: {
      secret: env.get('JWT_SECRET') || generateSecret(),
      expiresIn: env.get('JWT_EXPIRES_IN', '24h')
    },
    
    // Features dinâmicas
    features: {
      monitoring: env.bool('ENABLE_MONITORING', env.get('NODE_ENV') === 'production'),
      metrics: env.bool('ENABLE_METRICS', false),
      swagger: env.bool('ENABLE_SWAGGER', env.get('NODE_ENV') !== 'production')
    }
  }
  
  return serverConfig
}

// ========================================
// 4. FLUXSTACK COM ENV DINÂMICO
// ========================================

import { FluxStackFramework } from '../core/framework/server'

export function createFluxStackWithDynamicEnv() {
  // Usar configuração runtime dinâmica
  const config = createRuntimeConfig({
    // Overrides específicos
    server: {
      port: env.num('PORT', 3000),
      host: env.get('HOST', 'localhost'),
    }
  })
  
  const app = new FluxStackFramework(config)
  
  // Configurações que mudam em runtime
  if (env.bool('ENABLE_SWAGGER', true)) {
    // Swagger só se habilitado
  }
  
  if (env.bool('ENABLE_MONITORING', false)) {
    // Monitoring só se habilitado
  }
  
  return app
}

// ========================================
// 5. DIFERENTES AMBIENTES
// ========================================

export function createEnvironmentSpecificConfig() {
  const environment = env.get('NODE_ENV', 'development')
  
  switch (environment) {
    case 'development':
      return runtimeConfig.development()
    
    case 'production':
      return runtimeConfig.production()
    
    case 'test':
      return runtimeConfig.test()
    
    default:
      return runtimeConfig.auto()
  }
}

// ========================================
// 6. VALIDAÇÃO DE ENV VARS
// ========================================

export function validateEnvironment() {
  // Validar vars obrigatórias
  envValidation.require(['NODE_ENV'])
  
  // Se production, validar mais vars
  if (env.get('NODE_ENV') === 'production') {
    envValidation.require([
      'DATABASE_URL',
      'JWT_SECRET'
    ])
    
    // Validar formato
    envValidation.validate('DATABASE_URL', 
      (url) => url.includes('://'),
      'DATABASE_URL deve ser uma URL válida'
    )
  }
}

// ========================================
// 7. CONFIGURAÇÃO POR NAMESPACE
// ========================================

import { createEnvNamespace } from '../core/utils/env-runtime'

// Criar loaders especializados
const dbEnv = createEnvNamespace('DATABASE_')
const redisEnv = createEnvNamespace('REDIS_')
const awsEnv = createEnvNamespace('AWS_')

export function createDatabaseConfig() {
  return {
    url: dbEnv.get('URL'),           // DATABASE_URL
    host: dbEnv.get('HOST'),         // DATABASE_HOST
    port: dbEnv.getNumber('PORT'),   // DATABASE_PORT
    ssl: dbEnv.getBoolean('SSL'),    // DATABASE_SSL
  }
}

export function createRedisConfig() {
  return {
    url: redisEnv.get('URL'),        // REDIS_URL
    host: redisEnv.get('HOST'),      // REDIS_HOST
    port: redisEnv.getNumber('PORT'), // REDIS_PORT
  }
}

// ========================================
// 8. CONFIGURAÇÃO HELPERS
// ========================================

export function getAppConfig() {
  return {
    // Server config dinâmico
    server: configHelpers.getServerConfig(),
    
    // Client config dinâmico  
    client: configHelpers.getClientConfig(),
    
    // Database com validação
    database: configHelpers.getDatabaseUrl(),
    
    // CORS com defaults inteligentes
    cors: configHelpers.getCorsOrigins()
  }
}

// ========================================
// 9. EXEMPLO COMPLETO DE USO
// ========================================

export async function startFluxStackServer() {
  console.log('🔧 Validating environment...')
  validateEnvironment()
  
  console.log('⚙️  Loading dynamic configuration...')
  const config = createEnvironmentSpecificConfig()
  
  console.log('🚀 Starting FluxStack with dynamic env...')
  const app = new FluxStackFramework(config)
  
  // Log das configurações atuais (valores dinâmicos!)
  console.log('📊 Configuration loaded:')
  console.log(`   Environment: ${env.get('NODE_ENV')}`)
  console.log(`   Port: ${env.num('PORT', 3000)}`)
  console.log(`   Database: ${env.get('DATABASE_URL') ? '✅ Connected' : '❌ Not configured'}`)
  console.log(`   Monitoring: ${env.bool('ENABLE_MONITORING') ? '✅ Enabled' : '❌ Disabled'}`)
  
  await app.listen()
  
  console.log('✅ Server started with dynamic environment variables!')
}

// ========================================
// 10. MIGRANDO CÓDIGO EXISTENTE
// ========================================

// ❌ Código antigo que será fixado pelo Bun:
export const oldConfig = {
  port: parseInt(process.env.PORT || '3000'),
  dbUrl: process.env.DATABASE_URL,
  debug: process.env.DEBUG === 'true'
}

// ✅ Código novo que funciona dinamicamente:
export const newConfig = {
  port: env.num('PORT', 3000),
  dbUrl: env.get('DATABASE_URL'),
  debug: env.bool('DEBUG', false)
}

// ========================================
// 11. TESTES COM ENV DINÂMICO
// ========================================

export function createTestConfig() {
  // Configuração para testes que não interfere com env vars reais
  return runtimeConfig.test()
}

// Helper para simular env vars em testes
export function withTestEnv(envVars: Record<string, string>, fn: () => void) {
  const original = { ...runtimeEnv.all() }
  
  // Simular env vars
  Object.assign(process.env, envVars)
  
  try {
    fn()
  } finally {
    // Restaurar env original
    Object.keys(envVars).forEach(key => {
      if (original[key] !== undefined) {
        process.env[key] = original[key]
      } else {
        delete process.env[key]
      }
    })
  }
}

// Função helper para gerar secret se não existir
function generateSecret(): string {
  console.warn('⚠️  JWT_SECRET not found, generating random secret for development')
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// ========================================
// 12. EXPORT DEFAULT
// ========================================

export default {
  createDynamicServer,
  createFluxStackWithDynamicEnv,
  validateEnvironment,
  startFluxStackServer,
  getAppConfig
}