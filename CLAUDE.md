# 🤖 FluxStack - AI Context Documentation

> **IMPORTANTE**: Esta documentação foi **reorganizada e modernizada** para melhor suporte a LLMs.

## 📖 **Nova Documentação AI**

👉 **Acesse a documentação completa em**: [`ai-context/`](./ai-context/)

### ⚡ **Início Rápido para LLMs**
- **[`ai-context/00-QUICK-START.md`](./ai-context/00-QUICK-START.md)** - Entenda tudo em 2 minutos
- **[`ai-context/README.md`](./ai-context/README.md)** - Navegação completa

### 🎯 **Documentos Principais**
- **[Development Patterns](./ai-context/development/patterns.md)** - Padrões e boas práticas
- **[Eden Treaty Guide](./ai-context/development/eden-treaty-guide.md)** - Guia completo Eden Treaty
- **[CRUD Example](./ai-context/examples/crud-complete.md)** - Exemplo prático completo
- **[Troubleshooting](./ai-context/reference/troubleshooting.md)** - Solução de problemas

### 🔥 **Mudanças Recentes**
- **[Eden Treaty Refactor](./ai-context/recent-changes/eden-treaty-refactor.md)** - Refatoração crítica
- **[Type Inference Fix](./ai-context/recent-changes/type-inference-fix.md)** - Correção de tipos

---

## 🚀 **FluxStack - Overview Atualizado**

**FluxStack** é um framework full-stack TypeScript moderno que combina:

### 🛠️ **Stack Tecnológica (Janeiro 2025)**
- **Runtime**: Bun >= 1.2.0 (3x mais rápido que Node.js)
- **Backend**: Elysia.js 1.4.6 (ultra-performático)
- **Frontend**: React 19.1.0 + Vite 7.1.7
- **Language**: TypeScript 5.8.3 (100% type-safe)
- **Styling**: Tailwind CSS 4.1.13
- **Communication**: Eden Treaty 1.3.2 com inferência automática
- **Docs**: Swagger UI gerado automaticamente
- **Testing**: Vitest 3.2.4 + React Testing Library
- **Deploy**: Docker otimizado

### ✨ **Estado Atual (Validado)**
- **✅ Eden Treaty Nativo**: Type inference automática funcionando perfeitamente
- **✅ Zero Tipos Unknown**: Inferência corrigida após refatoração
- **✅ Monorepo Unificado**: Uma instalação, hot reload independente
- **✅ APIs Funcionando**: Health check e CRUD operacionais
- **✅ Frontend Ativo**: React 19 + Vite rodando na porta 5173
- **✅ Backend Ativo**: Elysia + Bun rodando na porta 3000

## 📁 **Arquitetura Atual Validada**

