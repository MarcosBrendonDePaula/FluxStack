# ⚡ FluxStack

**Modern full-stack TypeScript framework with unified monorepo architecture**

> **🚀 v1.4.0** - Now with simplified installation and unified dependency management!

Um framework moderno e ultra-performático para criar aplicações full-stack com type-safety end-to-end, hot reload independente, e experiência de desenvolvimento excepcional.

## ✨ Características

### 🏗️ **Arquitetura Moderna**
- 🚀 **Bun** - Runtime ultra-rápido para JavaScript/TypeScript
- 🦊 **Elysia** - Web framework performático baseado em Bun  
- ⚛️ **React 19 + Vite** - Frontend moderno com hot reload
- 🔒 **TypeScript 5** - Type-safety completo end-to-end
- 📦 **Monorepo Unificado** - Uma única instalação para tudo

### ⚡ **Developer Experience**
- 🔄 **Hot Reload Independente** - Backend e frontend se recarregam separadamente
- 🔗 **Eden Treaty** - Type-safe API client (TypeScript compartilhado)
- 📚 **Swagger UI Integrado** - Documentação automática da API
- 🧪 **Sistema de Testes** - Vitest + Testing Library + 30 testes inclusos
- 🏗️ **CLI Integrado** - Comandos simples para tudo

### 🔧 **Produção Ready**  
- 🐳 **Docker** - Configuração completa para containers
- 📦 **Build Otimizado** - Frontend e backend otimizados independentemente
- 🔌 **Sistema de Plugins** - Extensível e modular
- ♻️ **Environment Configs** - Desenvolvimento, produção, testes

## 🚀 Instalação Simplificada

### **Instalação Ultra-Rápida** ⚡
```bash
# Clone o projeto
git clone https://github.com/your-org/fluxstack.git
cd fluxstack

# ✨ UMA única instalação para TUDO!
bun install

# 🎉 Pronto! Inicie o desenvolvimento
bun run dev
```

**🎯 Isso é tudo!** Não há mais postinstall hooks, dependências duplicadas ou configurações complexas.

### **URLs Disponíveis Imediatamente:**
- 🌐 **Frontend**: `http://localhost:5173` (Vite dev server)
- 🔧 **Backend**: `http://localhost:3000` (API + proxy para frontend)
- 📚 **API Docs**: `http://localhost:3000/swagger`
- 🔍 **Health Check**: `http://localhost:3000/api/health`

## 🎯 Modos de Desenvolvimento

### **1. 🚀 Full-Stack (Recomendado)**
```bash
bun run dev
```
✅ **Backend (3000)** + **Frontend Integrado (5173)**  
✅ Hot reload independente entre eles  
✅ Um comando para tudo

### **2. 🎨 Frontend Apenas**
```bash
bun run dev:frontend
```
✅ **Vite dev server** puro na porta 5173  
✅ Proxy automático `/api/*` → backend externo

### **3. ⚡ Backend Apenas** 
```bash
bun run dev:backend
```
✅ **API standalone** na porta 3001  
✅ Perfeito para desenvolvimento de APIs

## 📁 Arquitetura Monorepo Unificada

```
FluxStack/
├── 📦 package.json              # ✨ ÚNICO package.json (backend + frontend)
├── 🔧 vite.config.ts            # Configuração Vite no root
├── 🔧 eslint.config.js          # ESLint unificado
├── 🔧 tsconfig.json            # TypeScript config
├── 📁 app/
│   ├── 🖥️ server/              # Backend Elysia.js
│   │   ├── controllers/        # Lógica de negócio
│   │   ├── routes/             # Rotas com Swagger docs
│   │   └── index.ts           # Entry point
│   ├── 🎨 client/              # Frontend React (sem package.json!)
│   │   └── src/
│   │       ├── App.tsx         # Interface com tabs integradas
│   │       └── lib/            # Eden Treaty type-safe API
│   └── 🔗 shared/              # Tipos compartilhados
├── 🔧 core/                    # Framework engine (não editar)
├── 🧪 tests/                   # Sistema completo de testes
├── 📋 CLAUDE.md                # Documentação AI (contexto completo)
└── 📦 dist/                    # Build de produção
```

