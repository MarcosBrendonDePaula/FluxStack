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
- **Runtime**: Bun 1.2.20 (3x mais rápido que Node.js)
- **Backend**: Elysia.js 1.4.6 (ultra-performático)
- **Frontend**: React 19.1.0 + Vite 7.0.4
- **Language**: TypeScript 5.9.2 (100% type-safe)
- **Communication**: Eden Treaty com inferência automática
- **Docs**: Swagger UI gerado automaticamente
- **Testing**: Vitest + React Testing Library
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
├── config/                  # ⚙️ CONFIGURAÇÕES DA APLICAÇÃO
│   ├── app.config.ts       # Configuração principal
│   ├── server.config.ts    # Servidor e CORS
│   ├── logger.config.ts    # Sistema de logs
│   ├── database.config.ts  # Banco de dados
│   ├── system.config.ts    # Informações do sistema
│   └── index.ts            # Exports centralizados
├── app/                     # 👨‍💻 CÓDIGO DA APLICAÇÃO
│   ├── server/             # Backend (controllers, routes)
│   │   ├── controllers/    # Lógica de negócio
│   │   ├── routes/         # Endpoints da API
│   │   └── app.ts          # Export do tipo para Eden Treaty
│   ├── client/             # Frontend (React + Vite)
│   │   ├── src/components/ # Componentes React
│   │   ├── src/lib/        # Cliente Eden Treaty
│   │   └── src/App.tsx     # Interface principal
│   └── shared/             # Types compartilhados
├── tests/                   # Testes do framework
├── docs/                    # Documentação técnica
└── ai-context/              # 📖 Esta documentação reorganizada
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
bun run dev:clean    # ✅ Output limpo (sem logs HEAD do Elysia)
```

### ✅ **3. APIs Funcionais**
- **Health Check**: `GET /api/health` ✅
- **Users CRUD**: `GET|POST|PUT|DELETE /api/users` ✅
- **Swagger Docs**: `GET /swagger` ✅

### ✅ **4. Sistema de Configuração Declarativa (Laravel-inspired)**

FluxStack usa um sistema de configuração declarativa com validação automática e inferência de tipos completa.

#### 📁 **Estrutura de Configuração**
```
config/
├── app.config.ts       # Configuração da aplicação
├── server.config.ts    # Configuração do servidor
├── logger.config.ts    # Configuração de logs
├── database.config.ts  # Configuração do banco de dados
├── system.config.ts    # Informações do sistema
└── index.ts           # Exports centralizados
```

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

// ✅ Type inference automática
const port = appConfig.port        // number
const env = appConfig.env          // "development" | "production" | "test"
const debug = appConfig.debug      // boolean

// ✅ Validação em tempo de boot
if (appConfig.env === 'production') {
  // TypeScript sabe que env é exatamente 'production'
}
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

#### 🔧 **Helpers Disponíveis**
```typescript
import { config } from '@/core/utils/config-schema'

config.string(envVar, defaultValue, required)
config.number(envVar, defaultValue, required)
config.boolean(envVar, defaultValue, required)
config.array(envVar, defaultValue, required)
config.enum(envVar, values, defaultValue, required)
```

#### 🚫 **Não Fazer**
- ❌ Usar `process.env` diretamente no código da aplicação
- ❌ Acessar variáveis de ambiente sem validação
- ❌ Criar configs sem schema

#### ✅ **Sempre Fazer**
- ✅ Usar configs declarativos de `config/`
- ✅ Definir schemas com validação
- ✅ Usar helpers `config.*` para type safety
- ✅ Adicionar `as const` nos schemas para preservar tipos literais

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

## 🔧 **Comandos Validados**

```bash
# Desenvolvimento
bun run dev              # ✅ Full-stack (recomendado)
bun run dev:clean        # ✅ Output limpo
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

## 🔥 **Mudanças Importantes v1.4→v1.5**

### **✅ Eden Treaty Refatoração (Setembro 2025)**
- **Problema resolvido**: Wrapper `apiCall()` quebrava type inference
- **Solução implementada**: Eden Treaty nativo preserva tipos automáticos
- **Resultado**: Zero tipos `unknown`, autocomplete perfeito

### **✅ Response Schemas Implementados**
- **Todas as rotas**: Schemas TypeBox para inferência
- **Documentação automática**: Swagger UI atualizado
- **Type inference**: Eden Treaty funcionando 100%

### **✅ Monorepo Estabilizado**
- **Uma instalação**: `bun install` para todo o projeto
- **Hot reload independente**: Backend e frontend separados
- **Build otimizado**: Sistema unificado

### **✅ Sistema de Configuração Declarativa (Janeiro 2025)**
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

**📅 Última atualização**: Janeiro 2025 - Documentação completamente reorganizada e validada.