```
FluxStack/
├── core/                    # 🔒 FRAMEWORK (read-only)
│   ├── server/             # Framework Elysia + plugins
│   ├── config/             # Sistema base de configuração
│   ├── utils/              # Utilitários (env.ts, config-schema.ts)
│   ├── types/              # Types do framework
│   └── build/              # Sistema de build
├── config/                  # ⚙️ CONFIGURAÇÕES DA APLICAÇÃO (12 arquivos)
│   ├── app.config.ts       # Configuração principal da aplicação
│   ├── server.config.ts    # Servidor, porta, host e CORS
│   ├── logger.config.ts    # Sistema de logs (níveis, formatos)
│   ├── database.config.ts  # Banco de dados e conexões
│   ├── system.config.ts    # Informações do sistema (build, versão)
│   ├── client.config.ts    # Vite, proxy e build do frontend
│   ├── runtime.config.ts   # ⚡ Configs recarregáveis em runtime
│   ├── monitoring.config.ts # Métricas, profiling e observabilidade
│   ├── plugins.config.ts   # Gerenciamento de plugins
│   ├── services.config.ts  # Email, JWT, Storage, Redis
│   ├── fluxstack.config.ts # Config espelhada (compatibilidade)
│   └── index.ts            # Exports centralizados
├── app/                     # 👨‍💻 CÓDIGO DA APLICAÇÃO
│   ├── server/             # Backend (Elysia + Bun)
│   │   ├── app.ts          # Export do tipo para Eden Treaty
│   │   ├── index.ts        # Entry point do servidor
│   │   ├── backend-only.ts # Servidor standalone (sem Vite)
│   │   ├── routes/         # Endpoints da API
│   │   └── live/           # Live Components (WebSocket)
│   ├── client/             # Frontend (React + Vite)
│   │   ├── public/         # Arquivos estáticos
│   │   ├── frontend-only.ts # Cliente standalone (sem backend)
│   │   └── src/
│   │       ├── App.tsx     # Interface principal
│   │       ├── main.tsx    # Entry point React
│   │       ├── index.css   # Estilos globais
│   │       ├── assets/     # Imagens e recursos
│   │       └── lib/        # Cliente Eden Treaty e utils
│   └── shared/             # Types compartilhados client/server
│       └── types/          # Interfaces e types comuns
├── plugins/                 # 🔌 PLUGINS EXTERNOS
│   └── crypto-auth/        # Plugin de autenticação criptográfica
├── tests/                   # Testes do framework
└── ai-context/              # 📖 Documentação para LLMs
    ├── 00-QUICK-START.md   # Início rápido
    ├── README.md           # Navegação completa
    ├── development/        # Padrões e guias de desenvolvimento
    ├── examples/           # Exemplos práticos
    ├── project/            # Arquitetura e configuração
    ├── recent-changes/     # Mudanças recentes
    └── reference/          # Referência técnica
```

## 🔄 **Estado Atual da Interface**

### **Frontend Redesignado (App.tsx)**
- **Interface em abas integradas**: Demo interativo, API Docs, Tests
- **Demo CRUD**: Usuários usando Eden Treaty nativo
- **Swagger UI**: Documentação automática integrada
- **Type Safety**: Eden Treaty com inferência automática

### **Backend Robusto (Elysia + Bun)**
- **API RESTful**: Endpoints CRUD completos
- **Response Schemas**: Documentação automática via TypeBox
- **Error Handling**: Tratamento consistente de erros
- **Hot Reload**: Recarregamento automático

## 🎯 **Funcionalidades Implementadas (Validadas)**

### ✅ **1. Type Safety End-to-End**
```typescript
// ✅ Eden Treaty infere automaticamente após refatoração
const { data: user, error } = await api.users.post({
  name: "João",
  email: "joao@example.com"
})

// TypeScript sabe que:
// - user: UserResponse = { success: boolean; user?: User; message?: string }
// - error: undefined (em caso de sucesso)
```

### ✅ **2. Hot Reload Independente**
```bash
bun run dev          # ✅ Backend (3000) + Frontend (5173)
bun run dev          # ✅ Output automaticamente limpo em desenvolvimento
```

### ✅ **3. APIs Funcionais**
- **Health Check**: `GET /api/health` ✅
- **Users CRUD**: `GET|POST|PUT|DELETE /api/users` ✅
- **Swagger Docs**: `GET /swagger` ✅

### ✅ **4. Sistema de Configuração Declarativa (Laravel-inspired)**

FluxStack usa um sistema de configuração declarativa com validação automática e inferência de tipos completa.

#### 📁 **Estrutura de Configuração Completa**
```
config/                          # 12 arquivos de configuração
├── app.config.ts               # App name, version, environment
├── server.config.ts            # Port, host, CORS, API prefix
├── logger.config.ts            # Log levels, formats (console/file)
├── database.config.ts          # Database connections e pools
├── system.config.ts            # Build info, versão, system metadata
├── client.config.ts            # Vite dev server, proxy, build frontend
├── runtime.config.ts           # ⚡ Configs recarregáveis (hot reload)
├── monitoring.config.ts        # Metrics, profiling, observability
├── plugins.config.ts           # Plugin management e discovery
├── services.config.ts          # External services (Email, JWT, Storage, Redis)
├── fluxstack.config.ts         # Mirror config (backward compatibility)
└── index.ts                    # Centralized exports
```

