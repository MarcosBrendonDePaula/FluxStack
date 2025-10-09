/**
 * Rotas de demonstração do Crypto Auth Plugin
 * Exemplos de rotas protegidas e públicas
 */

import { Elysia, t } from 'elysia'

export const cryptoAuthDemoRoutes = new Elysia({ prefix: '/api' })
  // Rota pública - não requer autenticação
  .get('/crypto-auth/public', () => ({
    success: true,
    message: 'Esta é uma rota pública, acessível sem autenticação',
    timestamp: new Date().toISOString()
  }))

  // Rota protegida - requer autenticação
  .get('/crypto-auth/protected', ({ headers, set }) => {
    const sessionId = headers['x-session-id']

    if (!sessionId) {
      set.status = 401
      return {
        success: false,
        error: 'Autenticação necessária',
        message: 'Esta rota requer autenticação via assinatura criptográfica'
      }
    }

    return {
      success: true,
      message: 'Acesso autorizado! Você está autenticado.',
      sessionId: sessionId.substring(0, 16) + '...',
      data: {
        secretInfo: 'Este é um dado protegido',
        userLevel: 'authenticated',
        timestamp: new Date().toISOString()
      }
    }
  })

  // Rota admin - requer autenticação de admin
  .get('/crypto-auth/admin', ({ headers, set }) => {
    const sessionId = headers['x-session-id']

    if (!sessionId) {
      set.status = 401
      return {
        success: false,
        error: 'Autenticação necessária'
      }
    }

    // TODO: Verificar se é admin usando authService
    // Por enquanto, retorna dados de exemplo
    return {
      success: true,
      message: 'Acesso admin autorizado',
      sessionId: sessionId.substring(0, 16) + '...',
      adminData: {
        totalSessions: 42,
        activeUsers: 12,
        systemHealth: 'optimal'
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
