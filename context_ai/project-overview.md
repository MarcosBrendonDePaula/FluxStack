# FluxStack v1.4.0 - Visão Geral do Projeto

## O que é o FluxStack?

FluxStack é um framework full-stack moderno em TypeScript que combina:
- **Backend**: Elysia.js (web framework ultra-performático baseado em Bun)
- **Frontend**: React 19 + Vite (desenvolvimento moderno com hot reload)
- **Runtime**: Bun (JavaScript runtime 3x mais rápido que Node.js)
- **Arquitetura**: Monorepo unificado (v1.4.0) - UMA instalação para tudo
- **Type Safety**: Eden Treaty para APIs completamente tipadas end-to-end
- **Hot Reload**: Independente entre frontend e backend
- **Documentação**: Swagger UI integrado automaticamente
- **Interface**: Design moderno com tabs integradas e demo funcional

## ⚡ Novidades v1.4.0 - Monorepo Unificado

### 🎯 **Mudança Revolucionária:**
- **ANTES**: 2x `package.json`, 2x `node_modules`, instalação em 2 etapas
- **AGORA**: 1x `package.json` unificado, 1x `node_modules`, instalação em 1 etapa

### 📦 **Estrutura Simplificada:**
```
FluxStack/
├── 📦 package.json              # ✨ ÚNICO package.json (backend + frontend)
├── 🔧 vite.config.ts            # Configuração Vite no root  
├── 🔧 eslint.config.js          # ESLint unificado
├── 🔧 tsconfig.json            # TypeScript config
└── 🚫 app/client/package.json   # REMOVIDO! Não existe mais
```

### ✨ **Benefícios da Nova Arquitetura:**
- ✅ **Instalação ultra-simples**: `bun install` (3 segundos)
- ✅ **Dependências centralizadas**: Sem duplicação, uma versão de cada lib
- ✅ **Type sharing automático**: Frontend e backend compartilham tipos naturalmente
- ✅ **Build otimizado**: Sistema unificado mais rápido
- ✅ **Developer experience++**: Menos configuração, mais desenvolvimento

## 🏗️ Estrutura do Projeto Atualizada

```
FluxStack/
├── core/                    # 🔧 Core do Framework (NÃO EDITAR)
│   ├── server/
│   │   ├── framework.ts     # FluxStackFramework class
│   │   ├── plugins/         # Sistema de plugins (logger, vite, static, swagger)
│   │   └── standalone.ts    # Servidor standalone para backend-only
│   ├── client/
│   │   └── standalone.ts    # Cliente standalone (legado)
│   ├── build/
│   │   └── index.ts         # FluxStackBuilder - sistema de build unificado
│   ├── cli/
│   │   └── index.ts         # CLI principal com comandos dev, build, etc.
│   ├── templates/
│   │   └── create-project.ts # Sistema de criação de projetos
│   └── types/
│       └── index.ts         # Tipos e interfaces do framework
├── app/                     # 👨‍💻 Código da Aplicação (EDITAR AQUI)
│   ├── server/
│   │   ├── controllers/     # Lógica de negócio (UsersController)
│   │   ├── routes/          # Definição de rotas API com Swagger docs
│   │   ├── types/           # Tipos específicos do servidor
│   │   ├── index.ts         # Entry point principal (desenvolvimento)
│   │   └── backend-only.ts  # Entry point para backend standalone
│   ├── client/              # 🚫 SEM package.json próprio!
│   │   ├── src/
│   │   │   ├── App.tsx      # Interface com tabs (Visão Geral, Demo, Docs)
│   │   │   ├── App.css      # Estilos modernos responsivos
│   │   │   ├── lib/
│   │   │   │   └── eden-api.ts # Cliente Eden Treaty type-safe
│   │   │   └── types/       # Tipos específicos do cliente
│   │   ├── public/          # Assets estáticos
│   │   ├── index.html       # HTML principal
│   │   └── frontend-only.ts # Entry point para frontend standalone
│   └── shared/              # 🔗 Tipos e utilitários compartilhados
│       ├── types.ts         # Tipos principais (User, CreateUserRequest, etc.)
│       └── api-types.ts     # Tipos específicos de API
├── tests/                   # 🧪 Sistema de Testes (30 testes inclusos)
│   ├── unit/                # Testes unitários
│   │   ├── core/           # Testes do framework
│   │   ├── app/
│   │   │   ├── controllers/ # Testes de controllers (isolamento de dados)
│   │   │   └── client/     # Testes de componentes React
│   ├── integration/        # Testes de integração (API endpoints)
│   ├── e2e/               # Testes end-to-end (preparado)
│   ├── __mocks__/         # Mocks para testes
│   ├── fixtures/          # Dados de teste fixos
│   └── utils/             # Utilitários de teste
├── context_ai/            # 📋 Documentação para IAs (este arquivo)
├── config/
│   └── fluxstack.config.ts # Configuração principal do framework
├── 📋 CLAUDE.md           # Documentação AI principal (contexto completo)
├── 🔧 vite.config.ts      # ✨ Configuração Vite UNIFICADA no root
├── 🔧 eslint.config.js    # ✨ ESLint UNIFICADO no root
├── 🔧 tsconfig.json      # TypeScript config principal
├── 📦 package.json       # ✨ ÚNICO package.json com TODAS as dependências
└── 📦 dist/              # Build de produção (client/ e server files)
```