**📌 Arquivos Principais por Categoria:**

**🔧 Core Application:**
- `app.config.ts` - Nome, versão, ambiente da aplicação
- `server.config.ts` - Porta, host, CORS, prefixos de API
- `client.config.ts` - Configurações Vite, proxy reverso, build

**📊 Observabilidade:**
- `logger.config.ts` - Níveis de log, formatos, destinos
- `monitoring.config.ts` - Métricas HTTP/Sistema, profiling, exporters

**🔌 Extensibilidade:**
- `plugins.config.ts` - Plugins habilitados, discovery, configurações
- `services.config.ts` - Serviços externos (Email SMTP, JWT, Storage S3/local, Redis)

**⚡ Runtime & Build:**
- `runtime.config.ts` - Configs que podem ser recarregadas sem restart
- `system.config.ts` - Informações de build, versão, system info
- `database.config.ts` - Conexões de banco de dados

#### 🎯 **Como Usar**

**1. Definir Schema de Configuração:**
```typescript
// config/app.config.ts
import { defineConfig, config } from '@/core/utils/config-schema'

const appConfigSchema = {
  name: config.string('APP_NAME', 'FluxStack', true),
  port: config.number('PORT', 3000, true),
  env: config.enum('NODE_ENV', ['development', 'production', 'test'] as const, 'development', true),
  debug: config.boolean('DEBUG', false),
} as const

export const appConfig = defineConfig(appConfigSchema)
```

**2. Usar Configuração com Type Safety:**
```typescript
import { appConfig } from '@/config/app.config'
import { serverConfig } from '@/config/server.config'
import { appRuntimeConfig } from '@/config/runtime.config'

// ✅ Type inference automática
const name = appConfig.name        // string
const env = appConfig.env          // "development" | "production" | "test"
const port = serverConfig.port     // number
const debug = appRuntimeConfig.values.enableDebugMode  // boolean

// ✅ Validação em tempo de boot
if (appConfig.env === 'production') {
  // TypeScript sabe que env é exatamente 'production'
}

// ✅ Hot reload de configs runtime (sem restart do servidor)
appRuntimeConfig.reload()
```

**3. Validação e Transformação:**
```typescript
const schema = {
  port: {
    type: 'number' as const,
    env: 'PORT',
    default: 3000,
    required: true,
    validate: (value: number) => {
      if (value < 1 || value > 65535) {
        return 'Port must be between 1 and 65535'
      }
      return true
    }
  }
}
```

#### ⚡ **Benefícios**
- ✅ **Type Safety Total**: Inferência automática de tipos literais
- ✅ **Validação em Boot**: Falha rápida com mensagens claras
- ✅ **Zero Tipos `any`**: TypeScript infere tudo corretamente
- ✅ **Hot Reload Seguro**: Configs podem ser recarregadas em runtime
- ✅ **Documentação Automática**: Schema serve como documentação

#### 🔥 **Configurações Runtime (runtime.config.ts)**

O `runtime.config.ts` é especial pois permite **recarregar configurações sem reiniciar o servidor**:

```typescript
import { defineReactiveConfig, config } from '@/core/utils/config-schema'

export const appRuntimeConfig = defineReactiveConfig({
  // Features toggleáveis em runtime
  enableSwagger: config.boolean('ENABLE_SWAGGER', true),
  enableMetrics: config.boolean('ENABLE_METRICS', false),
  enableDebugMode: config.boolean('DEBUG', false),

  // Rate limiting dinâmico
  rateLimitEnabled: config.boolean('RATE_LIMIT_ENABLED', true),
  rateLimitMax: config.number('RATE_LIMIT_MAX', 100),
  rateLimitWindow: config.number('RATE_LIMIT_WINDOW', 60000), // ms

  // Modo manutenção
  maintenanceMode: config.boolean('MAINTENANCE_MODE', false),
  maintenanceMessage: config.string('MAINTENANCE_MESSAGE', 'Under maintenance')
})

// Watch para mudanças
appRuntimeConfig.watch((newConfig) => {
  console.log('🔄 Config reloaded:', newConfig)
})
```

