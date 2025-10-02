/**
 * Componente de Rota Protegida
 * Protege componentes que requerem autenticação
 */

import React, { ReactNode } from 'react'
import { useAuth } from './AuthProvider'

export interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
  requiredPermissions?: string[]
  fallback?: ReactNode
  loadingComponent?: ReactNode
  unauthorizedComponent?: ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requiredPermissions = [],
  fallback,
  loadingComponent,
  unauthorizedComponent
}) => {
  const { isAuthenticated, isAdmin, permissions, isLoading, error } = useAuth()

  // Componente de loading padrão
  const defaultLoadingComponent = (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Verificando autenticação...</span>
    </div>
  )

  // Componente de não autorizado padrão
  const defaultUnauthorizedComponent = (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-red-600 mb-4">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-red-800 mb-2">Acesso Negado</h3>
      <p className="text-red-600 text-center">
        {!isAuthenticated 
          ? 'Você precisa estar autenticado para acessar esta página.'
          : requireAdmin && !isAdmin
          ? 'Você precisa de privilégios de administrador para acessar esta página.'
          : 'Você não tem as permissões necessárias para acessar esta página.'
        }
      </p>
      {error && (
        <p className="text-red-500 text-sm mt-2">
          Erro: {error}
        </p>
      )}
    </div>
  )

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return <>{loadingComponent || defaultLoadingComponent}</>
  }

  // Verificar se está autenticado
  if (!isAuthenticated) {
    return <>{unauthorizedComponent || fallback || defaultUnauthorizedComponent}</>
  }

  // Verificar se requer admin
  if (requireAdmin && !isAdmin) {
    return <>{unauthorizedComponent || fallback || defaultUnauthorizedComponent}</>
  }

  // Verificar permissões específicas
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      permissions.includes(permission) || permissions.includes('admin')
    )

    if (!hasRequiredPermissions) {
      return <>{unauthorizedComponent || fallback || defaultUnauthorizedComponent}</>
    }
  }

  // Usuário autorizado, renderizar children
  return <>{children}</>
}

/**
 * HOC para proteger componentes
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  const WrappedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  )

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ProtectedRoute