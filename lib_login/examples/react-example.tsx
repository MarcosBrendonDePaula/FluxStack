/**
 * React Example using @fluxstack/crypto-auth
 */

import React, { useState } from 'react'
import { useSession } from '../client/react/useSession'

function App() {
  const { 
    sessionId, 
    isAuthenticated, 
    isLoading, 
    requestSigner,
    logout,
    generateNewSession,
    exportPrivateKey,
    importPrivateKey
  } = useSession()

  const [apiResponse, setApiResponse] = useState<any>(null)
  const [privateKeyInput, setPrivateKeyInput] = useState('')

  const handleApiCall = async () => {
    try {
      const response = await requestSigner.get('/api/protected')
      setApiResponse(response)
    } catch (error) {
      console.error('API call failed:', error)
      setApiResponse({ error: 'API call failed' })
    }
  }

  const handleExportKey = () => {
    const privateKey = exportPrivateKey()
    if (privateKey) {
      navigator.clipboard.writeText(privateKey)
      alert('Private key copied to clipboard!')
    }
  }

  const handleImportKey = async () => {
    try {
      await importPrivateKey(privateKeyInput)
      setPrivateKeyInput('')
      alert('Private key imported successfully!')
    } catch (error) {
      alert('Failed to import private key: ' + error.message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">🔐 Crypto Auth Demo</h1>
        
        {/* Session Status */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</span>
            </div>
            {sessionId && (
              <div>
                <span className="text-sm text-gray-600">Session ID:</span>
                <code className="block text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                  {sessionId}
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleApiCall}
            disabled={!isAuthenticated}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            🌐 Test API Call
          </button>
          
          <button
            onClick={generateNewSession}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            🔄 Generate New Session
          </button>
          
          <button
            onClick={handleExportKey}
            disabled={!isAuthenticated}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            📤 Export Private Key
          </button>
          
          <button
            onClick={logout}
            disabled={!isAuthenticated}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
          >
            🚪 Logout
          </button>
        </div>

        {/* Import Private Key */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="text-md font-semibold mb-2">Import Private Key</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={privateKeyInput}
              onChange={(e) => setPrivateKeyInput(e.target.value)}
              placeholder="Enter private key (64 hex characters)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleImportKey}
              disabled={!privateKeyInput.trim()}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
            >
              📥 Import
            </button>
          </div>
        </div>

        {/* API Response */}
        {apiResponse && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold mb-2">API Response</h3>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">✨ Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-green-600">✅ Implemented</h3>
            <ul className="text-sm space-y-1">
              <li>• Ed25519 cryptographic sessions</li>
              <li>• Automatic key generation</li>
              <li>• Request signature authentication</li>
              <li>• Session persistence</li>
              <li>• Private key export/import</li>
              <li>• React hooks integration</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-600">🔐 Security</h3>
            <ul className="text-sm space-y-1">
              <li>• No passwords or emails required</li>
              <li>• Private keys never leave the client</li>
              <li>• Replay attack protection</li>
              <li>• Timestamp validation</li>
              <li>• Cryptographic signatures</li>
              <li>• Zero-knowledge authentication</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App