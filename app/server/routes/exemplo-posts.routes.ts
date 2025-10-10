/**
 * 🎓 EXEMPLO PRÁTICO: Como criar rotas com Crypto-Auth
 *
 * Este arquivo demonstra como um desenvolvedor cria rotas usando
 * o sistema de autenticação crypto-auth do FluxStack.
 */

import { Elysia, t } from 'elysia'
import {
  cryptoAuthRequired,
  cryptoAuthAdmin,
  cryptoAuthOptional,
  getCryptoAuthUser
} from '@/plugins/crypto-auth/server'

// Mock database (simulação)
const posts = [
  { id: 1, title: 'Post Público 1', content: 'Conteúdo aberto', public: true },
  { id: 2, title: 'Post Público 2', content: 'Conteúdo aberto', public: true }
]

export const exemploPostsRoutes = new Elysia({ prefix: '/exemplo-posts' })

  // ========================================
  // 🌐 ROTA PÚBLICA - Qualquer um acessa
  // ========================================
  .get('/', () => {
    return {
      success: true,
      message: 'Lista pública de posts',
      posts: posts.filter(p => p.public)
    }
  })

  // ========================================
  // 🌓 ROTA COM AUTH OPCIONAL
  // Funciona com ou sem autenticação
  // ========================================
  .guard({}, (app) =>
    app.use(cryptoAuthOptional())

      .get('/:id', ({ request, params }) => {
        const user = getCryptoAuthUser(request)
        const isAuthenticated = !!user
        const post = posts.find(p => p.id === parseInt(params.id))

        if (!post) {
          return { success: false, error: 'Post não encontrado' }
        }

        return {
          success: true,
          post: {
            ...post,
            // ✅ Conteúdo extra apenas para autenticados
            premiumContent: isAuthenticated
              ? 'Conteúdo premium exclusivo para usuários autenticados!'
              : null,
            viewer: isAuthenticated
              ? `Autenticado: ${user.publicKey.substring(0, 8)}...`
              : 'Visitante anônimo'
          }
        }
      })
  )

  // ========================================
  // 🔒 ROTAS PROTEGIDAS - Requer autenticação
  // ========================================
  .guard({}, (app) =>
    app.use(cryptoAuthRequired())

      // GET /api/exemplo-posts/meus-posts
      .get('/meus-posts', ({ request }) => {
        const user = getCryptoAuthUser(request)!

        return {
          success: true,
          message: `Posts criados por você`,
          user: {
            publicKey: user.publicKey.substring(0, 16) + '...',
            isAdmin: user.isAdmin
          },
          posts: [
            {
              id: 999,
              title: 'Meu Post Privado',
              content: 'Só eu posso ver',
              author: user.publicKey
            }
          ]
        }
      })

      // POST /api/exemplo-posts/criar
      .post('/criar', ({ request, body }) => {
        const user = getCryptoAuthUser(request)!
        const { title, content } = body as { title: string; content: string }

        const newPost = {
          id: Date.now(),
          title,
          content,
          author: user.publicKey,
          createdAt: new Date().toISOString(),
          public: false
        }

        posts.push(newPost)

        return {
          success: true,
          message: 'Post criado com sucesso!',
          post: newPost
        }
      }, {
        body: t.Object({
          title: t.String({ minLength: 3 }),
          content: t.String({ minLength: 10 })
        })
      })
  )

  // ========================================
  // 👑 ROTAS ADMIN - Apenas administradores
  // ========================================
  .guard({}, (app) =>
    app.use(cryptoAuthAdmin())

      // GET /api/exemplo-posts/admin/todos
      .get('/admin/todos', ({ request }) => {
        const user = getCryptoAuthUser(request)!

        return {
          success: true,
          message: 'Painel administrativo',
          admin: user.publicKey.substring(0, 8) + '...',
          totalPosts: posts.length,
          posts: posts // Admin vê tudo
        }
      })

      // DELETE /api/exemplo-posts/admin/:id
      .delete('/admin/:id', ({ request, params }) => {
        const user = getCryptoAuthUser(request)!
        const postIndex = posts.findIndex(p => p.id === parseInt(params.id))

        if (postIndex === -1) {
          return { success: false, error: 'Post não encontrado' }
        }

        const deletedPost = posts.splice(postIndex, 1)[0]

        return {
          success: true,
          message: `Post "${deletedPost.title}" deletado pelo admin`,
          deletedBy: user.publicKey.substring(0, 8) + '...',
          deletedPost
        }
      })
  )
