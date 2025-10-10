# 🔐 Crypto Auth - Guia de Middlewares

> **✅ Nova Abordagem**: Middlewares declarativos - sem necessidade de configurar listas de paths!

## 📖 **Visão Geral**

O plugin Crypto Auth agora usa **middlewares Elysia nativos** aplicados diretamente nas rotas. Isso torna o código mais limpo, explícito e fácil de manter.

## 🚀 **Quick Start**

### **1. Configuração Simplificada**

```typescript
// fluxstack.config.ts
plugins: {
  enabled: ['crypto-auth'],
  config: {
    'crypto-auth': {
      enabled: true,
      maxTimeDrift: 300000, // 5 minutos
      adminKeys: [
        'abc123def456...' // Chaves públicas dos admins
      ],
      enableMetrics: true
    }
  }
}
```

**✅ Removido**: `protectedRoutes` e `publicRoutes`
**✅ Novo**: Middlewares aplicados diretamente nas rotas

---

## 🔌 **Middlewares Disponíveis**

### **1. `cryptoAuthRequired()` - Requer Autenticação**

Bloqueia a rota se não houver assinatura válida.

```typescript
import { cryptoAuthRequired, getCryptoAuthUser } from '@/plugins/crypto-auth/server'
import { Elysia } from 'elysia'

export const protectedRoutes = new Elysia()
  .use(cryptoAuthRequired()) // ⚡ Middleware aplicado

  .get('/profile', ({ request }) => {
    const user = getCryptoAuthUser(request)! // Garantido que existe
    return {
      publicKey: user.publicKey,
      isAdmin: user.isAdmin
    }
  })
```

**Response se não autenticado (401):**
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

### **2. `cryptoAuthAdmin()` - Requer Admin**

Bloqueia a rota se não for administrador.

```typescript
import { cryptoAuthAdmin } from '@/plugins/crypto-auth/server'

export const adminRoutes = new Elysia()
  .use(cryptoAuthAdmin()) // ⚡ Requer admin

  .delete('/users/:id', ({ params, request }) => {
    const user = getCryptoAuthUser(request)! // Garantido admin
    return {
      deleted: params.id,
      by: user.publicKey
    }
  })
```

**Response se não for admin (403):**
```json
{
  "error": {
    "message": "Admin privileges required",
    "code": "ADMIN_REQUIRED",
    "statusCode": 403,
    "yourPermissions": ["user", "read"]
  }
}
```

---

### **3. `cryptoAuthPermissions([...])` - Requer Permissões**

Bloqueia se não tiver as permissões específicas.

```typescript
import { cryptoAuthPermissions } from '@/plugins/crypto-auth/server'

export const writeRoutes = new Elysia()
  .use(cryptoAuthPermissions(['write', 'edit'])) // ⚡ Requer ambas

  .post('/posts', ({ body }) => {
    return { created: body }
  })
```

**Response se sem permissão (403):**
```json
{
  "error": {
    "message": "Insufficient permissions",
    "code": "PERMISSION_DENIED",
    "statusCode": 403,
    "required": ["write", "edit"],
    "yours": ["read"]
  }
}
```

---

### **4. `cryptoAuthOptional()` - Autenticação Opcional**

Não bloqueia, mas adiciona `user` se autenticado.

```typescript
import { cryptoAuthOptional, getCryptoAuthUser } from '@/plugins/crypto-auth/server'

export const feedRoutes = new Elysia()
  .use(cryptoAuthOptional()) // ⚡ Opcional

  .get('/posts', ({ request }) => {
    const user = getCryptoAuthUser(request) // Pode ser null

    return {
      posts: getPosts(),
      personalizedFor: user ? user.publicKey : 'anonymous'
    }
  })
```

---

## 🎯 **Padrões de Uso**

### **Padrão 1: Grupo de Rotas Protegidas**

