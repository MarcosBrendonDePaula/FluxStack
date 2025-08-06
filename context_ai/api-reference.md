# FluxStack v1.4.0 - API Reference Monorepo

## Core Framework APIs v1.4.0

### FluxStackFramework Class

```typescript
import { FluxStackFramework } from '@/core/server'

const app = new FluxStackFramework(config?: FluxStackConfig)
```

#### Constructor Options
```typescript
interface FluxStackConfig {
  port?: number              // Default: 3000
  vitePort?: number         // Default: 5173
  clientPath?: string       // Default: "app/client"
  apiPrefix?: string        // Default: "/api"
  cors?: {
    origins?: string[]      // Default: ["*"]
    methods?: string[]      // Default: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    headers?: string[]      // Default: ["Content-Type", "Authorization"]
  }
  build?: {
    outDir?: string         // Default: "dist"
    target?: string         // Default: "bun"
  }
}
```

#### Methods

##### `use(plugin: Plugin)`
Adiciona um plugin ao framework.
```typescript
app.use(loggerPlugin)
app.use(vitePlugin)
```

##### `routes(routeModule: any)`
Registra um módulo de rotas.
```typescript
app.routes(apiRoutes)
```

##### `getApp()`
Retorna a instância do Elysia.
```typescript
const elysia = app.getApp()
```

##### `getContext()`
Retorna o contexto do framework.
```typescript
const context = app.getContext()
console.log(context.isDevelopment) // boolean
```

##### `listen(callback?: () => void)`
Inicia o servidor.
```typescript
app.listen(() => console.log('Servidor iniciado!'))
```

### Plugin System

#### Plugin Interface
```typescript
interface Plugin {
  name: string
  setup: (context: FluxStackContext) => void | PluginHandlers
}

interface FluxStackContext {
  config: FluxStackConfig
  isDevelopment: boolean
  isProduction: boolean
}

interface PluginHandlers {
  onRequest?: (context: RequestContext) => void
  onError?: (context: ErrorContext) => void
  handler?: (request: Request) => Response | Promise<Response>
}
```

#### Built-in Plugins v1.4.0

##### Logger Plugin
```typescript
import { loggerPlugin } from '@/core/server'

// Logs automáticos de requests e errors
app.use(loggerPlugin)
```

##### ✨ Swagger Plugin (NOVO)
```typescript
import { swaggerPlugin } from '@/core/server'

// ⚠️ IMPORTANTE: Registrar ANTES das rotas
app.use(swaggerPlugin)  // Primeiro
app.routes(apiRoutes)   // Depois

// URLs disponíveis:
// http://localhost:3000/swagger     - Swagger UI
// http://localhost:3000/swagger/json - OpenAPI spec
```

##### ✨ Vite Plugin com Detecção Inteligente
```typescript
import { vitePlugin } from '@/core/server'

// Integração inteligente:
// - Detecta se Vite já está rodando
// - Não reinicia processo existente
// - Hot reload independente
app.use(vitePlugin)
```

##### Static Plugin
```typescript
import { staticPlugin } from '@/core/server'

// Serve arquivos estáticos em produção
app.use(staticPlugin)
```

#### Custom Plugin Example
```typescript
const customPlugin: Plugin = {
  name: "custom-auth",
  setup: (context) => ({
    onRequest: ({ request, set }) => {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader) {
        set.status = 401
        return { error: 'Unauthorized' }
      }
    }
  })
}

app.use(customPlugin)
```

## Build System API

### FluxStackBuilder Class

```typescript
import { FluxStackBuilder } from '@/core/build'

const builder = new FluxStackBuilder(config)
```

#### Methods

##### `buildClient()`
Build do frontend (React + Vite).
```typescript
await builder.buildClient()
```

##### `buildServer()`
Build do backend (Elysia + Bun).
```typescript
await builder.buildServer()
```

##### `build()`
Build completo (client + server).
```typescript
await builder.build()
```

## Standalone Mode APIs

### Backend Standalone

```typescript
import { startBackendOnly, createStandaloneServer } from '@/core/server/standalone'

// Modo simples
await startBackendOnly(routes, { port: 3001 })

// Modo avançado
const app = createStandaloneServer({ port: 3001 })
app.routes(myRoutes)
app.listen()
```

