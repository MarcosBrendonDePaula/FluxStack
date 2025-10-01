/**
 * Demonstração do Plugin Crypto Auth
 * Exemplo completo de uso do sistema de autenticação
 */

import React from 'react'
import { 
  AuthProvider, 
  useAuth, 
  LoginButton, 
  ProtectedRoute, 
  SessionInfo 
} from '../../plugins/crypto-auth/client'

function App() {
  return (
    <AuthProvider
      config={{
        apiBaseUrl: 'http://localhost:3000',
        storage: 'localStorage'
      }}
    >
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <WelcomeSection />
          <AuthenticatedSection />
          <AdminSection />
        </main>
      </div>
    </AuthProvider>
  )
}

function Header() {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            FluxStack Crypto Auth
          </h1>
          <p className="text-gray-600">
            Autenticação criptográfica sem senhas
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <SessionInfo compact={true} />
          <LoginButton 
            showPermissions={true}
            onLogin={(session) => {
              console.log('✅ Login realizado:', session)
            }}
            onLogout={() => {
              console.log('👋 Logout realizado')
            }}
          />
        </div>
      </div>
    </header>
  )
}

function WelcomeSection() {
  return (
    <section className="bg-white rounded-lg shadow-md p-8 mb-8">
      <h2 className="text-2xl font-semibold mb-4">
        🔐 Autenticação Criptográfica
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Como funciona:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Gera automaticamente um par de chaves Ed25519</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Sua chave privada nunca sai do navegador</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Todas as requisições são assinadas criptograficamente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Sem senhas, sem cadastros, sem complicação!</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            Vantagens:
          </h3>
          <ul className="space-y-1 text-blue-800 text-sm">
            <li>• Zero-friction authentication</li>
            <li>• Criptografia de nível militar (Ed25519)</li>
            <li>• Stateless - sem dependência de banco</li>
            <li>• Proteção contra replay attacks</li>
            <li>• Componentes React prontos</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

function AuthenticatedSection() {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return (
      <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-yellow-800 mb-2">
          🔒 Área Protegida
        </h2>
        <p className="text-yellow-700 mb-4">
          Faça login para acessar funcionalidades protegidas.
        </p>
        <LoginButton 
          className="bg-yellow-600 hover:bg-yellow-700"
          loginText="Entrar para ver mais"
        />
      </section>
    )
  }

  return (
    <ProtectedRoute>
      <AuthenticatedContent />
    </ProtectedRoute>
  )
}

function AuthenticatedContent() {
  const { client, session, permissions, isAdmin } = useAuth()
  const [apiResponse, setApiResponse] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  const testProtectedAPI = async () => {
    setLoading(true)
    try {
      const response = await client.fetch('/api/protected/test', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Hello from authenticated client!',
          timestamp: new Date().toISOString()
        })
      })
      
      const data = await response.json()
      setApiResponse(data)
    } catch (error) {
      console.error('Erro na API:', error)
      setApiResponse({ error: 'Erro ao chamar API' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white rounded-lg shadow-md p-8 mb-8">
      <h2 className="text-2xl font-semibold mb-6 text-green-700">
        ✅ Você está autenticado!
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Informações da Sessão:</h3>
          <SessionInfo showFullSessionId={false} />
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Testar API Protegida:</h3>
          <button
            onClick={testProtectedAPI}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition-colors mb-4"
          >
            {loading ? 'Testando...' : 'Testar API'}
          </button>
          
          {apiResponse && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Resposta da API:</h4>
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-800 mb-2">Status:</h4>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm">
            Autenticado
          </span>
          {isAdmin && (
            <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">
              Administrador
            </span>
          )}
          {permissions.map(permission => (
            <span 
              key={permission}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm"
            >
              {permission}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function AdminSection() {
  return (
    <ProtectedRoute 
      requireAdmin={true}
      fallback={
        <section className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            👑 Área Administrativa
          </h2>
          <p className="text-gray-600">
            Esta seção é visível apenas para administradores.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Para testar, adicione sua chave pública na configuração adminKeys.
          </p>
        </section>
      }
    >
      <AdminContent />
    </ProtectedRoute>
  )
}

function AdminContent() {
  const { client } = useAuth()
  const [stats, setStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  const loadStats = async () => {
    setLoading(true)
    try {
      const response = await client.fetch('/api/admin/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erro ao carregar stats:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadStats()
  }, [])

  return (
    <section className="bg-white rounded-lg shadow-md p-8 border-l-4 border-red-500">
      <h2 className="text-2xl font-semibold mb-6 text-red-700">
        👑 Painel Administrativo
      </h2>
      
      <div className="mb-6">
        <button
          onClick={loadStats}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md transition-colors"
        >
          {loading ? 'Carregando...' : 'Atualizar Estatísticas'}
        </button>
      </div>
      
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-red-600 font-medium">Sessões Ativas</h3>
            <p className="text-2xl font-bold text-red-900">{stats.activeSessions || 0}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-red-600 font-medium">Admins Online</h3>
            <p className="text-2xl font-bold text-red-900">{stats.adminSessions || 0}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-red-600 font-medium">Total Sessões</h3>
            <p className="text-2xl font-bold text-red-900">{stats.totalSessions || 0}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-red-600 font-medium">Chaves Admin</h3>
            <p className="text-2xl font-bold text-red-900">{stats.adminKeys || 0}</p>
          </div>
        </div>
      )}
    </section>
  )
}

export default App