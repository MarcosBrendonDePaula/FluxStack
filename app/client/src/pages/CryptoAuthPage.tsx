import { useState, useEffect } from 'react'
import { FaKey, FaLock, FaUnlock, FaCheckCircle, FaTimesCircle, FaSync, FaShieldAlt, FaCopy, FaFileImport, FaExclamationTriangle } from 'react-icons/fa'
import { CryptoAuthClient, type KeyPair } from '../../../../plugins/crypto-auth/client'

export function CryptoAuthPage() {
  const [authClient] = useState(() => new CryptoAuthClient({
    storage: 'sessionStorage', // Usar sessionStorage ao invés de localStorage
    autoInit: true // Gerar automaticamente ao inicializar
  }))
  const [keys, setKeys] = useState<KeyPair | null>(null)
  const [loading, setLoading] = useState(false)
  const [publicDataResult, setPublicDataResult] = useState<any>(null)
  const [protectedDataResult, setProtectedDataResult] = useState<any>(null)
  const [copiedKey, setCopiedKey] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importKey, setImportKey] = useState('')
  const [importError, setImportError] = useState('')

  useEffect(() => {
    const existingKeys = authClient.getKeys()
    if (existingKeys) {
      setKeys(existingKeys)
    }
  }, [authClient])

  const handleCreateKeys = () => {
    setLoading(true)
    try {
      const newKeys = authClient.createNewKeys()
      setKeys(newKeys)
    } catch (error) {
      console.error('Erro ao criar chaves:', error)
      alert('Erro ao criar chaves: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleClearKeys = () => {
    setLoading(true)
    try {
      authClient.clearKeys()
      setKeys(null)
      setPublicDataResult(null)
      setProtectedDataResult(null)
    } catch (error) {
      console.error('Erro ao limpar chaves:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImportKey = () => {
    setImportError('')
    setLoading(true)
    try {
      const trimmedKey = importKey.trim()
      const importedKeys = authClient.importPrivateKey(trimmedKey)
      setKeys(importedKeys)
      setShowImportModal(false)
      setImportKey('')
    } catch (error) {
      console.error('Erro ao importar chave:', error)
      setImportError((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const openImportModal = () => {
    setShowImportModal(true)
    setImportKey('')
    setImportError('')
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
          Autenticação criptográfica usando Ed25519 - SEM sessões no servidor
        </p>
      </div>

      {/* Keys Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <FaKey className="mr-2 text-purple-600" />
          Suas Chaves Criptográficas
        </h2>

        {!keys ? (
          <div className="text-center py-8">
            <FaUnlock className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Nenhum par de chaves gerado</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCreateKeys}
                disabled={loading}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
              >
                {loading ? <FaSync className="animate-spin mr-2" /> : <FaKey className="mr-2" />}
                Gerar Novo Par de Chaves
              </button>
              <button
                onClick={openImportModal}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <FaFileImport className="mr-2" />
                Importar Chave Privada
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <FaLock className="text-green-600 text-2xl mr-3" />
                <div>
                  <p className="font-semibold text-green-800 flex items-center gap-2">
                    Chaves Ativas
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      sessionStorage
                    </span>
                  </p>
                  <p className="text-sm text-green-600">
                    Criadas em: {keys.createdAt.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={openImportModal}
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center text-sm"
                >
                  <FaFileImport className="mr-2" />
                  Importar
                </button>
                <button
                  onClick={handleClearKeys}
                  disabled={loading}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  Limpar Chaves
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Chave Pública (enviada ao servidor)</p>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-white px-2 py-1 rounded border flex-1 break-all">
                    {keys.publicKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(keys.publicKey, 'public')}
                    className="text-purple-600 hover:text-purple-700 flex-shrink-0"
                  >
                    {copiedKey === 'public' ? <FaCheckCircle /> : <FaCopy />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                <p className="text-sm text-red-600 mb-1 font-bold">⚠️ Chave Privada (NUNCA compartilhar!)</p>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-white px-2 py-1 rounded border flex-1 break-all blur-sm hover:blur-none transition">
                    {keys.privateKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(keys.privateKey, 'private')}
                    className="text-red-600 hover:text-red-700 flex-shrink-0"
                  >
                    {copiedKey === 'private' ? <FaCheckCircle /> : <FaCopy />}
                  </button>
                </div>
                <p className="text-xs text-red-500 mt-2">
                  Esta chave fica APENAS no seu navegador e nunca é enviada ao servidor
                </p>
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
            <p className="text-sm text-gray-600 mb-3">Requer assinatura criptográfica</p>
            <button
              onClick={handleProtectedRequest}
              disabled={loading || !keys}
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
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-blue-900 mb-4">🔍 Como Funciona (SEM Sessões)</h2>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start">
            <FaCheckCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
            <div>
              <strong>1. Geração de Chaves:</strong> Par de chaves Ed25519 gerado LOCALMENTE no navegador
            </div>
          </div>
          <div className="flex items-start">
            <FaCheckCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
            <div>
              <strong>2. Chave Privada:</strong> NUNCA sai do navegador, armazenada em sessionStorage (válida apenas durante a sessão)
            </div>
          </div>
          <div className="flex items-start">
            <FaCheckCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
            <div>
              <strong>3. Assinatura:</strong> Cada requisição é assinada: publicKey + timestamp + nonce + mensagem
            </div>
          </div>
          <div className="flex items-start">
            <FaCheckCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
            <div>
              <strong>4. Validação:</strong> Servidor valida assinatura usando a chave pública recebida
            </div>
          </div>
          <div className="flex items-start">
            <FaCheckCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
            <div>
              <strong>5. Headers Enviados:</strong> x-public-key, x-timestamp, x-nonce, x-signature
            </div>
          </div>
          <div className="flex items-start">
            <FaCheckCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
            <div>
              <strong>6. Sem Sessões:</strong> Servidor NÃO armazena nada, apenas valida assinaturas
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <FaFileImport className="mr-2 text-blue-600" />
                Importar Chave Privada
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chave Privada (64 caracteres hexadecimais)
              </label>
              <textarea
                value={importKey}
                onChange={(e) => setImportKey(e.target.value)}
                placeholder="Digite ou cole sua chave privada aqui..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                {importKey.trim().length}/64 caracteres
              </p>
            </div>

            {importError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <FaExclamationTriangle className="text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-700">{importError}</p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <strong>⚠️ Atenção:</strong> Importar uma chave privada substituirá suas chaves atuais.
                  A chave pública será derivada automaticamente da chave privada.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImportKey}
                disabled={loading || importKey.trim().length !== 64}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <FaSync className="animate-spin mr-2" />
                    Importando...
                  </>
                ) : (
                  <>
                    <FaFileImport className="mr-2" />
                    Importar Chave
                  </>
                )}
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
