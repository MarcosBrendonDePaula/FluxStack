# ⚡ create-fluxstack

> Create modern full-stack TypeScript applications with zero configuration

[![npm version](https://badge.fury.io/js/create-fluxstack.svg)](https://www.npmjs.com/package/create-fluxstack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
# Create a new FluxStack app
bunx create-fluxstack my-awesome-app

# Navigate and start developing
cd my-awesome-app
bun run dev
```

**That's it!** Your full-stack TypeScript app is ready at:
- 🚀 **Backend**: http://localhost:3000
- ⚛️ **Frontend**: http://localhost:5173  
- 📋 **API Docs**: http://localhost:3000/swagger

## ✨ What You Get

### 🔥 Modern Tech Stack
- **⚡ Bun Runtime** - 3x faster than Node.js
- **🚀 Elysia.js** - Ultra-fast backend framework
- **⚛️ React 19** - Latest React with modern features
- **🎨 Tailwind CSS v4** - Latest styling framework
- **📦 Vite 7** - Lightning-fast dev server
- **🔒 TypeScript 5** - Full type safety end-to-end

### 🛠️ Zero Configuration Features
- **✅ Type Safety** - Eden Treaty for API communication with automatic type inference
- **✅ Hot Reload** - Backend + Frontend coordinated development
- **✅ Auto Documentation** - Swagger UI generated from your API
- **✅ Git Ready** - Repository initialized with proper .gitignore
- **✅ Production Ready** - Optimized build scripts included
- **✅ AI Context** - Complete documentation for AI assistants

## 📁 Project Structure

```
my-awesome-app/
├── core/                    # FluxStack framework (don't modify)
│   ├── server/             # Framework server components  
│   ├── config/             # Configuration system
│   ├── plugins/            # Built-in plugins (logger, swagger, etc)
│   └── cli/                # Development CLI tools
├── app/                     # Your application code
│   ├── server/             # Backend API routes
│   │   ├── controllers/    # Business logic
│   │   └── routes/         # API endpoints  
│   ├── client/             # Frontend React app
│   │   ├── src/            # React components
│   │   └── public/         # Static assets
│   └── shared/             # Shared types and utilities
├── ai-context/              # AI assistant documentation
├── package.json            # Dependencies and scripts
├── CLAUDE.md               # AI instructions
└── README.md               # Project documentation
```

## 🎯 Available Scripts

```bash
# Development
bun run dev              # Start full-stack development
bun run dev:clean        # Clean output (no Elysia HEAD logs)
bun run dev:frontend     # Frontend only (port 5173)
bun run dev:backend      # Backend only (port 3001)

# Production
bun run build            # Build for production
bun run start            # Start production server

# Utilities
bun run typecheck        # Check TypeScript
bun run test             # Run test suite
```

## 🔧 Type-Safe API Development

FluxStack provides automatic type inference between your backend and frontend using Eden Treaty:

### Backend API (Elysia.js)
```typescript
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

### Frontend with Type Safety
```typescript
// app/client/src/components/Users.tsx
import { api } from '../lib/eden-api'

export function UsersList() {
  const [users, setUsers] = useState<User[]>([])

  const createUser = async (userData: CreateUserData) => {
    // ✨ Fully typed - no manual type definitions needed!
    const { data, error } = await api.users.post(userData)
    
    if (!error) {
      setUsers(prev => [...prev, data.user]) // ✅ TypeScript knows the shape
    }
  }

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}
```

## 🌍 Environment & Configuration

### Environment Variables
```bash
# .env (auto-generated from .env.example)
NODE_ENV=development
PORT=3000
HOST=localhost
VITE_PORT=5173
VITE_API_URL=http://localhost:3000

# Add your own variables
DATABASE_URL=postgresql://localhost:5432/myapp
JWT_SECRET=your-secret-key
```

### Frontend Environment
```typescript
// Only VITE_* variables are exposed to frontend
const apiUrl = import.meta.env.VITE_API_URL
const appName = import.meta.env.VITE_APP_NAME
```

## 🚀 Deployment

### Single Server (Recommended)
```bash
# Build everything
bun run build

# Start production server
bun run start
```

### Separate Deploy
```bash
# Backend
bun run build:backend
bun dist/index.js

# Frontend  
bun run build:frontend
# Deploy dist/ folder to CDN
```

### Docker
```bash
# Use included Dockerfile
docker build -t my-app .
docker run -p 3000:3000 my-app
```

## 🔧 Requirements

- **Bun** >= 1.2.0 (required)

### Install Bun
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1|iex"
```

> **Note**: FluxStack is built specifically for Bun runtime. Node.js is not supported.

## 🎨 Customization

### Adding API Routes
```typescript
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

### Custom Plugins
```typescript
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

## 📚 Documentation & AI Support

FluxStack includes comprehensive documentation for both developers and AI assistants:

- **📖 Full Documentation**: Check the `ai-context/` folder
- **🤖 AI Instructions**: See `CLAUDE.md` for AI assistant guidance
- **⚡ Quick Start**: `ai-context/00-QUICK-START.md`
- **🎯 Examples**: Complete CRUD examples included

## 🛟 Support & Community

- **🐛 Issues**: [Report bugs](https://github.com/MarcosBrendonDePaula/FluxStack/issues)
- **📖 Documentation**: [Full docs](https://github.com/MarcosBrendonDePaula/FluxStack)
- **💬 Discussions**: [GitHub Discussions](https://github.com/MarcosBrendonDePaula/FluxStack/discussions)

## 🔄 Upgrading

```bash
# Get the latest version
bunx create-fluxstack@latest my-new-app

# Check current version
npm list -g create-fluxstack
```

## 🌟 Why FluxStack?

### ✅ **Developer Experience**
- **Zero Config**: Just create and start coding
- **Type Safety**: End-to-end without manual work
- **Hot Reload**: Backend and frontend in sync
- **Auto Docs**: Swagger generated from your code

### ✅ **Performance**
- **Bun Runtime**: 3x faster than Node.js
- **Elysia**: One of the fastest TypeScript frameworks
- **Vite**: Instant HMR and optimized builds
- **React 19**: Latest performance improvements

### ✅ **Production Ready**
- **Docker**: Optimized containers included
- **Environment**: Robust configuration system
- **Error Handling**: Consistent error responses
- **Monitoring**: Built-in observability features

### ✅ **Modern Stack**
- **TypeScript 5**: Latest language features
- **React 19**: Concurrent features, Server Components ready
- **Tailwind v4**: Latest CSS framework
- **Eden Treaty**: Revolutionary type-safe API client

## 🎊 Get Started Now!

```bash
bunx create-fluxstack my-dream-app
cd my-dream-app
bun run dev
```

**Welcome to the future of full-stack development!** ⚡🚀

---

<div align="center">
  
**Built with ❤️ by the FluxStack Team**

[⭐ Star on GitHub](https://github.com/MarcosBrendonDePaula/FluxStack) • [📦 NPM Package](https://www.npmjs.com/package/create-fluxstack)

</div>