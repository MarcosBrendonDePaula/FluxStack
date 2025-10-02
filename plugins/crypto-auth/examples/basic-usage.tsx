/**
 * Exemplo básico de uso do plugin Crypto Auth
 */

import React from 'react'
import { 
  AuthProvider, 
  useAuth, 
  LoginButton, 
  ProtectedRoute, 
  SessionInfo 
} from '../client'

// Componente principal da aplicação
function App() {
  return (
    <AuthProvider
      config={{
        apiBaseUrl: 'http://localhost:3000',
        storage: 'localStorage',
        sessionTimeout: 1800000 // 30 minutos
      }}
      onAuthChange={(isAuthenticated, session) => {
        console.log('Status de autenticação mudou:', { isAuthenticated, session })
      }}
      onError={(error) => {
        console.error('Erro de autenticação:', error)
      }}
    >
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Dashboard />
        </main>
      </div>
    </AuthProvider>
  )
}

// Header com informações de autenticação
function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          FluxStack Crypto Auth Demo
        </h1>
        
        <div className="flex items-center gap-4">
          <SessionInfo compact={true} />
          <LoginButton 
            className="px-4 py-2"
            showPermissions={true}
            onLogin={(session) => {
              console.log('Login realizado:', session)
            }}
            onLogout={() => {
              console.log('Logout realizado')
            }}
            onError={(error) => {
              alert(`Erro: ${error}`)
            }}
          />
        </div>
      </div>
    </header>
  )
}

// Dashboard principal
function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Área pública */}
      <PublicSection />
      
      {/* Área protegida */}
      {isAuthenticated && (
        <ProtectedSection />
      )}
      
      {/* Área admin */}
      <ProtectedRoute requireAdmin={true}>
        <AdminSection />
      </ProtectedRoute>
    </div>
  )
}

// Seção pública
function PublicSection() {
  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Área Pública</h2>
      <p className="text-gray-600 mb-4">
        Esta seção é visível para todos os usuários, autenticados ou não.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h3 className="font-medium text-blue-900 mb-2">Como funciona:</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Clique em "Entrar" para gerar automaticamente um par de chaves Ed25519</li>
          <li>• Sua chave privada fica apenas no seu navegador</li>
          <li>• Todas as requisições são assinadas criptograficamente</li>
          <li>• Sem senhas, sem cadastros, sem complicação!</li>
        </ul>
      </div>
    </section>
  )
}

// Seção protegida
function ProtectedSection() {
  const { client, session, permissions } = useAuth()
  const [apiData, setApiData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  const callProtectedAPI = async () => {
    setLoading(true)
    try {
      const response = await client.fetch('/api/protected/data', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello from client!' })
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiData(data)
      } else {
        const error = await response.json()
        alert(`Erro na API: ${error.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao chamar API:', error)
      alert('Erro ao chamar API')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Área Protegida</h2>
      <p className="text-gray-600 mb-4">
        Esta seção é visível apenas para usuários autenticados.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-2">Suas Informações:</h3>
          <div className="bg-gray-50 rounded p-3 text-sm">
            <p><strong>Session ID:</strong> {session?.sessionId.substring(0, 16)}...</p>
            <p><strong>Permissões:</strong> {permissions.join(', ')}</p>
            <p><strong>Criado em:</strong> {session?.createdAt.toLocaleString()}</p>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Testar API Protegida:</h3>
          <button
            onClick={callProtectedAPI}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded transition-colors"
          >
            {loading ? 'Carregando...' : 'Chamar API'}
          </button>
          
          {apiData && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded p-3">
              <pre className="text-sm text-green-800">
                {JSON.stringify(apiData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// Seção admin
function AdminSection() {
  const { client } = useAuth()
  const [stats, setStats] = React.useState<any>(null)

  React.useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await client.fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar stats:', error)
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
      <h2 className="text-xl font-semibold mb-4 text-red-700">
        Área Administrativa
      </h2>
      <p className="text-gray-600 mb-4">
        Esta seção é visível apenas para administradores.
      </p>
      
      {stats && (
        <div className="bg-red-50 rounded p-4">
          <h3 className="font-medium text-red-900 mb-2">Estatísticas do Sistema:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-red-600 font-medium">Sessões Ativas</div>
              <div className="text-2xl font-bold text-red-900">{stats.activeSessions}</div>
            </div>
            <div>
              <div className="text-red-600 font-medium">Admins Online</div>
              <div className="text-2xl font-bold text-red-900">{stats.adminSessions}</div>
            </div>
            <div>
              <div className="text-red-600 font-medium">Total Sessões</div>
              <div className="text-2xl font-bold text-red-900">{stats.totalSessions}</div>
            </div>
            <div>
              <div className="text-red-600 font-medium">Chaves Admin</div>
              <div className="text-2xl font-bold text-red-900">{stats.adminKeys}</div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default App