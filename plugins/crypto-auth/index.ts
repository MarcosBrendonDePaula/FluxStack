/**
 * FluxStack Crypto Auth Plugin
 * Sistema de autenticação baseado em criptografia Ed25519
 */

import type { FluxStack, PluginContext, RequestContext, ResponseContext } from "../../core/plugins/types"

type Plugin = FluxStack.Plugin
import { CryptoAuthService, AuthMiddleware } from "./server"

export const cryptoAuthPlugin: Plugin = {
  name: "crypto-auth",
  version: "1.0.0",
  description: "Sistema de autenticação baseado em criptografia Ed25519 para FluxStack",
  author: "FluxStack Team",
  priority: 100, // Alta prioridade para autenticação
  category: "auth",
  tags: ["authentication", "ed25519", "cryptography", "security"],
  dependencies: [],
  
  configSchema: {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
        description: "Habilitar autenticação criptográfica"
      },
      sessionTimeout: {
        type: "number",
        minimum: 300000, // 5 minutos mínimo
        description: "Timeout da sessão em millisegundos"
      },
      maxTimeDrift: {
        type: "number",
        minimum: 30000,
        description: "Máximo drift de tempo permitido em millisegundos"
      },
      adminKeys: {
        type: "array",
        items: { type: "string" },
        description: "Chaves públicas dos administradores"
      },
      protectedRoutes: {
        type: "array",
        items: { type: "string" },
        description: "Rotas que requerem autenticação"
      },
      publicRoutes: {
        type: "array",
        items: { type: "string" },
        description: "Rotas públicas (não requerem autenticação)"
      },
      enableMetrics: {
        type: "boolean",
        description: "Habilitar métricas de autenticação"
      }
    },
    additionalProperties: false
  },
  
  defaultConfig: {
    enabled: true,
    sessionTimeout: 1800000, // 30 minutos
    maxTimeDrift: 300000, // 5 minutos
    adminKeys: [],
    protectedRoutes: ["/api/admin/*", "/api/protected/*"],
    publicRoutes: ["/api/auth/*", "/api/health", "/api/docs"],
    enableMetrics: true
  },

  setup: async (context: PluginContext) => {
    const config = getPluginConfig(context)
    
    if (!config.enabled) {
      context.logger.info('Crypto Auth plugin desabilitado por configuração')
      return
    }

    // Inicializar serviço de autenticação
    const authService = new CryptoAuthService({
      sessionTimeout: config.sessionTimeout,
      maxTimeDrift: config.maxTimeDrift,
      adminKeys: config.adminKeys,
      logger: context.logger
    })

    // Inicializar middleware de autenticação
    const authMiddleware = new AuthMiddleware(authService, {
      protectedRoutes: config.protectedRoutes,
      publicRoutes: config.publicRoutes,
      logger: context.logger
    })

    // Armazenar instâncias no contexto para uso posterior
    ;(context as any).authService = authService
    ;(context as any).authMiddleware = authMiddleware

    // Registrar rotas de autenticação
    context.app.group("/api/auth", (app: any) => {
      // Rota para inicializar sessão
      app.post("/session/init", async ({ body, set }: any) => {
        try {
          const result = await authService.initializeSession(body)
          return result
        } catch (error) {
          context.logger.error("Erro ao inicializar sessão", { error })
          set.status = 500
          return { success: false, error: "Erro interno do servidor" }
        }
      })

      // Rota para validar sessão
      app.post("/session/validate", async ({ body, set }: any) => {
        try {
          const result = await authService.validateSession(body)
          return result
        } catch (error) {
          context.logger.error("Erro ao validar sessão", { error })
          set.status = 500
          return { success: false, error: "Erro interno do servidor" }
        }
      })

      // Rota para obter informações da sessão
      app.get("/session/info", async ({ headers, set }: any) => {
        try {
          const sessionId = headers['x-session-id']
          if (!sessionId) {
            set.status = 401
            return { success: false, error: "Session ID não fornecido" }
          }

          const sessionInfo = await authService.getSessionInfo(sessionId)
          return { success: true, session: sessionInfo }
        } catch (error) {
          context.logger.error("Erro ao obter informações da sessão", { error })
          set.status = 500
          return { success: false, error: "Erro interno do servidor" }
        }
      })

      // Rota para logout
      app.post("/session/logout", async ({ headers, set }: any) => {
        try {
          const sessionId = headers['x-session-id']
          if (!sessionId) {
            set.status = 401
            return { success: false, error: "Session ID não fornecido" }
          }

          await authService.destroySession(sessionId)
          return { success: true, message: "Sessão encerrada com sucesso" }
        } catch (error) {
          context.logger.error("Erro ao encerrar sessão", { error })
          set.status = 500
          return { success: false, error: "Erro interno do servidor" }
        }
      })
    })

    context.logger.info("Crypto Auth plugin inicializado com sucesso", {
      sessionTimeout: config.sessionTimeout,
      adminKeys: config.adminKeys.length,
      protectedRoutes: config.protectedRoutes.length
    })
  },

  onRequest: async (context: RequestContext) => {
    const pluginContext = (context as any).pluginContext
    if (!pluginContext?.authMiddleware) return

    // Aplicar middleware de autenticação
    const authResult = await pluginContext.authMiddleware.authenticate(context)
    
    if (!authResult.success && authResult.required) {
      // Marcar como handled para evitar processamento adicional
      ;(context as any).handled = true
      ;(context as any).authError = authResult.error
    } else if (authResult.success && authResult.user) {
      // Adicionar usuário ao contexto
      ;(context as any).user = authResult.user
    }
  },

  onResponse: async (context: ResponseContext) => {
    const config = getPluginConfig((context as any).pluginContext)
    
    if (config.enableMetrics) {
      // Log métricas de autenticação
      const user = (context as any).user
      const authError = (context as any).authError
      
      if (user) {
        ;((context as any).pluginContext?.logger || console).debug("Requisição autenticada", {
          sessionId: user.sessionId,
          isAdmin: user.isAdmin,
          path: context.path,
          method: context.method,
          duration: context.duration
        })
      } else if (authError) {
        ;((context as any).pluginContext?.logger || console).warn("Falha na autenticação", {
          error: authError,
          path: context.path,
          method: context.method
        })
      }
    }
  },

  onServerStart: async (context: PluginContext) => {
    const config = getPluginConfig(context)
    
    if (config.enabled) {
      context.logger.info("Crypto Auth plugin ativo", {
        protectedRoutes: config.protectedRoutes.length,
        publicRoutes: config.publicRoutes.length,
        adminKeys: config.adminKeys.length
      })
    }
  }
}

// Helper function para obter configuração do plugin
function getPluginConfig(context: PluginContext) {
  const pluginConfig = context.config.plugins.config?.['crypto-auth'] || {}
  return { ...cryptoAuthPlugin.defaultConfig, ...pluginConfig }
}

export default cryptoAuthPlugin