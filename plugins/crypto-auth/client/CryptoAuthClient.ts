/**
 * Cliente de Autenticação Criptográfica
 * Gerencia autenticação no lado do cliente
 */

import { ed25519 } from '@noble/curves/ed25519'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'

export interface SessionInfo {
  sessionId: string
  publicKey: string
  privateKey: string
  isAdmin: boolean
  permissions: string[]
  createdAt: Date
  lastUsed: Date
}

export interface AuthConfig {
  apiBaseUrl?: string
  storage?: 'localStorage' | 'sessionStorage' | 'memory'
  autoInit?: boolean
  sessionTimeout?: number
}

export interface SignedRequestOptions extends RequestInit {
  skipAuth?: boolean
}

export class CryptoAuthClient {
  private session: SessionInfo | null = null
  private config: AuthConfig
  private storage: Storage | Map<string, string>

  constructor(config: AuthConfig = {}) {
    this.config = {
      apiBaseUrl: '',
      storage: 'localStorage',
      autoInit: true,
      sessionTimeout: 1800000, // 30 minutos
      ...config
    }

    // Configurar storage
    if (this.config.storage === 'localStorage' && typeof localStorage !== 'undefined') {
      this.storage = localStorage
    } else if (this.config.storage === 'sessionStorage' && typeof sessionStorage !== 'undefined') {
      this.storage = sessionStorage
    } else {
      this.storage = new Map<string, string>()
    }

    // Auto-inicializar se configurado
    if (this.config.autoInit) {
      this.initialize()
    }
  }

  /**
   * Inicializar sessão
   */
  async initialize(): Promise<SessionInfo> {
    // Tentar carregar sessão existente
    const existingSession = this.loadSession()
    if (existingSession && this.isSessionValid(existingSession)) {
      this.session = existingSession
      return existingSession
    }

    // Criar nova sessão
    return this.createNewSession()
  }

  /**
   * Criar nova sessão
   */
  async createNewSession(): Promise<SessionInfo> {
    try {
      // Gerar par de chaves
      const privateKey = ed25519.utils.randomPrivateKey()
      const publicKey = ed25519.getPublicKey(privateKey)
      
      const sessionId = bytesToHex(publicKey)
      const privateKeyHex = bytesToHex(privateKey)

      // Registrar sessão no servidor
      const response = await fetch(`${this.config.apiBaseUrl}/api/auth/session/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          publicKey: sessionId
        })
      })

      if (!response.ok) {
        throw new Error(`Erro ao inicializar sessão: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido ao inicializar sessão')
      }

      // Criar objeto de sessão
      const session: SessionInfo = {
        sessionId,
        publicKey: sessionId,
        privateKey: privateKeyHex,
        isAdmin: result.user?.isAdmin || false,
        permissions: result.user?.permissions || ['read'],
        createdAt: new Date(),
        lastUsed: new Date()
      }

      this.session = session
      this.saveSession(session)

      return session
    } catch (error) {
      console.error('Erro ao criar nova sessão:', error)
      throw error
    }
  }

  /**
   * Fazer requisição autenticada
   */
  async fetch(url: string, options: SignedRequestOptions = {}): Promise<Response> {
    const { skipAuth = false, ...fetchOptions } = options

    if (skipAuth) {
      return fetch(url, fetchOptions)
    }

    if (!this.session) {
      await this.initialize()
    }

    if (!this.session) {
      throw new Error('Sessão não inicializada')
    }

    // Preparar headers de autenticação
    const timestamp = Date.now()
    const nonce = this.generateNonce()
    const message = this.buildMessage(fetchOptions.method || 'GET', url, fetchOptions.body)
    const signature = this.signMessage(message, timestamp, nonce)

    const headers = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
      'x-session-id': this.session.sessionId,
      'x-timestamp': timestamp.toString(),
      'x-nonce': nonce,
      'x-signature': signature
    }

    // Atualizar último uso
    this.session.lastUsed = new Date()
    this.saveSession(this.session)

    return fetch(url, {
      ...fetchOptions,
      headers
    })
  }

  /**
   * Obter informações da sessão atual
   */
  getSession(): SessionInfo | null {
    return this.session
  }

  /**
   * Verificar se está autenticado
   */
  isAuthenticated(): boolean {
    return this.session !== null && this.isSessionValid(this.session)
  }

  /**
   * Verificar se é admin
   */
  isAdmin(): boolean {
    return this.session?.isAdmin || false
  }

  /**
   * Obter permissões
   */
  getPermissions(): string[] {
    return this.session?.permissions || []
  }

  /**
   * Fazer logout
   */
  async logout(): Promise<void> {
    if (this.session) {
      try {
        await this.fetch(`${this.config.apiBaseUrl}/api/auth/session/logout`, {
          method: 'POST'
        })
      } catch (error) {
        console.warn('Erro ao fazer logout no servidor:', error)
      }

      this.session = null
      this.clearSession()
    }
  }

  /**
   * Assinar mensagem
   */
  private signMessage(message: string, timestamp: number, nonce: string): string {
    if (!this.session) {
      throw new Error('Sessão não inicializada')
    }

    const fullMessage = `${this.session.sessionId}:${timestamp}:${nonce}:${message}`
    const messageHash = sha256(new TextEncoder().encode(fullMessage))
    const privateKeyBytes = hexToBytes(this.session.privateKey)
    const signature = ed25519.sign(messageHash, privateKeyBytes)
    
    return bytesToHex(signature)
  }

  /**
   * Construir mensagem para assinatura
   */
  private buildMessage(method: string, url: string, body?: any): string {
    const urlObj = new URL(url, window.location.origin)
    let message = `${method}:${urlObj.pathname}`
    
    if (body) {
      if (typeof body === 'string') {
        message += `:${body}`
      } else {
        message += `:${JSON.stringify(body)}`
      }
    }

    return message
  }

  /**
   * Gerar nonce aleatório
   */
  private generateNonce(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return bytesToHex(array)
  }

  /**
   * Verificar se sessão é válida
   */
  private isSessionValid(session: SessionInfo): boolean {
    const now = Date.now()
    const sessionAge = now - session.lastUsed.getTime()
    return sessionAge < (this.config.sessionTimeout || 1800000)
  }

  /**
   * Salvar sessão no storage
   */
  private saveSession(session: SessionInfo): void {
    const sessionData = JSON.stringify({
      ...session,
      createdAt: session.createdAt.toISOString(),
      lastUsed: session.lastUsed.toISOString()
    })

    if (this.storage instanceof Map) {
      this.storage.set('crypto-auth-session', sessionData)
    } else {
      this.storage.setItem('crypto-auth-session', sessionData)
    }
  }

  /**
   * Carregar sessão do storage
   */
  private loadSession(): SessionInfo | null {
    try {
      let sessionData: string | null

      if (this.storage instanceof Map) {
        sessionData = this.storage.get('crypto-auth-session') || null
      } else {
        sessionData = this.storage.getItem('crypto-auth-session')
      }

      if (!sessionData) {
        return null
      }

      const parsed = JSON.parse(sessionData)
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        lastUsed: new Date(parsed.lastUsed)
      }
    } catch (error) {
      console.warn('Erro ao carregar sessão:', error)
      return null
    }
  }

  /**
   * Limpar sessão do storage
   */
  private clearSession(): void {
    if (this.storage instanceof Map) {
      this.storage.delete('crypto-auth-session')
    } else {
      this.storage.removeItem('crypto-auth-session')
    }
  }
}