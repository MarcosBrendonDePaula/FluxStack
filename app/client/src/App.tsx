import { useState, useEffect } from 'react'
import { api, getErrorMessage } from './lib/eden-api'
import {
  FaRocket, FaReact, FaLink, FaDocker, FaFlask, FaPalette,
  FaCheckCircle, FaTimesCircle, FaSpinner, FaSync,
  FaUsers, FaTrash, FaPlus, FaBook, FaCode, FaCog,
  FaServer, FaDatabase, FaShieldAlt, FaBolt, FaLock,
  FaBullseye, FaGlobe,  FaFileAlt,
  FaClipboardList, FaFire, FaFlask as FaTest,
} from 'react-icons/fa'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

// WebSocket Provider - Singleton Connection for All Live Components
import { WebSocketProvider } from 'fluxstack'

// Import page components
import { OverviewPage } from './pages/Overview'
import { DemoPage } from './pages/Demo'
import { HybridLivePage } from './pages/HybridLive'
import { ApiDocsPage } from './pages/ApiDocs'
import { CryptoAuthPage } from './pages/CryptoAuthPage'
import { MainLayout } from './components/MainLayout'
import { LiveClock } from './components/LiveClock'

// State management is now handled by Zustand stores directly

interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

function AppContent() {
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
      const { data, error } = await api.health.get()
      if (error) {
        setApiStatus('offline')
      } else {
        setApiStatus('online')
      }
    } catch {
      setApiStatus('offline')
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await api.users.get()
      
      if (error) {
        showMessage('error', `Erro ao carregar usuários: ${error.status}`)
        return
      }
      
      setUsers(data.users || [])
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
      const { data: result, error } = await api.users.post({ 
        name: name.trim(), 
        email: email.trim() 
      })
      
      if (error) {
        showMessage('error', `Erro ao criar usuário: ${error.status}`)
        return
      }
      
      if (result.success && result.user) {
        setUsers(prev => [...prev, result.user])
        setName('')
        setEmail('')
        showMessage('success', `Usuário ${name} adicionado com sucesso!`)
      } else {
        showMessage('error', result.message || 'Erro ao criar usuário')
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
      const { data: result, error } = await api.users({ id: userId }).delete()
      
      if (error) {
        showMessage('error', `Erro ao deletar usuário: ${error.status}`)
        return
      }
      
      if (result.success) {
        setUsers(prev => prev.filter(user => user.id !== userId))
        showMessage('success', `Usuário ${userName} removido com sucesso!`)
      } else {
        showMessage('error', result.message || 'Erro ao deletar usuário')
      }
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

  return (
    <div>
      <Routes>
        {/* Full-screen Live App Route */}
        <Route path="/live-app" element={<MainLayout />} />
        
        {/* Regular routes with header and layout */}
        <Route path="*" element={
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  {/* Logo and Navigation */}
                  <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center gap-2">
                        <FaFire className="text-2xl text-orange-500" />
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                          FluxStack
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        v1.4.0
                      </span>
                    </div>
                    
                    {/* Navigation Tabs */}
                    <nav className="hidden md:flex space-x-1">
                      {[
                        { id: 'overview', label: 'Visão Geral', icon: <FaClipboardList />, path: '/' },
                        { id: 'demo', label: 'Demo', icon: <FaRocket />, path: '/demo' },
                        { id: 'crypto-auth', label: 'Crypto Auth', icon: <FaShieldAlt />, path: '/crypto-auth' },
                        { id: 'hybrid-live', label: 'Hybrid Live', icon: <FaBolt />, path: '/hybrid-live' },
                        { id: 'live-app', label: 'Live App', icon: <FaFire />, path: '/live-app' },
                        { id: 'api-docs', label: 'API Docs', icon: <FaBook />, path: '/api-docs' },
                        { id: 'tests', label: 'Testes', icon: <FaTest />, path: '/tests' }
                      ].map(tab => (
                        <Link
                          key={tab.id}
                          to={tab.path}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            location.pathname === tab.path
                              ? 'bg-blue-100 text-blue-700 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {tab.icon}
                            {tab.label}
                          </div>
                        </Link>
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
                      { id: 'overview', label: 'Visão', icon: <FaClipboardList />, path: '/' },
                      { id: 'demo', label: 'Demo', icon: <FaRocket />, path: '/demo' },
                      { id: 'crypto-auth', label: 'Crypto', icon: <FaShieldAlt />, path: '/crypto-auth' },
                      { id: 'hybrid-live', label: 'Hybrid', icon: <FaBolt />, path: '/hybrid-live' },
                      { id: 'api-docs', label: 'Docs', icon: <FaBook />, path: '/api-docs' },
                      { id: 'tests', label: 'Testes', icon: <FaTest />, path: '/tests' }
                    ].map(tab => (
                      <Link
                        key={tab.id}
                        to={tab.path}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                          location.pathname === tab.path
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          {tab.icon}
                          <span>{tab.label}</span>
                        </div>
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<OverviewPage />} />
                <Route 
                  path="/demo" 
                  element={
                    <DemoPage 
                      users={users}
                      apiStatus={apiStatus}
                      loading={loading}
                      submitting={submitting}
                      name={name}
                      email={email}
                      setName={setName}
                      setEmail={setEmail}
                      handleSubmit={handleSubmit}
                      handleDelete={handleDelete}
                      loadUsers={loadUsers}
                      getInitials={getInitials}
                    />
                  }
                />
                <Route path="/crypto-auth" element={<CryptoAuthPage />} />
                <Route path="/hybrid-live" element={<HybridLivePage />} />
                <Route path="/api-docs" element={<ApiDocsPage />} />
                <Route path="/tests" element={
                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">🧪 Tests</h2>
                    <p className="text-gray-600">Test suite functionality will be available here.</p>
                  </div>
                } />
              </Routes>
            </main>
          </div>
        } />
      </Routes>

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
            {message.type === 'success' ? (
              <FaCheckCircle className="text-lg" />
            ) : (
              <FaTimesCircle className="text-lg" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Main App component - Wrapped with WebSocketProvider for single connection
function App() {
  return (
    <WebSocketProvider
      autoConnect={true}
      reconnectInterval={1000}
      maxReconnectAttempts={5}
      heartbeatInterval={30000}
      debug={false}
    >
      <AppContent />
    </WebSocketProvider>
  )
}

export default App