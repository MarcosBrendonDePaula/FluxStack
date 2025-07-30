# FluxStack - API Reference

## Core Framework APIs

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

#### Built-in Plugins

##### Logger Plugin
```typescript
import { loggerPlugin } from '@/core/server'

// Logs automáticos de requests e errors
app.use(loggerPlugin)
```

##### Vite Plugin
```typescript
import { vitePlugin } from '@/core/server'

// Integração automática com Vite dev server
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

## Elysia Route Patterns

### Basic Routes
```typescript
import { Elysia } from "elysia"

export const routes = new Elysia({ prefix: "/api" })
  .get("/", () => ({ message: "Hello World" }))
  .post("/users", ({ body }) => createUser(body))
  .get("/users/:id", ({ params: { id } }) => getUserById(id))
  .delete("/users/:id", ({ params: { id } }) => deleteUser(id))
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

### Route with Error Handling
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
        details: error.message 
      }
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String()
    }),
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

## CLI Commands Reference

### Development Commands
```bash
# Framework CLI
flux create <name>         # Create new FluxStack project
flux dev                   # Full-stack development
flux frontend              # Frontend only
flux backend               # Backend only
flux build                 # Build all
flux build:frontend        # Build frontend only
flux build:backend         # Build backend only
flux start                 # Production server

# NPM Scripts
bun run dev                # Same as flux dev
bun run dev:frontend       # Same as flux frontend
bun run dev:backend        # Same as flux backend
bun run build              # Same as flux build
bun run start              # Same as flux start

# Testing Commands
bun run test               # Run tests in watch mode
bun run test:run           # Run tests once
bun run test:ui            # Open Vitest UI
bun run test:coverage      # Generate coverage report
bun run test:watch         # Run tests in watch mode (explicit)
```

### Health Check Endpoints

```bash
# Full-stack mode
curl http://localhost:3000/api/health

# Backend only mode
curl http://localhost:3001/api/health

# Expected response
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.456
}
```

## Path Aliases Reference

### Root Level Aliases
```typescript
"@/core/*"     // ./core/*
"@/app/*"      // ./app/*
"@/config/*"   // ./config/*
"@/shared/*"   // ./app/shared/*
```

### Client Level Aliases
```typescript
"@/*"              // ./src/*
"@/components/*"   // ./src/components/*
"@/utils/*"        // ./src/utils/*
"@/hooks/*"        // ./src/hooks/*
"@/assets/*"       // ./src/assets/*
"@/lib/*"          // ./src/lib/*
"@/types/*"        // ./src/types/*
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

### Test Structure
```typescript
// Unit Test Example
import { describe, it, expect } from 'vitest'
import { UsersController } from '@/app/server/controllers/users.controller'

describe('UsersController', () => {
  it('should create user successfully', async () => {
    const result = await UsersController.createUser({
      name: 'Test User',
      email: 'test@example.com'
    })
    
    expect(result.success).toBe(true)
    expect(result.user?.name).toBe('Test User')
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

### Controller Template
```typescript
// app/server/controllers/entity.controller.ts
import type { Entity, CreateEntityRequest, EntityResponse } from '../types'

export class EntityController {
  static async getEntities() {
    // Implementation
  }

  static async createEntity(data: CreateEntityRequest): Promise<EntityResponse> {
    // Implementation
  }

  static async getEntityById(id: number) {
    // Implementation
  }

  static async updateEntity(id: number, data: Partial<Entity>): Promise<EntityResponse> {
    // Implementation
  }

  static async deleteEntity(id: number): Promise<EntityResponse> {
    // Implementation
  }
}
```

### Route Template
```typescript
// app/server/routes/entity.routes.ts
import { Elysia, t } from "elysia"
import { EntityController } from "../controllers/entity.controller"

export const entityRoutes = new Elysia({ prefix: "/entities" })
  .get("/", () => EntityController.getEntities())
  .get("/:id", ({ params: { id } }) => EntityController.getEntityById(parseInt(id)))
  .post("/", ({ body }) => EntityController.createEntity(body), {
    body: t.Object({
      // Define schema
    })
  })
  .put("/:id", ({ params: { id }, body }) => 
    EntityController.updateEntity(parseInt(id), body)
  )
  .delete("/:id", ({ params: { id } }) => 
    EntityController.deleteEntity(parseInt(id))
  )
```

Esta referência cobre todas as APIs principais do FluxStack para desenvolvimento eficiente.