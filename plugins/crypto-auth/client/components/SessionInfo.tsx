/**
 * Componente de Informações da Sessão
 * Exibe informações detalhadas sobre a sessão atual
 */

import React, { useState } from 'react'
import { useAuth } from './AuthProvider'

export interface SessionInfoProps {
  className?: string
  showPrivateKey?: boolean
  showFullSessionId?: boolean
  compact?: boolean
}

export const SessionInfo: React.FC<SessionInfoProps> = ({
  className = '',
  showPrivateKey = false,
  showFullSessionId = false,
  compact = false
}) => {
  const { session, isAuthenticated, isAdmin, permissions, isLoading } = useAuth()
  const [showDetails, setShowDetails] = useState(!compact)

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (!isAuthenticated || !session) {
    return (
      <div className={`text-gray-500 ${className}`}>
        <p>Não autenticado</p>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(date)
  }

  const truncateId = (id: string, length: number = 8) => {
    return showFullSessionId ? id : `${id.substring(0, length)}...`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Você pode adicionar um toast/notification aqui
    } catch (err) {
      console.error('Erro ao copiar para clipboard:', err)
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">
            {truncateId(session.sessionId)}
          </span>
          {isAdmin && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
              Admin
            </span>
          )}
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        
        {showDetails && (
          <div className="absolute z-10 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg min-w-80">
            <SessionDetails 
              session={session}
              isAdmin={isAdmin}
              permissions={permissions}
              showPrivateKey={showPrivateKey}
              showFullSessionId={showFullSessionId}
              onCopy={copyToClipboard}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <SessionDetails 
        session={session}
        isAdmin={isAdmin}
        permissions={permissions}
        showPrivateKey={showPrivateKey}
        showFullSessionId={showFullSessionId}
        onCopy={copyToClipboard}
      />
    </div>
  )
}

interface SessionDetailsProps {
  session: any
  isAdmin: boolean
  permissions: string[]
  showPrivateKey: boolean
  showFullSessionId: boolean
  onCopy: (text: string) => void
}

const SessionDetails: React.FC<SessionDetailsProps> = ({
  session,
  isAdmin,
  permissions,
  showPrivateKey,
  showFullSessionId,
  onCopy
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(date)
  }

  const CopyButton: React.FC<{ text: string }> = ({ text }) => (
    <button
      onClick={() => onCopy(text)}
      className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
      title="Copiar"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Informações da Sessão</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-600 font-medium">Ativo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm">
        <div>
          <label className="block text-gray-600 font-medium mb-1">Session ID</label>
          <div className="flex items-center">
            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono break-all">
              {showFullSessionId ? session.sessionId : `${session.sessionId.substring(0, 16)}...`}
            </code>
            <CopyButton text={session.sessionId} />
          </div>
        </div>

        <div>
          <label className="block text-gray-600 font-medium mb-1">Chave Pública</label>
          <div className="flex items-center">
            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono break-all">
              {showFullSessionId ? session.publicKey : `${session.publicKey.substring(0, 16)}...`}
            </code>
            <CopyButton text={session.publicKey} />
          </div>
        </div>

        {showPrivateKey && (
          <div>
            <label className="block text-red-600 font-medium mb-1">
              Chave Privada
              <span className="text-xs text-red-500 ml-1">(Confidencial)</span>
            </label>
            <div className="flex items-center">
              <code className="bg-red-50 border border-red-200 px-2 py-1 rounded text-xs font-mono break-all">
                {session.privateKey.substring(0, 16)}...
              </code>
              <CopyButton text={session.privateKey} />
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <div>
            <label className="block text-gray-600 font-medium mb-1">Status</label>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isAdmin 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {isAdmin ? 'Administrador' : 'Usuário'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">Permissões</label>
            <div className="flex flex-wrap gap-1">
              {permissions.map((permission) => (
                <span
                  key={permission}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div>
            <label className="block text-gray-600 font-medium mb-1">Criado em</label>
            <span className="text-gray-800">{formatDate(session.createdAt)}</span>
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">Último uso</label>
            <span className="text-gray-800">{formatDate(session.lastUsed)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionInfo