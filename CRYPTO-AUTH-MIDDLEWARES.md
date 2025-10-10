# 🔐 Crypto Auth - Middlewares Elysia

## 🚀 Guia Rápido

### Uso Básico

```typescript
import { Elysia } from 'elysia'
import { cryptoAuthRequired, cryptoAuthAdmin } from '@/plugins/crypto-auth/server'

export const myRoutes = new Elysia()
  // ✅ Aplica autenticação a todas as rotas
  .use(cryptoAuthRequired())

  .get('/users', ({ request }) => {
    const user = (request as any).user
    return { users: [], requestedBy: user.publicKey }
  })

  .post('/users', ({ request, body }) => {
    const user = (request as any).user
    return { created: body, by: user.publicKey }
  })
```

---

## 📚 Middlewares Disponíveis

### 1️⃣ `cryptoAuthRequired()` - Requer Autenticação

Valida assinatura e bloqueia acesso se não autenticado.

```typescript
import { cryptoAuthRequired, getCryptoAuthUser } from '@/plugins/crypto-auth/server'

export const protectedRoutes = new Elysia()
  .use(cryptoAuthRequired())  // ✅ Todas as rotas protegidas

  .get('/profile', ({ request }) => {
    const user = getCryptoAuthUser(request)!
    return {
      publicKey: user.publicKey,
      isAdmin: user.isAdmin,
      permissions: user.permissions
    }
  })
```

**Retorno se não autenticado**:
```json
{
  "error": {
    "message": "Authentication required",
    "code": "CRYPTO_AUTH_REQUIRED",
    "statusCode": 401
  }
}
```

---

### 2️⃣ `cryptoAuthAdmin()` - Requer Admin

Valida autenticação E verifica se usuário é admin.

```typescript
import { cryptoAuthAdmin } from '@/plugins/crypto-auth/server'

export const adminRoutes = new Elysia()
  .use(cryptoAuthAdmin())  // ✅ Apenas admins

  .get('/admin/stats', () => ({
    totalUsers: 100,
    systemHealth: 'optimal'
  }))

  .delete('/admin/users/:id', ({ params, request }) => {
    const user = (request as any).user
    return {
      deleted: params.id,
      by: user.publicKey
    }
  })
```

**Retorno se não for admin**:
```json
{
  "error": {
    "message": "Admin privileges required",
    "code": "ADMIN_REQUIRED",
    "statusCode": 403,
    "yourPermissions": ["read"]
  }
}
```

---

### 3️⃣ `cryptoAuthPermissions(permissions)` - Requer Permissões

Valida autenticação E verifica permissões específicas.

```typescript
import { cryptoAuthPermissions } from '@/plugins/crypto-auth/server'

export const writeRoutes = new Elysia()
  .use(cryptoAuthPermissions(['write']))  // ✅ Requer permissão 'write'

  .put('/posts/:id', ({ params, body }) => ({
    updated: params.id,
    data: body
  }))

  .patch('/posts/:id/publish', ({ params }) => ({
    published: params.id
  }))
```

**Múltiplas permissões**:
```typescript
.use(cryptoAuthPermissions(['write', 'publish']))
```

**Retorno se sem permissão**:
```json
{
  "error": {
    "message": "Insufficient permissions",
    "code": "PERMISSION_DENIED",
    "statusCode": 403,
    "required": ["write"],
    "yours": ["read"]
  }
}
```

---

### 4️⃣ `cryptoAuthOptional()` - Autenticação Opcional

Adiciona `user` se autenticado, mas NÃO bloqueia se não autenticado.

```typescript
import { cryptoAuthOptional, getCryptoAuthUser } from '@/plugins/crypto-auth/server'

export const mixedRoutes = new Elysia()
  .use(cryptoAuthOptional())  // ✅ Opcional

  // Comportamento diferente se autenticado
  .get('/posts/:id', ({ request, params }) => {
    const user = getCryptoAuthUser(request)

    return {
      post: {
        id: params.id,
        title: 'Post Title',
        // Conteúdo completo apenas se autenticado
        content: user ? 'Full content...' : 'Preview...'
      },
      viewer: user ? {
        publicKey: user.publicKey,
        canEdit: user.isAdmin
      } : null
    }
  })
```

---

## 🛠️ Helper Functions

### `getCryptoAuthUser(request)` - Obter Usuário

```typescript
import { getCryptoAuthUser } from '@/plugins/crypto-auth/server'

.get('/me', ({ request }) => {
  const user = getCryptoAuthUser(request)

  if (!user) {
    return { error: 'Not authenticated' }
  }

  return { user }
})
```

---

### `isCryptoAuthAuthenticated(request)` - Verificar se Autenticado

```typescript
import { isCryptoAuthAuthenticated } from '@/plugins/crypto-auth/server'

.get('/posts/:id', ({ request, params }) => {
  const isAuth = isCryptoAuthAuthenticated(request)

  return {
    post: { id: params.id },
    canComment: isAuth
  }
})
```

---

### `isCryptoAuthAdmin(request)` - Verificar se é Admin

```typescript
import { isCryptoAuthAdmin } from '@/plugins/crypto-auth/server'

.get('/posts/:id', ({ request, params, set }) => {
  if (!isCryptoAuthAdmin(request)) {
    set.status = 403
    return { error: 'Admin only' }
  }

  return { post: params.id }
})
```

---

### `hasCryptoAuthPermission(request, permission)` - Verificar Permissão

```typescript
import { hasCryptoAuthPermission } from '@/plugins/crypto-auth/server'

.put('/posts/:id', ({ request, params, set }) => {
  if (!hasCryptoAuthPermission(request, 'write')) {
    set.status = 403
    return { error: 'Write permission required' }
  }

  return { updated: params.id }
})
```