```typescript
import { Elysia } from 'elysia'
import { cryptoAuthRequired } from '@/plugins/crypto-auth/server'

export const apiRoutes = new Elysia({ prefix: '/api' })

  // Rotas públicas
  .get('/health', () => ({ status: 'ok' }))
  .get('/docs', () => ({ version: '1.0.0' }))

  // Grupo protegido
  .group('/users', (app) => app
    .use(cryptoAuthRequired()) // ⚡ Todas as rotas do grupo requerem auth

    .get('/', ({ request }) => {
      const user = getCryptoAuthUser(request)!
      return { users: getUsers(user.publicKey) }
    })

    .post('/', ({ body }) => {
      return { created: body }
    })
  )
```

---

### **Padrão 2: Mix de Permissões no Mesmo Grupo**

```typescript
export const postsRoutes = new Elysia({ prefix: '/api/posts' })

  // Leitura: apenas auth
  .group('', (app) => app
    .use(cryptoAuthRequired())

    .get('/', () => ({ posts: [] }))
    .get('/:id', ({ params }) => ({ post: params.id }))
  )

  // Escrita: auth + permissão write
  .group('', (app) => app
    .use(cryptoAuthPermissions(['write']))

    .post('/', ({ body }) => ({ created: body }))
    .put('/:id', ({ params, body }) => ({ updated: params.id }))
  )

  // Deleção: só admin
  .group('', (app) => app
    .use(cryptoAuthAdmin())

    .delete('/:id', ({ params }) => ({ deleted: params.id }))
  )
```

---

### **Padrão 3: Auth Opcional com Comportamento Diferente**

```typescript
import { cryptoAuthOptional, getCryptoAuthUser, isCryptoAuthAdmin } from '@/plugins/crypto-auth/server'

export const contentRoutes = new Elysia({ prefix: '/api/content' })
  .use(cryptoAuthOptional()) // ⚡ Auth opcional para todas

  .get('/articles/:id', ({ request, params }) => {
    const user = getCryptoAuthUser(request)
    const isAdmin = isCryptoAuthAdmin(request)
    const article = getArticle(params.id)

    return {
      ...article,
      premium: user ? article.premiumContent : '[Premium - Login Required]',
      canEdit: isAdmin,
      canComment: !!user
    }
  })
```

---

## 🛠️ **Helpers Disponíveis**

### **`getCryptoAuthUser(request)`**

Retorna o usuário autenticado ou `null`.

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

### **`isCryptoAuthAuthenticated(request)`**

Verifica se está autenticado.

```typescript
import { isCryptoAuthAuthenticated } from '@/plugins/crypto-auth/server'

.get('/status', ({ request }) => {
  return {
    authenticated: isCryptoAuthAuthenticated(request)
  }
})
```

---

### **`isCryptoAuthAdmin(request)`**

Verifica se é admin.

```typescript
import { isCryptoAuthAdmin } from '@/plugins/crypto-auth/server'

.get('/posts/:id', ({ request, params }) => {
  const post = getPost(params.id)

  return {
    ...post,
    canEdit: isCryptoAuthAdmin(request)
  }
})
```

---

### **`hasCryptoAuthPermission(request, permission)`**

Verifica permissão específica.

```typescript
import { hasCryptoAuthPermission } from '@/plugins/crypto-auth/server'

.post('/posts/:id/publish', ({ request, params }) => {
  if (!hasCryptoAuthPermission(request, 'publish')) {
    return { error: 'Permission denied' }
  }

  return publishPost(params.id)
})
```

---

## 📋 **Estrutura do User**

```typescript
interface CryptoAuthUser {
  publicKey: string      // Chave pública Ed25519 (hex)
  isAdmin: boolean       // Se está na lista adminKeys
  permissions: string[]  // ['read', 'write', 'admin', ...]
}
```

**Como o `isAdmin` é determinado:**
```typescript
// Plugin verifica se a publicKey está em adminKeys
const isAdmin = config.adminKeys.includes(user.publicKey)
```

