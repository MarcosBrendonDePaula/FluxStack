# FluxStack v1.4.1 - Troubleshooting Guide

## Common Issues and Solutions

### Development Environment Issues

#### Issue: `bun install` Fails or Slow
```bash
# Error: Installation taking too long or failing
```

**Solutions:**
1. **Clear cache**: `bun pm cache rm`
2. **Update Bun**: `bun upgrade`  
3. **Check permissions**: Ensure write access to project directory
4. **Network issues**: Try `bun install --verbose` to see detailed logs

#### Issue: Hot Reload Not Working
```bash
# Error: Changes not reflecting in browser/server
```

**Backend Hot Reload:**
```bash
# Check if using correct command
bun run dev          # ✅ Uses bun --watch
bun run dev:backend  # ✅ Standalone backend with hot reload

# Avoid these
bun app/server/index.ts  # ❌ No hot reload
```

**Frontend Hot Reload:**
```bash
# Check Vite configuration
bun run dev:frontend  # Direct Vite development server
# OR
bun run dev          # Integrated mode
```

**Troubleshooting Steps:**
1. Check if files are being watched: Look for "watching for file changes" message
2. Verify file extensions: Only `.ts`, `.tsx`, `.js`, `.jsx` files trigger reload
3. Check path aliases: Ensure imports use correct paths
4. Restart development server: `Ctrl+C` and run `bun run dev` again

#### Issue: Port Already in Use
```bash
# Error: EADDRINUSE: address already in use :::3000
```

**Solutions:**
```bash
# Find process using the port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # macOS/Linux

# Kill the process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # macOS/Linux

# Or use different ports
FRONTEND_PORT=5174 BACKEND_PORT=3001 bun run dev
```

### Build and Production Issues

#### Issue: Build Fails with TypeScript Errors
```bash
# Error: Type errors during build
```

**Solutions:**
```bash
# Check TypeScript configuration
bun run type-check  # Check types without building

# Common fixes:
1. Update shared types in app/shared/types.ts
2. Check import paths use correct aliases (@/, @/shared/, etc.)
3. Ensure all required types are exported
4. Verify Eden Treaty types are properly generated
```

#### Issue: Production Build Missing Files
```bash
# Error: 404 errors for static assets in production
```

**Check Build Output:**
```bash
bun run build
ls -la dist/        # Verify files are built

# Expected structure:
dist/
├── client/         # Frontend build
├── server/         # Backend build (optional)
└── index.js        # Main server entry
```

**Solutions:**
1. Verify `vite.config.ts` output directory: `outDir: '../../dist/client'`
2. Check static file configuration in production
3. Ensure build script completes successfully

#### Issue: Environment Variables Not Loading
```bash
# Error: process.env.VARIABLE_NAME is undefined
```

**Environment File Priority:**
1. `.env.local` (highest priority)
2. `.env.production` / `.env.development`
3. `.env` (lowest priority)

**Frontend Environment Variables:**
```bash
# Must be prefixed with VITE_
VITE_API_URL=http://localhost:3000  # ✅ Available in frontend
API_URL=http://localhost:3000       # ❌ Backend only
```

**Troubleshooting:**
```bash
# Check if environment file is loaded
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  API_URL: process.env.API_URL,
  VITE_API_URL: import.meta.env.VITE_API_URL  # Frontend only
})
```

### API and Backend Issues

#### Issue: Eden Treaty Type Errors
```bash
# Error: Type 'unknown' is not assignable to type 'X'
```

**Common Causes:**
1. Server types not properly exported
2. Client importing wrong App type
3. Route definitions not properly typed

**Solutions:**
```typescript
// app/server/app.ts - Ensure proper export
export type App = typeof app

// app/client/src/lib/eden-api.ts - Correct import
import type { App } from '../../../server/app'  // ✅ Correct path
import type { App } from '@/app/server/app'     // ❌ May not resolve correctly
```

