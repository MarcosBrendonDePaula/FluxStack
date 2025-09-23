# 🚨 Troubleshooting - FluxStack

> **Guia completo para resolver problemas comuns no FluxStack**

## ⚡ **Diagnóstico Rápido**

### **🔍 Comandos de Diagnóstico**
```bash
# 1. Verificar APIs
curl http://localhost:3000/api/health
curl http://localhost:3000/swagger/json

# 2. Verificar TypeScript
bunx tsc --noEmit

# 3. Verificar testes
bun run test

# 4. Verificar build
bun run build
```

### **🌐 URLs Importantes**
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173  
- **Swagger**: http://localhost:3000/swagger
- **Health**: http://localhost:3000/api/health

## 🔧 **Problemas de Desenvolvimento**

### **❌ Erro: "Cannot find module 'vite/module-runner'"**
```bash
# Problema: Vite sendo importado em produção
# Solução: Verificar env vars e plugins
export NODE_ENV=development
bun run dev
```

### **❌ Types `unknown` no Eden Treaty**
```typescript
// ❌ Problema
const { data, error } = await api.users.get()
// data é 'unknown' em vez de { users: User[] }

// ✅ Solução: Verificar response schemas
export const usersRoutes = new Elysia()
  .get("/", handler, {
    response: t.Object({
      users: t.Array(t.Object({
        id: t.Number(),
        name: t.String(),
        email: t.String()
      }))
    })
  })
```

### **❌ Hot Reload Não Funciona**
```bash
# Verificar se Vite já está rodando
lsof -i :5173  # Mac/Linux
netstat -ano | findstr :5173  # Windows

# Matar processo se necessário
pkill -f vite  # Mac/Linux
taskkill /F /IM node.exe  # Windows

# Reiniciar
bun run dev
```

### **❌ Erro de Porta em Uso**
```bash
# Verificar processos na porta
lsof -i :3000  # Backend
lsof -i :5173  # Frontend

# Matar processo
kill -9 <PID>

# Ou usar porta diferente
PORT=3001 bun run dev
```

### **❌ TypeScript Errors Massivos**
```bash
# 1. Limpar cache
rm -rf node_modules/.cache
rm -rf dist/

# 2. Reinstalar
bun install

# 3. Verificar versões
bunx tsc --version
bun --version

# 4. Restart TypeScript server (VS Code)
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

## 🌐 **Problemas de API**

### **❌ CORS Errors**
```javascript
// ❌ Error: CORS policy blocks request
// ✅ Normal: API (3000) ≠ Frontend (5173)

// Verificar se API está respondendo
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(console.log)

// Eden Treaty deveria lidar automaticamente
```

### **❌ 404 Not Found nas Rotas**
```typescript
// ❌ Problema: Rota não encontrada
// ✅ Verificar prefix e estrutura

// 1. Verificar export das rotas
export const apiRoutes = new Elysia({ prefix: "/api" })
  .use(usersRoutes)  // ← Rota precisa estar registrada

// 2. Verificar URL final
// users routes com prefix "/users" 
// apiRoutes com prefix "/api"
// URL final: /api/users
```

### **❌ Validation Errors**
```typescript
// ❌ Body validation failed
// ✅ Verificar schema da rota

.post("/", handler, {
  body: t.Object({
    name: t.String({ minLength: 2 }),  // ← Verificar requisitos
    email: t.String({ format: "email" })
  })
})

// Client request deve corresponder:
await api.users.post({
  name: "João",      // ← String com 2+ chars
  email: "joao@x.com" // ← Email válido
})
```

### **❌ Error Handling Não Funciona**
```typescript
// ❌ Problema: Errors não tratados
const { data, error } = await api.users.get()

// ✅ Sempre verificar error primeiro
if (error) {
  console.log(`API Error: ${error.status} - ${error.message}`)
  return
}

// Agora data é garantidamente válido
console.log(data.users)
```

## ⚛️ **Problemas de Frontend**

### **❌ React Hook Warnings**
```typescript
// ❌ Warning: Can't perform state update on unmounted component

// ✅ Solução: Cleanup no useEffect
useEffect(() => {
  let mounted = true
  
  const loadData = async () => {
    const { data, error } = await api.users.get()
    if (mounted && !error) {
      setUsers(data.users)
    }
  }
  
  loadData()
  
  return () => { mounted = false }  // ← Cleanup
}, [])
```

### **❌ State Updates Não Refletem**
```typescript
// ❌ Problema: State não atualiza após API call

// ✅ Verificar se setState está sendo chamado
const createUser = async (userData) => {
  const { data, error } = await api.users.post(userData)
  
  if (!error && data.success) {
    setUsers(prev => [...prev, data.user])  // ← Crucial!
  }
}
```

### **❌ Infinite Re-renders**
```typescript
// ❌ Problema: useEffect sem dependencies
useEffect(() => {
  loadUsers()  // ← Vai chamar infinitamente
})

