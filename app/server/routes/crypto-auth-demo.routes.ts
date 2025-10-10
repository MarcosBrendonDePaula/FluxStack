/**
 * Rotas de demonstração do Crypto Auth Plugin
 * ✅ NOVA ABORDAGEM: Middlewares declarativos nas rotas
 */

import { Elysia, t } from 'elysia'
import {
  cryptoAuthRequired,
  cryptoAuthAdmin,
  cryptoAuthOptional,
  cryptoAuthPermissions,
  getCryptoAuthUser,
  isCryptoAuthAdmin
} from '@/plugins/crypto-auth/server'

export const cryptoAuthDemoRoutes = new Elysia({ prefix: '/crypto-auth' })

  // ========================================
  // 🌐 ROTAS PÚBLICAS (sem middleware)
  // ========================================

  .get('/public', () => ({
    success: true,
    message: 'Esta é uma rota pública - acessível sem autenticação',
    timestamp: new Date().toISOString(),
    note: 'Não usa nenhum middleware crypto-auth'
  }))

  .get('/status', ({ request, headers }) => {
    const user = getCryptoAuthUser(request)

    return {
      authenticated: !!user,
      headers: {
        hasSignature: !!headers['x-signature'],
        hasPublicKey: !!headers['x-public-key'],
        hasTimestamp: !!headers['x-timestamp'],
        hasNonce: !!headers['x-nonce']
      },
      user: user ? {
        publicKey: user.publicKey.substring(0, 16) + '...',
        isAdmin: user.isAdmin,
        permissions: user.permissions
      } : null,
      timestamp: new Date().toISOString()
    }
  })

  // ========================================
  // 🌓 ROTA COM AUTH OPCIONAL
  // ========================================

  .guard({}, (app) =>
    app.use(cryptoAuthOptional())
      .get('/feed', ({ request }) => {
        const user = getCryptoAuthUser(request)
        const isAuthenticated = !!user

        return {
          success: true,
          message: isAuthenticated
            ? `Feed personalizado para ${user.publicKey.substring(0, 8)}...`
            : 'Feed público geral',
          posts: [
            {
              id: 1,
              title: 'Post público',
              canEdit: isAuthenticated && isCryptoAuthAdmin(request),
              premium: false
            },
            {
              id: 2,
              title: 'Post premium',
              content: isAuthenticated ? 'Conteúdo completo' : 'Conteúdo bloqueado - faça login',
              premium: true
            }
          ],
          user: user ? {
            publicKey: user.publicKey.substring(0, 8) + '...',
            isAdmin: user.isAdmin
          } : null
        }
      })
  )

  // ========================================
  // 🔒 ROTAS PROTEGIDAS (require auth)
  // ========================================

  .guard({}, (app) =>
    app.use(cryptoAuthRequired())
      .get('/protected', ({ request }) => {
        const user = getCryptoAuthUser(request)!

        return {
          success: true,
          message: 'Acesso autorizado! Assinatura validada.',
          user: {
            publicKey: user.publicKey.substring(0, 16) + '...',
            isAdmin: user.isAdmin,
            permissions: user.permissions
          },
          data: {
            secretInfo: 'Dados protegidos - só acessível com assinatura válida',
            userLevel: 'authenticated',
            timestamp: new Date().toISOString()
          }
        }
      })

      .post('/protected/data', async ({ request, body }) => {
        const user = getCryptoAuthUser(request)!
        const postBody = body as { query: string }

        return {
          success: true,
          message: 'Dados processados com segurança',
          receivedFrom: user.publicKey.substring(0, 8) + '...',
          receivedData: postBody,
          processedAt: new Date().toISOString()
        }
      }, {
        body: t.Object({
          query: t.String()
        })
      })
  )

  // ========================================
  // 👑 ROTAS ADMIN (require admin)
  // ========================================

  .guard({}, (app) =>
    app.use(cryptoAuthAdmin())
      .get('/admin', ({ request }) => {
        const user = getCryptoAuthUser(request)!

        return {
          success: true,
          message: 'Acesso admin autorizado',
          user: {
            publicKey: user.publicKey.substring(0, 16) + '...',
            isAdmin: true,
            permissions: user.permissions
          },
          adminData: {
            systemHealth: 'optimal',
            totalUsers: 42,
            message: 'Dados sensíveis de administração'
          }
        }
      })

      .delete('/admin/users/:id', ({ request, params }) => {
        const user = getCryptoAuthUser(request)!

        return {
          success: true,
          message: `Usuário ${params.id} deletado por admin`,
          deletedBy: {
            publicKey: user.publicKey.substring(0, 8) + '...',
            isAdmin: true
          },
          timestamp: new Date().toISOString()
        }
      })
  )