#### Issue: API Routes Not Found (404)
```bash
# Error: Cannot GET /api/users
```

**Troubleshooting Steps:**
1. **Check route registration order:**
```typescript
// app/server/index.ts
app.use(swaggerPlugin)  // ✅ Swagger BEFORE routes
app.routes(apiRoutes)   // ✅ Routes registration
```

2. **Verify route prefixes:**
```typescript
// app/server/routes/index.ts
export const apiRoutes = new Elysia({ prefix: "/api" })  // ✅ Correct prefix

// app/server/routes/users.routes.ts  
export const usersRoutes = new Elysia({ prefix: "/users" })  // ✅ Will be /api/users
```

3. **Check server is running:**
```bash
curl http://localhost:3000/api/health  # Should return status
```

#### Issue: CORS Errors in Development
```bash
# Error: Access to fetch at 'http://localhost:3000/api/users' from origin 'http://localhost:5173' has been blocked by CORS
```

**Solution:**
Check Vite proxy configuration in `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

### Database and State Issues

#### Issue: In-Memory Data Resets Unexpectedly
```bash
# Issue: Users/data disappearing during development
```

**Cause:** Hot reload resets in-memory data structures.

**Solutions:**
```typescript
// app/server/controllers/users.controller.ts
export class UsersController {
  // Add persistence during development
  static resetForTesting() {
    users.splice(0, users.length)
    // Add default data
    users.push(
      { id: 1, name: "João", email: "joao@example.com", createdAt: new Date() },
      { id: 2, name: "Maria", email: "maria@example.com", createdAt: new Date() }
    )
  }
}
```

**For Production:**
1. Implement proper database integration
2. Use persistent storage (SQLite, PostgreSQL, etc.)
3. Add data migration scripts

### Frontend Issues

#### Issue: React Component Not Updating
```bash
# Issue: State changes not reflecting in UI
```

**Common Causes:**
1. **Missing dependencies in useEffect:**
```typescript
// ❌ Missing dependency
useEffect(() => {
  loadUsers()
}, [])  // Should include dependencies

// ✅ Correct dependencies
useEffect(() => {
  loadUsers()
}, [loadUsers])
```

2. **State mutation instead of replacement:**
```typescript
// ❌ Direct mutation
users.push(newUser)
setUsers(users)

// ✅ Create new array
setUsers(prev => [...prev, newUser])
```

#### Issue: Import Path Errors
```bash
# Error: Module not found: Can't resolve '@/components/UserList'
```

**Path Alias Issues:**
```typescript
// ✅ Correct usage
import { UserList } from '@/components/UserList'      // Frontend component
import type { User } from '@/shared/types'            // Shared types
import { api } from '@/lib/eden-api'                  // Frontend lib

// ❌ Common mistakes
import { User } from '@/app/shared/types'             // Too specific
import { UserList } from '../../components/UserList' // Relative path
```

### Testing Issues

#### Issue: Tests Failing After Changes
```bash
# Error: Tests failing due to data isolation issues
```

**Solution - Add Test Data Reset:**
```typescript
// In your test files
import { describe, it, expect, beforeEach } from 'vitest'
import { UsersController } from '@/app/server/controllers/users.controller'

describe('Users API', () => {
  beforeEach(() => {
    UsersController.resetForTesting()  // ✅ Reset data between tests
  })

  it('should create user successfully', async () => {
    const result = await UsersController.createUser({
      name: 'Test User',
      email: 'test@example.com'
    })
    
    expect(result.success).toBe(true)
  })
})
```

#### Issue: Vitest Configuration Errors
```bash
# Error: Test imports not resolving
```

**Check Vitest Config:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './app/client/src'),
      '@/shared': resolve(__dirname, './app/shared'),
      '@/core': resolve(__dirname, './core'),
      // Add all your path aliases here
    }
  }
})
```

### Performance Issues

