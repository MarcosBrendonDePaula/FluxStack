/**
 * Exportações principais do cliente de autenticação
 */

export { CryptoAuthClient } from './CryptoAuthClient'
export type { SessionInfo, AuthConfig, SignedRequestOptions } from './CryptoAuthClient'

// Componentes React
export * from './components'

// Re-exportar para compatibilidade
export { CryptoAuthClient as default } from './CryptoAuthClient'