## 🚀 Instalação Ultra-Simplificada

### **v1.4.0 - Novo Processo:**
```bash
# 1. Clone o projeto
git clone <repo>
cd FluxStack

# 2. ✨ UMA instalação para TUDO!
bun install

# 3. 🎉 Pronto! Inicie o desenvolvimento
bun run dev
```

**🎯 Isso é tudo!** Não há mais:
- ❌ `cd app/client && bun install` (postinstall hook removido)
- ❌ Gerenciamento de dependências duplicadas
- ❌ Sincronização de versões entre frontend/backend
- ❌ Configurações separadas

## 🎯 Modos de Desenvolvimento

### **1. 🚀 Full-Stack (Recomendado)**
```bash
bun run dev
```
- **Backend**: http://localhost:3000/api (Elysia + hot reload)
- **Frontend**: http://localhost:5173 (Vite dev server integrado)
- **Docs**: http://localhost:3000/swagger
- **Hot reload independente**: Backend e frontend se recarregam separadamente

### **2. 🎨 Frontend Apenas**
```bash
bun run dev:frontend
```
- **Porta**: 5173 (Vite dev server puro)
- **Proxy automático**: `/api/*` → backend externo
- **Ideal para**: Frontend developers, SPA development

### **3. ⚡ Backend Apenas** 
```bash
bun run dev:backend
```
- **Porta**: 3001 (API standalone)
- **Health check**: http://localhost:3001/health
- **Ideal para**: API development, mobile backends

### **4. 🔧 Legacy Mode**
```bash
bun run legacy:dev
```
- Modo direto com `bun --watch`
- Para debugging ou desenvolvimento customizado

## 📚 Dependency Management Unificado

### **Como Instalar Libraries:**

```bash
# ✨ UMA instalação funciona para frontend E backend
bun add <library>

# Exemplos práticos:
bun add zod                    # ✅ Funciona no frontend E backend
bun add prisma                 # ✅ Backend (mas tipos no frontend)
bun add react-router-dom       # ✅ Frontend (mas tipos no backend)
bun add @tanstack/react-query  # ✅ Frontend specific
bun add jsonwebtoken           # ✅ Backend specific

# Dev dependencies
bun add -d @types/jsonwebtoken # ✅ Types disponíveis em ambos
```

### **Type Sharing Automático:**
```typescript
// ✨ Backend: definir tipos
// app/server/types/index.ts
export interface User {
  id: number
  name: string
  email: string
}

// ✨ Frontend: usar tipos automaticamente
// app/client/src/components/UserList.tsx
import type { User } from '@/app/server/types' // ✅ Funciona!
```

## 🔗 Eden Treaty: Type-Safe API Client

FluxStack usa Eden Treaty para APIs completamente tipadas sem configuração extra:

```typescript
// Backend: definir rotas com Swagger docs
export const usersRoutes = new Elysia({ prefix: "/users" })
  .get("/", () => UsersController.getUsers(), {
    detail: {
      tags: ['Users'],
      summary: 'List Users',
      description: 'Retrieve a list of all users in the system'
    }
  })
  .post("/", ({ body }) => UsersController.createUser(body), {
    body: t.Object({
      name: t.String({ minLength: 2 }),
      email: t.String({ format: "email" })
    }),
    detail: {
      tags: ['Users'],
      summary: 'Create User',
      description: 'Create a new user with name and email'
    }
  })

// Frontend: usar API com types automáticos
import { api, apiCall } from '@/lib/eden-api'

// ✨ Completamente tipado! Autocomplete funciona!
const users = await apiCall(api.users.get())
const newUser = await apiCall(api.users.post({
  name: "João Silva",          // ✅ Type-safe
  email: "joao@example.com"    // ✅ Validado automaticamente
}))
```

## 🔄 Hot Reload Inteligente e Independente