#### Issue: Slow Startup Times
```bash
# Issue: Development server taking too long to start
```

**Diagnostic Steps:**
```bash
# Measure startup time
time bun run dev

# Check for large dependencies
bun pm ls --all | grep -E '\d+MB'

# Profile the application
bun --inspect app/server/index.ts
```

**Solutions:**
1. **Remove unused dependencies**
2. **Optimize imports** (avoid barrel exports)
3. **Use dynamic imports** for large modules
4. **Check for circular dependencies**

#### Issue: High Memory Usage
```bash
# Issue: Memory usage growing over time
```

**Monitoring:**
```typescript
// Add memory monitoring
app.get('/debug/memory', () => ({
  memory: process.memoryUsage(),
  uptime: process.uptime()
}))
```

**Common Causes:**
1. **Memory leaks in event listeners**
2. **Uncleared timeouts/intervals**
3. **Growing in-memory collections**
4. **Circular references**

### Debugging Tools and Techniques

#### Debug Mode Configuration

```typescript
// app/server/index.ts
if (process.env.NODE_ENV === 'development') {
  // Enable debug routes
  app.get('/debug/routes', () => app.routes)
  app.get('/debug/config', () => app.getContext())
  app.get('/debug/memory', () => process.memoryUsage())
}
```

#### Logging Best Practices

```typescript
// Enhanced logging during development
const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '')
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
  }
}

// Use in controllers
export class UsersController {
  static async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    logger.info('Creating user', { userData })
    
    try {
      const result = await this.performCreate(userData)
      logger.info('User created successfully', { user: result.user })
      return result
    } catch (error) {
      logger.error('Failed to create user', error)
      throw error
    }
  }
}
```

#### Network Debugging

```bash
# Test API endpoints directly
curl -X GET http://localhost:3000/api/health
curl -X GET http://localhost:3000/api/users
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'

# Check network requests in browser DevTools
# Monitor Network tab for API calls
# Check Console for errors
```

### Health Checks and Monitoring

#### Application Health Check

```typescript
// app/server/routes/index.ts
.get("/health", () => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    version: "1.4.1",
    environment: process.env.NODE_ENV || "development",
    memory: process.memoryUsage(),
    // Add more diagnostic info as needed
  }
  
  return health
})
```

#### System Diagnostics

```bash
# Create diagnostic script
# scripts/diagnose.ts
console.log('FluxStack Diagnostics')
console.log('==================')
console.log('Node Version:', process.version)
console.log('Bun Version:', process.env.BUN_VERSION)
console.log('OS:', process.platform)
console.log('Memory:', process.memoryUsage())
console.log('Environment:', process.env.NODE_ENV)

# Run diagnostics
bun scripts/diagnose.ts
```

## Emergency Recovery Procedures

### Complete Reset

```bash
# Nuclear option - complete reset
rm -rf node_modules
rm -f bun.lockb
bun install

# Reset development environment
rm -rf dist/
bun run build

# Clear all caches
bun pm cache rm
```

### Backup and Restore

```bash
# Backup current state
cp -r app/ backup/app-$(date +%Y%m%d)/
cp package.json backup/package-$(date +%Y%m%d).json

# Restore from backup
cp -r backup/app-20240101/ app/
cp backup/package-20240101.json package.json
bun install
```

### Configuration Verification

```typescript
// scripts/verify-config.ts
import { resolve } from 'path'

const configs = [
  'package.json',
  'vite.config.ts',
  'vitest.config.ts',
  'tsconfig.json'
]

console.log('Configuration Verification:')
configs.forEach(config => {
  const path = resolve(config)
  try {
    require(path)
    console.log(`✅ ${config} - Valid`)
  } catch (error) {
    console.log(`❌ ${config} - Error:`, error.message)
  }
})
```

Este guia de troubleshooting cobre os problemas mais comuns encontrados durante o desenvolvimento com FluxStack v1.4.1 e suas respectivas soluções.