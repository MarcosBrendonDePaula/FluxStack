# ⚡ create-fluxstack

> Create FluxStack apps with zero configuration - powered by Bun

[![npm version](https://badge.fury.io/js/create-fluxstack.svg)](https://badge.fury.io/js/create-fluxstack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
# Create a new FluxStack app
bunx create-fluxstack my-awesome-app

# Or with npx
npx create-fluxstack my-awesome-app

# Navigate and start developing
cd my-awesome-app
bun run dev
```

**That's it!** Your full-stack TypeScript app is ready at:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:3000/swagger

## ✨ What You Get

### 🔥 Modern Tech Stack
- **⚡ Bun Runtime** - 3x faster than Node.js
- **🚀 Elysia.js** - Ultra-fast backend framework
- **⚛️ React 19** - Latest React with modern features
- **🎨 Tailwind CSS v4** - Latest styling framework
- **📦 Vite 7** - Lightning-fast dev server
- **🔒 TypeScript 5** - Full type safety end-to-end

### 🛠️ Zero Configuration
- **✅ Hot Reload** - Backend + Frontend coordinated
- **✅ Type Safety** - Eden Treaty for API communication
- **✅ Auto Documentation** - Swagger UI generated
- **✅ Git Ready** - Initialized with first commit
- **✅ Production Ready** - Build scripts included

## 📁 Project Structure

```
my-awesome-app/
├── core/          # FluxStack framework (don't modify)
├── app/           # Your application code
│   ├── server/    # Backend API routes
│   ├── client/    # Frontend React app
│   └── shared/    # Shared types and utilities
├── package.json   # Dependencies and scripts
└── README.md      # Project documentation
```

## 🎯 Available Scripts

```bash
# Development
bun run dev              # Start full-stack development
bun run dev:frontend     # Frontend only
bun run dev:backend      # Backend only

# Production
bun run build            # Build for production
bun run start            # Start production server

# Utilities
bun run typecheck        # Check TypeScript
```

## 🔧 Requirements

- **Bun** >= 1.0.0 (recommended)
- **Node.js** >= 18.0.0 (fallback)

### Install Bun

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash
```

## 🎨 Customization

### Environment Variables

The generated app uses these environment variables (in `.env`):

```bash
NODE_ENV=development
PORT=3000
HOST=localhost
VITE_PORT=5173
VITE_API_URL=http://localhost:3000
```

### Adding Routes

Backend routes in `app/server/routes/`:

```typescript
// app/server/routes/users.ts
import { Elysia } from 'elysia'

export const userRoutes = new Elysia({ prefix: '/users' })
  .get('/', () => ({ users: [] }))
  .post('/', ({ body }) => ({ user: body }))
```

Frontend API calls with type safety:

```typescript
// app/client/src/components/Users.tsx
import { api } from '../lib/api'

const users = await api.users.get() // ✅ Fully typed!
```

## 🚀 Deployment

### Option 1: Single Server (Recommended)

```bash
# Build everything
bun run build

# Start production server
bun run start
```

### Option 2: Separate Deploy

```bash
# Backend
bun run build:backend
bun dist/index.js

# Frontend
bun run build:frontend
# Deploy dist/ folder to CDN
```

## 🤝 Examples

### Basic CRUD API

```typescript
// app/server/routes/posts.ts
export const postRoutes = new Elysia({ prefix: '/posts' })
  .get('/', () => ({ posts: [] }))
  .post('/', ({ body }) => ({ id: 1, ...body }))
  .get('/:id', ({ params }) => ({ id: params.id }))
```

### Frontend Integration

```typescript
// app/client/src/hooks/usePosts.ts
import { api } from '../lib/api'

export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: () => api.posts.get()
  })
}
```

## 🛟 Troubleshooting

### Port Already in Use

```bash
# Kill processes on ports
pkill -f "3000"
pkill -f "5173"
```

### Type Errors

```bash
# Regenerate types
bun run typecheck
```

### Environment Issues

```bash
# Force development mode
NODE_ENV=development bun run dev
```

## 📖 Learn More

- [FluxStack Documentation](https://fluxstack.dev)
- [Bun Runtime](https://bun.sh)
- [Elysia.js](https://elysiajs.com)
- [React 19](https://react.dev)

## 🐛 Issues & Contributing

Found a bug? Have a suggestion?
- [GitHub Issues](https://github.com/fluxstack/create-fluxstack/issues)
- [GitHub Discussions](https://github.com/fluxstack/create-fluxstack/discussions)

## 📄 License

MIT © FluxStack Team

---

**Happy coding with the divine Bun runtime! ⚡🔥**