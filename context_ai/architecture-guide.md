# FluxStack v1.4.0 - Guia de Arquitetura Monorepo

## Arquitetura Geral Unificada

FluxStack v1.4.0 introduz **arquitetura monorepo unificada** com separação clara entre framework e aplicação, mas com dependências centralizadas.

```
┌─────────────────────────────────────────────────────────────┐
│              FLUXSTACK v1.4.0 MONOREPO                    │
├─────────────────────────────────────────────────────────────┤
│  📦 Unified Package Management (root/)                     │
│  ├── package.json (backend + frontend dependencies)       │
│  ├── vite.config.ts (centralized Vite config)             │
│  ├── tsconfig.json (unified TypeScript config)            │
│  └── eslint.config.js (unified ESLint config)             │
├─────────────────────────────────────────────────────────────┤
│  🔧 Core Framework (core/)                                 │
│  ├── FluxStackFramework (Elysia wrapper)                   │
│  ├── Plugin System (logger, vite, static, swagger)         │
│  ├── CLI Tools with Hot Reload (dev, build, start)         │
│  ├── Build System (unified client/server builds)           │
│  └── Intelligent Vite Detection                            │
├─────────────────────────────────────────────────────────────┤
│  👨‍💻 User Application (app/)                                │
│  ├── Server (controllers, routes with Swagger docs)        │
│  ├── Client (React 19 + modern UI, NO package.json!)      │
│  └── Shared (unified types, automatic sharing)             │
├─────────────────────────────────────────────────────────────┤
│  🧪 Complete Test Suite (tests/)                           │
│  ├── Unit Tests (controllers, framework core, components)  │
│  ├── Integration Tests (API endpoints with real requests)  │
│  └── Test Isolation (data reset between tests)            │
└─────────────────────────────────────────────────────────────┘
```

### 🚀 v1.4.0 Architectural Improvements

- **✅ Unified Dependencies**: Single `package.json` for backend + frontend
- **✅ Centralized Configuration**: Vite, ESLint, TypeScript configs in root
- **✅ Type Sharing**: Automatic type sharing between client/server
- **✅ Hot Reload Independence**: Backend and frontend reload separately
- **✅ Intelligent Vite Detection**: Avoids restarting existing processes
- **✅ Build System Optimization**: Unified build process

## Core Framework (`core/`)

### FluxStackFramework (`core/server/framework.ts`)

Classe principal que encapsula o Elysia.js:

```typescript
class FluxStackFramework {
  private app: Elysia
  private context: FluxStackContext
  private plugins: Plugin[]

  // Métodos principais
  use(plugin: Plugin)           // Adicionar plugins
  routes(routeModule: any)      // Registrar rotas
  listen(callback?: () => void) // Iniciar servidor
}
```

**Responsabilidades:**
- Configuração automática de CORS
- Gerenciamento de contexto (dev/prod)
- Sistema de plugins extensível
- Proxy Vite em desenvolvimento

### Sistema de Plugins (`core/server/plugins/`)

#### Logger Plugin
```typescript
export const loggerPlugin: Plugin = {
  name: "logger",
  setup: (context, app) => {
    app.onRequest(({ request, path }) => console.log(`${request.method} ${path}`))
    app.onError(({ error, request, path }) => console.error(`ERROR ${request.method} ${path}`))
  }
}
```

#### Swagger Plugin
```typescript
export const swaggerPlugin: Plugin = {
  name: 'swagger',
  setup(context: FluxStackContext, app: any) {
    app.use(swagger({
      path: '/swagger',
      documentation: {
        info: {
          title: 'FluxStack API',
          version: '1.0.0',
          description: 'Modern full-stack TypeScript framework'
        },
        tags: [
          { name: 'Health', description: 'Health check endpoints' },
          { name: 'Users', description: 'User management endpoints' }
        ]
      }
    }))
  }
}
```

#### Vite Plugin
- Gerencia Vite dev server automaticamente
- Proxy requests não-API para Vite
- Cleanup automático ao sair

#### Static Plugin
- Serve arquivos estáticos em produção
- Suporte a SPA (Single Page Application)
- Fallback para index.html

### CLI System com Hot Reload Independente (`core/cli/index.ts`)

Interface unificada com hot reload inteligente:

```typescript
switch (command) {
  case "dev":
    // ✨ NOVO: Hot reload independente com Bun --watch
    const { spawn } = await import("child_process")
    const devProcess = spawn("bun", ["--watch", "app/server/index.ts"], {
      stdio: "inherit",
      cwd: process.cwd()
    })
    break
    
  case "frontend":
    // ✨ Vite puro sem conflitos
    const frontendProcess = spawn("vite", ["--config", "vite.config.ts"], {
      stdio: "inherit",
      cwd: process.cwd()
    })
    break
    
  case "backend":
    // ✨ Backend standalone com hot reload
    const backendProcess = spawn("bun", ["--watch", "app/server/backend-only.ts"], {
      stdio: "inherit",
      cwd: process.cwd()
    })
    break
    
  case "build":    await builder.build()                 // Build completo
  case "start":    await import(process.cwd() + "/dist/index.js") // Produção
}
```

#### 🔄 Hot Reload Intelligence:
1. **Backend mudança** → Apenas Bun reinicia, Vite continua
2. **Frontend mudança** → Apenas Vite faz HMR, backend não afetado
3. **Vite já rodando** → FluxStack detecta e não reinicia processo

### Build System (`core/build/index.ts`)

```typescript
class FluxStackBuilder {
  async buildClient()  // Build React com Vite
  async buildServer()  // Build Elysia com Bun
  async build()        // Build completo
}
```

## User Application (`app/`)

### Server Architecture (`app/server/`)

#### Controllers Pattern
```typescript
// app/server/controllers/users.controller.ts
export class UsersController {
  static async getUsers() { /* lógica */ }
  static async createUser(userData: CreateUserRequest) { /* lógica */ }
  static async getUserById(id: number) { /* lógica */ }
  static async deleteUser(id: number) { /* lógica */ }
}
```

#### Routes Pattern com Swagger
```typescript
// app/server/routes/users.routes.ts
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
```

#### Application Entry Point
```typescript
// app/server/index.ts
const app = new FluxStackFramework({ 
  port: 3000,
  clientPath: "app/client"
})

// IMPORTANTE: Ordem de registro dos plugins
app
  .use(swaggerPlugin)  // Primeiro: Swagger
  .use(loggerPlugin)
  .use(vitePlugin)

// Registrar rotas DEPOIS do Swagger
app.routes(apiRoutes)

app.listen()
```

### Client Architecture Unificada (`app/client/`) - SEM package.json!

#### API Integration com Eden Treaty
```typescript
// app/client/src/lib/eden-api.ts
import { treaty } from '@elysiajs/eden'
import type { App } from '../../../server/app'

const client = treaty<App>(getBaseUrl())
export const api = client.api

// Wrapper para chamadas com tratamento de erro
export const apiCall = async (promise: Promise<any>) => {
  try {
    const response = await promise
    if (response.error) throw new Error(response.error)
    return response.data || response
  } catch (error) {
    throw error
  }
}
```