### **🎉 Benefícios da Nova Arquitetura:**

| Antes (v1.3) | Agora (v1.4) |
|---------------|---------------|
| 2x `package.json` | ✅ 1x `package.json` unificado |
| 2x `node_modules/` | ✅ 1x `node_modules/` |
| 2x `bun.lockb` | ✅ 1x `bun.lockb` |
| `bun install` + postinstall | ✅ `bun install` (uma vez!) |
| Dependências duplicadas | ✅ Dependências centralizadas |

## 🔧 Comandos CLI

### **Desenvolvimento**
```bash
bun run dev          # 🚀 Full-stack: Backend (3000) + Frontend integrado (5173)
bun run dev:frontend # 🎨 Frontend apenas: Vite dev server (5173)
bun run dev:backend  # ⚡ Backend apenas: API server (3001)
```

### **Build e Produção**
```bash
bun run build               # 📦 Build completo (frontend + backend)
bun run build:frontend     # 🎨 Build apenas frontend
bun run build:backend      # ⚡ Build apenas backend
bun run start              # 🚀 Servidor de produção
```

### **Testes**
```bash
bun run test               # 🧪 Testes em modo watch
bun run test:run          # 🎯 Executar testes uma vez
bun run test:ui           # 🖥️ Interface visual do Vitest
bun run test:coverage     # 📊 Relatório de cobertura
```

### **Utilitários**
```bash
bun run legacy:dev        # 🔧 Modo direto com Bun watch
```

## 🧪 Sistema de Testes Completo

**30 testes inclusos** cobrindo:
- ✅ **Testes unitários** - Controllers e lógica de negócio
- ✅ **Testes de integração** - API endpoints com requests reais
- ✅ **Testes de componentes** - Interface React com Testing Library  
- ✅ **Testes do framework** - Core do FluxStack

```bash
# Executar todos os testes
bun run test:run

# Resultado esperado:
# ✓ 4 test files passed
# ✓ 30 tests passed (100%)
```

## 🔗 Eden Treaty: Type-Safe API Client

**Sem configuração extra!** O Eden Treaty permite chamadas type-safe do frontend para backend:

```typescript
// ✨ Frontend: Chamadas type-safe automáticas
import { api, apiCall } from '@/lib/eden-api'

// Type-safe! Autocomplete completo!
const users = await apiCall(api.users.get())
const newUser = await apiCall(api.users.post({
  name: "João Silva",
  email: "joao@example.com"  
}))
```

```typescript
// 🔧 Backend: Rotas automaticamente tipadas
export const usersRoutes = new Elysia({ prefix: "/users" })
  .get("/", () => UsersController.getUsers())
  .post("/", ({ body }) => UsersController.createUser(body), {
    body: t.Object({
      name: t.String({ minLength: 2 }),
      email: t.String({ format: "email" })
    })
  })
```

**✨ Magia**: O TypeScript é compartilhado automaticamente entre frontend e backend!

## 📚 Swagger UI Integrado

A documentação da API é **gerada automaticamente** e disponível em:
- **Swagger UI**: `http://localhost:3000/swagger`
- **OpenAPI JSON**: `http://localhost:3000/swagger/json`

```typescript
// Documentar rotas é simples:
.get("/users", () => getUsers(), {
  detail: {
    tags: ['Users'],
    summary: 'List Users', 
    description: 'Retrieve all users in the system'
  }
})
```

## 🔄 Hot Reload Inteligente

### **Como Funciona:**
1. **Mudança no backend** → Apenas backend reinicia
2. **Mudança no frontend** → Apenas Vite faz hot reload  
3. **Vite já rodando** → FluxStack detecta e não reinicia

### **Logs Esperados:**
```bash
⚡ FluxStack Full-Stack Development
🚀 API ready at http://localhost:3000/api
✅ Vite já está rodando na porta 5173  
🔄 Backend hot reload independente do frontend
```

## 🎨 Interface Moderna Incluída

O projeto vem com uma **interface React moderna** já configurada:

