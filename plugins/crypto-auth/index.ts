/**
 * FluxStack Crypto Auth Plugin
 * Sistema de autenticação baseado em criptografia Ed25519
 */

import type { FluxStack, PluginContext, RequestContext, ResponseContext } from "../../core/plugins/types"

type Plugin = FluxStack.Plugin
import { Elysia, t } from "elysia"
import { CryptoAuthService, AuthMiddleware } from "./server"
import { makeProtectedRouteCommand } from "./cli/make-protected-route.command"

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
    enableMetrics: true
  },

  // CLI Commands
  commands: [
    makeProtectedRouteCommand
  ],

  setup: async (context: PluginContext) => {
    // ✅ Usar config declarativo do FluxStack
    const { cryptoAuthConfig } = await import('@/config')
    const config = cryptoAuthConfig

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

    // Inicializar middleware de autenticação (sem path matching)
    const authMiddleware = new AuthMiddleware(authService, {
      logger: context.logger
    })

    // Armazenar instâncias no contexto global
    ;(global as any).cryptoAuthService = authService
    ;(global as any).cryptoAuthMiddleware = authMiddleware

    context.logger.info("✅ Crypto Auth plugin inicializado", {
      mode: 'middleware-based',
      maxTimeDrift: config.maxTimeDrift,
      adminKeys: config.adminKeys.length,
      usage: 'Use cryptoAuthRequired(), cryptoAuthAdmin(), cryptoAuthOptional() nas rotas'
    })
  },

  // @ts-ignore - plugin property não está no tipo oficial mas é suportada
  plugin: new Elysia({ prefix: "/api/auth" })
    .get("/info", () => ({
      name: "FluxStack Crypto Auth",
      description: "Autenticação baseada em assinatura Ed25519",
      version: "1.0.0",
      mode: "middleware-based",
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
      admin_keys: (global as any).cryptoAuthService?.getStats().adminKeys || 0,
      usage: {
        required: "import { cryptoAuthRequired } from '@/plugins/crypto-auth/server'",
        admin: "import { cryptoAuthAdmin } from '@/plugins/crypto-auth/server'",
        optional: "import { cryptoAuthOptional } from '@/plugins/crypto-auth/server'",
        permissions: "import { cryptoAuthPermissions } from '@/plugins/crypto-auth/server'"
      }
    })),

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
    const { cryptoAuthConfig } = await import('@/config')

    if (cryptoAuthConfig.enabled) {
      context.logger.info("✅ Crypto Auth plugin ativo", {
        mode: 'middleware-based',
        adminKeys: cryptoAuthConfig.adminKeys.length,
        maxTimeDrift: `${cryptoAuthConfig.maxTimeDrift}ms`,
        usage: 'Use cryptoAuthRequired(), cryptoAuthAdmin() nas rotas'
      })
    }
  }
}

export default cryptoAuthPlugin