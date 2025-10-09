import { useState, useEffect } from 'react'
import { FaKey, FaLock, FaUnlock, FaCheckCircle, FaTimesCircle, FaSync, FaShieldAlt, FaCopy } from 'react-icons/fa'
import { CryptoAuthClient } from '../../../../plugins/crypto-auth/client'

interface SessionInfo {
  sessionId: string
  publicKey: string
  isAdmin: boolean
  permissions: string[]
  createdAt: Date
  lastUsed: Date
}

export function CryptoAuthPage() {
  const [authClient] = useState(() => new CryptoAuthClient({
    apiBaseUrl: '',
    autoInit: false
  }))
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [publicDataResult, setPublicDataResult] = useState<any>(null)
  const [protectedDataResult, setProtectedDataResult] = useState<any>(null)
  const [secureDataResult, setSecureDataResult] = useState<any>(null)
  const [statusResult, setStatusResult] = useState<any>(null)
  const [copiedKey, setCopiedKey] = useState('')

  useEffect(() => {
    const existingSession = authClient.getSession()
    if (existingSession) {
      setSession(existingSession)
    }
  }, [authClient])

  const handleCreateSession = async () => {
    setLoading(true)
    try {
      const newSession = await authClient.initialize()
      setSession(newSession)
    } catch (error) {
      console.error('Erro ao criar sessão:', error)
      alert('Erro ao criar sessão: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await authClient.logout()
      setSession(null)
      setPublicDataResult(null)
      setProtectedDataResult(null)
      setSecureDataResult(null)
      setStatusResult(null)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePublicRequest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/crypto-auth/public')
      const data = await response.json()
      setPublicDataResult(data)
    } catch (error) {
      console.error('Erro na requisição pública:', error)
      setPublicDataResult({ error: (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const handleProtectedRequest = async () => {
    setLoading(true)
    try {
      const response = await authClient.fetch('/api/crypto-auth/protected')
      const data = await response.json()
      setProtectedDataResult(data)
    } catch (error) {
      console.error('Erro na requisição protegida:', error)
      setProtectedDataResult({ error: (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const handleSecureDataRequest = async () => {
    setLoading(true)
    try {
      const response = await authClient.fetch('/api/crypto-auth/secure-data', {
        method: 'POST',
        body: JSON.stringify({
          query: 'SELECT * FROM secure_table',
          filters: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          }
        })
      })
      const data = await response.json()
      setSecureDataResult(data)
    } catch (error) {
      console.error('Erro na requisição segura:', error)
      setSecureDataResult({ error: (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusCheck = async () => {
    setLoading(true)
    try {
      const response = await authClient.fetch('/api/crypto-auth/status')
      const data = await response.json()
      setStatusResult(data)
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      setStatusResult({ error: (error as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(type)
    setTimeout(() => setCopiedKey(''), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <FaShieldAlt className="text-3xl" />
          <h1 className="text-3xl font-bold">🔐 Crypto Auth Demo</h1>
        </div>
        <p className="text-purple-100">
          Demonstração de autenticação criptográfica usando Ed25519
        </p>
      </div>

      {/* Session Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <FaKey className="mr-2 text-purple-600" />
          Status da Sessão
        </h2>

        {!session ? (
          <div className="text-center py-8">
            <FaUnlock className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Nenhuma sessão ativa</p>
            <button
              onClick={handleCreateSession}
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center mx-auto"
            >
              {loading ? <FaSync className="animate-spin mr-2" /> : <FaKey className="mr-2" />}
              Criar Nova Sessão
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <FaLock className="text-green-600 text-2xl mr-3" />
                <div>
                  <p className="font-semibold text-green-800">Sessão Ativa</p>
                  <p className="text-sm text-green-600">
                    Criada em: {session.createdAt.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                Logout
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Session ID (Public Key)</p>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-white px-2 py-1 rounded border flex-1 truncate">
                    {session.sessionId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(session.sessionId, 'public')}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    {copiedKey === 'public' ? <FaCheckCircle /> : <FaCopy />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Permissões</p>
                <div className="flex flex-wrap gap-1">
                  {session.permissions.map(perm => (
                    <span key={perm} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {perm}
                    </span>
                  ))}
                  {session.isAdmin && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Tests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🧪 Testes de API</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Public Request */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Rota Pública</h3>
            <p className="text-sm text-gray-600 mb-3">Não requer autenticação</p>
            <button
              onClick={handlePublicRequest}
              disabled={loading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 mb-3"
            >
              GET /api/crypto-auth/public
            </button>
            {publicDataResult && (
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(publicDataResult, null, 2)}
              </pre>
            )}
          </div>

          {/* Protected Request */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Rota Protegida</h3>
            <p className="text-sm text-gray-600 mb-3">Requer autenticação</p>
            <button
              onClick={handleProtectedRequest}
              disabled={loading || !session}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 mb-3"
            >
              GET /api/crypto-auth/protected
            </button>
            {protectedDataResult && (
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(protectedDataResult, null, 2)}
              </pre>
            )}
          </div>

          {/* Secure Data Request */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Dados Seguros (POST)</h3>
            <p className="text-sm text-gray-600 mb-3">Requisição assinada com body</p>
            <button
              onClick={handleSecureDataRequest}
              disabled={loading || !session}
              className="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 disabled:opacity-50 mb-3"
            >
              POST /api/crypto-auth/secure-data
            </button>
            {secureDataResult && (
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(secureDataResult, null, 2)}
              </pre>
            )}
          </div>

          {/* Status Check */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Status de Auth</h3>
            <p className="text-sm text-gray-600 mb-3">Verifica headers enviados</p>
            <button
              onClick={handleStatusCheck}
              disabled={loading || !session}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 mb-3"
            >
              GET /api/crypto-auth/status
            </button>
            {statusResult && (
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(statusResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-blue-900 mb-4">🔍 Como Funciona</h2>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start">
            <FaCheckCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
            <div>
              <strong>1. Geração de Chaves:</strong> Par de chaves Ed25519 gerado no cliente (pública + privada)
            </div>
          </div>
          <div className="flex items-start">
            <FaCheckCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
            <div>
              <strong>2. Registro de Sessão:</strong> Chave pública enviada ao servidor via POST /api/auth/session/init
            </div>
          </div>
          <div className="flex items-start">
            <FaCheckCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
            <div>
              <strong>3. Assinatura:</strong> Cada requisição é assinada com: sessionId + timestamp + nonce + mensagem
            </div>
          </div>
          <div className="flex items-start">
            <FaCheckCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
            <div>
              <strong>4. Validação:</strong> Servidor verifica assinatura usando chave pública armazenada
            </div>
          </div>
          <div className="flex items-start">
            <FaCheckCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
            <div>
              <strong>5. Headers Enviados:</strong> x-session-id, x-timestamp, x-nonce, x-signature
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