### Frontend Standalone

```typescript
import { startFrontendOnly } from '@/core/client/standalone'

startFrontendOnly({
  clientPath: "app/client",
  vitePort: 5173,
  apiUrl: "http://localhost:3001"
})
```

## Elysia Route Patterns com Swagger v1.4.0

### Basic Routes com Documentation
```typescript
import { Elysia } from "elysia"

export const routes = new Elysia({ prefix: "/api" })
  .get("/", () => ({ message: "Hello World" }), {
    detail: {
      tags: ['General'],
      summary: 'Welcome message',
      description: 'Returns a welcome message from the API'
    }
  })
  .post("/users", ({ body }) => createUser(body), {
    detail: {
      tags: ['Users'],
      summary: 'Create User',
      description: 'Create a new user in the system'
    }
  })
  .get("/users/:id", ({ params: { id } }) => getUserById(id), {
    detail: {
      tags: ['Users'],
      summary: 'Get User by ID',
      description: 'Retrieve a specific user by their ID'
    }
  })
  .delete("/users/:id", ({ params: { id } }) => deleteUser(id), {
    detail: {
      tags: ['Users'],
      summary: 'Delete User',
      description: 'Delete a user from the system'
    }
  })
```

### Route with Validation
```typescript
import { Elysia, t } from "elysia"

export const routes = new Elysia()
  .post("/users", ({ body }) => createUser(body), {
    body: t.Object({
      name: t.String({ minLength: 2, maxLength: 50 }),
      email: t.String({ format: "email" }),
      age: t.Number({ minimum: 0, maximum: 120 })
    }),
    response: t.Object({
      success: t.Boolean(),
      user: t.Optional(t.Object({
        id: t.Number(),
        name: t.String(),
        email: t.String()
      })),
      message: t.Optional(t.String())
    })
  })
```

### Route with Error Handling v1.4.0
```typescript
export const routes = new Elysia()
  .post("/users", async ({ body, set }) => {
    try {
      return await createUser(body)
    } catch (error) {
      set.status = 400
      return { 
        success: false, 
        error: "Validation failed",
        // ✨ CORRIGIDO: Type-safe error handling
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 2 }),
      email: t.String({ format: "email" })
    }),
    detail: {
      tags: ['Users'],
      summary: 'Create User with Validation',
      description: 'Create a new user with proper validation and error handling'
    },
    error({ code, error, set }) {
      switch (code) {
        case 'VALIDATION':
          set.status = 400
          return { success: false, error: "Invalid data" }
        default:
          set.status = 500
          return { success: false, error: "Internal server error" }
      }
    }
  })
```

## TypeBox Validation Schemas

### Basic Types
```typescript
import { t } from "elysia"

// String validation
t.String()                          // Any string
t.String({ minLength: 2 })          // Min 2 characters
t.String({ maxLength: 100 })        // Max 100 characters
t.String({ format: "email" })       // Email format
t.String({ format: "uri" })         // URI format
t.String({ pattern: "^[A-Z]+$" })   // Regex pattern

// Number validation
t.Number()                          // Any number
t.Number({ minimum: 0 })            // Min value
t.Number({ maximum: 100 })          // Max value
t.Number({ multipleOf: 2 })         // Must be multiple of 2

// Boolean
t.Boolean()                         // true/false

// Date
t.Date()                            // Date object
```

### Complex Types
```typescript
// Object validation
t.Object({
  name: t.String({ minLength: 2 }),
  email: t.String({ format: "email" }),
  age: t.Optional(t.Number({ minimum: 0 })),
  tags: t.Array(t.String())
})

// Array validation
t.Array(t.String())                 // Array of strings
t.Array(t.Number(), { minItems: 1 }) // Min 1 item
t.Array(t.Object({                  // Array of objects
  id: t.Number(),
  name: t.String()
}))

// Union types
t.Union([
  t.String(),
  t.Number()
])

// Enum
t.Union([
  t.Literal('admin'),
  t.Literal('user'),
  t.Literal('guest')
])
```

## Environment Variables

