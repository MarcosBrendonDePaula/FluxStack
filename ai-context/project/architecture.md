# 🏗️ FluxStack - Arquitetura Detalhada

> **Arquitetura completa**: Como o framework funciona internamente

## 📊 **Visão Geral da Arquitetura**

FluxStack implementa uma arquitetura **monorepo modular** com separação clara entre framework core e código da aplicação, garantindo escalabilidade e manutenibilidade.

```
┌─────────────────────────────────────────────────────────────┐
│                      FluxStack                              │
├─────────────────────────────────────────────────────────────┤
│  🎨 Frontend (React + Vite)                                 │
│  ├─ Components & Pages                                      │
│  ├─ Eden Treaty Client ←─────────────────────┐              │
│  └─ Hooks & Utils                            │              │
├─────────────────────────────────────────────┼──────────────┤
│  🔌 Communication Layer                     │              │
│  └─ Eden Treaty (Type-safe HTTP) ────────────┘              │
├─────────────────────────────────────────────────────────────┤
│  🚀 Backend (Elysia + Bun)                                  │
│  ├─ Controllers (Business Logic)                            │
│  ├─ Routes (API Endpoints)                                  │
│  ├─ Types (Shared with Frontend)                            │
│  └─ App Export (for Eden Treaty)                            │
├─────────────────────────────────────────────────────────────┤
│  ⚙️ Framework Core (Read-Only)                              │
│  ├─ Server Framework                                        │
│  ├─ Plugin System                                           │
│  ├─ Build System                                            │
│  └─ Configuration Management                                │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 **Core Principles**

### **1. 🔒 Separation of Concerns**
- **`core/`**: Framework code (read-only, versioned)
- **`app/`**: Application code (user-editable)
- **Clear boundaries**: Framework vs Application

### **2. ⚡ Type Safety First**
- **End-to-end types**: Client ↔ Server automaticamente sincronizados
- **Zero duplicação**: Types definidos uma vez, usados em todo lugar
- **Compile-time validation**: Erros detectados antes do runtime

### **3. 🔄 Hot Development**
- **Independent reloading**: Backend e Frontend recarregam separadamente
- **Fast iterations**: Mudanças refletem instantaneamente
- **Zero downtime**: Desenvolvimento sem interrupções

## 🏗️ **Arquitetura Detalhada**

### **📁 Estrutura de Diretórios**
```
FluxStack/
├── core/                        # 🔒 FRAMEWORK CORE
│   ├── server/
│   │   ├── framework.ts         # Classe principal FluxStackFramework
│   │   └── plugins/             # Sistema de plugins built-in
│   │       ├── logger.ts        # Logging avançado
│   │       ├── swagger.ts       # Documentação automática
│   │       ├── vite.ts          # Integração Vite
│   │       └── static.ts        # Arquivos estáticos
│   ├── config/
│   │   ├── env-dynamic.ts       # Environment variables dinâmicas
│   │   └── runtime-config.ts    # Configuração runtime
│   ├── types/
│   │   └── index.ts             # Types do framework
│   └── build/
│       └── index.ts             # Sistema de build
├── app/                         # 👨‍💻 APPLICATION CODE
│   ├── server/
│   │   ├── controllers/         # Business logic
│   │   ├── routes/              # API endpoints
│   │   └── app.ts               # App type export
│   ├── client/
│   │   ├── src/
│   │   │   ├── components/      # React components
│   │   │   ├── lib/             # Eden Treaty client
│   │   │   └── App.tsx          # Main interface
│   │   └── public/              # Static assets
│   └── shared/
│       └── types/               # Shared types
└── ai-context/                  # 📖 LLM Documentation
```

### **⚙️ Framework Core Architecture**

#### **🎮 FluxStackFramework Class**
```typescript
export class FluxStackFramework {
  private app: Elysia
  private plugins: Plugin[] = []
  
  constructor(options: FluxStackOptions) {
    this.app = new Elysia()
    this.loadCorePlugins()
    this.setupRoutes()
  }
  
  // Plugin system
  use(plugin: Plugin): this
  
  // Development server  
  startDev(): Promise<void>
  
  // Production server
  start(): Promise<void>
  
  // Build system
  build(): Promise<void>
}
```

#### **🔌 Plugin System**
```typescript
export interface Plugin {
  name: string
  version?: string
  dependencies?: string[]
  setup(context: FluxStackContext, app: Elysia): void
}

// Built-in plugins
const corePlugins = [
  loggerPlugin,     // Request/response logging
  swaggerPlugin,    // API documentation
  vitePlugin,       // Frontend integration
  staticPlugin      // Static file serving
]
```

### **🔄 Communication Architecture**

#### **📡 Eden Treaty Integration**
```typescript
// Server: Export app type
export type App = typeof appInstance

// Client: Import and use
import { treaty } from '@elysiajs/eden'
import type { App } from '../../../server/app'