#### Component Structure - Interface Moderna com Tabs Integradas
```typescript
// app/client/src/App.tsx - React 19 + Modern UI
type TabType = 'overview' | 'demo' | 'api-docs'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  useEffect(() => {
    // ✨ Eden Treaty com complete type safety
    loadUsers()
  }, [])
  
  const loadUsers = async () => {
    try {
      const data = await apiCall(api.users.get())
      setUsers(data.users)
    } catch (error) {
      setMessage('❌ Erro ao carregar usuários')
    }
  }
  
  const handleDelete = async (userId: number) => {
    setLoading(true)
    try {
      // ✨ CORRIGIDO: Nova sintaxe Eden Treaty
      await apiCall(api.users({ id: userId.toString() }).delete())
      setUsers(prev => prev.filter(user => user.id !== userId))
      setMessage('✅ Usuário deletado com sucesso!')
    } catch (error) {
      setMessage('❌ Erro ao deletar usuário')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreate = async (userData: CreateUserRequest) => {
    setLoading(true)
    try {
      const newUser = await apiCall(api.users.post(userData))
      setUsers(prev => [...prev, newUser.user])
      setMessage('✅ Usuário criado com sucesso!')
    } catch (error) {
      setMessage('❌ Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">
            <span className="header-icon">⚡</span>
            FluxStack
            <span className="header-version">v1.4.0</span>
          </h1>
        </div>
        
        {/* ✨ Tabs integradas no header */}
        <nav className="header-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📋 Visão Geral
          </button>
          <button 
            className={`tab ${activeTab === 'demo' ? 'active' : ''}`}
            onClick={() => setActiveTab('demo')}
          >
            🚀 Demo
          </button>
          <button 
            className={`tab ${activeTab === 'api-docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('api-docs')}
          >
            📚 API Docs
          </button>
        </nav>
      </header>
      
      <main className="main">
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        
        {activeTab === 'overview' && <OverviewContent />}
        {activeTab === 'demo' && (
          <DemoContent 
            users={users} 
            onDelete={handleDelete}
            onCreate={handleCreate}
            loading={loading}
          />
        )}
        {activeTab === 'api-docs' && <ApiDocsContent />}
      </main>
    </div>
  )
}
```

#### 🎨 CSS Moderno e Responsivo (App.css):
```css
/* Design system moderno com CSS custom properties */
:root {
  --primary: #646cff;
  --primary-dark: #535bf2;
  --success: #22c55e;
  --error: #ef4444;
  --bg: #ffffff;
  --bg-secondary: #f8fafc;
  --text: #1e293b;
  --border: #e2e8f0;
  --radius: 8px;
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.app {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.header {
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.header-tabs {
  display: flex;
  gap: 0;
  background: var(--bg-secondary);
}

.tab {
  padding: 1rem 2rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab.active {
  background: var(--bg);
  border-bottom-color: var(--primary);
  color: var(--primary);
}

.message {
  padding: 1rem;
  border-radius: var(--radius);
  margin: 1rem;
  text-align: center;
}

.message.success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.message.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
```

### Shared Types (`app/shared/`)

Tipos compartilhados entre client e server:

```typescript
// app/shared/types.ts
export interface User {
  id: number
  name: string
  email: string
  createdAt?: Date
}

export interface CreateUserRequest {
  name: string
  email: string
}

export interface UserResponse {
  success: boolean
  user?: User
  message?: string
}
```

## Fluxo de Dados

### Request Flow (Full-Stack Mode)
```
1. Browser Request → Elysia Server (port 3000)
2. API Request (/api/*) → Controllers → Response
3. Static Request → Vite Proxy → Vite Dev Server → Response
```

### Request Flow (Separated Mode)
```
1. Frontend: Browser → Vite Dev Server (port 5173)
2. API Calls: Vite Proxy (/api/*) → Backend Server (port 3001)
3. Backend: Elysia Standalone → Controllers → Response
```

## Path Alias System Unificado v1.4.0

### Configuração Centralizada

**Root Level - Único tsconfig.json (`tsconfig.json`)**:
```json
{
  "paths": {
    // Framework level - disponível em todo lugar
    "@/core/*": ["./core/*"],
    "@/app/*": ["./app/*"],
    "@/config/*": ["./config/*"],
    "@/shared/*": ["./app/shared/*"],
    
    // Frontend level - dentro de app/client/src
    "@/*": ["./app/client/src/*"],
    "@/components/*": ["./app/client/src/components/*"],
    "@/lib/*": ["./app/client/src/lib/*"],
    "@/types/*": ["./app/client/src/types/*"],
    "@/assets/*": ["./app/client/src/assets/*"]
  }
}
```

**Vite Config Centralizado - Root (`vite.config.ts`)**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  
  // ✨ Configuração unificada no root
  root: './app/client',
  
  resolve: {
    alias: {
      // Frontend aliases
      '@': resolve(__dirname, './app/client/src'),
      '@/components': resolve(__dirname, './app/client/src/components'),
      '@/lib': resolve(__dirname, './app/client/src/lib'),
      '@/types': resolve(__dirname, './app/client/src/types'),
      '@/assets': resolve(__dirname, './app/client/src/assets'),
      
      // Framework aliases - acesso do frontend ao backend
      '@/core': resolve(__dirname, './core'),
      '@/shared': resolve(__dirname, './app/shared'),
      '@/app/server': resolve(__dirname, './app/server')
    }
  },
  
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true
  }
})
```

### 🔗 Type Sharing Automático

```typescript
// ✅ Backend: definir tipos
// app/server/types/index.ts
export interface User {
  id: number
  name: string
  email: string
  createdAt: Date
}

// ✅ Frontend: usar automaticamente
// app/client/src/components/UserList.tsx
import type { User } from '@/app/server/types' // ✨ Funciona!

// ✅ Shared: tipos compartilhados
// app/shared/types.ts - disponível em ambos os lados
export interface CreateUserRequest {
  name: string
  email: string
}

// ✅ Backend usage
// app/server/controllers/users.controller.ts
import type { CreateUserRequest, User } from '@/shared/types'

// ✅ Frontend usage 
// app/client/src/lib/eden-api.ts
import type { CreateUserRequest } from '@/shared/types'
```

## Plugin System

### Plugin Interface
```typescript
interface Plugin {
  name: string
  setup: (context: FluxStackContext, app: any) => void
}
```

### Context Interface
```typescript
interface FluxStackContext {
  config: FluxStackConfig
  isDevelopment: boolean
  isProduction: boolean
}
```

### Criando Plugins Customizados
```typescript
export const customPlugin: Plugin = {
  name: "custom-plugin",
  setup: (context, app) => {
    console.log(`🔌 Plugin ${name} ativo em modo ${context.isDevelopment ? 'dev' : 'prod'}`)
    
    // Agora você tem acesso ao app Elysia
    app.onRequest(({ request }) => {
      console.log(`Custom plugin intercepting: ${request.method}`)
    })
  }
}

// Uso - ordem importa!
app
  .use(swaggerPlugin)  // Primeiro
  .use(customPlugin)   // Depois
  .use(loggerPlugin)
```

## Configuração (`config/fluxstack.config.ts`)

```typescript
export const config: FluxStackConfig = {
  port: 3000,
  vitePort: 5173,
  clientPath: "app/client",
  apiPrefix: "/api",
  cors: {
    origins: ["*"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    headers: ["Content-Type", "Authorization"]
  },
  build: {
    outDir: "dist",
    target: "bun"
  }
}
```

## Deployment Architecture v1.4.0

### Development - Hot Reload Independente

#### Modo Full-Stack (`bun run dev`):
```
┌─────────────────┐    ┌──────────────────┐
│  Bun --watch    │    │  Vite Detection  │
│  Backend:3000   │◄──►│  Frontend:5173   │
│  ├── API routes │    │  ├── React HMR   │
│  ├── Swagger UI │    │  ├── CSS HMR     │
│  └── Vite Proxy│    │  └── Fast Refresh│
└─────────────────┘    └──────────────────┘
```

**Fluxo de Hot Reload:**
1. **Backend change** → Bun restarts (500ms), Vite continua
2. **Frontend change** → Vite HMR (100ms), Backend não afetado
3. **Vite já rodando** → CLI detecta e não reinicia

#### Modo Separado:
```
# Frontend apenas
bun run dev:frontend  # Vite:5173 + proxy /api/* → external

# Backend apenas  
bun run dev:backend   # Elysia:3001 standalone
```

### Production - Build Otimizado

#### Unified Build System:
```bash
bun run build                # Build completo
# ├── bun run build:frontend → dist/client/
# └── bun run build:backend  → dist/index.js
```

#### Production Structure:
```
dist/
├── client/              # Frontend build otimizado
│   ├── index.html       # SPA entry point
│   ├── assets/
│   │   ├── index-[hash].js   # React bundle com tree-shaking
│   │   ├── index-[hash].css  # Estilos otimizados
│   │   └── logo-[hash].svg   # Assets com hash
│   └── vite-manifest.json    # Asset manifest
└── index.js             # Backend bundle (Elysia + static serving)
```

#### Production Start:
```bash
bun run start  # Servidor único na porta 3000
# ├── Serve static files from dist/client/
# ├── API routes on /api/*  
# ├── Swagger UI on /swagger
# └── SPA fallback to index.html
```

### 🐳 Docker Architecture

#### Multi-Stage Dockerfile:
```dockerfile
# ✨ Unified build stage
FROM oven/bun:alpine AS build
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build

# Production stage
FROM oven/bun:alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
RUN bun install --production
EXPOSE 3000
CMD ["bun", "run", "start"]
```

### 📊 Performance Benchmarks v1.4.0

#### Development Performance:
- **Installation**: `bun install` ~3-15s (vs ~30-60s dual package.json)
- **Full-stack startup**: ~1-2s (independent hot reload)
- **Backend hot reload**: ~500ms (Bun watch)
- **Frontend HMR**: ~100ms (Vite unchanged)
- **Type checking**: Unified, faster with shared types

#### Build Performance:
- **Frontend build**: ~10-20s (Vite + React 19)
- **Backend build**: ~2-5s (Bun native)
- **Bundle size**: Optimized with tree-shaking
- **Cold start**: ~200-500ms (Bun runtime)

Esta arquitetura v1.4.0 fornece **maximum flexibility** com **simplified management**, mantendo performance superior e developer experience excepcional! ⚡