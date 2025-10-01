/**
 * Provedor de Contexto de Autenticação
 * Context Provider React para gerenciar estado de autenticação
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { CryptoAuthClient, SessionInfo, AuthConfig } from '../CryptoAuthClient'

export interface AuthContextValue {
  client: CryptoAuthClient
  session: SessionInfo | null
  isAuthenticated: boolean
  isAdmin: boolean
  permissions: string[]
  isLoading: boolean
  error: string | null
  login: () => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export interface AuthProviderProps {
  children: ReactNode
  config?: AuthConfig
  onAuthChange?: (isAuthenticated: boolean, session: SessionInfo | null) => void
  onError?: (error: string) => void
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  config = {},
  onAuthChange,
  onError
}) => {
  const [client] = useState(() => new CryptoAuthClient({ ...config, autoInit: false }))
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = session !== null && client.isAuthenticated()
  const isAdmin = session?.isAdmin || false
  const permissions = session?.permissions || []

  useEffect(() => {
    initializeAuth()
  }, [])

  useEffect(() => {
    onAuthChange?.(isAuthenticated, session)
  }, [isAuthenticated, session, onAuthChange])

  const initializeAuth = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const currentSession = client.getSession()
      if (currentSession && client.isAuthenticated()) {
        setSession(currentSession)
      } else {
        // Tentar inicializar automaticamente se não houver sessão
        try {
          const newSession = await client.initialize()
          setSession(newSession)
        } catch (initError) {
          // Falha na inicialização automática é normal se não houver sessão salva
          console.debug('Inicialização automática falhou:', initError)
          setSession(null)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      onError?.(errorMessage)
      console.error('Erro ao inicializar autenticação:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const newSession = await client.createNewSession()
      setSession(newSession)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login'
      setError(errorMessage)
      onError?.(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await client.logout()
      setSession(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer logout'
      setError(errorMessage)
      onError?.(errorMessage)
      // Mesmo com erro, limpar a sessão local
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }

  const refresh = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Verificar se a sessão atual ainda é válida
      const currentSession = client.getSession()
      if (currentSession && client.isAuthenticated()) {
        // Tentar fazer uma requisição de teste para validar no servidor
        const response = await client.fetch('/api/auth/session/info')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.session) {
            // Atualizar informações da sessão
            const updatedSession = {
              ...currentSession,
              ...result.session,
              lastUsed: new Date()
            }
            setSession(updatedSession)
          } else {
            // Sessão inválida no servidor
            setSession(null)
          }
        } else {
          // Erro na requisição, sessão pode estar inválida
          setSession(null)
        }
      } else {
        setSession(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar sessão'
      setError(errorMessage)
      onError?.(errorMessage)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }

  const contextValue: AuthContextValue = {
    client,
    session,
    isAuthenticated,
    isAdmin,
    permissions,
    isLoading,
    error,
    login,
    logout,
    refresh
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para usar o contexto de autenticação
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

export default AuthProvider