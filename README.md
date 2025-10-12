# create-fluxstack

> Create modern full-stack TypeScript applications with zero configuration.

[![npm version](https://badge.fury.io/js/create-fluxstack.svg)](https://www.npmjs.com/package/create-fluxstack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Quick Start

```bash
# create a new FluxStack app
bunx create-fluxstack my-awesome-app

# navigate and start developing
cd my-awesome-app
bun run dev
```

That's it! Your full-stack TypeScript app is ready at:

- **Backend**: http://localhost:3000  
- **Frontend (proxy)**: http://localhost:3000/  
- **API Docs**: http://localhost:3000/swagger

---

## What You Get

### Modern Tech Stack
- **Bun Runtime** – 3x faster than Node.js
- **Elysia.js** – ultra-fast backend framework
- **React 19** – latest concurrent features
- **Tailwind CSS v4** – modern styling workflow
- **Vite 7** – instant dev server and builds
- **TypeScript 5** – end-to-end static typing

### Zero Configuration Features
- **Type Safety** – Eden Treaty with automatic inference
- **Hot Reload** – backend + frontend in sync
- **Auto Documentation** – Swagger UI out of the box
- **Git Ready** – sensible `.gitignore` and project layout
- **Production Ready** – optimized build scripts and Docker targets
- **AI Context** – docs tailored for LLM assistants

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FluxStack Monorepo                      │
├─────────────────────────────────────────────────────────────┤
│ app/                                                        │
│  ├─ Frontend (React + Vite)                                 │
│  ├─ Backend (Elysia + Bun)                                  │
│  └─ Shared Types / Utils                                    │
├─────────────────────────────────────────────────────────────┤
│ core/                                                       │
│  ├─ Server Framework                                        │
│  ├─ Plugin System                                           │
│  └─ Build System                                            │
├─────────────────────────────────────────────────────────────┤
│ Communication Layer (Eden Treaty, WebSockets)               │
├─────────────────────────────────────────────────────────────┤
│ Configuration Management                                    │
└─────────────────────────────────────────────────────────────┘
```

```
my-awesome-app/
├─ core/                   # FluxStack framework (do not modify)
│  ├─ framework/           # FluxStackFramework (Elysia + plugins)
│  ├─ plugins/             # Built-in plugins (swagger, vite, static…)
│  ├─ build/               # Bundler + optimizer + Docker helpers
│  ├─ cli/                 # Flux CLI commands and generators
│  └─ config/, utils/      # Declarative schemas & helpers
├─ app/                    # Your application code
│  ├─ server/              # Backend API routes, controllers, live components
│  │  ├─ controllers/      # Business logic
│  │  ├─ routes/           # API endpoints and schemas
│  │  ├─ types/            # Shared types, Eden Treaty app export
│  │  └─ live/             # WebSocket-driven live components
│  ├─ client/              # React SPA (components, pages, hooks, store)
│  └─ shared/              # Shared types/utilities between client and server
├─ config/                 # Project-specific config built on declarative schema
├─ plugins/                # Optional external plugins (e.g. crypto-auth)
├─ ai-context/             # Documentation for AI assistants
└─ package.json, README.md # Project metadata
```

---

## Available Scripts

```bash
# Development
bun run dev              # start full-stack development (proxy + Vite)
bun run dev:clean        # same as dev but with quieter logs
bun run dev:frontend     # run only the frontend (port 5173)
bun run dev:backend      # run only the backend (port 3001)

# Production
bun run build            # build frontend + backend + manifest
bun run start            # start production bundle

# Utilities
bun run typecheck        # TypeScript type checking
bun run test             # run test suite (Vitest)
```

---

## Type-Safe API Development

FluxStack uses Eden Treaty to infer types end-to-end.

### Backend (Elysia.js)
```ts
// app/server/routes/users.ts
import { Elysia, t } from 'elysia'

export const userRoutes = new Elysia({ prefix: '/users' })
  .get('/', () => ({ users: getAllUsers() }))
  .post('/', ({ body }) => createUser(body), {
    body: t.Object({
      name: t.String(),
      email: t.String({ format: 'email' })
    }),
    response: t.Object({
      success: t.Boolean(),
      user: t.Optional(t.Object({
        id: t.Number(),
        name: t.String(),
        email: t.String(),
        createdAt: t.Date()
      }))
    })
  })
```

### Frontend
```tsx
// app/client/src/components/Users.tsx
import { api } from '../lib/eden-api'

export function UsersList() {
  const [users, setUsers] = useState<User[]>([])

  const createUser = async (userData: CreateUserData) => {
    const { data, error } = await api.users.post(userData)
    if (!error && data.user) {
      setUsers(prev => [...prev, data.user])
    }
  }

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

---

## Customisation Highlights

### Add API Routes
```ts
// app/server/routes/posts.ts
import { Elysia, t } from 'elysia'

export const postRoutes = new Elysia({ prefix: '/posts' })
  .get('/', () => ({ posts: [] }))
  .post('/', ({ body }) => ({ post: body }), {
    body: t.Object({
      title: t.String(),
      content: t.String()
    })
  })

// app/server/index.ts
import { postRoutes } from './routes/posts'
app.use(postRoutes)
```

### Create a Custom Plugin
```ts
// app/server/plugins/auth.ts
import { Elysia } from 'elysia'

export const authPlugin = new Elysia({ name: 'auth' })
  .derive(({ headers }) => ({
    user: getUserFromToken(headers.authorization)
  }))
  .guard({
    beforeHandle({ user, set }) {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized' }
      }
    }
  })
```

---

## Documentation & AI Support

- **Full docs**: see the `ai-context/` folder.
- **Assistant guidance**: `CLAUDE.md`.
- **Quick start (AI)**: `ai-context/00-QUICK-START.md`.
- **Examples**: CRUD and plugin samples included.

---

## Community

- **Issues**: [Report bugs](https://github.com/MarcosBrendonDePaula/FluxStack/issues)
- **Docs**: [Full documentation](https://github.com/MarcosBrendonDePaula/FluxStack)
- **Discussions**: [GitHub Discussions](https://github.com/MarcosBrendonDePaula/FluxStack/discussions)

---

## Upgrading

```bash
# grab the latest template
bunx create-fluxstack@latest my-new-app

# check current version
npm list -g create-fluxstack
```

---

## Why FluxStack?

### Developer Experience
- Zero configuration: start coding immediately.
- Type safety: full inference, no manual DTOs.
- Hot reload: backend and frontend in sync.
- Auto docs: Swagger generated from route schemas.

### Performance
- Bun runtime: faster startup and lower memory.
- Elysia: one of the fastest TypeScript frameworks.
- Vite: instant HMR and optimized builds.
- React 19: cutting-edge UI runtime.

### Production Ready
- Docker: optimized multi-stage builds.
- Configuration: declarative schema with environment overrides.
- Error handling: unified response structure.
- Monitoring: optional plugin with metrics/exporters.

### Modern Stack
- TypeScript 5, React 19, Tailwind v4, Eden Treaty.
- Shared types everywhere; Eden Treaty clients auto-generated.
- Live components via WebSocket plugin.

---

## Requirements

- **Bun** ≥ 1.2.0

### Install Bun
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
```

> FluxStack targets the Bun runtime. Node.js is not supported.

---

### Get Started Now!

```bash
bunx create-fluxstack my-dream-app
cd my-dream-app
bun run dev
```

Welcome to the future of full-stack development.

