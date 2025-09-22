import { useState, useEffect } from 'react'
import { api, apiCall, getErrorMessage } from './lib/eden-api'
import type { User } from '@/shared/types'
import TestPage from './components/TestPage'

type TabType = 'overview' | 'demo' | 'api-docs' | 'tests'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('offline')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    checkApiStatus()
    loadUsers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkApiStatus = async () => {
    try {
      await apiCall(api.health.get())
      setApiStatus('online')
    } catch {
      setApiStatus('offline')
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await apiCall(api.users.get())
      setUsers(data?.users || [])
    } catch (error) {
      showMessage('error', getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    try {
      setSubmitting(true)
      const result = await apiCall(api.users.post({ name: name.trim(), email: email.trim() })) as { success: boolean; user: User }
      
      if (result?.success && result?.user) {
        setUsers(prev => [...prev, result.user])
        setName('')
        setEmail('')
        showMessage('success', `Usuário ${name} adicionado com sucesso!`)
      }
    } catch (error) {
      showMessage('error', getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (userId: number, userName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${userName}?`)) return
    
    try {
      // Chamar API de delete via Eden Treaty
      await apiCall(api.users({ id: userId.toString() }).delete())
      
      // Remover da lista local após sucesso da API
      setUsers(prev => prev.filter(user => user.id !== userId))
      showMessage('success', `Usuário ${userName} removido com sucesso!`)
    } catch (error) {
      showMessage('error', getErrorMessage(error))
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const renderOverview = () => (
    <div className="relative">
      {/* Hero Section with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
        <div className="relative px-8 py-16 text-center">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              🔥 FluxStack v1.4.0 ⚡
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Framework full-stack TypeScript moderno com hot reload coordenado e Tailwind CSS 4! 🚀
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
                TypeScript
              </span>
              <span className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30">
                Elysia.js
              </span>
              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium border border-emerald-500/30">
                React 19
              </span>
              <span className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded-full text-sm font-medium border border-orange-500/30">
                Tailwind CSS 4
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
        {[
          {
            icon: "🚀",
            title: "Elysia.js",
            description: "Backend rápido e type-safe com Bun runtime",
            color: "from-blue-500 to-cyan-500"
          },
          {
            icon: "⚛️",
            title: "React + Vite",
            description: "Frontend moderno com hot-reload ultrarrápido",
            color: "from-purple-500 to-pink-500"
          },
          {
            icon: "🔗",
            title: "Eden Treaty",
            description: "API type-safe com inferência automática de tipos",
            color: "from-emerald-500 to-teal-500"
          },
          {
            icon: "🐳",
            title: "Docker Ready",
            description: "Deploy fácil com configurações otimizadas",
            color: "from-indigo-500 to-purple-500"
          },
          {
            icon: "🧪",
            title: "Testing",
            description: "Vitest + Testing Library configurados",
            color: "from-orange-500 to-red-500"
          },
          {
            icon: "🎨",
            title: "Tailwind CSS 4",
            description: "Styling moderno e responsivo",
            color: "from-teal-500 to-green-500"
          }
        ].map((feature, index) => (
          <div
            key={index}
            className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
            <div className="relative">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tech Stack Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Stack Tecnológica</h2>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Backend",
                color: "blue",
                items: [
                  "Elysia.js - Web framework",
                  "Bun - Runtime & package manager",
                  "TypeScript - Type safety"
                ]
              },
              {
                title: "Frontend",
                color: "purple",
                items: [
                  "React 19 - UI library",
                  "Vite - Build tool",
                  "Tailwind CSS 4 - Styling"
                ]
              },
              {
                title: "Comunicação",
                color: "emerald",
                items: [
                  "Eden Treaty - Type-safe API",
                  "End-to-end TypeScript",
                  "Automatic type inference"
                ]
              }
            ].map((category, index) => (
              <div key={index} className="space-y-4">
                <h3 className={`text-lg font-semibold text-${category.color}-600 pb-2 border-b-2 border-${category.color}-100`}>
                  {category.title}
                </h3>
                <ul className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3 text-gray-600">
                      <div className={`w-2 h-2 rounded-full bg-${category.color}-400 flex-shrink-0 mt-2`}></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderDemo = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">🔥 Demo Interativo</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Teste a API em tempo real com hot reload coordenado e Eden Treaty 🚀
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">{users.length}</div>
          <div className="text-sm font-medium text-blue-700 uppercase tracking-wide">Usuários</div>
        </div>
        <div className={`bg-gradient-to-br ${apiStatus === 'online' ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'} border rounded-2xl p-6 text-center`}>
          <div className="text-4xl mb-2">{apiStatus === 'online' ? '✅' : '❌'}</div>
          <div className={`text-sm font-medium uppercase tracking-wide ${apiStatus === 'online' ? 'text-emerald-700' : 'text-red-700'}`}>
            API {apiStatus === 'online' ? 'Online' : 'Offline'}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">🚀</div>
          <div className="text-sm font-medium text-purple-700 uppercase tracking-wide">Eden Treaty</div>
        </div>
      </div>

      {/* Add User Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Adicionar Usuário</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div className="md:col-span-2">
              <button 
                type="submit" 
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={submitting || !name.trim() || !email.trim()}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adicionando...
                  </span>
                ) : (
                  'Adicionar Usuário'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Usuários ({users.length})</h3>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200"
            onClick={loadUsers}
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="text-lg">↻</span>
            )}
            Atualizar
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando usuários...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">👥</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h4>
              <p className="text-gray-600">Adicione o primeiro usuário usando o formulário acima</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => (
                <div key={user.id} className="group bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{user.name}</h4>
                      <p className="text-sm text-gray-600 truncate">{user.email}</p>
                      <button 
                        className="mt-3 w-full px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium"
                        onClick={() => handleDelete(user.id, user.name)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderApiDocs = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">📚 Documentação da API</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Documentação interativa gerada automaticamente com Swagger UI
        </p>
      </div>
      
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
          <div className="text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Swagger UI Interativo</h3>
            <p className="text-gray-600 mb-6">Interface completa para testar todos os endpoints da API</p>
            <a 
              href="/swagger" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              🚀 Abrir em Nova Aba
            </a>
          </div>
        </div>
        
        <div className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
          <div className="text-center">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">OpenAPI Spec (JSON)</h3>
            <p className="text-gray-600 mb-6">Especificação OpenAPI em formato JSON para integração</p>
            <a 
              href="/swagger/json" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-xl hover:from-purple-700 hover:to-purple-800 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              📋 Ver JSON
            </a>
          </div>
        </div>
      </div>

      {/* Embedded Swagger */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">🔧 Documentação Integrada</h3>
        </div>
        <iframe 
          src="/swagger"
          className="w-full h-[600px] border-0"
          title="Swagger UI"
        />
      </div>

      {/* Eden Treaty Guide */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">🔧 Como usar Eden Treaty</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">Configuração do Cliente:</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm border border-gray-700">
{`import { treaty } from '@elysiajs/eden'
import type { App } from './server'

const client = treaty<App>('http://localhost:3000')
export const api = client.api`}
            </pre>
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">Exemplos de Uso:</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm border border-gray-700">
{`// Listar usuários
const users = await api.users.get()

// Criar usuário
const newUser = await api.users.post({
  name: "João Silva",
  email: "joao@example.com"
})

// Deletar usuário
await api.users["1"].delete()

// Health check
const health = await api.health.get()`}
            </pre>
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">Com tratamento de erros:</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm border border-gray-700">
{`try {
  const result = await apiCall(api.users.post({
    name: "Maria Silva",
    email: "maria@example.com"
  }))
  
  if (result.success) {
    console.log('Usuário criado:', result.user)
  }
} catch (error) {
  console.error('Erro:', getErrorMessage(error))
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 text-center">✨ Funcionalidades</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: "🔒",
                title: "Type Safety",
                description: "Tipos TypeScript inferidos automaticamente"
              },
              {
                icon: "⚡",
                title: "Auto-complete",
                description: "IntelliSense completo no editor"
              },
              {
                icon: "🔄",
                title: "Sincronização",
                description: "Mudanças no backend refletem automaticamente no frontend"
              },
              {
                icon: "🐛",
                title: "Debugging",
                description: "Erros de tipo detectados em tempo de compilação"
              }
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                <div className="text-2xl">{feature.icon}</div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  🔥 FluxStack
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  v1.4.0
                </span>
              </div>
              
              {/* Navigation Tabs */}
              <nav className="hidden md:flex space-x-1">
                {[
                  { id: 'overview', label: '📋 Visão Geral', icon: '📋' },
                  { id: 'demo', label: '🚀 Demo', icon: '🚀' },
                  { id: 'api-docs', label: '📚 API Docs', icon: '📚' },
                  { id: 'tests', label: '🧪 Testes', icon: '🧪' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab(tab.id as TabType)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Status Badge */}
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${
              apiStatus === 'online' 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                apiStatus === 'online' ? 'bg-emerald-400' : 'bg-red-400'
              }`}></div>
              <span>API {apiStatus === 'online' ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden pb-3">
            <nav className="flex space-x-1">
              {[
                { id: 'overview', label: '📋 Visão Geral' },
                { id: 'demo', label: '🚀 Demo' },
                { id: 'api-docs', label: '📚 Docs' },
                { id: 'tests', label: '🧪 Testes' }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab(tab.id as TabType)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'demo' && renderDemo()}
        {activeTab === 'api-docs' && renderApiDocs()}
        {activeTab === 'tests' && <TestPage />}
      </main>

      {/* Toast Notification */}
      {message && (
        <div 
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 max-w-sm ${
            message.type === 'success' 
              ? 'bg-emerald-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
          onClick={() => setMessage(null)}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {message.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default App