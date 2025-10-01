/**
 * React hook for session management
 */

import { useState, useEffect, useCallback } from 'react'
import { getSessionManager, getRequestSigner, initializeSessionSafely } from '../sessionInit'
import { Logger } from '../../shared/utils'

const logger = new Logger('useSession')

interface UseSessionReturn {
  sessionId: string | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionManager: ReturnType<typeof getSessionManager>
  requestSigner: ReturnType<typeof getRequestSigner>
  authenticate: (baseUrl?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refresh: () => Promise<void>
  exportPrivateKey: () => string | null
  importPrivateKey: (privateKey: string) => Promise<{ sessionId: string }>
  generateNewSession: () => Promise<{ sessionId: string; isNew: boolean }>
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<{
    sessionId: string | null
    isAuthenticated: boolean
    isLoading: boolean
  }>({
    sessionId: null,
    isAuthenticated: false,
    isLoading: true
  })

  const sessionManager = getSessionManager()
  const requestSigner = getRequestSigner()

  // Initialize session on mount
  useEffect(() => {
    let mounted = true
    
    const initializeSession = async () => {
      try {
        await initializeSessionSafely()
        
        if (mounted) {
          const currentSessionId = sessionManager.getSessionId()
          setSession({
            sessionId: currentSessionId,
            isAuthenticated: !!currentSessionId,
            isLoading: false
          })
        }
      } catch (error) {
        logger.error('Session initialization failed', error)
        if (mounted) {
          setSession({
            sessionId: null,
            isAuthenticated: false,
            isLoading: false
          })
        }
      }
    }

    initializeSession()

    return () => {
      mounted = false
    }
  }, [sessionManager])

  // Monitor session state changes
  useEffect(() => {
    let mounted = true
    
    const checkSession = () => {
      if (mounted) {
        const currentSessionId = sessionManager.getSessionId()
        setSession(prev => ({
          ...prev,
          sessionId: currentSessionId,
          isAuthenticated: !!currentSessionId,
          isLoading: false
        }))
      }
    }

    // Check immediately
    checkSession()
    
    // Check periodically if session is not ready
    const interval = setInterval(() => {
      const currentSessionId = sessionManager.getSessionId()
      if (currentSessionId && mounted) {
        setSession(prev => ({
          ...prev,
          sessionId: currentSessionId,
          isAuthenticated: !!currentSessionId,
          isLoading: false
        }))
        clearInterval(interval)
      }
    }, 100)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [sessionManager])

  const authenticate = useCallback(async (baseUrl?: string) => {
    try {
      const result = await sessionManager.authenticate(baseUrl)
      if (result.success) {
        setSession(prev => ({ ...prev, isAuthenticated: true }))
      }
      return result
    } catch (error) {
      logger.error('Authentication failed', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      }
    }
  }, [sessionManager])

  const logout = useCallback(() => {
    sessionManager.clearSession()
    requestSigner.clearKeys()
    setSession({
      sessionId: null,
      isAuthenticated: false,
      isLoading: false
    })
    logger.info('User logged out')
  }, [sessionManager, requestSigner])

  const refresh = useCallback(async () => {
    try {
      setSession(prev => ({ ...prev, isLoading: true }))
      
      const result = await sessionManager.initialize()
      const privateKey = sessionManager.getPrivateKey()
      
      if (privateKey && result.sessionId) {
        requestSigner.setKeys(privateKey, result.sessionId)
      }
      
      setSession({
        sessionId: result.sessionId,
        isAuthenticated: !!result.sessionId,
        isLoading: false
      })
      
      logger.info('Session refreshed', { sessionId: result.sessionId?.slice(0, 8) + '...' })
    } catch (error) {
      logger.error('Session refresh failed', error)
      setSession({
        sessionId: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  }, [sessionManager, requestSigner])

  const exportPrivateKey = useCallback(() => {
    return sessionManager.exportPrivateKey()
  }, [sessionManager])

  const importPrivateKey = useCallback(async (privateKey: string) => {
    try {
      const result = await sessionManager.importFromPrivateKey(privateKey)
      const newPrivateKey = sessionManager.getPrivateKey()
      
      if (newPrivateKey) {
        requestSigner.setKeys(newPrivateKey, result.sessionId)
      }
      
      setSession({
        sessionId: result.sessionId,
        isAuthenticated: true,
        isLoading: false
      })
      
      logger.info('Private key imported successfully')
      return result
    } catch (error) {
      logger.error('Private key import failed', error)
      throw error
    }
  }, [sessionManager, requestSigner])

  const generateNewSession = useCallback(async () => {
    try {
      setSession(prev => ({ ...prev, isLoading: true }))
      
      const result = await sessionManager.generateNewSession()
      const privateKey = sessionManager.getPrivateKey()
      
      if (privateKey) {
        requestSigner.setKeys(privateKey, result.sessionId)
      }
      
      setSession({
        sessionId: result.sessionId,
        isAuthenticated: true,
        isLoading: false
      })
      
      logger.info('New session generated')
      return result
    } catch (error) {
      logger.error('New session generation failed', error)
      setSession(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [sessionManager, requestSigner])

  return {
    ...session,
    sessionManager,
    requestSigner,
    authenticate,
    logout,
    refresh,
    exportPrivateKey,
    importPrivateKey,
    generateNewSession
  }
}