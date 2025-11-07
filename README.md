# create-fluxstack

Create modern full-stack TypeScript applications with zero configuration.

[![npm version](https://badge.fury.io/js/create-fluxstack.svg)](https://www.npmjs.com/package/create-fluxstack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Quick Start

```bash
# scaffold a new FluxStack app
bunx create-fluxstack my-awesome-app

# enter the project and start developing
cd my-awesome-app
bun run dev
```

Your development environment will be available at:

- **Backend**: http://localhost:3000  
- **Frontend (proxied)**: http://localhost:3000/  
- **API Docs**: http://localhost:3000/swagger

---

## What You Get

### Modern Tech Stack
- Bun runtime (3x faster than Node.js)
- Elysia.js backend
- React 19.1+ / Vite 7.1+ frontend
- Tailwind CSS v4 styling
- TypeScript 5.8+ end-to-end typing

### Zero-Config Features
- Automatic Eden Treaty type inference
- Coordinated hot reload (backend + frontend)
- Swagger documentation out of the box
- Production-ready build scripts and Docker templates
- AI-focused documentation (`ai-context/`)

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
FluxStack/
├─ core/                    # framework internals (read-only)
│  ├─ framework/            # FluxStackFramework (Elysia orchestrator)
│  ├─ plugins/              # built-in plugins (swagger, vite, static, monitoring)
│  ├─ build/                # bundler, optimizer, Docker scaffolding
│  ├─ cli/                  # flux CLI commands and generators
│  ├─ config/               # declarative schema helpers
│  └─ utils/                # logging, environment helpers, etc.
├─ app/                     # your editable application code
│  ├─ server/               # API routes, controllers, services, live components
│  │  ├─ controllers/       # business logic
│  │  ├─ routes/            # endpoints + schemas
│  │  ├─ types/             # shared types and App export for Eden Treaty
│  │  └─ live/              # WebSocket live components
│  ├─ client/               # React SPA (components, pages, hooks, store)
│  └─ shared/               # cross-layer types/utilities
├─ config/                  # project-specific config built on the schema
├─ plugins/                 # optional external plugins (e.g. crypto-auth)
├─ ai-context/              # documentation tailored for assistants
└─ package.json / README.md # project metadata
```

---

## Available Scripts

```bash
# development
bun run dev              # full stack with proxy + vite
bun run dev              # logs are automatically filtered in development
bun run dev:frontend     # only the frontend (port 5173, no proxy)
bun run dev:backend      # only the backend (port 3001)

# production
bun run build            # build backend + frontend + manifest
bun run start            # start production bundle

# utilities
bun run typecheck        # run TypeScript type checking
bun run test             # execute Vitest suite
```

---

## Type-Safe API Development

FluxStack uses Eden Treaty to eliminate manual DTOs.

### Backend Route (Elysia)
```ts
import { Elysia, t } from 'elysia'

export const userRoutes = new Elysia({ prefix: '/users' })
  .get('/', () => ({ users: listUsers() }))
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

### Frontend Usage (React)
```tsx
import { api } from '@/app/client/src/lib/eden-api'

const { data: response, error } = await api.users.post({
  name: 'Ada Lovelace',
  email: 'ada@example.com'
})

if (!error && response?.user) {
  console.log(response.user.name)
}
```

---

## Customisation Highlights

### Add a Route
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

### Create a Plugin
```ts
// app/server/plugins/audit.ts
import { Elysia } from 'elysia'

export const auditPlugin = new Elysia({ name: 'audit' })
  .onRequest(({ request }) => {
    console.log(`[AUDIT] ${request.method} ${request.url}`)
  })
```

---

## Documentation & Support

### For Developers
- Quick start: This README
- Examples: `examples/` directory
- Architecture: `ai-context/project/`

### For AI Assistants
- **Start here**: `CLAUDE.md` - Complete framework context
- Quick reference: `ai-context/00-QUICK-START.md`
- Detailed guides: `ai-context/development/`
- Troubleshooting: `ai-context/reference/troubleshooting.md`

---

## Community

- **Issues**: [GitHub Issues](https://github.com/MarcosBrendonDePaula/FluxStack/issues)
- **Docs**: [Repository Docs](https://github.com/MarcosBrendonDePaula/FluxStack)
- **Discussions**: [GitHub Discussions](https://github.com/MarcosBrendonDePaula/FluxStack/discussions)

---

## Upgrading

```bash
# pull the latest scaffold
bunx create-fluxstack@latest my-new-app

# check current global version
npm list -g create-fluxstack
```

---

## Why FluxStack?

### Developer Experience
- Zero configuration – start coding immediately.
- Type-safe from controllers to components.
- Hot reload with backend/frontend coordination.
- Swagger documentation generated automatically.

### Performance
- Bun runtime for fast startup and low memory.
- Elysia for high-performance API routing.
- Vite for instant dev server and optimized builds.
- React 19 for modern UI primitives.

### Production Ready
- Docker multi-stage builds out of the box.
- Declarative configuration with environment overrides.
- Unified error handling and logging support.
- Optional monitoring plugin for metrics/exporters.

### Modern Stack
- TypeScript 5.8+, React 19, Tailwind v4, Eden Treaty.
- Shared types everywhere.
- WebSocket live components built in.
- AI-optimized documentation (`CLAUDE.md`, `ai-context/`).

---

## Requirements

- **Bun** ≥ 1.2.0

### Install Bun
```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
```

> FluxStack targets the Bun runtime. Node.js is not supported.

---

## Ready to Build?

```bash
bunx create-fluxstack my-dream-app
cd my-dream-app
bun run dev
```

Welcome to the future of full-stack development.