const client = treaty<App>(baseUrl)
export const api = client.api  // ✨ Full type inference
```

#### **🔒 Type Flow**
```
1. Server defines routes with TypeBox schemas
2. Elysia generates TypeScript types
3. App.ts exports combined app type  
4. Eden Treaty imports app type
5. Client gets automatic type inference
6. Changes server → automatic client updates
```

## 🚀 **Runtime Architecture**

### **🔄 Development Mode**
```
┌─────────────────┐    ┌─────────────────┐
│   Bun Process   │    │   Vite Process  │
│                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │FluxStack    │ │    │ │React HMR    │ │
│ │Framework    │ │    │ │Server       │ │
│ │:3000        │ │    │ │:5173        │ │
│ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘
         │                       │
         └─────── CORS ──────────┘
              (Different ports)
```

### **🏭 Production Mode**
```
┌─────────────────────────────────┐
│         Bun Process             │
│                                 │
│ ┌─────────────┐ ┌─────────────┐ │
│ │FluxStack    │ │Static Files │ │
│ │API Server   │ │Server       │ │
│ │:3000/api    │ │:3000/       │ │
│ └─────────────┘ └─────────────┘ │
└─────────────────────────────────┘
          Single process
```

## 🛠️ **Build Architecture**

### **📦 Build Stages**
```typescript
// 1. Frontend Build (Vite)
const frontendBuild = {
  input: 'app/client/src/main.tsx',
  output: 'dist/client/',
  mode: 'production',
  env: process.env
}

// 2. Backend Build (Bun)  
const backendBuild = {
  input: 'app/server/index.ts',
  output: 'dist/server/',
  target: 'bun',
  minify: true
}

// 3. Framework Core (No build - TypeScript)
// Core remains as TypeScript for performance
```

### **🐳 Docker Architecture**
```dockerfile
# Multi-stage build
FROM oven/bun:1 as builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build stage
COPY . .
RUN bun run build

# Runtime stage  
FROM oven/bun:1 as runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["bun", "dist/index.js"]
```

## ⚡ **Performance Architecture**

### **🚀 Bun Runtime Benefits**
- **3x faster startup** vs Node.js
- **Built-in bundler** (faster than webpack)
- **Native fetch** & Web APIs
- **Low memory footprint**

### **📈 Elysia Performance**
- **Zero-cost abstractions**
- **Compile-time optimizations**  
- **Minimal runtime overhead**
- **Built-in validation** with TypeBox

### **🔄 Hot Reload Strategy**
```typescript
// Backend: File watching with Bun
Bun.watch("app/server/**/*.ts", {
  onUpdate: () => {
    // Restart server preserving connections
    server.reload()
  }
})

// Frontend: Vite HMR
// Independent hot module replacement
// No server restart required
```

## 🧪 **Testing Architecture**

### **🔬 Test Strategy**
```
┌─────────────────────────────────────────┐
│               Test Pyramid              │
├─────────────────────────────────────────┤
│  E2E Tests (Playwright)                 │ ← Full app tests
├─────────────────────────────────────────┤
│  Integration Tests (Vitest)             │ ← API + UI tests  
├─────────────────────────────────────────┤
│  Unit Tests (Vitest + React Testing)    │ ← Component tests
└─────────────────────────────────────────┘
```

### **🧪 Test Configuration**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',        // React testing
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})
```

## 🔧 **Configuration Architecture**

### **⚙️ Dynamic Environment System**
```typescript
// Precedence: Process Env > Runtime > .env > Defaults
class EnvironmentManager {
  static precedence = [
    'process.env',     // Highest priority
    'runtime.env',     // Runtime overrides  
    'file.env',        // .env file
    'defaults'         // Framework defaults
  ]
  
  static get(key: string): string {
    return this.resolveWithPrecedence(key)
  }
}
```

### **🎛️ Plugin Configuration**
```typescript
interface PluginConfig {
  logger: {
    level: 'debug' | 'info' | 'warn' | 'error'
    format: 'json' | 'pretty'
  }
  swagger: {
    path: string
    title: string
    version: string
  }
  vite: {
    port: number
    host: string
    open: boolean
  }
}
```

## 🚀 **Deployment Architecture**

### **☁️ Production Deployment Options**

#### **1. Single Container (Recommended)**
```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
```

#### **2. Microservices (Advanced)**
```yaml
services:
  api:
    build: 
      target: api-only
    ports:
      - "3000:3000"
      
  frontend:
    build:
      target: frontend-only  
    ports:
      - "80:80"
```

#### **3. Serverless (Future)**
```typescript
// Planned: Vercel/Netlify adapters
export default FluxStackFramework.createServerlessHandler({
  platform: 'vercel' | 'netlify' | 'aws-lambda'
})
```

## 🔮 **Future Architecture**

### **📈 Planned Enhancements**
- **Database Layer**: Native ORM integration
- **Authentication**: Built-in auth system
- **Real-time**: WebSocket support
- **Microservices**: Service mesh support
- **Observability**: Metrics & tracing

### **🎯 Architecture Goals**
- **Zero config** for common use cases
- **Infinite customization** for advanced needs
- **Production ready** out of the box
- **Developer happiness** as top priority

---

**🎯 Esta arquitetura garante que FluxStack seja tanto simples para começar quanto poderoso para escalar!**