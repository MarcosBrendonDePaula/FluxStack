/**
 * Exportações principais do cliente de autenticação
 */

export type { AuthConfig, KeyPair, SignedRequestOptions } from './CryptoAuthClient'
// Re-exportar para compatibilidade
export { CryptoAuthClient, CryptoAuthClient as default } from './CryptoAuthClient'
// Componentes React
export * from './components'