**💡 Casos de Uso:**
- ✅ Habilitar/desabilitar Swagger em produção sem restart
- ✅ Ativar modo manutenção dinamicamente
- ✅ Ajustar rate limiting durante picos de tráfego
- ✅ Toggle de debug mode para troubleshooting
- ✅ Recarregar após atualizar variáveis de ambiente

**🔄 Recarregar Manualmente:**
```typescript
// Em qualquer lugar do código
import { appRuntimeConfig } from '@/config/runtime.config'

// Recarregar do .env ou process.env
await appRuntimeConfig.reload()

// Acessar valores atualizados
if (appRuntimeConfig.values.maintenanceMode) {
  return { message: appRuntimeConfig.values.maintenanceMessage }
}
```

#### 🌐 **Serviços Externos (services.config.ts)**

Configuração centralizada para integrações externas:

```typescript
import { defineNestedConfig, config } from '@/core/utils/config-schema'

export const servicesConfig = defineNestedConfig({
  // Email SMTP
  email: {
    host: config.string('SMTP_HOST'),
    port: config.number('SMTP_PORT', 587),
    user: config.string('SMTP_USER'),
    password: config.string('SMTP_PASSWORD'),
    secure: config.boolean('SMTP_SECURE', false),
    from: config.string('SMTP_FROM', 'noreply@example.com')
  },

  // JWT Authentication
  jwt: {
    secret: config.string('JWT_SECRET'), // Min 32 chars
    expiresIn: config.string('JWT_EXPIRES_IN', '24h'),
    algorithm: config.enum('JWT_ALGORITHM',
      ['HS256', 'HS384', 'HS512', 'RS256'] as const,
      'HS256'
    ),
    issuer: config.string('JWT_ISSUER', 'fluxstack')
  },

  // Storage (Local/S3/GCS/Azure)
  storage: {
    provider: config.enum('STORAGE_PROVIDER',
      ['local', 's3', 'gcs', 'azure'] as const,
      'local'
    ),
    uploadPath: config.string('UPLOAD_PATH', './uploads'),
    maxFileSize: config.number('MAX_FILE_SIZE', 10485760), // 10MB
    allowedTypes: config.array('ALLOWED_FILE_TYPES', ['image/*', 'application/pdf']),
    // S3 specific
    s3Bucket: config.string('S3_BUCKET'),
    s3Region: config.string('S3_REGION', 'us-east-1')
  },

  // Redis Cache
  redis: {
    host: config.string('REDIS_HOST', 'localhost'),
    port: config.number('REDIS_PORT', 6379),
    password: config.string('REDIS_PASSWORD'),
    db: config.number('REDIS_DB', 0),
    keyPrefix: config.string('REDIS_KEY_PREFIX', 'fluxstack:')
  }
})
```

**💡 Uso:**
```typescript
import { servicesConfig } from '@/config/services.config'

// Configurar email
const transporter = nodemailer.createTransport({
  host: servicesConfig.email.host,
  port: servicesConfig.email.port,
  auth: {
    user: servicesConfig.email.user,
    pass: servicesConfig.email.password
  }
})

// JWT signing
const token = jwt.sign(payload, servicesConfig.jwt.secret, {
  expiresIn: servicesConfig.jwt.expiresIn,
  algorithm: servicesConfig.jwt.algorithm
})
```

#### 🔧 **Helpers Disponíveis**
```typescript
import { config } from '@/core/utils/config-schema'

config.string(envVar, defaultValue, required)
config.number(envVar, defaultValue, required)
config.boolean(envVar, defaultValue, required)
config.array(envVar, defaultValue, required)
config.enum(envVar, values, defaultValue, required)
```

#### 📊 **Observabilidade (monitoring.config.ts)**

Sistema completo de métricas e profiling:

