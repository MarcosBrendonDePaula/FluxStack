# ⚡ FluxStack

> **O framework full-stack TypeScript que você sempre quis**

[![CI Tests](https://img.shields.io/badge/tests-30%20passing-success)](/.github/workflows/ci-build-tests.yml)
[![Build Status](https://img.shields.io/badge/build-passing-success)](/.github/workflows/ci-build-tests.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)
[![Version](https://img.shields.io/badge/version-v1.4.0-orange.svg)](https://github.com/your-org/fluxstack/releases)
[![Bun](https://img.shields.io/badge/runtime-Bun%201.1.34-black.svg)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)

FluxStack é um framework full-stack moderno que combina **Bun**, **Elysia**, **React 19** e **TypeScript** numa arquitetura monorepo unificada com hot reload independente e type-safety end-to-end automática.

---

## 🎯 Por que FluxStack?

**FluxStack resolve os problemas reais do desenvolvimento full-stack moderno:**

### ❌ **Problemas Comuns:**
- Configuração complexa com múltiplos package.json
- Hot reload que reinicia tudo quando muda uma linha
- APIs não tipadas entre frontend e backend  
- Documentação desatualizada ou inexistente
- Build systems confusos e lentos

### ✅ **Soluções FluxStack:**
- **Uma instalação**: `bun install` - pronto!
- **Hot reload independente**: Backend e frontend separados
- **Type-safety automática**: Eden Treaty + TypeScript compartilhado
- **Swagger UI integrado**: Documentação sempre atualizada
- **Build unificado**: Um comando, tudo otimizado

---

## 🚀 Instalação Ultra-Rápida

```bash
# 1. Clone o projeto
git clone https://github.com/your-org/fluxstack.git
cd fluxstack

# 2. ✨ UMA instalação para TUDO!
bun install

# 3. 🎉 Pronto! Inicie o desenvolvimento
bun run dev
```

**🎯 URLs disponíveis imediatamente:**
- 🌐 **App**: http://localhost:3000
- 🔧 **API**: http://localhost:3000/api
- 📚 **Docs**: http://localhost:3000/swagger
- 🩺 **Health**: http://localhost:3000/api/health

---

## ⚡ Características Principais

### 🏗️ **Arquitetura Revolucionária**
```
FluxStack v1.4.0 - Monorepo Unificado
├── 📦 package.json              # ✨ ÚNICO package.json (tudo junto)
├── 🔧 vite.config.ts            # Vite centralizado
├── 🔧 tsconfig.json            # TypeScript unificado  
├── 🔧 eslint.config.js          # ESLint unificado
├── 🚫 app/client/package.json   # REMOVIDO! (v1.4.0)
├── app/
│   ├── server/                  # 🖥️ Backend (Elysia + Bun)
│   ├── client/                  # 🎨 Frontend (React 19 + Vite)
│   └── shared/                  # 🔗 Tipos compartilhados
├── core/                        # 🔧 Framework engine
├── tests/                       # 🧪 30 testes inclusos
└── .github/                     # 🤖 CI/CD completo
```

### 🔄 **Hot Reload Independente** (ÚNICO no mercado!)
- **Mudança no backend** → Apenas backend reinicia (~500ms)
- **Mudança no frontend** → Apenas Vite HMR (~100ms)
- **Sem interferência** → Cada lado funciona independente

### 🔗 **Type-Safety Automática**
```typescript
// 🖥️ Backend: Definir API
export const usersRoutes = new Elysia({ prefix: "/users" })
  .get("/", () => UsersController.getUsers())
  .post("/", ({ body }) => UsersController.createUser(body), {
    body: t.Object({
      name: t.String({ minLength: 2 }),
      email: t.String({ format: "email" })
    })
  })

// 🎨 Frontend: Usar API (100% tipado!)
import { api, apiCall } from '@/lib/eden-api'

const users = await apiCall(api.users.get())        // ✅ Tipos automáticos
const user = await apiCall(api.users.post({         // ✅ Autocomplete
  name: "João Silva",                               // ✅ Validação  
  email: "joao@example.com"                         // ✅ Type-safe
}))
```

### 📚 **Swagger UI Integrado**
- Documentação **sempre atualizada** automaticamente
- Interface visual em `http://localhost:3000/swagger`
- OpenAPI spec em `http://localhost:3000/swagger/json`

### 🧪 **30 Testes Inclusos**
```bash
bun run test:run
# ✓ 4 test files passed
# ✓ 30 tests passed (100%)
# ✓ Controllers, Routes, Components, Framework
```

---

## 🎯 Modos de Desenvolvimento

### 1. 🚀 **Full-Stack (Recomendado)**
```bash
bun run dev
```
- Backend na porta 3000 + Frontend integrado na 5173
- Hot reload independente entre eles
- Um comando para governar todos

### 2. 🎨 **Frontend Apenas**  
```bash
bun run dev:frontend
```
- Vite dev server puro na porta 5173
- Proxy automático `/api/*` → backend externo
- Perfeito para frontend developers

### 3. ⚡ **Backend Apenas**
```bash
bun run dev:backend
```
- API standalone na porta 3001
- Ideal para desenvolvimento de APIs
- Perfeito para mobile/SPA backends

---

## 🔧 Comandos Essenciais

### **Desenvolvimento**
```bash
bun run dev              # 🚀 Full-stack com hot reload independente
bun run dev:frontend     # 🎨 Apenas frontend (Vite puro)
bun run dev:backend      # ⚡ Apenas backend (API standalone)
```

### **Build & Deploy**
```bash
bun run build           # 📦 Build completo otimizado
bun run build:frontend  # 🎨 Build apenas frontend → dist/client/
bun run build:backend   # ⚡ Build apenas backend → dist/index.js
bun run start           # 🚀 Servidor de produção
```

### **Testes & Qualidade**
```bash
bun run test            # 🧪 Testes em modo watch
bun run test:run        # 🎯 Rodar todos os 30 testes
bun run test:ui         # 🖥️ Interface visual do Vitest
bun run test:coverage   # 📊 Relatório de cobertura
```

---

## 🌟 Destaques Únicos

### 📦 **Monorepo Inteligente**
| Antes (v1.3) | FluxStack v1.4.0 |
|---------------|------------------|
| 2x `package.json` | ✅ 1x unificado |
| 2x `node_modules/` | ✅ 1x centralizado |
| Deps duplicadas | ✅ Sem duplicação |
| Instalação complexa | ✅ `bun install` (3s) |

### ⚡ **Performance Excepcional**
- **Instalação**: 3-15s (vs 30-60s frameworks tradicionais)
- **Startup**: 1-2s full-stack
- **Hot reload**: Backend 500ms, Frontend 100ms
- **Build**: Frontend <30s, Backend <10s
- **Runtime**: Bun nativo (3x mais rápido que Node.js)

### 🔐 **Type-Safety sem Configuração**
- Eden Treaty conecta backend/frontend automaticamente
- Tipos compartilhados em `app/shared/`  
- Autocomplete e validação em tempo real
- Sem código boilerplate extra

### 🎨 **Interface Moderna Incluída**
- React 19 com design responsivo
- Navegação em abas integradas
- Demo CRUD funcional
- Componentes reutilizáveis
- CSS moderno com custom properties

---

## 🐳 Deploy em Produção

### **Docker (Recomendado)**
```bash
# Build da imagem
docker build -t fluxstack .

# Executar container
docker run -p 3000:3000 fluxstack

# Docker Compose para desenvolvimento
docker-compose up -d
```

### **Deploy Tradicional**
```bash
# Build otimizado
bun run build

# Servidor de produção
bun run start
```

---

## 🔌 Sistema de Plugins

FluxStack é extensível através de plugins:

```typescript
// Criar plugin personalizado
export const meuPlugin: Plugin = {
  name: "analytics",
  setup: (context, app) => {
    app.onRequest(({ request }) => {
      console.log(`📊 ${request.method} ${request.url}`)
    })
    
    app.get("/analytics", () => ({ 
      totalRequests: getRequestCount() 
    }))
  }
}

// Usar no projeto
app.use(meuPlugin)
```

**Plugins inclusos:**
- 🪵 **Logger** - Logging automático
- 📚 **Swagger** - Documentação automática
- ⚡ **Vite** - Integração inteligente  
- 📁 **Static** - Arquivos estáticos

---

## 🌐 Perfeito para SaaS

FluxStack é ideal para construir SaaS modernos:

### **✅ Já Incluído:**
- Type-safety end-to-end
- Hot reload otimizado
- API documentada automaticamente  
- Sistema de testes robusto
- Build de produção otimizado
- Docker pronto para deploy
- Monorepo simplificado

### **🚀 Adicione conforme necessário:**
- Autenticação (JWT, OAuth, Clerk)
- Database (Prisma, Drizzle, PlanetScale)
- Pagamentos (Stripe, Paddle)
- Email (Resend, SendGrid)
- Monitoring (Sentry, LogRocket)
- Deploy (Vercel, Railway, Fly.io)

---

## 🎯 FluxStack vs Concorrentes

### **vs Next.js**
- ✅ **Runtime nativo Bun** (3x mais rápido)
- ✅ **Hot reload independente** (vs reload completo)
- ✅ **Eden Treaty** (melhor que tRPC)
- ✅ **Monorepo simplificado** (vs T3 Stack complexo)

### **vs Remix**
- ✅ **Swagger automático** (vs documentação manual)
- ✅ **Deploy flexível** (fullstack ou separado)
- ✅ **Sistema de plugins** (mais extensível)
- ✅ **Bun runtime** (performance superior)

### **vs SvelteKit/Nuxt**
- ✅ **Ecosystem React maduro** (mais libraries)
- ✅ **TypeScript first** (não adicional)
- ✅ **Eden Treaty** (type-safety automática)
- ✅ **Bun ecosystem** (tooling moderno)

---

## 📚 Documentação Completa

- 📖 **[Documentação AI](CLAUDE.md)** - Contexto completo para IAs
- 🏗️ **[Guia de Arquitetura](context_ai/architecture-guide.md)** - Estrutura detalhada  
- 🔧 **[Padrões de Desenvolvimento](context_ai/development-patterns.md)** - Melhores práticas
- 🔍 **[Referência da API](context_ai/api-reference.md)** - APIs completas
- 🤖 **[GitHub Actions](.github/README.md)** - CI/CD automático

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Faça suas mudanças
4. Teste: `bun run test:run`
5. Build: `bun run build`  
6. Commit: `git commit -m "Add nova feature"`
7. Push: `git push origin feature/nova-feature`
8. Abra um Pull Request

---

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

## 🎉 Roadmap

### **v1.4.x (Atual)**
- ✅ Monorepo unificado
- ✅ Hot reload independente  
- ✅ 30 testes inclusos
- ✅ CI/CD completo

### **v1.5.0 (Próximo)**
- 🔄 Database abstraction layer
- 🔄 Authentication plugins
- 🔄 Real-time features (WebSockets)
- 🔄 Deploy CLI helpers

### **v2.0.0 (Futuro)**
- 🔄 Multi-tenancy support  
- 🔄 Advanced caching
- 🔄 Microservices templates
- 🔄 GraphQL integration


---

**🚀 Built with ❤️ using Bun, Elysia, React 19, and TypeScript 5**

**⚡ FluxStack - Where performance meets developer happiness!**

---

<div align="center">

**[⭐ Star no GitHub](https://github.com/MarcosBrendonDePaula/FluxStack)** • **[📖 Documentação](CLAUDE.md)** • **[💬 Discussions](https://github.com/MarcosBrendonDePaula/FluxStack/discussions)** • **[🐛 Issues](https://github.com/MarcosBrendonDePaula/FluxStack/issues)**

</div>