### **Como Funciona (ÚNICO no mercado):**
1. **Mudança no backend** → Apenas backend reinicia, Vite continua
2. **Mudança no frontend** → Apenas Vite faz hot reload, backend não afetado  
3. **Vite já rodando** → FluxStack detecta e não reinicia processo

### **Logs Esperados:**
```bash
⚡ FluxStack Full-Stack Development
🚀 API ready at http://localhost:3000/api
✅ Vite já está rodando na porta 5173  
🔄 Backend hot reload independente do frontend
```

### **Vantagem Competitiva:**
- **Next.js**: Qualquer mudança → full reload
- **Remix**: Dev server único → impacto em ambos
- **FluxStack**: Reloads completamente independentes ✨

## 🧪 Sistema de Testes Completo

**30 testes inclusos** cobrindo todo o sistema:

### **Estrutura de Testes:**
```
tests/
├── unit/                      # Testes unitários (18 testes)
│   ├── core/                 # Framework core (8 testes)
│   ├── app/
│   │   ├── controllers/      # Controllers com isolamento (9 testes)
│   │   └── client/          # Componentes React (2 testes)
├── integration/              # Testes de integração (11 testes)
│   └── api/                 # API endpoints com requests reais
├── __mocks__/               # Mocks para APIs
├── fixtures/                # Dados de teste (users.ts)
└── utils/                   # Helpers de teste
```

### **Comandos de Teste:**
```bash
bun run test               # 🔄 Modo watch (desenvolvimento)
bun run test:run          # 🎯 Executar uma vez (CI/CD)
bun run test:ui           # 🖥️ Interface visual do Vitest
bun run test:coverage     # 📊 Relatório de cobertura
```

### **Resultado Esperado:**
```bash
✓ 4 test files passed
✓ 30 tests passed (100%)
✓ Coverage: Controllers, Routes, Framework, Components
```

## 🎨 Interface Moderna Incluída

### **Frontend Redesignado (App.tsx):**
- **📑 Navegação em abas**: Visão Geral, Demo, API Docs
- **🏠 Tab Visão Geral**: Apresentação da stack com funcionalidades
- **🧪 Tab Demo**: CRUD interativo de usuários usando Eden Treaty
- **📚 Tab API Docs**: Swagger UI integrado via iframe + links externos

### **Funcionalidades da Interface:**
- ✅ **Design responsivo** com CSS moderno
- ✅ **Type-safe API calls** com Eden Treaty
- ✅ **Sistema de notificações** (toasts) para feedback
- ✅ **Estados de carregamento** e tratamento de erros
- ✅ **Demo CRUD funcional** (Create, Read, Delete users)
- ✅ **Swagger UI integrado** sem deixar a aplicação

## 📚 Sistema de Plugins Extensível

### **Plugins Inclusos:**
- **🪵 loggerPlugin**: Logging automático de requests/responses
- **📚 swaggerPlugin**: Documentação Swagger automática
- **⚡ vitePlugin**: Integração inteligente com Vite (detecção automática)
- **📁 staticPlugin**: Servir arquivos estáticos em produção

### **Criar Plugin Customizado:**
```typescript
import type { Plugin } from "@/core/types"

export const meuPlugin: Plugin = {
  name: "meu-plugin",
  setup: (context, app) => {
    console.log("🔌 Meu plugin ativado")
    
    // Adicionar middleware
    app.onRequest(({ request }) => {
      console.log(`Request: ${request.method} ${request.url}`)
    })
    
    // Adicionar rota
    app.get("/custom", () => ({ message: "Plugin funcionando!" }))
  }
}

// Usar no app
app.use(meuPlugin)
```

## 🚀 Build e Deploy

### **Build Commands:**
```bash
bun run build               # 📦 Build completo (frontend + backend)
bun run build:frontend     # 🎨 Build apenas frontend → dist/client/
bun run build:backend      # ⚡ Build apenas backend → dist/index.js

# Resultado:
dist/
├── client/          # Frontend build (HTML, CSS, JS otimizados)
│   ├── index.html
│   └── assets/
└── index.js         # Backend build (servidor otimizado)
```

### **Production Start:**
```bash
bun run start              # 🚀 Servidor de produção
bun run start:frontend     # 🎨 Frontend apenas (via dist/)
bun run start:backend      # ⚡ Backend apenas (porta 3001)
```

## 🎯 Path Aliases Atualizados

### **Framework Level (disponível em todo lugar):**
```typescript
"@/core/*"     // ./core/*         (framework core)
"@/app/*"      // ./app/*          (seu código)
"@/config/*"   // ./config/*       (configurações)
"@/shared/*"   // ./app/shared/*   (tipos compartilhados)
```