```typescript
import { defineNestedConfig, config } from '@/core/utils/config-schema'

export const monitoringConfig = defineNestedConfig({
  // Monitoring geral
  monitoring: {
    enabled: config.boolean('ENABLE_MONITORING', false),
    exporters: config.array('MONITORING_EXPORTERS', []),
    enableHealthChecks: config.boolean('ENABLE_HEALTH_CHECKS', true),
    healthCheckInterval: config.number('HEALTH_CHECK_INTERVAL', 30000)
  },

  // Métricas (HTTP, Sistema)
  metrics: {
    enabled: config.boolean('ENABLE_METRICS', false),
    collectInterval: config.number('METRICS_INTERVAL', 5000), // Min 1000ms
    httpMetrics: config.boolean('HTTP_METRICS', true),
    systemMetrics: config.boolean('SYSTEM_METRICS', true),
    exportToConsole: config.boolean('METRICS_EXPORT_CONSOLE', true),
    exportToFile: config.boolean('METRICS_EXPORT_FILE', false),
    retentionPeriod: config.number('METRICS_RETENTION_PERIOD', 3600000) // 1h
  },

  // Profiling (CPU, Memory)
  profiling: {
    enabled: config.boolean('PROFILING_ENABLED', false),
    sampleRate: config.number('PROFILING_SAMPLE_RATE', 0.1), // 0-1
    memoryProfiling: config.boolean('MEMORY_PROFILING', false),
    cpuProfiling: config.boolean('CPU_PROFILING', false),
    outputDir: config.string('PROFILING_OUTPUT_DIR', 'profiling')
  }
})
```

**💡 Casos de Uso:**
- ✅ Monitorar performance de APIs (latência, throughput)
- ✅ Tracking de uso de memória e CPU
- ✅ Exportar métricas para Prometheus/Grafana
- ✅ Health checks automáticos
- ✅ Profiling de código em produção (low overhead)

#### ⚛️ **Frontend & Vite (client.config.ts)**

Configuração do desenvolvimento e build frontend:

```typescript
export const clientConfig = defineNestedConfig({
  // Vite Dev Server
  vite: {
    port: config.number('VITE_PORT', 5173),
    host: config.string('VITE_HOST', 'localhost'),
    strictPort: config.boolean('VITE_STRICT_PORT', false),
    open: config.boolean('VITE_OPEN', false),
    enableLogging: config.boolean('ENABLE_VITE_PROXY_LOGS', false)
  },

  // Proxy Reverso (Backend API)
  proxy: {
    target: config.string('PROXY_TARGET', 'http://localhost:3000'),
    changeOrigin: config.boolean('PROXY_CHANGE_ORIGIN', true),
    secure: config.boolean('PROXY_SECURE', false),
    ws: config.boolean('PROXY_WS', true) // WebSocket support
  },

  // Build do Frontend
  build: {
    outDir: config.string('CLIENT_OUTDIR', 'dist/client'),
    sourceMaps: config.boolean('CLIENT_SOURCEMAPS', true),
    minify: config.boolean('CLIENT_MINIFY', true),
    target: config.string('CLIENT_TARGET', 'esnext'),
    chunkSizeWarningLimit: config.number('CLIENT_CHUNK_SIZE_WARNING', 500) // KB
  }
})
```

#### 🚫 **Não Fazer**
- ❌ Usar `process.env` diretamente no código da aplicação
- ❌ Acessar variáveis de ambiente sem validação
- ❌ Criar configs sem schema
- ❌ Hardcodar valores que variam por ambiente

#### ✅ **Sempre Fazer**
- ✅ Usar configs declarativos de `config/`
- ✅ Definir schemas com validação
- ✅ Usar helpers `config.*` para type safety
- ✅ Adicionar `as const` nos schemas para preservar tipos literais
- ✅ Documentar variáveis de ambiente no `.env.example`

## 🚨 **Regras Críticas (Atualizadas)**

### ❌ **NUNCA FAZER**
- Editar arquivos em `core/` (framework read-only)
- ~~Usar `apiCall()` wrapper~~ ✅ **REMOVIDO** - quebrava type inference
- Criar types manuais para Eden Treaty
- Ignorar response schemas nas rotas

