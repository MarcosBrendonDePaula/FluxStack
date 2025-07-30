# FluxStack - Guia de Arquitetura

## Arquitetura Geral

FluxStack segue uma arquitetura modular bem definida com separação clara entre framework e aplicação.

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXSTACK FRAMEWORK                     │
├─────────────────────────────────────────────────────────────┤
│  Core Framework (core/)                                     │
│  ├── FluxStackFramework (Elysia wrapper)                   │
│  ├── Plugin System (logger, vite, static, cors)            │
│  ├── CLI Tools (dev, build, start commands)                │
│  ├── Build System (client/server builds)                   │
│  └── Standalone Modes (frontend-only, backend-only)        │
├─────────────────────────────────────────────────────────────┤
│  User Application (app/)                                    │
│  ├── Server (controllers, routes, middleware)              │
│  ├── Client (React components, hooks, utils)               │
│  └── Shared (types, interfaces)                            │
└─────────────────────────────────────────────────────────────┘
```

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
  setup: (context) => ({
    onRequest: ({ request, path }) => console.log(`${request.method} ${path}`),
    onError: ({ error, request, path }) => console.error(`ERROR ${request.method} ${path}`)
  })
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

### CLI System (`core/cli/index.ts`)

Interface unificada para todos os comandos:

```typescript
switch (command) {
  case "dev":     await import("@/app/server")           // Full-stack
  case "frontend": await import("@/app/client/frontend-only") // Frontend apenas
  case "backend":  await import("@/app/server/backend-only")  // Backend apenas
  case "build":    await builder.build()                 // Build completo
  case "start":    await import("@/dist/index.js")      // Produção
}
```

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

#### Routes Pattern
```typescript
// app/server/routes/users.routes.ts
export const usersRoutes = new Elysia({ prefix: "/users" })
  .get("/", () => UsersController.getUsers())
  .post("/", ({ body }) => UsersController.createUser(body), {
    body: t.Object({
      name: t.String({ minLength: 2 }),
      email: t.String({ format: "email" })
    })
  })
```

#### Application Entry Point
```typescript
// app/server/index.ts
const app = new FluxStackFramework({ port: 3000 })

app
  .use(loggerPlugin)
  .use(vitePlugin)
  .routes(apiRoutes)

app.listen()
```

### Client Architecture (`app/client/`)

#### API Integration
```typescript
// app/client/src/lib/api.ts
export const api = {
  api: {
    users: {
      get: async () => fetch(`${baseUrl}/api/users`).then(r => r.json()),
      post: async (body: CreateUserRequest) => /* ... */
    }
  }
}
```

#### Component Structure
```typescript
// app/client/src/App.tsx
function App() {
  const [users, setUsers] = useState<User[]>([])
  
  useEffect(() => {
    api.api.users.get().then(({ data }) => setUsers(data.users))
  }, [])
  
  return /* JSX */
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

## Path Alias System

### Configuração Multi-Contexto

**Root Level (`tsconfig.json`)**:
```json
{
  "paths": {
    "@/core/*": ["./core/*"],
    "@/app/*": ["./app/*"],
    "@/config/*": ["./config/*"],
    "@/shared/*": ["./app/shared/*"]
  }
}
```

**Client Level (`app/client/tsconfig.app.json`)**:
```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/components/*": ["./src/components/*"],
    "@/lib/*": ["./src/lib/*"],
    "@/types/*": ["./src/types/*"]
  }
}
```

**Vite Config (`app/client/vite.config.ts`)**:
```typescript
resolve: {
  alias: {
    '@': resolve(__dirname, './src'),
    '@/core': resolve(__dirname, '../../core'),
    '@/shared': resolve(__dirname, '../shared')
  }
}
```

## Plugin System

### Plugin Interface
```typescript
interface Plugin {
  name: string
  setup: (context: FluxStackContext) => void
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
  setup: (context) => {
    console.log(`🔌 Plugin ${name} ativo em modo ${context.isDevelopment ? 'dev' : 'prod'}`)
    // Sua lógica aqui
  }
}

// Uso
app.use(customPlugin)
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

## Deployment Architecture

### Development
- Vite Dev Server com HMR
- Elysia com hot reload
- Proxy automático entre serviços

### Production
- Build estático do React
- Servidor Elysia otimizado
- Static file serving integrado

Esta arquitetura fornece flexibilidade máxima mantendo simplicidade de uso.