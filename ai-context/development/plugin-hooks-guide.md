# 🎣 Plugin Hooks Guide - FluxStack

> **Guia completo dos hooks disponíveis no sistema de plugins do FluxStack**

## 📖 Índice

- [Lifecycle Hooks](#lifecycle-hooks)
- [Request/Response Pipeline Hooks](#requestresponse-pipeline-hooks)
- [Error Handling Hooks](#error-handling-hooks)
- [Build Pipeline Hooks](#build-pipeline-hooks)
- [Plugin System Hooks](#plugin-system-hooks)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## 🔄 Lifecycle Hooks

Hooks relacionados ao ciclo de vida do servidor e plugins.

### `setup`

**Quando**: Durante o carregamento inicial do plugin
**Contexto**: `PluginContext`
**Uso**: Inicialização de recursos, configurações, estado global

```typescript
import type { PluginContext } from '@/core/plugins/types'

export const myPlugin = {
  name: 'my-plugin',
  setup: async (context: PluginContext) => {
    // Inicializar recursos
    context.logger.info('Plugin inicializado')

    // Acessar configurações
    const port = context.config.server.port

    // Criar timers, cache, etc
  }
}
```

### `onConfigLoad`

**Quando**: Após carregar configurações, antes do setup
**Contexto**: `ConfigLoadContext`
**Uso**: Modificar ou validar configurações antes do uso

```typescript
import type { ConfigLoadContext } from '@/core/plugins/types'

export const myPlugin = {
  name: 'config-validator',
  onConfigLoad: async (context: ConfigLoadContext) => {
    // Validar configurações
    if (!context.config.server.port) {
      throw new Error('PORT é obrigatório')
    }

    // Acessar variáveis de ambiente
    const apiKey = context.envVars['API_KEY']

    // Modificar config (cuidado!)
    // context.config.server.cors.origins.push('https://example.com')
  }
}
```

### `onBeforeServerStart`

**Quando**: Antes do servidor HTTP começar a escutar
**Contexto**: `PluginContext`
**Uso**: Setup de recursos que precisam estar prontos antes de aceitar requests

```typescript
export const myPlugin = {
  name: 'database-connector',
  onBeforeServerStart: async (context: PluginContext) => {
    // Conectar ao banco de dados
    await connectToDatabase()

    // Validar conexões
    await checkHealthChecks()

    context.logger.info('Database conectado e pronto')
  }
}
```

### `onServerStart`

**Quando**: Quando o servidor HTTP inicia (porta aberta)
**Contexto**: `PluginContext`
**Uso**: Iniciar workers, cron jobs, WebSockets

```typescript
export const myPlugin = {
  name: 'scheduler',
  onServerStart: async (context: PluginContext) => {
    // Iniciar cron jobs
    startCronJobs()

    // Conectar WebSockets
    initializeWebSocketServer()

    context.logger.info('Scheduler ativo na porta', context.config.server.port)
  }
}
```

### `onAfterServerStart`

**Quando**: Após o servidor estar completamente pronto
**Contexto**: `PluginContext`
**Uso**: Tasks pós-inicialização (logs, métricas, notificações)

```typescript
export const myPlugin = {
  name: 'telemetry',
  onAfterServerStart: async (context: PluginContext) => {
    // Enviar métrica de startup
    await sendStartupMetric({
      environment: context.config.app.env,
      port: context.config.server.port,
      timestamp: Date.now()
    })

    // Registrar em service discovery
    await registerService()
  }
}
```

### `onBeforeServerStop`

**Quando**: Antes do servidor começar a parar (ainda aceita requests)
**Contexto**: `PluginContext`
**Uso**: Avisar sistemas externos, marcar como "draining"

```typescript
export const myPlugin = {
  name: 'load-balancer',
  onBeforeServerStop: async (context: PluginContext) => {
    // Avisar load balancer para parar de enviar requests
    await notifyLoadBalancer('draining')

    // Aguardar requests em andamento
    await waitForActiveRequests()

    context.logger.warn('Servidor entrando em modo shutdown')
  }
}
```

### `onServerStop`

**Quando**: Quando o servidor está parando
**Contexto**: `PluginContext`
**Uso**: Cleanup de recursos, fechar conexões

```typescript
export const myPlugin = {
  name: 'cleanup',
  onServerStop: async (context: PluginContext) => {
    // Fechar conexões
    await closeDatabase()
    await closeRedis()

    // Parar workers
    stopAllWorkers()

    context.logger.info('Recursos liberados com sucesso')
  }
}
```

---

## 🌐 Request/Response Pipeline Hooks

Hooks para interceptar e modificar o fluxo de requisições.

### `onRequest`

**Quando**: Em cada request, antes do routing
**Contexto**: `RequestContext`
**Uso**: Logging, autenticação, rate limiting

```typescript
import type { RequestContext } from '@/core/plugins/types'

export const myPlugin = {
  name: 'request-logger',
  onRequest: async (context: RequestContext) => {
    console.log(`[${context.method}] ${context.path}`)

    // Rate limiting
    const clientIp = context.headers['x-forwarded-for'] || 'unknown'
    await checkRateLimit(clientIp)

    // Adicionar timestamp
    context.startTime = Date.now()
  }
}
```

### `onBeforeRoute`

**Quando**: Antes do routing, pode interceptar a request
**Contexto**: `RequestContext` (com `handled` e `response`)
**Uso**: Proxy, cache, interceptação de rotas

```typescript
export const myPlugin = {
  name: 'cache-interceptor',
  onBeforeRoute: async (context: RequestContext) => {
    // Verificar cache
    const cached = await getFromCache(context.path)

    if (cached) {
      // Marcar como handled e fornecer response
      context.handled = true
      context.response = new Response(cached, {
        headers: { 'X-Cache': 'HIT' }
      })
    }
  }
}
```

### `onAfterRoute`

**Quando**: Após routing, antes de executar o handler
**Contexto**: `RouteContext`
**Uso**: Validação de rotas, logging de rota matched

```typescript
import type { RouteContext } from '@/core/plugins/types'

export const myPlugin = {
  name: 'route-logger',
  onAfterRoute: async (context: RouteContext) => {
    console.log(`Route matched: ${context.route}`)
    console.log(`Params:`, context.params)

    // Validar permissões por rota
    if (context.route?.startsWith('/admin')) {
      await validateAdminAccess(context)
    }
  }
}
```

### `onRequestValidation`

**Quando**: Durante validação de request
**Contexto**: `ValidationContext`
**Uso**: Validação customizada, sanitização

```typescript
import type { ValidationContext } from '@/core/plugins/types'

export const myPlugin = {
  name: 'validator',
  onRequestValidation: async (context: ValidationContext) => {
    // Adicionar erros customizados
    if (!context.body?.email?.includes('@')) {
      context.errors.push({
        field: 'email',
        message: 'Email inválido',
        code: 'INVALID_EMAIL'
      })
      context.isValid = false
    }

    // Sanitizar dados
    if (context.body?.name) {
      context.body.name = sanitize(context.body.name)
    }
  }
}
```

### `onBeforeResponse`

**Quando**: Antes de enviar response ao cliente
**Contexto**: `ResponseContext`
**Uso**: Modificar headers, adicionar CORS, comprimir

```typescript
export const myPlugin = {
  name: 'response-modifier',
  onBeforeResponse: async (context: ResponseContext) => {
    // Adicionar headers de segurança
    context.response.headers.set('X-Frame-Options', 'DENY')
    context.response.headers.set('X-Content-Type-Options', 'nosniff')

    // Adicionar timing header
    const duration = Date.now() - context.startTime
    context.response.headers.set('X-Response-Time', `${duration}ms`)
  }
}
```

### `onResponseTransform`

**Quando**: Para transformar o corpo da response
**Contexto**: `TransformContext`
**Uso**: Comprimir, criptografar, formatar dados

```typescript
import type { TransformContext } from '@/core/plugins/types'

export const myPlugin = {
  name: 'response-transformer',
  onResponseTransform: async (context: TransformContext) => {
    // Salvar original
    context.originalResponse = context.response

    // Transformar JSON responses
    if (context.response.headers.get('content-type')?.includes('json')) {
      const data = await context.response.json()

      // Adicionar metadata
      const transformed = {
        data,
        meta: {
          timestamp: Date.now(),
          version: '1.0'
        }
      }

      context.response = new Response(JSON.stringify(transformed))
      context.transformed = true
    }
  }
}
```

### `onResponse`

**Quando**: Após enviar response (para logging)
**Contexto**: `ResponseContext`
**Uso**: Métricas, analytics, logging

```typescript
export const myPlugin = {
  name: 'metrics',
  onResponse: async (context: ResponseContext) => {
    // Enviar métricas
    await sendMetric({
      path: context.path,
      method: context.method,
      status: context.statusCode,
      duration: context.duration
    })

    // Log de slow requests
    if (context.duration > 1000) {
      console.warn(`Slow request: ${context.path} (${context.duration}ms)`)
    }
  }
}
```

---

## ❌ Error Handling Hooks

### `onError`

**Quando**: Quando ocorre um erro durante a request
**Contexto**: `ErrorContext`
**Uso**: Error tracking, logging, recovery

```typescript
import type { ErrorContext } from '@/core/plugins/types'

export const myPlugin = {
  name: 'error-tracker',
  onError: async (context: ErrorContext) => {
    // Enviar para Sentry/Bugsnag
    await trackError({
      error: context.error,
      path: context.path,
      method: context.method,
      user: context.user
    })

    // Marcar como handled para fornecer custom response
    if (context.error.message.includes('Not Found')) {
      context.handled = true
      // Framework vai usar error handler padrão ou plugin pode definir response
    }
  }
}
```

---

## 🏗️ Build Pipeline Hooks

Hooks para o processo de build.

### `onBeforeBuild`

**Quando**: Antes do build começar
**Contexto**: `BuildContext`
**Uso**: Validação, limpeza de arquivos antigos

```typescript
import type { BuildContext } from '@/core/plugins/types'

export const myPlugin = {
  name: 'build-validator',
  onBeforeBuild: async (context: BuildContext) => {
    console.log(`Starting ${context.mode} build to ${context.outDir}`)

    // Validar se pode fazer build
    if (!canBuild()) {
      throw new Error('Build não permitido neste momento')
    }

    // Limpar output dir
    await cleanDirectory(context.outDir)
  }
}
```

### `onBuild`

**Quando**: Durante o processo de build
**Contexto**: `BuildContext`
**Uso**: Compilação customizada, transformações

```typescript
export const myPlugin = {
  name: 'custom-builder',
  onBuild: async (context: BuildContext) => {
    // Compilar assets customizados
    await compileTemplates()
    await optimizeImages()

    // Gerar arquivos
    await generateSitemap(context.outDir)
  }
}
```

### `onBuildAsset`

**Quando**: Para cada asset sendo processado
**Contexto**: `BuildAssetContext`
**Uso**: Minificar, otimizar, transformar assets

```typescript
import type { BuildAssetContext } from '@/core/plugins/types'

export const myPlugin = {
  name: 'asset-optimizer',
  onBuildAsset: async (context: BuildAssetContext) => {
    // Processar por tipo
    if (context.assetType === 'image') {
      context.content = await optimizeImage(context.content)
      console.log(`Optimized ${context.assetPath}: ${context.size} bytes`)
    }

    if (context.assetType === 'js') {
      context.content = await minifyJS(context.content)
    }
  }
}
```

### `onBuildComplete`

**Quando**: Após build completar com sucesso
**Contexto**: `BuildContext`
**Uso**: Deploy, notificações, análise de bundle

```typescript
export const myPlugin = {
  name: 'build-reporter',
  onBuildComplete: async (context: BuildContext) => {
    // Analisar tamanho do bundle
    const stats = await analyzeBundleSize(context.outDir)
    console.log(`Build completo: ${stats.totalSize} bytes`)

    // Notificar time
    await sendSlackNotification(`Build ${context.mode} completed!`)

    // Fazer deploy automático
    if (context.mode === 'production') {
      await deployToProduction(context.outDir)
    }
  }
}
```

### `onBuildError`

**Quando**: Quando build falha
**Contexto**: `BuildErrorContext`
**Uso**: Error reporting, cleanup

```typescript
import type { BuildErrorContext } from '@/core/plugins/types'

export const myPlugin = {
  name: 'build-error-handler',
  onBuildError: async (context: BuildErrorContext) => {
    // Log detalhado
    console.error(`Build failed: ${context.error.message}`)
    if (context.file) {
      console.error(`File: ${context.file}:${context.line}:${context.column}`)
    }

    // Notificar time
    await sendAlert({
      type: 'build_failed',
      error: context.error.message
    })
  }
}
```

---

## 🔌 Plugin System Hooks

Hooks relacionados ao sistema de plugins.

### `onPluginRegister`

**Quando**: Quando um plugin é registrado no sistema
**Contexto**: `PluginEventContext`
**Uso**: Detectar novos plugins, validar compatibilidade

```typescript
import type { PluginEventContext } from '@/core/plugins/types'

export const myPlugin = {
  name: 'plugin-monitor',
  onPluginRegister: async (context: PluginEventContext) => {
    console.log(`Plugin registered: ${context.pluginName} v${context.pluginVersion}`)

    // Verificar compatibilidade
    if (context.data?.plugin?.dependencies?.includes('conflicting-plugin')) {
      console.warn('Conflito de plugin detectado!')
    }

    // Registrar em sistema de métricas
    await trackPluginRegistration(context)
  }
}
```

### `onPluginUnregister`

**Quando**: Quando um plugin é removido do sistema
**Contexto**: `PluginEventContext`
**Uso**: Cleanup de recursos compartilhados

```typescript
export const myPlugin = {
  name: 'plugin-cleanup',
  onPluginUnregister: async (context: PluginEventContext) => {
    console.log(`Plugin unregistered: ${context.pluginName}`)

    // Limpar recursos associados ao plugin
    await cleanupPluginData(context.pluginName)

    // Notificar outros plugins
    await notifyPluginRemoval(context.pluginName)
  }
}
```

### `onPluginError`

**Quando**: Quando um plugin gera um erro
**Contexto**: `PluginEventContext & { error: Error }`
**Uso**: Error tracking de plugins

```typescript
export const myPlugin = {
  name: 'plugin-error-tracker',
  onPluginError: async (context: PluginEventContext & { error: Error }) => {
    // Rastrear erro
    await trackPluginError({
      plugin: context.pluginName,
      error: context.error.message,
      timestamp: context.timestamp
    })

    // Desabilitar plugin problemático (cuidado!)
    if (shouldDisablePlugin(context)) {
      console.error(`Disabling problematic plugin: ${context.pluginName}`)
    }
  }
}
```

---

## ✨ Best Practices

### 1. **Sempre tratar erros**
```typescript
onRequest: async (context: RequestContext) => {
  try {
    await doSomething(context)
  } catch (error) {
    context.logger.error('Hook failed', { error })
    // Não deixe o erro crashar o servidor
  }
}
```

### 2. **Usar logger do contexto**
```typescript
// ✅ Bom
context.logger.info('Processing request')

// ❌ Ruim
console.log('Processing request')
```

### 3. **Respeitar handled flag**
```typescript
onBeforeRoute: async (context: RequestContext) => {
  // Só interceptar se nenhum plugin anterior já handled
  if (context.handled) return

  // Processar...
  context.handled = true
  context.response = new Response('Custom response')
}
```

### 4. **Performance: evitar blocking**
```typescript
// ✅ Bom - operações rápidas síncronas
onRequest: (context) => {
  context.startTime = Date.now()
}

// ⚠️ Cuidado - operações assíncronas devem ser rápidas
onRequest: async (context) => {
  await checkRateLimit(context) // Deve ser rápido (<10ms)
}

// ❌ Ruim - operações lentas bloqueiam o pipeline
onRequest: async (context) => {
  await fetchExternalAPI() // Vai deixar servidor lento!
}
```

### 5. **Usar prioridade para ordem de execução**
```typescript
export const authPlugin = {
  name: 'auth',
  priority: 100, // Alta prioridade (executa primeiro)
  onRequest: async (context) => {
    // Autenticação precisa rodar antes de tudo
  }
}

export const loggingPlugin = {
  name: 'logging',
  priority: -100, // Baixa prioridade (executa por último)
  onResponse: async (context) => {
    // Logging após tudo processar
  }
}
```

---

## 📚 Examples

### Example 1: Authentication Plugin

```typescript
import type { FluxStack, RequestContext, PluginContext } from '@/core/plugins/types'

export const authPlugin: FluxStack.Plugin = {
  name: 'auth',
  version: '1.0.0',
  priority: 100,

  setup: async (context: PluginContext) => {
    context.logger.info('Auth plugin initialized')
  },

  onRequest: async (context: RequestContext) => {
    const token = context.headers['authorization']

    if (!token) {
      context.handled = true
      context.response = new Response('Unauthorized', { status: 401 })
      return
    }

    try {
      const user = await verifyToken(token)
      context.user = user
    } catch (error) {
      context.handled = true
      context.response = new Response('Invalid token', { status: 401 })
    }
  }
}
```

### Example 2: Metrics Plugin

```typescript
import type { FluxStack, ResponseContext, PluginContext } from '@/core/plugins/types'

const metrics = {
  requests: 0,
  errors: 0,
  totalDuration: 0
}

export const metricsPlugin: FluxStack.Plugin = {
  name: 'metrics',
  version: '1.0.0',

  onAfterServerStart: async (context: PluginContext) => {
    // Exportar métricas a cada 60s
    setInterval(() => {
      context.logger.info('Metrics', {
        requests: metrics.requests,
        avgDuration: metrics.totalDuration / metrics.requests,
        errorRate: metrics.errors / metrics.requests
      })
    }, 60000)
  },

  onResponse: async (context: ResponseContext) => {
    metrics.requests++
    metrics.totalDuration += context.duration

    if (context.statusCode >= 400) {
      metrics.errors++
    }
  }
}
```

### Example 3: Cache Plugin

```typescript
import type { FluxStack, RequestContext, ResponseContext } from '@/core/plugins/types'

const cache = new Map<string, { data: string; expires: number }>()

export const cachePlugin: FluxStack.Plugin = {
  name: 'cache',
  version: '1.0.0',

  onBeforeRoute: async (context: RequestContext) => {
    // Só cachear GET requests
    if (context.method !== 'GET') return

    const cached = cache.get(context.path)

    if (cached && cached.expires > Date.now()) {
      context.handled = true
      context.response = new Response(cached.data, {
        headers: { 'X-Cache': 'HIT' }
      })
    }
  },

  onResponse: async (context: ResponseContext) => {
    // Cachear responses de sucesso
    if (context.statusCode === 200 && context.method === 'GET') {
      const body = await context.response.text()

      cache.set(context.path, {
        data: body,
        expires: Date.now() + 60000 // 1 minuto
      })
    }
  }
}
```

---

## 🎯 Resumo de Ordem de Execução

```
1. onConfigLoad          → Carregar e validar configs
2. setup                 → Inicializar plugin
3. onBeforeServerStart   → Setup pré-servidor
4. onServerStart         → Servidor iniciando
5. onAfterServerStart    → Servidor pronto

   ↓ (para cada request)

6. onRequest             → Request recebida
7. onBeforeRoute         → Antes de routing (pode interceptar)
8. onAfterRoute          → Após routing
9. onRequestValidation   → Validação
10. [Handler executa]
11. onBeforeResponse     → Antes de enviar
12. onResponseTransform  → Transformar response
13. onResponse           → Response enviada

   ↓ (se houver erro)

14. onError              → Tratar erro

   ↓ (durante build)

15. onBeforeBuild
16. onBuild
17. onBuildAsset (para cada asset)
18. onBuildComplete ou onBuildError

   ↓ (ao parar servidor)

19. onBeforeServerStop   → Avisar shutdown
20. onServerStop         → Cleanup
```

---

**✅ Sistema de Hooks atualizado em**: Janeiro 2025 - FluxStack v1.9.1