// ✅ Solução: Dependencies corretas
useEffect(() => {
  loadUsers()
}, [])  // ← Empty array = run once

// ✅ Ou use useCallback
const loadUsers = useCallback(async () => {
  // ...
}, [])

useEffect(() => {
  loadUsers()
}, [loadUsers])
```

## 🏗️ **Problemas de Build**

### **❌ Build Failures**
```bash
# 1. Verificar imports
# ❌ Problema comum
import { api } from '../../lib/eden-api'  # Path relativo
import type { User } from '../../../shared/types'  # Muitos ../

# ✅ Usar path aliases (tsconfig.json)
import { api } from '@/lib/eden-api'
import type { User } from '@/shared/types'

# 2. Verificar exports
# Cada arquivo deve ter export padrão ou nomeado correto
```

### **❌ Type Errors na Build**
```typescript
// ❌ Problema: Tipos diferentes dev vs build
// ✅ Verificar tsconfig.json consistency

{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": false,  // ← Importante para libs
    "moduleResolution": "bundler"
  }
}
```

### **❌ Asset Loading Problems**
```typescript
// ❌ Problema: Assets não carregam em prod
// ✅ Usar public/ folder

// ❌ Errado
import logo from '../assets/logo.png'

// ✅ Correto  
<img src="/logo.png" />  // File em public/logo.png
```

## 🐳 **Problemas de Docker**

### **❌ Docker Build Falha**
```dockerfile
# ❌ Problema: Node modules não copiados
# ✅ Verificar .dockerignore

# .dockerignore não deve incluir:
# node_modules/  ← OK, será reinstalado
# dist/          ← OK, será gerado
# .env           ← Cuidado: env vars podem ser necessárias
```

### **❌ Container Não Inicia**
```bash
# Verificar logs
docker logs <container-id>

# Verificar portas
docker ps
docker port <container-id>

# Verificar conectividade
curl http://localhost:3000/api/health
```

## 🧪 **Problemas de Testing**

### **❌ Tests Falhando**
```typescript
// ❌ Problema: API calls em tests
// ✅ Mock Eden Treaty

// tests/setup.ts
vi.mock('@/lib/eden-api', () => ({
  api: {
    users: {
      get: vi.fn(),
      post: vi.fn()
    }
  }
}))

// test.ts
import { api } from '@/lib/eden-api'

it('should handle users', () => {
  const mockUsers = [{ id: 1, name: 'Test' }]
  vi.mocked(api.users.get).mockResolvedValue({
    data: { users: mockUsers },
    error: undefined
  })
  
  // Test component...
})
```

### **❌ Mock Not Working**
```typescript
// ❌ Problema: Mocks não aplicados
// ✅ Verificar ordem de imports

// ❌ Errado
import { Component } from './Component'
import { vi } from 'vitest'

// ✅ Correto
import { vi } from 'vitest'
vi.mock('./api')
import { Component } from './Component'
```

## 🔧 **Ferramentas de Debug**

### **✅ Browser DevTools**
```javascript
// Network tab
// - Verificar requests/responses
// - Status codes
// - Headers CORS

// Console
// - Eden Treaty debug
console.log('API call:', await api.users.get())

// React DevTools  
// - Component state
// - Props debugging
// - Hook values
```

### **✅ Bun Debugging**
```bash
# Debug mode
DEBUG=* bun run dev

# Verbose output
bun run dev --verbose

# Memory usage
bun run --inspect dev
```

### **✅ Elysia Debugging**
```typescript
// app/server/index.ts
app.onError((error) => {
  console.error('Elysia Error:', error)
  return { error: error.message, status: 500 }
})

app.onRequest((request) => {
  console.log(`${request.method} ${request.url}`)
})

app.onResponse((response) => {
  console.log(`Response: ${response.status}`)
})
```

## 📋 **Checklist de Troubleshooting**

### **🔍 Quando algo não funciona:**
1. **Verificar URLs** - APIs nas portas certas?
2. **Verificar types** - `bunx tsc --noEmit`
3. **Verificar console** - Errors no browser/terminal?
4. **Verificar schemas** - Response schemas definidos?
5. **Verificar imports** - Paths corretos?
6. **Reiniciar tudo** - `bun run dev` fresh

### **🆘 Quando tudo falha:**
1. **Clean install**: `rm -rf node_modules && bun install`
2. **Clear cache**: `rm -rf dist/ .cache/`
3. **Restart editor**: Recarregar VS Code
4. **Check docs**: Verificar esta documentação
5. **Minimal repro**: Isolar o problema

---

**🎯 90% dos problemas são resolvidos verificando response schemas, imports corretos e reiniciando o dev server!**