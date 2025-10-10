/**
 * Exemplo de uso dos middlewares crypto-auth
 * Demonstra como proteger rotas com autenticação criptográfica
 */

import { Elysia, t } from 'elysia'
import {
  cryptoAuthRequired,
  cryptoAuthAdmin,
  cryptoAuthPermissions,
  cryptoAuthOptional,
  getCryptoAuthUser,
  isCryptoAuthAdmin
} from '@/plugins/crypto-auth/server'

// ========================================
// 1️⃣ ROTAS QUE REQUEREM AUTENTICAÇÃO
// ========================================

export const protectedRoutes = new Elysia()
  // ✅ Aplica middleware a TODAS as rotas deste grupo
  .use(cryptoAuthRequired())

  // Agora TODAS as rotas abaixo requerem autenticação
  .get('/users/me', ({ request }) => {
    const user = getCryptoAuthUser(request)!

    return {
      profile: {
        publicKey: user.publicKey,
        isAdmin: user.isAdmin,
        permissions: user.permissions
      }
    }
  })

  .get('/users', ({ request }) => {
    const user = getCryptoAuthUser(request)!

    return {
      users: [
        { id: 1, name: 'João' },
        { id: 2, name: 'Maria' }
      ],
      requestedBy: user.publicKey.substring(0, 16) + '...'
    }
  })

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

// ========================================
// 2️⃣ ROTAS QUE REQUEREM ADMIN
// ========================================

export const adminRoutes = new Elysia()
  // ✅ Apenas admins podem acessar
  .use(cryptoAuthAdmin())

  .get('/admin/stats', () => ({
    totalUsers: 100,
    totalPosts: 500,
    systemHealth: 'optimal'
  }))

  .delete('/admin/users/:id', ({ params, request }) => {
    const user = getCryptoAuthUser(request)!

    return {
      success: true,
      message: `Usuário ${params.id} deletado`,
      deletedBy: user.publicKey
    }
  })

  .post('/admin/broadcast', ({ body }) => ({
    success: true,
    message: 'Mensagem enviada para todos os usuários',
    content: body
  }), {
    body: t.Object({
      message: t.String()
    })
  })

// ========================================
// 3️⃣ ROTAS COM PERMISSÕES ESPECÍFICAS
// ========================================

export const writeRoutes = new Elysia()
  // ✅ Requer permissão 'write'
  .use(cryptoAuthPermissions(['write']))

  .put('/posts/:id', ({ params, body }) => ({
    success: true,
    message: `Post ${params.id} atualizado`,
    data: body
  }), {
    body: t.Object({
      title: t.Optional(t.String()),
      content: t.Optional(t.String())
    })
  })

  .patch('/posts/:id/publish', ({ params }) => ({
    success: true,
    message: `Post ${params.id} publicado`
  }))

// ========================================
// 4️⃣ ROTAS MISTAS (Opcional)
// ========================================

export const mixedRoutes = new Elysia()
  // ✅ Autenticação OPCIONAL - adiciona user se autenticado
  .use(cryptoAuthOptional())

  // Comportamento diferente se autenticado
  .get('/posts/:id', ({ request, params }) => {
    const user = getCryptoAuthUser(request)
    const isAdmin = isCryptoAuthAdmin(request)

    return {
      post: {
        id: params.id,
        title: 'Título do Post',
        // Mostra conteúdo completo apenas se autenticado
        content: user ? 'Conteúdo completo do post...' : 'Prévia...',
        author: 'João'
      },
      viewer: user ? {
        publicKey: user.publicKey.substring(0, 16) + '...',
        canEdit: isAdmin,
        canComment: true
      } : {
        canEdit: false,
        canComment: false
      }
    }
  })

  .get('/posts', ({ request }) => {
    const user = getCryptoAuthUser(request)

    return {
      posts: [
        { id: 1, title: 'Post 1' },
        { id: 2, title: 'Post 2' }
      ],
      authenticated: !!user
    }
  })

// ========================================
// 5️⃣ ROTAS COM VERIFICAÇÃO MANUAL
// ========================================

export const customRoutes = new Elysia()
  .use(cryptoAuthRequired())

  .get('/posts/:id/edit', ({ request, params, set }) => {
    const user = getCryptoAuthUser(request)!

    // Verificação customizada - apenas autor ou admin
    const post = { id: params.id, authorKey: 'abc123...' } // Buscar do DB

    const canEdit = user.isAdmin || user.publicKey === post.authorKey

    if (!canEdit) {
      set.status = 403
      return {
        error: 'Apenas o autor ou admin podem editar este post'
      }
    }

    return {
      post,
      canEdit: true
    }
  })

// ========================================
// 6️⃣ COMBINANDO MÚLTIPLOS MIDDLEWARES
// ========================================

export const combinedRoutes = new Elysia({ prefix: '/api/v1' })
  // Primeiro grupo - rotas públicas
  .get('/health', () => ({ status: 'ok' }))

  .get('/posts', () => ({
    posts: [/* ... */]
  }))

  // Segundo grupo - rotas protegidas
  .group('/users', (app) => app
    .use(cryptoAuthRequired())
    .get('/', () => ({ users: [] }))
    .post('/', ({ body }) => ({ created: body }))
  )

  // Terceiro grupo - rotas admin
  .group('/admin', (app) => app
    .use(cryptoAuthAdmin())
    .get('/stats', () => ({ stats: {} }))
    .delete('/users/:id', ({ params }) => ({ deleted: params.id }))
  )

// ========================================
// 7️⃣ EXPORTAR TODAS AS ROTAS
// ========================================

export const allExampleRoutes = new Elysia()
  .use(protectedRoutes)
  .use(adminRoutes)
  .use(writeRoutes)
  .use(mixedRoutes)
  .use(customRoutes)
  .use(combinedRoutes)