---

## 🔄 **Migrando da Abordagem Antiga**

### **❌ Antes (listas de paths)**

```typescript
// fluxstack.config.ts
plugins: {
  config: {
    'crypto-auth': {
      protectedRoutes: ['/api/users/*', '/api/admin/*'],
      publicRoutes: ['/api/health', '/api/docs']
    }
  }
}

// Rotas (sem controle explícito)
export const routes = new Elysia()
  .get('/api/users', handler) // Protegido pelo plugin
```

### **✅ Agora (middlewares declarativos)**

```typescript
// fluxstack.config.ts
plugins: {
  config: {
    'crypto-auth': {
      adminKeys: ['abc123...']
      // Sem protectedRoutes/publicRoutes!
    }
  }
}

// Rotas (controle explícito)
import { cryptoAuthRequired } from '@/plugins/crypto-auth/server'

export const routes = new Elysia()
  .get('/health', handler) // ✅ Público explicitamente

  .group('/users', (app) => app
    .use(cryptoAuthRequired()) // ✅ Protegido explicitamente
    .get('/', handler)
  )
```

---

## 🎯 **Vantagens da Nova Abordagem**

| Aspecto | Antes | Agora |
|---------|-------|-------|
| **Clareza** | Rotas implicitamente protegidas | ✅ Explícito no código |
| **Manutenção** | Editar config + rotas | ✅ Editar apenas rotas |
| **Type Safety** | Sem garantia de user | ✅ TypeScript sabe que user existe |
| **Flexibilidade** | Apenas on/off | ✅ Permissões, admin, opcional |
| **Debugging** | Difícil rastrear proteção | ✅ Fácil ver middleware aplicado |

---

## 🧪 **Testando**

### **Rota Pública**
```bash
curl http://localhost:3000/api/crypto-auth/public
# ✅ 200 OK - sem headers
```

### **Rota Protegida (sem auth)**
```bash
curl http://localhost:3000/api/crypto-auth/protected
# ❌ 401 Unauthorized
```

### **Rota Protegida (com auth)**
```bash
curl http://localhost:3000/api/crypto-auth/protected \
  -H "x-public-key: abc123..." \
  -H "x-timestamp: 1234567890" \
  -H "x-nonce: xyz789" \
  -H "x-signature: def456..."
# ✅ 200 OK
```

### **Rota Admin (sem ser admin)**
```bash
curl http://localhost:3000/api/crypto-auth/admin \
  -H "x-public-key: user123..." \
  -H "x-signature: ..."
# ❌ 403 Forbidden - "Admin privileges required"
```

---

## 📚 **Exemplos Completos**

Veja exemplos práticos em:
- `app/server/routes/crypto-auth-demo.routes.ts` - Rotas de demonstração
- `plugins/crypto-auth/server/middlewares.ts` - Implementação dos middlewares

---

## 🆘 **Troubleshooting**

### **Erro: "CryptoAuthService not initialized"**

**Causa**: Plugin não está carregado.

**Solução**:
```typescript
// fluxstack.config.ts
plugins: {
  enabled: ['crypto-auth'], // ✅ Adicione aqui
}
```

### **User sempre null**

**Causa**: Não está usando o middleware.

**Solução**:
```typescript
// ❌ Errado
.get('/protected', ({ request }) => {
  const user = getCryptoAuthUser(request) // null
})

// ✅ Correto
.use(cryptoAuthRequired())
.get('/protected', ({ request }) => {
  const user = getCryptoAuthUser(request)! // Garantido
})
```

### **403 ao invés de 401**

**Causa**: Usuário autenticado mas sem permissão.

**Solução**: Verificar se `adminKeys` ou permissões estão corretas.

---

**✅ Pronto!** Agora você tem controle total e explícito sobre quais rotas são protegidas, sem precisar configurar listas de paths!
