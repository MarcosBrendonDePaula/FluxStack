/**
 * Session initialization utilities
 */

import { CryptoSessionManager } from './CryptoSessionManager'
import { RequestSigner } from './RequestSigner'
import { Logger } from '../shared/utils'

const logger = new Logger('SessionInit')

// Session initialization control
let sessionInitialized = false
let sessionInitializationPromise: Promise<{ sessionId: string | null; isNew: boolean }> | null = null

// Global instances
let globalSessionManager: CryptoSessionManager | null = null
let globalRequestSigner: RequestSigner | null = null

/**
 * Get or create global session manager
 */
export function getSessionManager(): CryptoSessionManager {
  if (!globalSessionManager) {
    globalSessionManager = new CryptoSessionManager()
  }
  return globalSessionManager
}

/**
 * Get or create global request signer
 */
export function getRequestSigner(): RequestSigner {
  if (!globalRequestSigner) {
    globalRequestSigner = new RequestSigner()
  }
  return globalRequestSigner
}

/**
 * Initialize session safely with proper async coordination
 */
export const initializeSessionSafely = async () => {
  // If already initialized, return immediately
  if (sessionInitialized) {
    logger.debug('Session already initialized, returning existing session')
    const sessionManager = getSessionManager()
    return { sessionId: sessionManager.getSessionId(), isNew: false }
  }
  
  // If initialization is in progress, wait for it
  if (sessionInitializationPromise) {
    logger.debug('Session initialization in progress, waiting...')
    return await sessionInitializationPromise
  }
  
  // Start initialization
  logger.info('Starting session initialization...')
  sessionInitializationPromise = (async () => {
    try {
      const sessionManager = getSessionManager()
      const result = await sessionManager.initialize()
      
      // Configure requestSigner with the initialized keys
      const privateKey = sessionManager.getPrivateKey()
      const sessionId = sessionManager.getSessionId()
      
      if (privateKey && sessionId) {
        const requestSigner = getRequestSigner()
        requestSigner.setKeys(privateKey, sessionId)
        logger.debug('RequestSigner configured with session keys')
      }
      
      sessionInitialized = true
      logger.info('Session initialized successfully', result)
      return result
    } catch (error) {
      sessionInitialized = false
      sessionInitializationPromise = null // Reset on error
      logger.error('Failed to initialize session', error)
      throw error
    }
  })()
  
  const result = await sessionInitializationPromise
  sessionInitializationPromise = null // Clear after completion
  return result
}

/**
 * Simple initialization that doesn't interfere with React rendering
 */
export const initializeSessionInBackground = () => {
  // Initialize in next tick to avoid React setState issues
  setTimeout(() => {
    initializeSessionSafely().catch(error => {
      logger.warn('Background session initialization failed', error)
    })
  }, 0)
}

/**
 * Force reinitialize session
 */
export const reinitializeSession = async () => {
  logger.info('Force reinitializing session...')
  
  // Reset state
  sessionInitialized = false
  sessionInitializationPromise = null
  
  // Clear existing instances
  if (globalSessionManager) {
    globalSessionManager.clearSession()
  }
  if (globalRequestSigner) {
    globalRequestSigner.clearKeys()
  }
  
  // Reinitialize
  return await initializeSessionSafely()
}

/**
 * Check if session is initialized
 */
export const isSessionInitialized = (): boolean => {
  return sessionInitialized
}

/**
 * Get current session status
 */
export const getSessionStatus = () => {
  const sessionManager = getSessionManager()
  const requestSigner = getRequestSigner()
  
  return {
    initialized: sessionInitialized,
    hasSession: sessionManager.hasSession(),
    signerReady: requestSigner.isReady(),
    sessionId: sessionManager.getSessionId(),
    sessionInfo: sessionManager.getSessionInfo()
  }
}