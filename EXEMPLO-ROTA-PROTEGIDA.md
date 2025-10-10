# 🔐 Como Criar Rotas com Crypto-Auth

Guia prático para desenvolvedores criarem rotas usando o sistema de autenticação.

## 📋 Passo a Passo

### 1️⃣ Criar Arquivo de Rotas

Crie um arquivo em `app/server/routes/`:

```typescript
// app/server/routes/posts.routes.ts
import { Elysia, t } from 'elysia'
import {
  cryptoAuthRequired,
  cryptoAuthAdmin,
  cryptoAuthOptional,
  getCryptoAuthUser
} from '@/plugins/crypto-auth/server'

export const postsRoutes = new Elysia({ prefix: '/posts' })

  // ========================================
  // 🌐 ROTA PÚBLICA - Qualquer um pode acessar
  // ========================================
  .get('/', () => {
    return {
      success: true,
      posts: [
        { id: 1, title: 'Post público' },
        { id: 2, title: 'Outro post' }
      ]
    }
  })

  // ========================================
  // 🔒 ROTA PROTEGIDA - Requer autenticação
  // ========================================
  .guard({}, (app) =>
    app.use(cryptoAuthRequired())

      // GET /api/posts/my-posts - Lista posts do usuário autenticado
      .get('/my-posts', ({ request }) => {
        const user = getCryptoAuthUser(request)!

        return {
          success: true,
          message: `Posts de ${user.publicKey.substring(0, 8)}...`,
          posts: [
            { id: 1, title: 'Meu post privado', author: user.publicKey }
          ]
        }
      })

      // POST /api/posts - Criar novo post (autenticação obrigatória)
      .post('/', ({ request, body }) => {
        const user = getCryptoAuthUser(request)!
        const { title, content } = body as { title: string; content: string }

        return {
          success: true,
          message: 'Post criado com sucesso',
          post: {
            id: Date.now(),
            title,
            content,
            author: user.publicKey,
            createdAt: new Date().toISOString()
          }
        }
      }, {
        body: t.Object({
          title: t.String(),
          content: t.String()
        })
      })
  )

  // ========================================
  // 👑 ROTA ADMIN - Apenas administradores
  // ========================================
  .guard({}, (app) =>
    app.use(cryptoAuthAdmin())

      // DELETE /api/posts/:id - Deletar qualquer post (só admin)
      .delete('/:id', ({ request, params }) => {
        const user = getCryptoAuthUser(request)!

        return {
          success: true,
          message: `Post ${params.id} deletado por admin`,
          deletedBy: user.publicKey.substring(0, 8) + '...'
        }
      })

      // GET /api/posts/moderation - Painel de moderação
      .get('/moderation', ({ request }) => {
        const user = getCryptoAuthUser(request)!

        return {
          success: true,
          message: 'Painel de moderação',
          admin: user.publicKey.substring(0, 8) + '...',
          pendingPosts: [],
          reportedPosts: []
        }
      })
  )

  // ========================================
  // 🌓 ROTA COM AUTH OPCIONAL - Funciona com/sem auth
  // ========================================
  .guard({}, (app) =>
    app.use(cryptoAuthOptional())

      // GET /api/posts/:id - Detalhes do post (conteúdo extra se autenticado)
      .get('/:id', ({ request, params }) => {
        const user = getCryptoAuthUser(request)
        const isAuthenticated = !!user

        return {
          success: true,
          post: {
            id: params.id,
            title: 'Post de exemplo',
            content: 'Conteúdo público',
            // ✅ Conteúdo extra apenas para autenticados
            extraContent: isAuthenticated
              ? 'Conteúdo premium para usuários autenticados'
              : null,
            canEdit: isAuthenticated,
            viewer: user ? user.publicKey.substring(0, 8) + '...' : 'anonymous'
          }
        }
      })
  )
```

### 2️⃣ Registrar no Router Principal

```typescript
// app/server/routes/index.ts
import { Elysia } from 'elysia'
import { postsRoutes } from './posts.routes'  // ✅ Importar suas rotas

export const apiRoutes = new Elysia({ prefix: '/api' })
  .use(userRoutes)
  .use(postsRoutes)  // ✅ Adicionar aqui
  // ... outras rotas
```

### 3️⃣ Como o Cliente Faz Login

O cliente precisa enviar headers de autenticação criptográfica:

```typescript
// Frontend/Cliente
import { generateKeyPair, sign } from './crypto-utils'

// 1. Gerar par de chaves (feito uma vez)
const { publicKey, privateKey } = generateKeyPair()

// 2. Fazer requisição autenticada
const timestamp = Date.now()
const nonce = crypto.randomUUID()
const message = `GET:/api/posts/my-posts:${timestamp}:${nonce}`
const signature = sign(message, privateKey)

fetch('http://localhost:3000/api/posts/my-posts', {
  headers: {
    'X-Public-Key': publicKey,
    'X-Timestamp': timestamp.toString(),
    'X-Nonce': nonce,
    'X-Signature': signature
  }
})
```

