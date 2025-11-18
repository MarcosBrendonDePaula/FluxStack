# 🎣 Hooks Demo Plugin

> Plugin de demonstração completa de todos os hooks disponíveis no FluxStack

## 📖 Sobre

Este plugin demonstra o uso de **todos os 23 hooks** disponíveis no sistema de plugins do FluxStack, incluindo os novos hooks adicionados para dar maior autonomia aos desenvolvedores.

## ✨ Features Demonstradas

### 🔄 Lifecycle Hooks
- ✅ `onConfigLoad` - Validação de configurações
- ✅ `setup` - Inicialização do plugin
- ✅ `onBeforeServerStart` - Preparação pré-servidor
- ✅ `onServerStart` - Servidor iniciando
- ✅ `onAfterServerStart` - Servidor pronto
- ✅ `onBeforeServerStop` - Preparando shutdown
- ✅ `onServerStop` - Cleanup de recursos

### 🌐 Request/Response Pipeline
- ✅ `onRequest` - Logging e rate limiting
- ✅ `onBeforeRoute` - **Cache interceptor** (pode bloquear request)
- ✅ `onAfterRoute` - Log de rota matched
- ✅ `onRequestValidation` - Validação customizada
- ✅ `onBeforeResponse` - Adicionar headers
- ✅ `onResponseTransform` - **Transformar JSON responses**
- ✅ `onResponse` - **Cachear responses** e métricas

### ❌ Error Handling
- ✅ `onError` - Error tracking e logging

### 🏗️ Build Pipeline
- ✅ `onBeforeBuild` - Validação pré-build
- ✅ `onBuild` - Compilação customizada
- ✅ `onBuildAsset` - Otimização de assets
- ✅ `onBuildComplete` - Deploy automático
- ✅ `onBuildError` - Error reporting

### 🔌 Plugin System
- ✅ `onPluginRegister` - Detectar novos plugins
- ✅ `onPluginUnregister` - Cleanup de plugins
- ✅ `onPluginError` - Tracking de erros de plugins

## 🎯 Funcionalidades Implementadas

### 1. **Sistema de Cache Simples**
```typescript
// GET requests são cacheadas por 30 segundos
// onBeforeRoute verifica cache antes de processar
// onResponse cacheia responses de sucesso
```

### 2. **Métricas em Tempo Real**
```typescript
// Coleta métricas de:
// - Número de requests
// - Erros
// - Duração média
// - Cache hits/misses

// Reporta a cada 60 segundos
```

### 3. **Response Transformation**
```typescript
// Adiciona wrapper automático em JSON responses:
{
  "success": true,
  "data": { /* original data */ },
  "meta": {
    "timestamp": "2025-01-18T...",
    "duration": 123,
    "plugin": "hooks-demo"
  }
}
```

### 4. **Request Logging Detalhado**
```typescript
// Logs para cada fase:
// 🌐 onRequest - Recebida
// 🔍 onBeforeRoute - Verificando cache
// 📍 onAfterRoute - Rota matched
// ✔️ onRequestValidation - Validando
// 📤 onBeforeResponse - Enviando
// ✨ onResponse - Completo
```

### 5. **Slow Request Detection**
```typescript
// Alerta quando request demora > 500ms
// 🐌 SLOW REQUEST: /api/users (1234ms)
```

## 🚀 Como Usar

### Instalação

1. O plugin já está na pasta `plugins/example-hooks-demo/`

2. Habilitar no `.env`:
```bash
FLUXSTACK_PLUGINS_ENABLED=logger,swagger,vite,cors,static-files,crypto-auth,hooks-demo
```

3. Reiniciar servidor:
```bash
bun run dev
```

### Ver Logs

O plugin loga todas as fases de execução:

```bash
# Startup
📋 [hooks-demo] onConfigLoad - Configurações carregadas
🔧 [hooks-demo] setup - Plugin inicializando
⏳ [hooks-demo] onBeforeServerStart - Preparando recursos
🚀 [hooks-demo] onServerStart - Servidor iniciando
✅ [hooks-demo] onAfterServerStart - Servidor pronto

# Request
🌐 [hooks-demo] onRequest - GET /api/health
🔍 [hooks-demo] onBeforeRoute - Verificando cache
   ❌ Cache MISS para /api/health
📍 [hooks-demo] onAfterRoute - Rota: /api/health
📤 [hooks-demo] onBeforeResponse - Status: 200
🔄 [hooks-demo] onResponseTransform
   ✅ Response transformada
✨ [hooks-demo] onResponse - Completo em 45ms
   💾 Response cacheada para /api/health

# Métricas (a cada 60s)
📊 [hooks-demo] Métricas (último minuto):
   Requests: 15
   Erros: 0
   Duração média: 34.21ms
   Cache: 8 hits, 7 misses
```

## 🧪 Testar Funcionalidades

### 1. Testar Cache
```bash
# Primeira request (cache miss)
curl http://localhost:3000/api/health

# Segunda request em <30s (cache hit)
curl http://localhost:3000/api/health
# Deve retornar: X-Cache: HIT
```

### 2. Testar Response Transform
```bash
curl http://localhost:3000/api/health | jq

# Output:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "..."
  },
  "meta": {
    "timestamp": "2025-01-18T...",
    "duration": 12,
    "plugin": "hooks-demo"
  }
}
```

### 3. Testar Validação
```bash
# Criar rota de teste que valida email
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid"}'

# Log mostrará erro de validação:
# ⚠️ Erros de validação: [{ field: 'email', message: 'Email deve conter @', code: 'INVALID_EMAIL' }]
```

### 4. Ver Métricas
```bash
# Fazer várias requests
for i in {1..20}; do
  curl http://localhost:3000/api/health > /dev/null 2>&1
done

# Aguardar 60s para ver métricas no log do servidor
```

## 📚 Aprendizado

Este plugin é uma **referência completa** para criar plugins FluxStack. Você pode:

1. **Copiar hooks específicos** que você precisa
2. **Modificar a lógica** para seu caso de uso
3. **Combinar múltiplos hooks** para funcionalidades complexas
4. **Ver a ordem de execução** na prática

## 🔧 Customizar

### Desabilitar Transformação
```typescript
// Remover ou comentar onResponseTransform
// onResponseTransform: async (context: TransformContext) => { ... }
```

### Ajustar Tempo de Cache
```typescript
onResponse: async (context: ResponseContext) => {
  cache.set(context.path, {
    data: body,
    expires: Date.now() + 60000 // 60 segundos
  })
}
```

### Adicionar Rate Limiting
```typescript
const rateLimits = new Map<string, number>()

onRequest: async (context: RequestContext) => {
  const ip = context.headers['x-forwarded-for'] || 'unknown'
  const count = rateLimits.get(ip) || 0

  if (count > 100) {
    context.handled = true
    context.response = new Response('Rate limit exceeded', { status: 429 })
    return
  }

  rateLimits.set(ip, count + 1)
}
```

## 🎯 Próximos Passos

1. **Ler a documentação completa**: `ai-context/development/plugin-hooks-guide.md`
2. **Criar seu próprio plugin** usando este como base
3. **Explorar hooks específicos** que você precisa
4. **Compartilhar seu plugin** com a comunidade

## 📝 Notas

- Este plugin é **apenas para demonstração** em desenvolvimento
- **Não use em produção** sem adaptar para seu caso de uso
- O cache é **em memória** e será perdido ao reiniciar
- As métricas são **básicas** - use soluções profissionais para produção

## 🔗 Links

- [Plugin Hooks Guide](../../ai-context/development/plugin-hooks-guide.md)
- [Plugin Development Patterns](../../ai-context/development/patterns.md)
- [FluxStack Documentation](../../README.md)

---

**Criado**: Janeiro 2025 - FluxStack v1.9.1
**Status**: ✅ Demonstração completa de 23 hooks