### **Frontend Level (dentro de app/client/src):**
```typescript
"@/*"            // ./app/client/src/*
"@/components/*" // ./app/client/src/components/*
"@/lib/*"        // ./app/client/src/lib/*
"@/types/*"      // ./app/client/src/types/*
"@/assets/*"     // ./app/client/src/assets/*
```

### **Exemplos Práticos:**
```typescript
// ✅ Backend
import { FluxStackFramework } from '@/core/server'
import { UsersController } from '@/app/server/controllers/users.controller'
import type { User } from '@/shared/types'

// ✅ Frontend  
import { api } from '@/lib/eden-api'
import Logo from '@/assets/logo.svg'
import type { User } from '@/shared/types'
```

## 🌐 URLs e Endpoints

### **Desenvolvimento:**
- **🏠 App principal**: http://localhost:3000
- **🔧 API**: http://localhost:3000/api/*
- **📚 Swagger UI**: http://localhost:3000/swagger  
- **📋 Health Check**: http://localhost:3000/api/health
- **🎨 Vite Dev Server**: http://localhost:5173 (quando integrado)

### **Backend Standalone:**
- **🔧 API**: http://localhost:3001/api/*
- **📋 Health**: http://localhost:3001/health

### **Produção:**
- **🏠 App completa**: http://localhost:3000
- Arquivos estáticos servidos pelo Elysia

## 🔥 Principais Tecnologias

- **🚀 Bun 1.1.34**: Runtime ultra-rápido (3x faster than Node.js)
- **🦊 Elysia.js 1.3.8**: Web framework performático baseado em Bun
- **⚛️ React 19.1.1**: Biblioteca de interface moderna
- **⚡ Vite 7.0.6**: Build tool com hot reload instantâneo
- **🔒 TypeScript 5.9.2**: Type safety completo end-to-end
- **🔗 Eden Treaty 1.3.2**: Cliente HTTP type-safe automático
- **📚 Swagger 1.3.1**: Documentação automática integrada
- **🧪 Vitest 3.2.4**: Sistema de testes rápido e moderno
- **📱 Testing Library**: Testes de componentes React

## 📝 Para IAs: Pontos Importantes v1.4.0

### **✅ FAZER:**
1. **Sempre instalar libs no root**: `bun add <library>` (funciona para frontend E backend)
2. **Editar apenas em `app/`**: Código da aplicação fica aqui
3. **Usar path aliases**: Imports limpos com `@/` prefixes
4. **Manter types em `app/shared/`**: Tipos compartilhados entre client/server
5. **Sempre usar Eden Treaty**: Para chamadas API type-safe
6. **Documentar APIs com Swagger**: Tags e descriptions em todas as rotas
7. **Criar testes**: Novos recursos precisam de testes em `tests/`
8. **Hot reload independente**: Aproveitar recarregamento separado
9. **Usar monorepo**: Dependências centralizadas, configuração unificada

### **❌ NÃO FAZER:**
1. **NÃO editar `core/`**: Framework files são read-only
2. **NÃO criar `app/client/package.json`**: Foi removido na v1.4.0!
3. **NÃO instalar deps separadamente**: Uma instalação no root serve tudo
4. **NÃO duplicar configurações**: Vite, ESLint, TypeScript são unificados
5. **NÃO usar `cd app/client`**: Não há mais package.json lá
6. **NÃO quebrar type-safety**: Sempre manter tipagem end-to-end
7. **NÃO ignorar testes**: Sistema completo depende de testes funcionando

### **🎯 Workflow Recomendado:**
```bash
# 1. Instalar nova library
bun add <library>              # No root do projeto

# 2. Usar no backend
// app/server/controllers/exemplo.controller.ts
import { library } from '<library>'

# 3. Usar no frontend  
// app/client/src/components/Exemplo.tsx
import { library } from '<library>'  // ✅ Disponível automaticamente!

# 4. Tipos compartilhados
// app/shared/types.ts - disponível em ambos os lados

# 5. Testar
bun run test:run               # Garantir que tudo funciona
```

### **🚨 Mudanças Importantes v1.4.0:**
- **Estrutura monorepo**: Dependências unificadas no root
- **Sem postinstall hook**: Instalação direta e simples  
- **Vite config no root**: Configuração centralizada
- **Hot reload independente**: Backend e frontend separados
- **Build system otimizado**: Processo unificado mais rápido
- **30 testes inclusos**: Cobertura completa do sistema

**FluxStack v1.4.0 representa uma evolução significativa em direção à simplicidade e performance, mantendo toda a power e flexibilidade do framework!** ⚡