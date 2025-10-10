# 🔐 Como Usar Crypto Auth no Servidor

## 📋 Índice
1. [Configuração Inicial](#configuração-inicial)
2. [Rotas Protegidas Automáticas](#rotas-protegidas-automáticas)
3. [Acessar Dados do Usuário](#acessar-dados-do-usuário)
4. [Verificar Permissões Admin](#verificar-permissões-admin)
5. [Rotas Públicas](#rotas-públicas)
6. [Exemplos Completos](#exemplos-completos)

---

## 1️⃣ Configuração Inicial

### Adicionar suas rotas à configuração do plugin

**Arquivo**: `config/app.config.ts` (ou onde você configura plugins)

```typescript
export const appConfig = defineConfig({
  // ... outras configs

  plugins: {
    config: {
      'crypto-auth': {
        // Rotas que REQUEREM autenticação
        protectedRoutes: [
          "/api/users/*",        // Todas as rotas de usuários
          "/api/admin/*",        // Todas as rotas admin
          "/api/posts/create",   // Criar post
          "/api/posts/*/edit",   // Editar post
          "/api/profile/*"       // Perfil do usuário
        ],

        // Rotas PÚBLICAS (não requerem autenticação)
        publicRoutes: [
          "/api/health",
          "/api/posts",          // Listar posts (público)
          "/api/posts/*/view",   // Ver post (público)
          "/api/crypto-auth/public"
        ],

        // Chaves públicas de administradores
        adminKeys: [
          "7443b54b3c8e2f1a9d5c6e4b2f8a1d3c9e5b7a2f4d8c1e6b3a9d5c7e2f4b8a1d"
          // Adicione mais chaves de admin aqui
        ]
      }
    }
  }
})
```

---

## 2️⃣ Rotas Protegidas Automáticas

### ✅ Middleware Automático

Quando você adiciona uma rota em `protectedRoutes`, o middleware **valida automaticamente** a assinatura antes de executar sua rota.

**Se a assinatura for inválida**: Retorna `401 Unauthorized` automático
**Se a assinatura for válida**: Sua rota é executada normalmente

```typescript
// app/server/routes/users.routes.ts
import { Elysia } from 'elysia'

export const usersRoutes = new Elysia()
  // ✅ Esta rota está protegida automaticamente
  // Configurada em: protectedRoutes: ["/api/users/*"]
  .get('/users', ({ request }) => {
    // Se chegou aqui, a assinatura já foi validada!
    const user = (request as any).user

    return {
      success: true,
      message: 'Usuário autenticado',
      user: {
        publicKey: user.publicKey,
        isAdmin: user.isAdmin,
        permissions: user.permissions
      }
    }
  })
```

---

## 3️⃣ Acessar Dados do Usuário

### 📦 Object `user` disponível no request

Após a validação automática, você tem acesso a:

```typescript
interface User {
  publicKey: string      // Chave pública do usuário (identificador único)
  isAdmin: boolean       // Se é admin (baseado em adminKeys config)
  permissions: string[]  // ["read"] ou ["admin", "read", "write", "delete"]
}
```

### Exemplo Prático:

```typescript
.get('/users/me', ({ request }) => {
  const user = (request as any).user

  return {
    id: user.publicKey,
    isAdmin: user.isAdmin,
    permissions: user.permissions,
    authenticatedAt: new Date()
  }
})

.post('/users', ({ request, body }) => {
  const user = (request as any).user

  // Criar usuário
  const newUser = {
    ...body,
    createdBy: user.publicKey,
    createdAt: new Date()
  }

  return {
    success: true,
    user: newUser
  }
})
```

---

## 4️⃣ Verificar Permissões Admin

### 🔒 Rotas que requerem privilégios de administrador

```typescript
.delete('/users/:id', ({ request, params, set }) => {
  const user = (request as any).user

  // ❌ Verificar se é admin
  if (!user.isAdmin) {
    set.status = 403
    return {
      success: false,
      error: 'Acesso negado',
      message: 'Você precisa ser administrador para deletar usuários',
      yourPermissions: user.permissions
    }
  }

  // ✅ É admin, pode deletar
  const userId = params.id
  // ... lógica de deleção

  return {
    success: true,
    message: `Usuário ${userId} deletado`,
    deletedBy: user.publicKey
  }
})
```

### 🎯 Verificar Permissão Específica

```typescript
.put('/posts/:id', ({ request, params, body, set }) => {
  const user = (request as any).user

  // Verificar se tem permissão de escrita
  const canWrite = user.permissions.includes('write') ||
                   user.permissions.includes('admin')

  if (!canWrite) {
    set.status = 403
    return {
      success: false,
      error: 'Permissão negada',
      required: ['write'],
      yours: user.permissions
    }
  }

  // Atualizar post
  return {
    success: true,
    message: 'Post atualizado'
  }
})
```

---

## 5️⃣ Rotas Públicas

### 🌐 Rotas que NÃO requerem autenticação

Adicione em `publicRoutes` na configuração:

```typescript
.get('/posts', () => {
  // Esta rota é PÚBLICA
  // Qualquer um pode acessar sem autenticação
  return {
    success: true,
    posts: [/* ... */]
  }
})

.get('/posts/:id/view', ({ params }) => {
  // Esta rota também é PÚBLICA
  return {
    post: {
      id: params.id,
      title: "Post público"
    }
  }
})
```

---

## 6️⃣ Exemplos Completos

### Exemplo 1: CRUD de Posts

```typescript
// app/server/routes/posts.routes.ts
import { Elysia, t } from 'elysia'

export const postsRoutes = new Elysia()

  // ✅ PÚBLICO - Listar posts
  .get('/posts', () => ({
    posts: [
      { id: 1, title: 'Post 1', author: 'João' },
      { id: 2, title: 'Post 2', author: 'Maria' }
    ]
  }))

  // ✅ PÚBLICO - Ver post específico
  .get('/posts/:id', ({ params }) => ({
    post: {
      id: params.id,
      title: `Post ${params.id}`,
      content: 'Conteúdo do post...'
    }
  }))

  // 🔒 PROTEGIDO - Criar post (requer autenticação)
  .post('/posts', ({ request, body }) => {
    const user = (request as any).user

    return {
      success: true,
      post: {
        ...body,
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

  // 🔒 PROTEGIDO - Editar post
  .put('/posts/:id', ({ request, params, body }) => {
    const user = (request as any).user

    return {
      success: true,
      message: `Post ${params.id} atualizado por ${user.publicKey.substring(0, 8)}...`
    }
  }, {
    body: t.Object({
      title: t.Optional(t.String()),
      content: t.Optional(t.String())
    })
  })

  // 🔒 ADMIN - Deletar post
  .delete('/posts/:id', ({ request, params, set }) => {
    const user = (request as any).user

    if (!user.isAdmin) {
      set.status = 403
      return {
        success: false,
        error: 'Apenas administradores podem deletar posts'
      }
    }

    return {
      success: true,
      message: `Post ${params.id} deletado`
    }
  })
```

### Configuração correspondente:

```typescript
// config/app.config.ts
plugins: {
  config: {
    'crypto-auth': {
      protectedRoutes: [
        "/api/posts",      // POST /api/posts (criar)
        "/api/posts/*"     // PUT/DELETE /api/posts/:id
      ],
      publicRoutes: [
        "/api/posts",      // GET /api/posts (listar)
        "/api/posts/*"     // GET /api/posts/:id (ver)
      ]
    }
  }
}
```

---

### Exemplo 2: API de Perfil de Usuário

```typescript
// app/server/routes/profile.routes.ts
import { Elysia, t } from 'elysia'

export const profileRoutes = new Elysia()

  // 🔒 Ver próprio perfil
  .get('/profile/me', ({ request }) => {
    const user = (request as any).user

    return {
      profile: {
        id: user.publicKey,
        publicKey: user.publicKey.substring(0, 16) + '...',
        isAdmin: user.isAdmin,
        permissions: user.permissions,
        memberSince: new Date('2025-01-01') // Buscar do DB
      }
    }
  })

  // 🔒 Atualizar perfil
  .put('/profile/me', ({ request, body }) => {
    const user = (request as any).user

    return {
      success: true,
      message: 'Perfil atualizado',
      profile: {
        id: user.publicKey,
        ...body
      }
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      bio: t.Optional(t.String()),
      avatar: t.Optional(t.String())
    })
  })

  // 🔒 ADMIN - Ver perfil de outro usuário
  .get('/profile/:publicKey', ({ request, params, set }) => {
    const user = (request as any).user

    if (!user.isAdmin) {
      set.status = 403
      return {
        error: 'Apenas admins podem ver perfis de outros usuários'
      }
    }

    return {
      profile: {
        id: params.publicKey,
        // ... buscar dados do DB
      }
    }
  })
```

---

### Exemplo 3: Verificação Condicional

```typescript
// app/server/routes/mixed.routes.ts
import { Elysia } from 'elysia'

export const mixedRoutes = new Elysia()

  // Rota com comportamento diferente se autenticado
  .get('/posts/:id/view', ({ request, params }) => {
    const user = (request as any).user

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

## 🎯 Resumo Rápido

### 1. Configurar rotas protegidas:
```typescript
protectedRoutes: ["/api/users/*", "/api/admin/*"]
```

### 2. Acessar usuário nas rotas:
```typescript
const user = (request as any).user
```

### 3. Verificar se é admin:
```typescript
if (!user.isAdmin) {
  set.status = 403
  return { error: 'Admin required' }
}
```

### 4. Verificar permissões:
```typescript
if (!user.permissions.includes('write')) {
  set.status = 403
  return { error: 'Permission denied' }
}
```

---

## 🔍 Debugging

### Ver logs de autenticação:

```typescript
.get('/debug/auth', ({ request }) => {
  const user = (request as any).user

  return {
    authenticated: !!user,
    user: user || null,
    headers: {
      publicKey: request.headers.get('x-public-key'),
      timestamp: request.headers.get('x-timestamp'),
      nonce: request.headers.get('x-nonce'),
      signature: request.headers.get('x-signature')
    }
  }
})
```

---

## ⚠️ Importante

1. **Middleware valida automaticamente**: Se a rota está em `protectedRoutes`, você não precisa validar manualmente
2. **User sempre está disponível**: Em rotas protegidas, `(request as any).user` sempre existe
3. **Rotas públicas**: Não têm `user` object (verifique com `if (user)`)
4. **isAdmin é automático**: Baseado na lista `adminKeys` da configuração
5. **Permissions padrão**: Users normais têm `["read"]`, admins têm `["admin", "read", "write", "delete"]`

---

## 📚 Ver Mais

- **Documentação completa**: `plugins/crypto-auth/ai-context.md`
- **Exemplo demo**: `app/server/routes/crypto-auth-demo.routes.ts`
- **Testes**: `test-crypto-auth.ts`

---

**Última atualização**: Janeiro 2025