### ✅ **SEMPRE FAZER**
- Trabalhar em `app/` (código da aplicação)
- **Usar Eden Treaty nativo**: `const { data, error } = await api.users.get()`
- Manter types compartilhados em `app/shared/`
- Definir response schemas para documentação automática
- Testar com `bun run dev`

## 🔧 **Verificação e Instalação do Bun**

### ⚠️ **REGRA CRÍTICA: Verificar Bun Antes de Executar Comandos**

**SEMPRE** que tentar executar um comando `bun` ou `bunx` e receber erro de "command not found", você **DEVE** instalar o Bun automaticamente.

### **1. Verificar se Bun está Instalado**
```bash
which bun || bun --version
```

### **2. Se Bun NÃO estiver instalado, instalar automaticamente:**

**Linux/macOS:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Após instalação, verificar:**
```bash
bun --version
```

### **3. Comportamento Esperado:**
- ✅ **Se `bun --version` funcionar**: Continuar com o comando original
- ❌ **Se `bun: command not found`**: Instalar Bun automaticamente e tentar novamente
- 🔄 **Após instalação**: Sempre verificar se funcionou antes de continuar

### **Exemplo de Fluxo:**
```bash
# Tentativa 1
bun run dev
# ❌ Error: bun: command not found

# Ação automática: Instalar Bun
curl -fsSL https://bun.sh/install | bash

# Verificar instalação
bun --version
# ✅ Output: 1.2.20

# Tentativa 2 (agora funciona)
bun run dev
# ✅ Servidor iniciado com sucesso
```

### **💡 Dica Importante:**
- Bun é **ESSENCIAL** para FluxStack funcionar
- A instalação é rápida (< 1 minuto)
- Após instalar, pode ser necessário reiniciar o terminal ou executar: `source ~/.bashrc` (Linux) ou `source ~/.zshrc` (macOS)

## 🔧 **Comandos Validados**

```bash
# Desenvolvimento
bun run dev              # ✅ Full-stack (recomendado)
bun run dev              # ✅ Output automaticamente limpo
bun run dev:backend      # ✅ Backend apenas (porta 3001)
bun run dev:frontend     # ✅ Frontend apenas (porta 5173)

# Build e produção  
bun run build           # ✅ Build completo
bun run start           # ✅ Servidor de produção

# Testes e validação
bun run test            # ✅ Suite de testes
bunx tsc --noEmit       # ✅ Verificação TypeScript
curl http://localhost:3000/api/health  # ✅ Health check
```

## 📊 **URLs de Acesso (Validadas)**

- **🚀 Backend API**: http://localhost:3000
- **⚛️ Frontend React**: http://localhost:5173  
- **📋 Swagger Docs**: http://localhost:3000/swagger
- **🩺 Health Check**: http://localhost:3000/api/health
- **👥 Users API**: http://localhost:3000/api/users

## 🔥 **Mudanças Importantes v1.7→v1.8**

### **✅ Centralização da App Instance (Janeiro 2025)**
- **Problema resolvido**: Multiple exports da app instance causavam inconsistências
- **Solução implementada**: App instance como fonte única de verdade
- **Resultado**: Arquitetura mais limpa e previne bugs de sincronização

### **✅ CI/CD Arithmetic Safety (Janeiro 2025)**
- **Problema resolvido**: Exit codes inconsistentes em workflows
- **Solução implementada**: Arithmetic safety aplicado em todos os workflows CI/CD
- **Resultado**: Pipeline mais confiável e previsível

### **✅ Regra de Instalação Automática do Bun (Janeiro 2025)**
- **Problema resolvido**: LLMs não sabiam como proceder quando Bun não estava instalado
- **Solução implementada**: Instrução clara no CLAUDE.md para instalar Bun automaticamente
- **Resultado**: Onboarding mais fluido e menos erros de "command not found"

### **✅ Sistema de Versão Unificado Consolidado**
- **Aprimoramento**: Sistema de versão única de verdade completamente estável
- **Sincronização**: package.json ↔ version.ts funcionando perfeitamente
- **DX Melhorado**: Scripts `sync-version` integrados no workflow