## 🧪 Testando as Rotas

### Rota Pública (sem auth)
```bash
curl http://localhost:3000/api/posts
# ✅ 200 OK
```

### Rota Protegida (sem auth)
```bash
curl http://localhost:3000/api/posts/my-posts
# ❌ 401 {"error": {"message": "Authentication required"}}
```

### Rota Protegida (com auth)
```bash
curl http://localhost:3000/api/posts/my-posts \
  -H "X-Public-Key: abc123..." \
  -H "X-Timestamp: 1234567890" \
  -H "X-Nonce: uuid-here" \
  -H "X-Signature: signature-here"
# ✅ 200 OK {"posts": [...]}
```

### Rota Admin (sem admin)
```bash
curl http://localhost:3000/api/posts/moderation \
  -H "X-Public-Key: user-key..." \
  # ... outros headers
# ❌ 403 {"error": {"message": "Admin privileges required"}}
```

### Rota Opcional (ambos funcionam)
```bash
# Sem auth
curl http://localhost:3000/api/posts/123
# ✅ 200 OK {"post": {"extraContent": null}}

# Com auth
curl http://localhost:3000/api/posts/123 -H "X-Public-Key: ..."
# ✅ 200 OK {"post": {"extraContent": "Conteúdo premium..."}}
```

## 📦 Middlewares Disponíveis

### `cryptoAuthRequired()`
Bloqueia acesso se não autenticado.
```typescript
.use(cryptoAuthRequired())
.get('/protected', ({ request }) => {
  const user = getCryptoAuthUser(request)! // ✅ Sempre existe
})
```

### `cryptoAuthAdmin()`
Bloqueia se não for admin.
```typescript
.use(cryptoAuthAdmin())
.delete('/users/:id', ({ request }) => {
  const user = getCryptoAuthUser(request)! // ✅ Sempre admin
})
```

### `cryptoAuthOptional()`
Adiciona user se autenticado, mas não bloqueia.
```typescript
.use(cryptoAuthOptional())
.get('/feed', ({ request }) => {
  const user = getCryptoAuthUser(request) // ⚠️ Pode ser null
  if (user) {
    return { message: 'Feed personalizado' }
  }
  return { message: 'Feed público' }
})
```

### `cryptoAuthPermissions(['write', 'delete'])`
Bloqueia se não tiver permissões específicas.
```typescript
.use(cryptoAuthPermissions(['write', 'delete']))
.put('/posts/:id', ({ request }) => {
  const user = getCryptoAuthUser(request)! // ✅ Tem as permissões
})
```

## 🔑 Helpers Úteis

```typescript
import {
  getCryptoAuthUser,
  isCryptoAuthAuthenticated,
  isCryptoAuthAdmin,
  hasCryptoAuthPermission
} from '@/plugins/crypto-auth/server'

// Dentro de uma rota
({ request }) => {
  // Pegar usuário autenticado (null se não autenticado)
  const user = getCryptoAuthUser(request)

  // Verificar se está autenticado
  if (!isCryptoAuthAuthenticated(request)) {
    return { error: 'Login required' }
  }

  // Verificar se é admin
  if (isCryptoAuthAdmin(request)) {
    return { message: 'Admin panel' }
  }

  // Verificar permissão específica
  if (hasCryptoAuthPermission(request, 'delete')) {
    return { message: 'Can delete' }
  }
}
```

## ⚠️ Boas Práticas

### ✅ Fazer
- Usar `.guard({})` para isolar middlewares
- Verificar `null` em rotas com `cryptoAuthOptional()`
- Usar `!` apenas após middlewares obrigatórios
- Separar rotas por nível de permissão

### ❌ Não Fazer
- Usar `.use()` fora de `.guard()` (afeta TODAS as rotas seguintes)
- Esquecer `.as('plugin')` ao criar middlewares customizados
- Assumir que `user` existe sem middleware de proteção

## 🎯 Padrão Recomendado

```typescript
export const myRoutes = new Elysia({ prefix: '/my-feature' })

  // Públicas primeiro
  .get('/public', () => ({ ... }))

  // Auth opcional (separado)
  .guard({}, (app) =>
    app.use(cryptoAuthOptional())
      .get('/optional', ({ request }) => {
        const user = getCryptoAuthUser(request)
        // ...
      })
  )

  // Protegidas (separado)
  .guard({}, (app) =>
    app.use(cryptoAuthRequired())
      .get('/protected', ({ request }) => {
        const user = getCryptoAuthUser(request)!
        // ...
      })
  )

  // Admin (separado)
  .guard({}, (app) =>
    app.use(cryptoAuthAdmin())
      .delete('/admin-only', ({ request }) => {
        const user = getCryptoAuthUser(request)!
        // ...
      })
  )
```

---

**Pronto!** Agora você sabe criar rotas com autenticação crypto-auth no FluxStack. 🚀
