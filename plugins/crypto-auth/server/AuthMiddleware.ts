/**
 * Middleware de Autenticação
 * Intercepta requisições e valida autenticação
 */

import type { RequestContext } from '../../../core/plugins/types'
import type { CryptoAuthService } from './CryptoAuthService'

export interface Logger {
    debug(message: string, meta?: any): void
    info(message: string, meta?: any): void
    warn(message: string, meta?: any): void
    error(message: string, meta?: any): void
}

export interface AuthMiddlewareConfig {
    protectedRoutes: string[]
    publicRoutes: string[]
    logger?: Logger
}

export interface AuthMiddlewareResult {
    success: boolean
    required: boolean
    error?: string
    user?: {
        sessionId: string
        isAdmin: boolean
        isSuperAdmin: boolean
        permissions: string[]
    }
}

export class AuthMiddleware {
    private authService: CryptoAuthService
    private config: AuthMiddlewareConfig
    private logger?: Logger

    constructor(authService: CryptoAuthService, config: AuthMiddlewareConfig) {
        this.authService = authService
        this.config = config
        this.logger = config.logger
    }

    /**
     * Autenticar requisição
     */
    async authenticate(context: RequestContext): Promise<AuthMiddlewareResult> {
        const path = context.path
        const method = context.method

        // Verificar se a rota é pública
        if (this.isPublicRoute(path)) {
            return {
                success: true,
                required: false
            }
        }

        // Verificar se a rota requer autenticação
        if (!this.isProtectedRoute(path)) {
            return {
                success: true,
                required: false
            }
        }

        // Extrair headers de autenticação
        const authHeaders = this.extractAuthHeaders(context.headers)
        if (!authHeaders) {
            this.logger?.warn("Headers de autenticação ausentes", {
                path,
                method,
                headers: Object.keys(context.headers)
            })

            return {
                success: false,
                required: true,
                error: "Headers de autenticação obrigatórios"
            }
        }

        // Validar sessão
        try {
            const validationResult = await this.authService.validateSession({
                sessionId: authHeaders.sessionId,
                timestamp: authHeaders.timestamp,
                nonce: authHeaders.nonce,
                signature: authHeaders.signature,
                message: this.buildMessage(context)
            })

            if (!validationResult.success) {
                this.logger?.warn("Falha na validação da sessão", {
                    path,
                    method,
                    sessionId: authHeaders.sessionId.substring(0, 8) + "...",
                    error: validationResult.error
                })

                return {
                    success: false,
                    required: true,
                    error: validationResult.error
                }
            }

            this.logger?.debug("Requisição autenticada com sucesso", {
                path,
                method,
                sessionId: authHeaders.sessionId.substring(0, 8) + "...",
                isAdmin: validationResult.user?.isAdmin
            })

            return {
                success: true,
                required: true,
                user: validationResult.user
            }
        } catch (error) {
            this.logger?.error("Erro durante autenticação", {
                path,
                method,
                error
            })

            return {
                success: false,
                required: true,
                error: "Erro interno de autenticação"
            }
        }
    }

    /**
     * Verificar se a rota é pública
     */
    private isPublicRoute(path: string): boolean {
        return this.config.publicRoutes.some(route => {
            if (route.endsWith('/*')) {
                const prefix = route.slice(0, -2)
                return path.startsWith(prefix)
            }
            return path === route
        })
    }

    /**
     * Verificar se a rota é protegida
     */
    private isProtectedRoute(path: string): boolean {
        return this.config.protectedRoutes.some(route => {
            if (route.endsWith('/*')) {
                const prefix = route.slice(0, -2)
                return path.startsWith(prefix)
            }
            return path === route
        })
    }

    /**
     * Extrair headers de autenticação
     */
    private extractAuthHeaders(headers: Record<string, string>): {
        sessionId: string
        timestamp: number
        nonce: string
        signature: string
    } | null {
        const sessionId = headers['x-session-id']
        const timestampStr = headers['x-timestamp']
        const nonce = headers['x-nonce']
        const signature = headers['x-signature']

        if (!sessionId || !timestampStr || !nonce || !signature) {
            return null
        }

        const timestamp = parseInt(timestampStr, 10)
        if (isNaN(timestamp)) {
            return null
        }

        return {
            sessionId,
            timestamp,
            nonce,
            signature
        }
    }

    /**
     * Construir mensagem para assinatura
     */
    private buildMessage(context: RequestContext): string {
        // Incluir método, path e body (se houver) na mensagem
        let message = `${context.method}:${context.path}`

        if (context.body && typeof context.body === 'string') {
            message += `:${context.body}`
        } else if (context.body && typeof context.body === 'object') {
            message += `:${JSON.stringify(context.body)}`
        }

        return message
    }

    /**
     * Verificar se usuário tem permissão para acessar rota
     */
    hasPermission(user: any, requiredPermission: string): boolean {
        if (!user || !user.permissions) {
            return false
        }

        return user.permissions.includes(requiredPermission) || user.permissions.includes('admin')
    }

    /**
     * Verificar se usuário é admin
     */
    isAdmin(user: any): boolean {
        return user && user.isAdmin === true
    }

    /**
     * Obter estatísticas do middleware
     */
    getStats() {
        return {
            protectedRoutes: this.config.protectedRoutes.length,
            publicRoutes: this.config.publicRoutes.length,
            authService: this.authService.getStats()
        }
    }
}