---

## 📋 **Histórico de Versões Anteriores**

### **v1.5→v1.6 (Janeiro 2025)**

#### **✅ Limpeza e Organização do Projeto**
- **Problema resolvido**: Arquivos markdown duplicados e desorganizados na raiz
- **Solução implementada**: Consolidação em `ai-context/` e remoção de arquivos desnecessários
- **Resultado**: Estrutura limpa com apenas README.md e CLAUDE.md na raiz

#### **✅ Integração do Filtro de Bug do Elysia**
- **Problema resolvido**: Logs poluídos com erros HEAD do Elysia em desenvolvimento
- **Solução implementada**: Filtro integrado no core do framework
- **Resultado**: Logs limpos automaticamente, sem necessidade de scripts externos

#### **✅ Correção de Tipos TypeScript**
- **Problema resolvido**: Uso inadequado de tipos `any` e erros de compilação
- **Solução implementada**: Tipos específicos e interfaces apropriadas
- **Resultado**: Type safety melhorada e código mais robusto

#### **✅ Eden Treaty Refatoração**
- **Problema resolvido**: Wrapper `apiCall()` quebrava type inference
- **Solução implementada**: Eden Treaty nativo preserva tipos automáticos
- **Resultado**: Zero tipos `unknown`, autocomplete perfeito

#### **✅ Response Schemas Implementados**
- **Todas as rotas**: Schemas TypeBox para inferência
- **Documentação automática**: Swagger UI atualizado
- **Type inference**: Eden Treaty funcionando 100%

#### **✅ Monorepo Estabilizado**
- **Uma instalação**: `bun install` para todo o projeto
- **Hot reload independente**: Backend e frontend separados
- **Build otimizado**: Sistema unificado

#### **✅ Sistema de Configuração Declarativa**
- **Problema resolvido**: Uso direto de `process.env` sem validação
- **Solução implementada**: Sistema Laravel-inspired com schemas
- **Arquitetura**: 3 camadas (env loader → config schema → app configs)
- **Benefícios**:
  - ✅ Type inference completa com tipos literais
  - ✅ Validação em boot time com mensagens claras
  - ✅ Zero tipos `any` em configurações
  - ✅ Hot reload seguro de configs
  - ✅ Pasta `config/` centralizada e organizada
- **Build**: Pasta `config/` copiada automaticamente para produção
- **CLI**: `create-fluxstack` inclui configs automaticamente

## 🎯 **Próximos Passos Sugeridos**

### **Funcionalidades Pendentes**
1. **Database integration** - ORM nativo
2. **Authentication system** - Auth built-in
3. **Real-time features** - WebSockets/SSE
4. **API versioning** - Versionamento automático

### **Melhorias Técnicas**
- Middleware de validação avançado
- Cache de responses
- Bundle size optimization
- Monitoring e métricas

## 🆘 **Suporte e Troubleshooting**

1. **Erro específico?** → [`ai-context/reference/troubleshooting.md`](./ai-context/reference/troubleshooting.md)
2. **Como fazer X?** → [`ai-context/development/patterns.md`](./ai-context/development/patterns.md)
3. **Eden Treaty?** → [`ai-context/development/eden-treaty-guide.md`](./ai-context/development/eden-treaty-guide.md)
4. **Não entendo nada?** → [`ai-context/00-QUICK-START.md`](./ai-context/00-QUICK-START.md)

---

**🎯 Objetivo**: Capacitar LLMs a trabalhar eficientemente com FluxStack, seguindo padrões estabelecidos e garantindo código de alta qualidade com type safety automática.

**📅 Última atualização**: Janeiro 2025 - v1.8.3

### **🔄 Changelog da Documentação:**
- **v1.8.3 (12/01/2025)**: Documentação completa de configuração (12 arquivos), correção de estrutura de pastas, adição de runtime.config.ts, services.config.ts, monitoring.config.ts e client.config.ts
- **v1.8.2**: Centralização de app instance e regra de instalação do Bun
- **v1.8.0**: Sistema de versão unificado consolidado