### Development
```bash
NODE_ENV=development
FRONTEND_PORT=5173
BACKEND_PORT=3001
API_URL=http://localhost:3001
```

### Production
```bash
NODE_ENV=production
PORT=3000
```

## CLI Commands Reference v1.4.0

### 📦 Monorepo Installation
```bash
# ✨ Unified installation
bun install                # Install ALL dependencies (backend + frontend)

# ✨ Add libraries (works for both!)
bun add <library>          # Available in frontend AND backend
bun add -d <dev-library>   # Dev dependency for both

# Examples:
bun add zod                # ✅ Available in frontend AND backend
bun add react-router-dom   # ✅ Frontend (types in backend)
bun add prisma             # ✅ Backend (types in frontend)
```

### ⚡ Development Commands with Independent Hot Reload
```bash
# Framework CLI
flux create <name>         # Create new FluxStack project
flux dev                   # ✨ Full-stack: Backend:3000 + Frontend integrated:5173
flux frontend              # ✨ Frontend only: Vite:5173
flux backend               # ✨ Backend only: API:3001
flux build                 # Build all
flux build:frontend        # Build frontend only
flux build:backend         # Build backend only
flux start                 # Production server

# NPM Scripts (recommended)
bun run dev                # ✨ Independent hot reload for backend & frontend
bun run dev:frontend       # Vite dev server pure (5173)
bun run dev:backend        # Backend standalone (3001)
bun run build              # Unified build system
bun run start              # Production server
bun run legacy:dev         # Direct Bun watch mode

# ✨ Testing Commands (30 tests included)
bun run test               # Watch mode (development)
bun run test:run          # Run once (CI/CD)
bun run test:ui           # Vitest visual interface
bun run test:coverage     # Coverage report
```

### Health Check Endpoints v1.4.0

```bash
# ✨ Full-stack mode (integrated)
curl http://localhost:3000/api/health

# ✨ Backend standalone mode
curl http://localhost:3001/api/health

# ✨ Expected response (enhanced)
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "uptime": 123.456,
  "version": "1.4.0",
  "environment": "development"
}
```

### ✨ New API Endpoints v1.4.0

```bash
# Swagger Documentation
curl http://localhost:3000/swagger/json     # OpenAPI spec
open http://localhost:3000/swagger          # Swagger UI

# API Root
curl http://localhost:3000/api              # Welcome message

# Users CRUD (example)
curl http://localhost:3000/api/users        # List users
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "João", "email": "joao@example.com"}'
```

## Path Aliases Reference v1.4.0 (Unified)

### ✨ Root Level Aliases (Available Everywhere)
```typescript
// Framework level - available in backend AND frontend
"@/core/*"     // ./core/*              (framework core)
"@/app/*"      // ./app/*               (your application)
"@/config/*"   // ./config/*            (configurations)
"@/shared/*"   // ./app/shared/*        (shared types)
```

### ✨ Frontend Level Aliases (Within app/client/src)
```typescript
// Frontend specific - within React components
"@/*"              // ./app/client/src/*
"@/components/*"   // ./app/client/src/components/*
"@/lib/*"          // ./app/client/src/lib/*
"@/hooks/*"        // ./app/client/src/hooks/*
"@/types/*"        // ./app/client/src/types/*
"@/assets/*"       // ./app/client/src/assets/*
```

### ✨ Cross-System Access (Monorepo Magic)
```typescript
// ✅ Frontend accessing backend types
import type { User } from '@/app/server/types'
import type { CreateUserRequest } from '@/shared/types'

// ✅ Backend using shared types
import type { User, CreateUserRequest } from '@/shared/types'

// ✅ Example usage
// app/client/src/components/UserList.tsx
import { api, apiCall } from '@/lib/eden-api'
import type { User } from '@/shared/types'  // ✨ Automatic sharing!
```

## Testing System API

### Vitest Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
```

### Test Structure v1.4.0 (With Isolation)
```typescript
// Unit Test Example with Data Isolation
import { describe, it, expect, beforeEach } from 'vitest'
import { UsersController } from '@/app/server/controllers/users.controller'