---

## 🎯 Padrões de Uso

### Padrão 1: Grupo de Rotas Protegidas

```typescript
export const apiRoutes = new Elysia()
  // Rotas públicas
  .get('/health', () => ({ status: 'ok' }))
  .get('/posts', () => ({ posts: [] }))

  // Grupo protegido
  .group('/users', (app) => app
    .use(cryptoAuthRequired())
    .get('/', () => ({ users: [] }))
    .post('/', ({ body }) => ({ created: body }))
    .delete('/:id', ({ params }) => ({ deleted: params.id }))
  )

  // Grupo admin
  .group('/admin', (app) => app
    .use(cryptoAuthAdmin())
    .get('/stats', () => ({ stats: {} }))
  )
```

---

### Padrão 2: Middleware Cascata

```typescript
export const routes = new Elysia()
  // Aplica a todas as rotas
  .use(cryptoAuthRequired())

  .get('/profile', () => ({ profile: {} }))

  // Sub-grupo com restrição adicional
  .group('/admin', (app) => app
    .use(cryptoAuthAdmin())  // Admin adicional ao required
    .get('/users', () => ({ users: [] }))
  )
```

---

### Padrão 3: Verificação Manual Combinada

```typescript
export const routes = new Elysia()
  .use(cryptoAuthRequired())

  .delete('/posts/:id', ({ request, params, set }) => {
    const user = getCryptoAuthUser(request)!

    // Buscar post do DB
    const post = { id: params.id, authorKey: 'abc...' }

    // Apenas autor ou admin pode deletar
    const canDelete = user.isAdmin ||
                      user.publicKey === post.authorKey

    if (!canDelete) {
      set.status = 403
      return {
        error: 'Apenas o autor ou admin podem deletar'
      }
    }

    return { deleted: params.id }
  })
```

---

### Padrão 4: Rotas Condicionais

```typescript
export const routes = new Elysia()
  .use(cryptoAuthOptional())

  .get('/posts/:id/download', ({ request, params, set }) => {
    const user = getCryptoAuthUser(request)

    // Usuários autenticados: download ilimitado
    // Não autenticados: limite de 3 por dia
    if (!user) {
      const dailyLimit = checkRateLimit(request.headers.get('x-forwarded-for'))
      if (dailyLimit > 3) {
        set.status = 429
        return { error: 'Rate limit exceeded. Authenticate for unlimited access.' }
      }
    }

    return { download: `post-${params.id}.pdf` }
  })
```

---

## 🔍 Debugging

### Log de Autenticação

```typescript
import { cryptoAuthRequired } from '@/plugins/crypto-auth/server'

export const routes = new Elysia()
  .use(cryptoAuthRequired({
    logger: yourLogger  // ✅ Passar logger para debug
  }))

  .get('/users', ({ request }) => {
    const user = (request as any).user
    console.log('User:', user)
    return { users: [] }
  })
```

---

### Rota de Debug

```typescript
export const debugRoutes = new Elysia()
  .use(cryptoAuthOptional())

  .get('/debug/auth', ({ request }) => {
    const user = getCryptoAuthUser(request)

    return {
      authenticated: !!user,
      user: user || null,
      headers: {
        publicKey: request.headers.get('x-public-key'),
        timestamp: request.headers.get('x-timestamp'),
        nonce: request.headers.get('x-nonce'),
        signature: request.headers.get('x-signature')?.substring(0, 16) + '...'
      }
    }
  })
```

---

## ⚠️ Importante

1. **Ordem importa**: Aplique middlewares antes de definir rotas
   ```typescript
   .use(cryptoAuthRequired())  // ✅ Primeiro
   .get('/users', ...)         // ✅ Depois
   ```

2. **Grupos herdam middlewares**:
   ```typescript
   .use(cryptoAuthRequired())
   .group('/api', ...)  // ✅ Herda cryptoAuthRequired
   ```

3. **User object sempre disponível**: Em rotas com `cryptoAuthRequired`, `cryptoAuthAdmin` ou `cryptoAuthPermissions`

4. **Null check necessário**: Em rotas com `cryptoAuthOptional`:
   ```typescript
   const user = getCryptoAuthUser(request)
   if (user) {  // ✅ Verificar antes de usar
     ...
   }
   ```

---

## 📦 TypeScript Types

```typescript
interface CryptoAuthUser {
  publicKey: string      // Chave pública (ID único)
  isAdmin: boolean       // Se é administrador
  permissions: string[]  // ["read"] ou ["admin", "read", "write", "delete"]
}
```

---

## 🆚 Comparação com Config

### ❌ Antes (Config Global)
```typescript
// config/app.config.ts
plugins: {
  config: {
    'crypto-auth': {
      protectedRoutes: ["/api/users/*"]
    }
  }
}

// routes/users.routes.ts
.get('/users', ({ request }) => {
  // Protegido automaticamente
})
```

### ✅ Agora (Middlewares)
```typescript
// routes/users.routes.ts
import { cryptoAuthRequired } from '@/plugins/crypto-auth/server'

export const routes = new Elysia()
  .use(cryptoAuthRequired())  // ✅ Explícito
  .get('/users', ({ request }) => {
    // Protegido
  })
```

**Vantagens**:
- ✅ Explícito e visível
- ✅ Type-safe
- ✅ Mais flexível
- ✅ Melhor autocomplete
- ✅ Não depende de config global

---

## 📚 Ver Mais

- **Exemplo completo**: `app/server/routes/example-with-crypto-auth.routes.ts`
- **Documentação AI**: `plugins/crypto-auth/ai-context.md`
- **Demo rotas**: `app/server/routes/crypto-auth-demo.routes.ts`

---

**Última atualização**: Janeiro 2025
