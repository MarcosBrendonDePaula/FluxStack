/**
 * Rotas de demonstração do Crypto Auth Plugin
 * Exemplos de rotas protegidas e públicas
 *
 * IMPORTANTE: O middleware crypto-auth já validou a assinatura
 * As rotas protegidas são automaticamente protegidas pela configuração
 */

import { Elysia, t } from 'elysia'

export const cryptoAuthDemoRoutes = new Elysia()
  // Rota pública - não requer autenticação
  .get('/crypto-auth/public', () => ({
    success: true,
    message: 'Esta é uma rota pública, acessível sem autenticação',
    timestamp: new Date().toISOString(),
    note: 'Esta rota está na lista de publicRoutes do plugin crypto-auth'
  }))

  // Rota protegida - MIDDLEWARE JÁ VALIDOU
  // Se chegou aqui, a assinatura foi validada com sucesso
  .get('/crypto-auth/protected', ({ request }) => {
    // O middleware já validou e colocou user no contexto
    const user = (request as any).user

    return {
      success: true,
      message: 'Acesso autorizado! Assinatura validada com sucesso.',
      user: {
        publicKey: user?.publicKey ? user.publicKey.substring(0, 16) + '...' : 'unknown',
        isAdmin: user?.isAdmin || false,
        permissions: user?.permissions || []
      },
      data: {
        secretInfo: 'Este é um dado protegido - só acessível com assinatura válida',
        userLevel: 'authenticated',
        timestamp: new Date().toISOString()
      }
    }
  })

  // Rota admin - requer autenticação E ser admin
  .get('/crypto-auth/admin', ({ request, set }) => {
    const user = (request as any).user

    // Verificar se é admin
    if (!user?.isAdmin) {
      set.status = 403
      return {
        success: false,
        error: 'Permissão negada',
        message: 'Esta rota requer privilégios de administrador',
        yourPermissions: user?.permissions || []
      }
    }

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
        message: 'Dados sensíveis de administração'
      }
    }
  })

  // Rota para obter dados sensíveis (POST com body assinado)
  .post('/crypto-auth/secure-data', async ({ body, headers, set }) => {
    const sessionId = headers['x-session-id']
    const signature = headers['x-signature']

    if (!sessionId || !signature) {
      set.status = 401
      return {
        success: false,
        error: 'Autenticação completa necessária (sessionId + assinatura)'
      }
    }

    return {
      success: true,
      message: 'Dados processados com segurança',
      receivedData: body,
      processed: {
        timestamp: new Date().toISOString(),
        signatureValid: true,
        sessionVerified: true
      }
    }
  }, {
    body: t.Object({
      query: t.String(),
      filters: t.Optional(t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String())
      }))
    })
  })

  // Rota para verificar status de autenticação
  .get('/crypto-auth/status', ({ headers }) => {
    const sessionId = headers['x-session-id']
    const signature = headers['x-signature']
    const timestamp = headers['x-timestamp']
    const nonce = headers['x-nonce']

    return {
      authenticated: !!(sessionId && signature),
      headers: {
        hasSessionId: !!sessionId,
        hasSignature: !!signature,
        hasTimestamp: !!timestamp,
        hasNonce: !!nonce
      },
      sessionPreview: sessionId ? sessionId.substring(0, 16) + '...' : null,
      timestamp: new Date().toISOString()
    }
  })
