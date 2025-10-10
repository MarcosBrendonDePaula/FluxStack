# 🔐 Como Usar Crypto Auth no Servidor

## 📋 Índice
1. [Middlewares Disponíveis](#middlewares-disponíveis)
2. [Uso Básico](#uso-básico)
3. [Acessar Dados do Usuário](#acessar-dados-do-usuário)
4. [Verificar Permissões](#verificar-permissões)
5. [Exemplos Completos](#exemplos-completos)
6. [Helper Functions](#helper-functions)

---

## 🚀 Middlewares Disponíveis

### 1️⃣ `cryptoAuthRequired()` - Requer Autenticação

Valida assinatura e **bloqueia** acesso se não autenticado.

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

**Retorno se não autenticado**: `401 Unauthorized`

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

  .delete('/admin/users/:id', ({ params }) => ({
    deleted: params.id
  }))
```

**Retorno se não for admin**: `403 Forbidden`

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
```

**Múltiplas permissões**:
```typescript
.use(cryptoAuthPermissions(['write', 'publish']))
```

---

### 4️⃣ `cryptoAuthOptional()` - Autenticação Opcional

Adiciona `user` se autenticado, mas **NÃO bloqueia** se não autenticado.

```typescript
import { cryptoAuthOptional, getCryptoAuthUser } from '@/plugins/crypto-auth/server'

export const mixedRoutes = new Elysia()
  .use(cryptoAuthOptional())  // ✅ Opcional

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

## 🛠️ Uso Básico

### Aplicar Middleware a Todas as Rotas

```typescript
import { Elysia } from 'elysia'
import { cryptoAuthRequired } from '@/plugins/crypto-auth/server'

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

### Aplicar a Grupos Específicos

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
  )

  // Grupo admin
  .group('/admin', (app) => app
    .use(cryptoAuthAdmin())
    .get('/stats', () => ({ stats: {} }))
  )
```

---

## 📦 Acessar Dados do Usuário

### Interface `CryptoAuthUser`

```typescript
interface CryptoAuthUser {
  publicKey: string      // Chave pública (ID único)
  isAdmin: boolean       // Se é admin
  permissions: string[]  // [\"read\"] ou [\"admin\", \"read\", \"write\", \"delete\"]
}
```

### Acessar no Handler

```typescript
import { getCryptoAuthUser } from '@/plugins/crypto-auth/server'

.get('/me', ({ request }) => {
  const user = getCryptoAuthUser(request)!  // ! porque já passou pelo middleware

  return {
    id: user.publicKey,
    isAdmin: user.isAdmin,
    permissions: user.permissions
  }
})
```

---

## 🔒 Verificar Permissões

### Verificar se é Admin

```typescript
import { isCryptoAuthAdmin } from '@/plugins/crypto-auth/server'

.delete('/posts/:id', ({ request, params, set }) => {
  if (!isCryptoAuthAdmin(request)) {
    set.status = 403
    return { error: 'Admin only' }
  }

  return { deleted: params.id }
})
```

---

### Verificar Permissão Específica

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

## 🎯 Exemplos Completos

### Exemplo 1: CRUD de Posts

```typescript
import { Elysia, t } from 'elysia'
import {
  cryptoAuthRequired,
  cryptoAuthAdmin,
  cryptoAuthOptional,
  getCryptoAuthUser
} from '@/plugins/crypto-auth/server'

export const postsRoutes = new Elysia()

  // ✅ PÚBLICO - Listar posts
  .get('/posts', () => ({
    posts: [
      { id: 1, title: 'Post 1', author: 'João' },
      { id: 2, title: 'Post 2', author: 'Maria' }
    ]
  }))

  // 🔒 PROTEGIDO - Criar post
  .post('/posts', ({ request, body }) => {
    const user = getCryptoAuthUser(request)!
    const { title, content } = body as { title: string; content: string }

    return {
      success: true,
      post: {
        title,
        content,
        author: user.publicKey,
        createdAt: new Date()
      }
    }
  }, {
    body: t.Object({
      title: t.String(),
      content: t.String()
    })
  })
  .use(cryptoAuthRequired())  // Aplica apenas ao .post acima

  // 🔒 ADMIN - Deletar post
  .delete('/posts/:id', ({ params }) => ({
    success: true,
    message: `Post ${params.id} deletado`
  }))
  .use(cryptoAuthAdmin())  // Aplica apenas ao .delete acima
```

---

### Exemplo 2: Rotas Condicionais

```typescript
export const mixedRoutes = new Elysia()
  .use(cryptoAuthOptional())

  .get('/posts/:id', ({ request, params }) => {
    const user = getCryptoAuthUser(request)

    // Post básico (público)
    const post = {
      id: params.id,
      title: 'Título do Post',
      excerpt: 'Prévia do conteúdo...'
    }

    // Se autenticado, retorna conteúdo completo
    if (user) {
      return {
        ...post,
        fullContent: 'Conteúdo completo do post...',
        comments: [/* comentários */],
        viewer: {
          publicKey: user.publicKey,
          canEdit: user.isAdmin
        }
      }
    }

    // Se não autenticado, apenas prévia
    return post
  })
```

---

### Exemplo 3: Middleware Cascata

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

## 📚 Ver Mais

- **Documentação completa de middlewares**: `CRYPTO-AUTH-MIDDLEWARES.md`
- **Exemplo completo**: `app/server/routes/example-with-crypto-auth.routes.ts`
- **Documentação AI**: `plugins/crypto-auth/ai-context.md`
- **Demo rotas**: `app/server/routes/crypto-auth-demo.routes.ts`

---

**Última atualização**: Janeiro 2025
