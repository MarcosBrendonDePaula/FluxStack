/**
 * FluxStack Crypto Auth Plugin
 * Sistema de autenticação baseado em criptografia Ed25519
 */

import type { FluxStack, PluginContext, RequestContext, ResponseContext } from "../../core/plugins/types"

type Plugin = FluxStack.Plugin
import { Elysia, t } from "elysia"
import { CryptoAuthService, AuthMiddleware } from "./server"

// Store config globally for hooks to access
let pluginConfig: any = null

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
      maxTimeDrift: {
        type: "number",
        minimum: 30000,
        description: "Máximo drift de tempo permitido em millisegundos (previne replay attacks)"
      },
      adminKeys: {
        type: "array",
        items: { type: "string" },
        description: "Chaves públicas dos administradores (hex 64 caracteres)"
      },
      protectedRoutes: {
        type: "array",
        items: { type: "string" },
        description: "Rotas que requerem autenticação via assinatura"
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
    maxTimeDrift: 300000, // 5 minutos
    adminKeys: [],
    protectedRoutes: ["/api/admin/*", "/api/crypto-auth/protected", "/api/crypto-auth/admin"],
    publicRoutes: ["/api/crypto-auth/public", "/api/health", "/api/docs", "/swagger"],
    enableMetrics: true
  },

  setup: async (context: PluginContext) => {
    const config = getPluginConfig(context)

    // Store config globally for hooks
    pluginConfig = config

    if (!config.enabled) {
      context.logger.info('Crypto Auth plugin desabilitado por configuração')
      return
    }

    // Inicializar serviço de autenticação (SEM SESSÕES)
    const authService = new CryptoAuthService({
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

    // Armazenar instâncias no contexto global
    ;(global as any).cryptoAuthService = authService
    ;(global as any).cryptoAuthMiddleware = authMiddleware

    context.logger.info("Crypto Auth plugin inicializado com sucesso", {
      maxTimeDrift: config.maxTimeDrift,
      adminKeys: config.adminKeys.length,
      protectedRoutes: config.protectedRoutes.length,
      publicRoutes: config.publicRoutes.length
    })
  },

  // Rotas removidas - autenticação é feita via middleware em cada requisição
  // @ts-ignore - plugin property não está no tipo oficial mas é suportada
  plugin: new Elysia({ prefix: "/api/auth" })
    .get("/info", () => ({
      name: "FluxStack Crypto Auth",
      description: "Autenticação baseada em assinatura Ed25519",
      version: "1.0.0",
      how_it_works: {
        step1: "Cliente gera par de chaves Ed25519 (pública + privada) localmente",
        step2: "Cliente armazena chave privada no navegador (NUNCA envia ao servidor)",
        step3: "Para cada requisição, cliente assina com chave privada",
        step4: "Cliente envia: chave pública + assinatura + dados",
        step5: "Servidor valida assinatura usando chave pública recebida"
      },
      required_headers: {
        "x-public-key": "Chave pública Ed25519 (hex 64 chars)",
        "x-timestamp": "Timestamp da requisição (milliseconds)",
        "x-nonce": "Nonce aleatório (previne replay)",
        "x-signature": "Assinatura Ed25519 da mensagem (hex)"
      },
      admin_keys: (global as any).cryptoAuthService?.getStats().adminKeys || 0
    })),

  onRequest: async (context: RequestContext) => {
    const authMiddleware = (global as any).cryptoAuthMiddleware as AuthMiddleware
    if (!authMiddleware) return

    // Aplicar middleware de autenticação
    const authResult = await authMiddleware.authenticate(context)

    if (!authResult.success && authResult.required) {
      // Marcar como handled e retornar erro
      ;(context as any).handled = true
      ;(context as any).authError = authResult.error
      ;(context as any).response = new Response(
        JSON.stringify({
          success: false,
          error: authResult.error,
          code: 'AUTHENTICATION_FAILED'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    } else if (authResult.success && authResult.user) {
      // Adicionar usuário ao request para acesso nas rotas
      ;(context.request as any).user = authResult.user
      // Também adicionar ao contexto para o onResponse hook
      ;(context as any).user = authResult.user
    }
  },

  onResponse: async (context: ResponseContext) => {
    if (!pluginConfig || !pluginConfig.enableMetrics) return

    // Log métricas de autenticação
    const user = (context as any).user
    const authError = (context as any).authError

    if (user) {
      console.debug("Requisição autenticada", {
        publicKey: user.publicKey?.substring(0, 8) + "...",
        isAdmin: user.isAdmin,
        path: context.path,
        method: context.method,
        duration: context.duration
      })
    } else if (authError) {
      console.warn("Falha na autenticação", {
        error: authError,
        path: context.path,
        method: context.method
      })
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