- 📱 **Design responsivo** com CSS moderno
- 📑 **Navegação em abas** (Visão Geral, Demo, API Docs)
- 🧪 **Demo CRUD** funcional usando Eden Treaty
- 📚 **Swagger UI integrado** via iframe
- 🎨 **Componentes reutilizáveis** e bem estruturados

## 🐳 Docker Pronto para Produção

```bash
# Desenvolvimento
docker-compose up -d

# Produção otimizada
docker build -f Dockerfile .
```

Configurações incluídas:
- ✅ **Multi-stage builds** para otimização
- ✅ **Frontend e backend** separados ou juntos
- ✅ **Load balancer** Nginx configurado
- ✅ **Microservices** ready

## 🔌 Sistema de Plugins Extensível

```typescript
// Criar plugin personalizado
export const meuPlugin: Plugin = {
  name: "meu-plugin",
  setup: (context, app) => {
    // Sua lógica aqui
    app.get("/custom", () => ({ message: "Plugin funcionando!" }))
  }
}

// Usar no seu app
app.use(meuPlugin)
```

**Plugins inclusos:**
- 🪵 **Logger** - Logging automático de requests
- 📚 **Swagger** - Documentação automática  
- ⚡ **Vite** - Integração inteligente com frontend
- 📁 **Static** - Servir arquivos estáticos

## 🌐 Perfeito para SaaS

O FluxStack é uma base **excelente para SaaS**:

### **✅ Já Incluído:**
- Type-safety end-to-end
- Hot reload otimizado  
- Sistema de testes robusto
- API documentada automaticamente
- Build de produção otimizado
- Docker pronto para deploy
- Sistema de plugins extensível

### **🚀 Para Adicionar (conforme necessário):**
- Autenticação (JWT, OAuth)
- Banco de dados (Prisma, Drizzle)
- Pagamentos (Stripe, PayPal)  
- Multi-tenancy
- Monitoring (Sentry)
- Email/Notifications

**O FluxStack fornece a fundação sólida - você adiciona as features específicas do seu SaaS!**

## 🚀 Performance

### **Desenvolvimento:**
- ✅ **Bun install**: ~13-50s (dependendo da conexão)
- ✅ **Startup full-stack**: ~1-2s  
- ✅ **Hot reload backend**: ~500ms
- ✅ **Hot reload frontend**: ~100ms (Vite)

### **Produção:**
- ✅ **Build time**: ~10-30s
- ✅ **Bundle size**: Otimizado com tree-shaking
- ✅ **Runtime**: Bun nativo (ultra-rápido)

## 🤝 Contribuindo

1. **Fork** o projeto
2. **Clone**: `git clone <seu-fork>`
3. **Install**: `bun install` 
4. **Desenvolva**: Faça suas melhorias
5. **Teste**: `bun run test:run`
6. **Build**: `bun run build`
7. **PR**: Abra um Pull Request

## 📝 Versionamento

- **v1.4.0** - Monorepo unificado, instalação simplificada
- **v1.3.1** - Hot reload independente, Vite integrado  
- **v1.3.0** - Swagger UI, Eden Treaty, interface moderna
- **v1.2.x** - Sistema de plugins, CLI robusto
- **v1.1.x** - Testes integrados, Docker
- **v1.0.x** - Framework base

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🎯 Por Que FluxStack?

### **vs. Next.js**
✅ **Bun nativo** (mais rápido que Node.js)  
✅ **Eden Treaty** (type-safety melhor que tRPC)  
✅ **Elysia** (performance superior ao Next.js API routes)  
✅ **Monorepo unificado** (mais simples que T3 Stack)

### **vs. Remix**
✅ **Hot reload independente** (backend não afeta frontend)  
✅ **Swagger automático** (documentação sem esforço)  
✅ **Deploy flexível** (fullstack ou separado)  
✅ **Sistema de plugins** (mais extensível)

### **vs. SvelteKit/Nuxt**
✅ **React 19** (ecosystem mais maduro)  
✅ **TypeScript first** (não adicional)  
✅ **Bun runtime** (performance superior)  
✅ **Eden Treaty** (type-safety automática)

---

**🚀 Built with ❤️ using Bun, Elysia, React 19, and TypeScript 5**

**⚡ FluxStack - Where performance meets developer happiness!**