/**
 * Serviço de Autenticação Criptográfica
 * Implementa autenticação baseada em Ed25519
 */

import { ed25519 } from '@noble/curves/ed25519'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
export interface Logger {
  debug(message: string, meta?: any): void
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, meta?: any): void
}

export interface SessionData {
  sessionId: string
  publicKey: string
  createdAt: Date
  lastUsed: Date
  isAdmin: boolean
  permissions: string[]
}

export interface AuthResult {
  success: boolean
  sessionId?: string
  error?: string
  user?: {
    sessionId: string
    isAdmin: boolean
    isSuperAdmin: boolean
    permissions: string[]
  }
}

export interface CryptoAuthConfig {
  sessionTimeout: number
  maxTimeDrift: number
  adminKeys: string[]
  logger?: Logger
}

export class CryptoAuthService {
  private sessions: Map<string, SessionData> = new Map()
  private config: CryptoAuthConfig
  private logger?: Logger

  constructor(config: CryptoAuthConfig) {
    this.config = config
    this.logger = config.logger

    // Limpar sessões expiradas a cada 5 minutos
    setInterval(() => {
      this.cleanupExpiredSessions()
    }, 5 * 60 * 1000)
  }

  /**
   * Inicializar uma nova sessão
   */
  async initializeSession(data: { publicKey?: string }): Promise<AuthResult> {
    try {
      let publicKey: string

      if (data.publicKey) {
        // Validar chave pública fornecida
        if (!this.isValidPublicKey(data.publicKey)) {
          return {
            success: false,
            error: "Chave pública inválida"
          }
        }
        publicKey = data.publicKey
      } else {
        // Gerar novo par de chaves
        const privateKey = ed25519.utils.randomPrivateKey()
        publicKey = bytesToHex(ed25519.getPublicKey(privateKey))
      }

      const sessionId = publicKey
      const isAdmin = this.config.adminKeys.includes(publicKey)

      const sessionData: SessionData = {
        sessionId,
        publicKey,
        createdAt: new Date(),
        lastUsed: new Date(),
        isAdmin,
        permissions: isAdmin ? ['admin', 'read', 'write'] : ['read']
      }

      this.sessions.set(sessionId, sessionData)

      this.logger?.info("Nova sessão inicializada", {
        sessionId: sessionId.substring(0, 8) + "...",
        isAdmin,
        permissions: sessionData.permissions
      })

      return {
        success: true,
        sessionId,
        user: {
          sessionId,
          isAdmin,
          isSuperAdmin: isAdmin,
          permissions: sessionData.permissions
        }
      }
    } catch (error) {
      this.logger?.error("Erro ao inicializar sessão", { error })
      return {
        success: false,
        error: "Erro interno ao inicializar sessão"
      }
    }
  }

  /**
   * Validar uma sessão com assinatura
   */
  async validateSession(data: {
    sessionId: string
    timestamp: number
    nonce: string
    signature: string
    message?: string
  }): Promise<AuthResult> {
    try {
      const { sessionId, timestamp, nonce, signature, message = "" } = data

      // Verificar se a sessão existe
      const session = this.sessions.get(sessionId)
      if (!session) {
        return {
          success: false,
          error: "Sessão não encontrada"
        }
      }

      // Verificar se a sessão não expirou
      const now = Date.now()
      const sessionAge = now - session.lastUsed.getTime()
      if (sessionAge > this.config.sessionTimeout) {
        this.sessions.delete(sessionId)
        return {
          success: false,
          error: "Sessão expirada"
        }
      }

      // Verificar drift de tempo
      const timeDrift = Math.abs(now - timestamp)
      if (timeDrift > this.config.maxTimeDrift) {
        return {
          success: false,
          error: "Timestamp inválido"
        }
      }

      // Construir mensagem para verificação
      const messageToVerify = `${sessionId}:${timestamp}:${nonce}:${message}`
      const messageHash = sha256(new TextEncoder().encode(messageToVerify))

      // Verificar assinatura
      const publicKeyBytes = hexToBytes(session.publicKey)
      const signatureBytes = hexToBytes(signature)
      
      const isValidSignature = ed25519.verify(signatureBytes, messageHash, publicKeyBytes)
      
      if (!isValidSignature) {
        return {
          success: false,
          error: "Assinatura inválida"
        }
      }

      // Atualizar último uso da sessão
      session.lastUsed = new Date()

      return {
        success: true,
        sessionId,
        user: {
          sessionId,
          isAdmin: session.isAdmin,
          isSuperAdmin: session.isAdmin,
          permissions: session.permissions
        }
      }
    } catch (error) {
      this.logger?.error("Erro ao validar sessão", { error })
      return {
        success: false,
        error: "Erro interno ao validar sessão"
      }
    }
  }

  /**
   * Obter informações da sessão
   */
  async getSessionInfo(sessionId: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return null
    }

    // Verificar se não expirou
    const now = Date.now()
    const sessionAge = now - session.lastUsed.getTime()
    if (sessionAge > this.config.sessionTimeout) {
      this.sessions.delete(sessionId)
      return null
    }

    return { ...session }
  }

  /**
   * Destruir uma sessão
   */
  async destroySession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId)
    this.logger?.info("Sessão destruída", {
      sessionId: sessionId.substring(0, 8) + "..."
    })
  }

  /**
   * Verificar se uma chave pública é válida
   */
  private isValidPublicKey(publicKey: string): boolean {
    try {
      if (publicKey.length !== 64) {
        return false
      }
      
      const bytes = hexToBytes(publicKey)
      return bytes.length === 32
    } catch {
      return false
    }
  }

  /**
   * Limpar sessões expiradas
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionAge = now - session.lastUsed.getTime()
      if (sessionAge > this.config.sessionTimeout) {
        this.sessions.delete(sessionId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      this.logger?.debug(`Limpeza de sessões: ${cleanedCount} sessões expiradas removidas`)
    }
  }

  /**
   * Obter estatísticas das sessões
   */
  getStats() {
    const now = Date.now()
    let activeSessions = 0
    let adminSessions = 0

    for (const session of this.sessions.values()) {
      const sessionAge = now - session.lastUsed.getTime()
      if (sessionAge <= this.config.sessionTimeout) {
        activeSessions++
        if (session.isAdmin) {
          adminSessions++
        }
      }
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions,
      adminSessions,
      sessionTimeout: this.config.sessionTimeout,
      adminKeys: this.config.adminKeys.length
    }
  }
}