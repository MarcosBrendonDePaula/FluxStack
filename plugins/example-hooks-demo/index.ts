/**
 * Example Hooks Demo Plugin
 * Demonstra o uso dos novos hooks do FluxStack
 */

import type {
  FluxStack,
  PluginContext,
  ConfigLoadContext,
  RequestContext,
  RouteContext,
  ValidationContext,
  ResponseContext,
  TransformContext,
  ErrorContext,
  BuildContext,
  BuildAssetContext,
  BuildErrorContext,
  PluginEventContext
} from '@/core/plugins/types'

type Plugin = FluxStack.Plugin

// Métricas do plugin
const metrics = {
  requests: 0,
  errors: 0,
  totalDuration: 0,
  cacheHits: 0,
  cacheMisses: 0
}

export const hooksDemo: Plugin = {
  name: 'hooks-demo',
  version: '1.0.0',
  description: 'Plugin de demonstração de todos os hooks disponíveis',
  author: 'FluxStack Team',
  priority: 50, // Prioridade média
  category: 'examples',
  tags: ['demo', 'hooks', 'example'],

  // ===========================
  // LIFECYCLE HOOKS
  // ===========================

  onConfigLoad: async (context: ConfigLoadContext) => {
    console.log('📋 [hooks-demo] onConfigLoad - Configurações carregadas')
    console.log(`   Environment: ${context.config.app.env}`)
    console.log(`   Port: ${context.config.server.port}`)

    // Exemplo: Validar configurações
    if (context.config.server.port < 1024) {
      console.warn('⚠️  Porta menor que 1024 pode exigir privilégios de admin')
    }
  },

  setup: async (context: PluginContext) => {
    console.log('🔧 [hooks-demo] setup - Plugin inicializando')
    context.logger.info('Hooks Demo Plugin configurado com sucesso')

    // Exemplo: Inicializar cache
    ;(global as any).demoCache = new Map()
  },

  onBeforeServerStart: async (context: PluginContext) => {
    console.log('⏳ [hooks-demo] onBeforeServerStart - Preparando recursos')

    // Exemplo: Conectar a serviços externos
    // await connectToExternalService()

    context.logger.info('Recursos preparados para inicialização')
  },

  onServerStart: async (context: PluginContext) => {
    console.log('🚀 [hooks-demo] onServerStart - Servidor iniciando')
    console.log(`   Servidor ativo na porta ${context.config.server.port}`)

    // Exemplo: Iniciar workers, cron jobs
    // startBackgroundJobs()
  },

  onAfterServerStart: async (context: PluginContext) => {
    console.log('✅ [hooks-demo] onAfterServerStart - Servidor pronto')

    // Exemplo: Enviar métricas de startup
    const startupInfo = {
      environment: context.config.app.env,
      port: context.config.server.port,
      timestamp: new Date().toISOString()
    }

    console.log('   Startup Info:', startupInfo)

    // Iniciar reporter de métricas
    setInterval(() => {
      if (metrics.requests > 0) {
        console.log('\n📊 [hooks-demo] Métricas (último minuto):')
        console.log(`   Requests: ${metrics.requests}`)
        console.log(`   Erros: ${metrics.errors}`)
        console.log(`   Duração média: ${(metrics.totalDuration / metrics.requests).toFixed(2)}ms`)
        console.log(`   Cache: ${metrics.cacheHits} hits, ${metrics.cacheMisses} misses`)

        // Reset metrics
        metrics.requests = 0
        metrics.errors = 0
        metrics.totalDuration = 0
        metrics.cacheHits = 0
        metrics.cacheMisses = 0
      }
    }, 60000) // A cada 60 segundos
  },

  // ===========================
  // REQUEST/RESPONSE PIPELINE
  // ===========================

  onRequest: async (context: RequestContext) => {
    // Incrementar contador
    metrics.requests++

    // Log da request
    console.log(`\n🌐 [hooks-demo] onRequest - ${context.method} ${context.path}`)

    // Exemplo: Rate limiting
    const clientIp = context.headers['x-forwarded-for'] || context.headers['x-real-ip'] || 'unknown'
    console.log(`   Client IP: ${clientIp}`)

    // Exemplo: Adicionar dados customizados ao contexto
    ;(context as any).customData = {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
  },

  onBeforeRoute: async (context: RequestContext) => {
    console.log(`🔍 [hooks-demo] onBeforeRoute - Verificando cache`)

    // Exemplo: Verificar cache para GET requests
    if (context.method === 'GET') {
      const cache = (global as any).demoCache as Map<string, any>
      const cached = cache.get(context.path)

      if (cached && cached.expires > Date.now()) {
        console.log(`   ✅ Cache HIT para ${context.path}`)
        metrics.cacheHits++

        // Interceptar request
        context.handled = true
        context.response = new Response(cached.data, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'X-Cache-Plugin': 'hooks-demo'
          }
        })
      } else {
        console.log(`   ❌ Cache MISS para ${context.path}`)
        metrics.cacheMisses++
      }
    }
  },

  onAfterRoute: async (context: RouteContext) => {
    console.log(`📍 [hooks-demo] onAfterRoute - Rota: ${context.route || 'unknown'}`)
    if (Object.keys(context.params).length > 0) {
      console.log(`   Params:`, context.params)
    }
  },

  onRequestValidation: async (context: ValidationContext) => {
    console.log(`✔️  [hooks-demo] onRequestValidation - Validando request`)

    // Exemplo: Validação customizada
    if (context.body && typeof context.body === 'object') {
      // Validar email se presente
      if ('email' in context.body && !context.body.email?.includes('@')) {
        context.errors.push({
          field: 'email',
          message: 'Email deve conter @',
          code: 'INVALID_EMAIL'
        })
        context.isValid = false
      }
    }

    if (!context.isValid) {
      console.log(`   ⚠️  Erros de validação:`, context.errors)
    }
  },

  onBeforeResponse: async (context: ResponseContext) => {
    console.log(`📤 [hooks-demo] onBeforeResponse - Status: ${context.statusCode}`)

    // Exemplo: Adicionar headers customizados
    if (context.response) {
      const duration = Date.now() - context.startTime
      context.response.headers.set('X-Response-Time', `${duration}ms`)
      context.response.headers.set('X-Powered-By', 'FluxStack')
      context.response.headers.set('X-Plugin', 'hooks-demo')
    }
  },

  onResponseTransform: async (context: TransformContext) => {
    console.log(`🔄 [hooks-demo] onResponseTransform`)

    // Exemplo: Adicionar wrapper em JSON responses
    const contentType = context.response?.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      try {
        const originalData = await context.response.clone().json()

        // Adicionar metadata
        const transformed = {
          success: context.statusCode >= 200 && context.statusCode < 300,
          data: originalData,
          meta: {
            timestamp: new Date().toISOString(),
            duration: context.duration,
            plugin: 'hooks-demo'
          }
        }

        context.originalResponse = context.response
        context.response = new Response(JSON.stringify(transformed), {
          status: context.statusCode,
          headers: context.response.headers
        })
        context.transformed = true

        console.log(`   ✅ Response transformada`)
      } catch (error) {
        console.log(`   ⚠️  Não foi possível transformar response`)
      }
    }
  },

  onResponse: async (context: ResponseContext) => {
    // Atualizar métricas
    metrics.totalDuration += context.duration

    console.log(`✨ [hooks-demo] onResponse - Completo em ${context.duration}ms`)

    // Exemplo: Cachear responses de sucesso (GET)
    if (context.method === 'GET' && context.statusCode === 200) {
      try {
        const body = await context.response.clone().text()
        const cache = (global as any).demoCache as Map<string, any>

        cache.set(context.path, {
          data: body,
          expires: Date.now() + 30000 // 30 segundos
        })

        console.log(`   💾 Response cacheada para ${context.path}`)
      } catch (error) {
        console.log(`   ⚠️  Erro ao cachear response`)
      }
    }

    // Log de slow requests
    if (context.duration > 500) {
      console.log(`   🐌 SLOW REQUEST: ${context.path} (${context.duration}ms)`)
    }
  },

  // ===========================
  // ERROR HANDLING
  // ===========================

  onError: async (context: ErrorContext) => {
    metrics.errors++

    console.log(`❌ [hooks-demo] onError - ${context.error.message}`)
    console.log(`   Path: ${context.path}`)
    console.log(`   Method: ${context.method}`)

    // Exemplo: Enviar para sistema de tracking
    // await trackError({
    //   error: context.error,
    //   path: context.path,
    //   method: context.method
    // })

    // Não marcar como handled - deixar outros plugins tratarem
  },

  // ===========================
  // BUILD PIPELINE
  // ===========================

  onBeforeBuild: async (context: BuildContext) => {
    console.log(`\n🏗️  [hooks-demo] onBeforeBuild - ${context.mode}`)
    console.log(`   Target: ${context.target}`)
    console.log(`   Output: ${context.outDir}`)
  },

  onBuild: async (context: BuildContext) => {
    console.log(`⚙️  [hooks-demo] onBuild - Compilando...`)
    // Exemplo: Gerar arquivos customizados
  },

  onBuildAsset: async (context: BuildAssetContext) => {
    console.log(`📦 [hooks-demo] onBuildAsset - ${context.assetType}: ${context.assetPath}`)
    console.log(`   Size: ${context.size} bytes`)

    // Exemplo: Otimizar assets
    if (context.assetType === 'image') {
      console.log(`   🖼️  Image asset detected - can optimize`)
    }
  },

  onBuildComplete: async (context: BuildContext) => {
    console.log(`✅ [hooks-demo] onBuildComplete - Build finalizado com sucesso!`)
    console.log(`   Output: ${context.outDir}`)
  },

  onBuildError: async (context: BuildErrorContext) => {
    console.log(`💥 [hooks-demo] onBuildError - Build falhou`)
    console.log(`   Error: ${context.error.message}`)
    if (context.file) {
      console.log(`   File: ${context.file}:${context.line}:${context.column}`)
    }
  },

  // ===========================
  // PLUGIN SYSTEM
  // ===========================

  onPluginRegister: async (context: PluginEventContext) => {
    console.log(`\n🔌 [hooks-demo] onPluginRegister - ${context.pluginName} registrado`)
    if (context.pluginVersion) {
      console.log(`   Version: ${context.pluginVersion}`)
    }
  },

  onPluginUnregister: async (context: PluginEventContext) => {
    console.log(`\n🔌 [hooks-demo] onPluginUnregister - ${context.pluginName} removido`)
  },

  onPluginError: async (context: PluginEventContext & { error: Error }) => {
    console.log(`\n⚠️  [hooks-demo] onPluginError - Plugin: ${context.pluginName}`)
    console.log(`   Error: ${context.error.message}`)
  },

  // ===========================
  // BUILD PIPELINE
  // ===========================

  onBeforeBuild: async (context: BuildContext) => {
    console.log(`\n🏗️  [hooks-demo] onBeforeBuild - ${context.mode}`)
    console.log(`   Target: ${context.target}`)
    console.log(`   Output: ${context.outDir}`)

    // Exemplo: Validar ambiente antes de build
    if (context.mode === 'production') {
      console.log(`   ✅ Production build validated`)
    }
  },

  onBuild: async (context: BuildContext) => {
    console.log(`⚙️  [hooks-demo] onBuild - Compilando...`)
    console.log(`   Mode: ${context.mode}`)

    // Exemplo: Gerar arquivos customizados durante build
    // await generateCustomFiles(context.outDir)
  },

  onBuildAsset: async (context: BuildAssetContext) => {
    console.log(`📦 [hooks-demo] onBuildAsset - ${context.assetType}: ${context.assetPath.split('/').pop()}`)
    console.log(`   Size: ${(context.size / 1024).toFixed(2)} KB`)

    // Exemplo: Processar assets específicos
    if (context.assetType === 'image' && context.size > 100000) {
      console.log(`   ⚠️  Large image detected (>${(100000 / 1024).toFixed(0)}KB)`)
    }

    if (context.assetType === 'js' && context.size > 500000) {
      console.log(`   ⚠️  Large JavaScript bundle (>${(500000 / 1024).toFixed(0)}KB)`)
    }
  },

  onBuildComplete: async (context: BuildContext) => {
    console.log(`\n✅ [hooks-demo] onBuildComplete - Build finalizado com sucesso!`)
    console.log(`   Output: ${context.outDir}`)
    console.log(`   Mode: ${context.mode}`)

    // Exemplo: Deploy automático em produção
    if (context.mode === 'production') {
      console.log(`   📤 Ready for deployment`)
      // await deployToProduction(context.outDir)
    }
  },

  onBuildError: async (context: BuildErrorContext) => {
    console.log(`\n💥 [hooks-demo] onBuildError - Build falhou`)
    console.log(`   Error: ${context.error.message}`)

    if (context.file) {
      console.log(`   File: ${context.file}:${context.line}:${context.column}`)
    }

    // Exemplo: Notificar time sobre falha no build
    // await sendBuildFailureNotification({
    //   error: context.error.message,
    //   file: context.file
    // })
  },

  // ===========================
  // SHUTDOWN
  // ===========================

  onBeforeServerStop: async (context: PluginContext) => {
    console.log('\n⏸️  [hooks-demo] onBeforeServerStop - Preparando shutdown')

    // Exemplo: Avisar sistemas externos
    // await notifyServiceShutdown()
  },

  onServerStop: async (context: PluginContext) => {
    console.log('🛑 [hooks-demo] onServerStop - Liberando recursos')

    // Exemplo: Limpar cache
    const cache = (global as any).demoCache as Map<string, any>
    if (cache) {
      cache.clear()
      console.log('   Cache limpo')
    }

    // Exemplo: Fechar conexões
    // await closeConnections()

    context.logger.info('Hooks Demo Plugin desligado com sucesso')
  }
}

export default hooksDemo