describe('UsersController', () => {
  // ✨ NOVO: Reset data before each test
  beforeEach(() => {
    UsersController.resetForTesting()
  })

  it('should create user successfully', async () => {
    const result = await UsersController.createUser({
      name: 'Test User',
      email: 'test@example.com'
    })
    
    expect(result.success).toBe(true)
    expect(result.user?.name).toBe('Test User')
  })

  it('should delete user successfully', async () => {
    // Create user first
    await UsersController.createUser({
      name: 'Delete Me',
      email: 'delete@example.com'
    })
    
    // Then delete
    const result = await UsersController.deleteUser(3) // New ID
    expect(result.success).toBe(true)
  })
})
```

### React Component Testing
```typescript
// Component Test Example
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('MyComponent', () => {
  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(screen.getByText('Clicked!')).toBeInTheDocument()
  })
})
```

### API Integration Testing
```typescript
// Integration Test Example
import { Elysia } from 'elysia'
import { usersRoutes } from '@/app/server/routes/users.routes'

describe('Users API', () => {
  let app: Elysia

  beforeEach(() => {
    app = new Elysia().use(usersRoutes)
  })

  it('should create user via API', async () => {
    const response = await app.handle(new Request('http://localhost/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@example.com' })
    }))
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
```

## Common Response Patterns

### Success Response
```typescript
interface SuccessResponse<T> {
  success: true
  data: T
  message?: string
}
```

### Error Response
```typescript
interface ErrorResponse {
  success: false
  error: string
  details?: string
  code?: string
}
```

### List Response
```typescript
interface ListResponse<T> {
  success: true
  data: T[]
  total: number
  page?: number
  limit?: number
}
```

## File Structure Templates

### Controller Template v1.4.0 (With Test Support)
```typescript
// app/server/controllers/entity.controller.ts
import type { Entity, CreateEntityRequest, EntityResponse } from '@/shared/types' // ✨ Unified import

// ✨ In-memory storage (replace with DB in production)
let entities: Entity[] = []

export class EntityController {
  static async getEntities() {
    return { entities }
  }

  static async createEntity(data: CreateEntityRequest): Promise<EntityResponse> {
    const newEntity: Entity = {
      id: Date.now(),
      ...data,
      createdAt: new Date()
    }

    entities.push(newEntity)

    return {
      success: true,
      entity: newEntity
    }
  }

  static async getEntityById(id: number) {
    const entity = entities.find(e => e.id === id)
    return entity ? { entity } : null
  }

  static async updateEntity(id: number, data: Partial<Entity>): Promise<EntityResponse> {
    const index = entities.findIndex(e => e.id === id)
    
    if (index === -1) {
      return {
        success: false,
        message: "Entity não encontrada"
      }
    }

    entities[index] = { ...entities[index], ...data }
    
    return {
      success: true,
      entity: entities[index],
      message: "Entity atualizada com sucesso"
    }
  }

  static async deleteEntity(id: number): Promise<EntityResponse> {
    const index = entities.findIndex(e => e.id === id)
    
    if (index === -1) {
      return {
        success: false,
        message: "Entity não encontrada"
      }
    }

    const deletedEntity = entities.splice(index, 1)[0]
    
    return {
      success: true,
      entity: deletedEntity,
      message: "Entity deletada com sucesso"
    }
  }

  // ✨ NOVO: Method for test isolation
  static resetForTesting() {
    entities.splice(0, entities.length)
    // Add default test data if needed
    entities.push(
      {
        id: 1,
        name: "Test Entity 1",
        createdAt: new Date()
      },
      {
        id: 2,
        name: "Test Entity 2",
        createdAt: new Date()
      }
    )
  }
}
```

### Route Template v1.4.0 (With Swagger Docs)
```typescript
// app/server/routes/entity.routes.ts
import { Elysia, t } from "elysia"
import { EntityController } from "../controllers/entity.controller"

export const entityRoutes = new Elysia({ prefix: "/entities" })
  .get("/", () => EntityController.getEntities(), {
    detail: {
      tags: ['Entities'],
      summary: 'List Entities',
      description: 'Retrieve a list of all entities in the system'
    }
  })
  
  .get("/:id", ({ params: { id } }) => {
    const result = EntityController.getEntityById(parseInt(id))
    if (!result) {
      return { error: "Entity não encontrada" }
    }
    return result
  }, {
    params: t.Object({
      id: t.String()
    }),
    detail: {
      tags: ['Entities'],
      summary: 'Get Entity by ID',
      description: 'Retrieve a specific entity by its ID'
    }
  })
  
  .post("/", async ({ body, set }) => {
    try {
      return await EntityController.createEntity(body)
    } catch (error) {
      set.status = 400
      return {
        success: false,
        error: "Dados inválidos",
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 2 }),
      // Add other required fields
    }),
    detail: {
      tags: ['Entities'],
      summary: 'Create Entity',
      description: 'Create a new entity with validation'
    }
  })
  
  .put("/:id", async ({ params: { id }, body, set }) => {
    try {
      return await EntityController.updateEntity(parseInt(id), body)
    } catch (error) {
      set.status = 400
      return {
        success: false,
        error: "Erro ao atualizar entity",
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      name: t.Optional(t.String({ minLength: 2 }))
      // Add other optional fields
    }),
    detail: {
      tags: ['Entities'],
      summary: 'Update Entity',
      description: 'Update an existing entity by ID'
    }
  })
  
  .delete("/:id", ({ params: { id } }) => 
    EntityController.deleteEntity(parseInt(id)), {
    params: t.Object({
      id: t.String()
    }),
    detail: {
      tags: ['Entities'],
      summary: 'Delete Entity',
      description: 'Delete an entity by its ID'
    }
  })
