/**
 * Componente de Botão de Login
 * Componente React para autenticação criptográfica
 */

import React, { useState, useEffect } from 'react'
import { CryptoAuthClient } from '../CryptoAuthClient'

export interface LoginButtonProps {
  onLogin?: (session: any) => void
  onLogout?: () => void
  onError?: (error: string) => void
  className?: string
  loginText?: string
  logoutText?: string
  loadingText?: string
  showPermissions?: boolean
  authClient?: CryptoAuthClient
}

export const LoginButton: React.FC<LoginButtonProps> = ({
  onLogin,
  onLogout,
  onError,
  className = '',
  loginText = 'Entrar',
  logoutText = 'Sair',
  loadingText = 'Carregando...',
  showPermissions = false,
  authClient
}) => {
  const [client] = useState(() => authClient || new CryptoAuthClient())
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const currentSession = client.getSession()
      if (currentSession && client.isAuthenticated()) {
        setIsAuthenticated(true)
        setSession(currentSession)
      } else {
        setIsAuthenticated(false)
        setSession(null)
      }
    } catch (error) {
      console.error('Erro ao verificar status de autenticação:', error)
      setIsAuthenticated(false)
      setSession(null)
    }
  }

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      const newSession = await client.initialize()
      setIsAuthenticated(true)
      setSession(newSession)
      onLogin?.(newSession)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('Erro ao fazer login:', error)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await client.logout()
      setIsAuthenticated(false)
      setSession(null)
      onLogout?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('Erro ao fazer logout:', error)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const baseClassName = `
    px-4 py-2 rounded-md font-medium transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim()

  if (isLoading) {
    return (
      <button
        disabled
        className={`${baseClassName} bg-gray-400 text-white cursor-not-allowed ${className}`}
      >
        {loadingText}
      </button>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">
            Autenticado
            {session?.isAdmin && (
              <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                Admin
              </span>
            )}
          </span>
        </div>
        
        {showPermissions && session?.permissions && (
          <div className="flex gap-1">
            {session.permissions.map((permission: string) => (
              <span
                key={permission}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {permission}
              </span>
            ))}
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={`${baseClassName} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 ${className}`}
        >
          {logoutText}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleLogin}
      className={`${baseClassName} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 ${className}`}
    >
      {loginText}
    </button>
  )
}

export default LoginButton