```

## ✨ Eden Treaty Type-Safe Client API v1.4.0

### Eden Treaty Setup
```typescript
// app/client/src/lib/eden-api.ts
import { treaty } from '@elysiajs/eden'
import type { App } from '@/app/server/app' // ✨ Import server types

function getBaseUrl() {
  if (import.meta.env.DEV) {
    return 'http://localhost:3000'
  }
  return window.location.origin
}

// ✨ Type-safe client
const client = treaty<App>(getBaseUrl())
export const api = client.api

// ✨ Error handling wrapper
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

### Eden Treaty Usage Examples
```typescript
// ✨ Completely type-safe API calls!

// List entities
const entities = await apiCall(api.entities.get())

// Create entity (with validation)
const newEntity = await apiCall(api.entities.post({
  name: "My Entity",          // ✅ Type-safe
  description: "Test"         // ✅ Validated automatically
}))

// Get by ID
const entity = await apiCall(api.entities({ id: '1' }).get())

// Update entity
const updated = await apiCall(api.entities({ id: '1' }).put({
  name: "Updated Name"
}))

// Delete entity
await apiCall(api.entities({ id: '1' }).delete())

// ✨ All with full TypeScript autocomplete and validation!
```

## 🌐 Environment Variables v1.4.0

### Development (.env)
```bash
# Framework
NODE_ENV=development
FRAMEWORK_VERSION=1.4.0

# Ports
FRONTEND_PORT=5173          # Vite dev server
BACKEND_PORT=3000           # Main server (full-stack)
BACKEND_STANDALONE_PORT=3001 # Backend-only server

# API Configuration
API_URL=http://localhost:3000
API_PREFIX=/api

# Vite Configuration
VITE_API_URL=http://localhost:3000
```

### Production (.env.production)
```bash
NODE_ENV=production
PORT=3000
API_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com
```

## 📊 Performance Metrics v1.4.0

### Development Performance
```bash
# Installation speed (monorepo)
bun install                 # ~3-15s (vs ~30-60s dual package.json)

# Startup times
bun run dev                 # ~1-2s full-stack startup

# Hot reload performance
# Backend change: ~500ms (Bun --watch)
# Frontend change: ~100ms (Vite HMR)

# Build performance
bun run build              # ~10-30s total
bun run build:frontend     # ~5-20s (Vite + React 19)
bun run build:backend      # ~2-5s (Bun native)
```

Esta referência v1.4.0 cobre todas as APIs principais do FluxStack com foco na **arquitetura monorepo unificada**, **type-safety end-to-end** e **hot reload independente** para desenvolvimento eficiente e moderno! ⚡