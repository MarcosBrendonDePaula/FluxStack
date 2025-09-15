import { useState, useEffect } from 'react'
import './App.css'
import { api, apiCall, getErrorMessage } from './lib/eden-api'
import type { User } from '@/shared/types'
import SimpleLiveCounter from './components/SimpleLiveCounter'
import './components/LiveCounter.css'

type TabType = 'overview' | 'demo' | 'live-components' | 'api-docs'

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
  }, [])

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
      const result = await apiCall(api.users.post({ name: name.trim(), email: email.trim() })) as any
      
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
    <div className="overview-content">
      <div className="hero-section">
        <div className="hero-text">
          <h1>🔥 FluxStack - Hot Reload Ativo! ⚡</h1>
          <p className="hero-subtitle">
            Framework full-stack TypeScript moderno com hot reload coordenado! 🚀
          </p>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🚀</div>
              <h3>Elysia.js</h3>
              <p>Backend rápido e type-safe com Bun runtime</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚛️</div>
              <h3>React + Vite</h3>
              <p>Frontend moderno com hot-reload ultrarrápido</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔗</div>
              <h3>Eden Treaty</h3>
              <p>API type-safe com inferência automática de tipos</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🐳</div>
              <h3>Docker Ready</h3>
              <p>Deploy fácil com configurações otimizadas</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🧪</div>
              <h3>Testing</h3>
              <p>Vitest + Testing Library configurados</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📦</div>
              <h3>Bun Package Manager</h3>
              <p>Instalação e builds extremamente rápidos</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="tech-stack">
        <h2>Stack Tecnológica</h2>
        <div className="stack-items">
          <div className="stack-category">
            <h3>Backend</h3>
            <ul>
              <li>Elysia.js - Web framework</li>
              <li>Bun - Runtime & package manager</li>
              <li>TypeScript - Type safety</li>
            </ul>
          </div>
          <div className="stack-category">
            <h3>Frontend</h3>
            <ul>
              <li>React 19 - UI library</li>
              <li>Vite - Build tool</li>
              <li>TypeScript - Type safety</li>
            </ul>
          </div>
          <div className="stack-category">
            <h3>Comunicação</h3>
            <ul>
              <li>Eden Treaty - Type-safe API</li>
              <li>End-to-end TypeScript</li>
              <li>Automatic type inference</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDemo = () => (
    <div className="demo-content">
      <h2>🔥 Demo Interativo - Hot Reload Testando!</h2>
      <p className="demo-subtitle">Teste a API em tempo real com hot reload coordenado 🚀</p>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">Usuários</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{apiStatus === 'online' ? '✅' : '❌'}</div>
          <div className="stat-label">API Status</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">🚀</div>
          <div className="stat-label">Eden Treaty</div>
        </div>
      </div>

      {/* Add User Form */}
      <div className="form-section">
        <h3 className="section-title">Adicionar Usuário</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={submitting || !name.trim() || !email.trim()}
          >
            {submitting ? 'Adicionando...' : 'Adicionar'}
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="users-section">
        <div className="section-header">
          <h3 className="section-title">Usuários ({users.length})</h3>
          <button 
            className="btn btn-secondary"
            onClick={loadUsers}
            disabled={loading}
          >
            {loading ? <span className="spinner"></span> : '↻'} Atualizar
          </button>
        </div>

        {loading ? (
          <div className="loading">
            <span className="spinner"></span>
            Carregando usuários...
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h4>Nenhum usuário encontrado</h4>
            <p>Adicione o primeiro usuário usando o formulário acima</p>
          </div>
        ) : (
          <div className="users-grid">
            {users.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-avatar">
                  {getInitials(user.name)}
                </div>
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
                <div className="user-actions">
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(user.id, user.name)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderApiDocs = () => (
    <div className="api-docs">
      <h2>Documentação da API</h2>
      <p className="api-subtitle">Documentação interativa gerada automaticamente com Swagger</p>
      
      <div className="swagger-links">
        <div className="swagger-card">
          <h3>📋 Swagger UI Interativo</h3>
          <p>Interface completa para testar todos os endpoints da API</p>
          <a 
            href="/swagger" 
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            🚀 Abrir em Nova Aba
          </a>
        </div>
        
        <div className="swagger-card">
          <h3>📄 OpenAPI Spec (JSON)</h3>
          <p>Especificação OpenAPI em formato JSON para integração</p>
          <a 
            href="/swagger/json" 
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            📋 Ver JSON
          </a>
        </div>
      </div>

      <div className="swagger-iframe-container">
        <h3>🔧 Documentação Integrada</h3>
        <iframe 
          src="/swagger"
          className="swagger-iframe"
          title="Swagger UI"
          frameBorder="0"
        />
      </div>

      <div className="swagger-preview">
        <h3>🔧 Como usar Eden Treaty</h3>
        <div className="code-examples">
          <div className="example-section">
            <h4>Configuração do Cliente:</h4>
            <pre className="code-block">{`import { treaty } from '@elysiajs/eden'
import type { App } from './server'

const client = treaty<App>('http://localhost:3000')
export const api = client.api`}</pre>
          </div>

          <div className="example-section">
            <h4>Exemplos de Uso:</h4>
            <pre className="code-block">{`// Listar usuários
const users = await api.users.get()

// Criar usuário
const newUser = await api.users.post({
  name: "João Silva",
  email: "joao@example.com"
})

// Deletar usuário
await api.users["1"].delete()

// Health check
const health = await api.health.get()`}</pre>
          </div>

          <div className="example-section">
            <h4>Com tratamento de erros:</h4>
            <pre className="code-block">{`try {
  const result = await apiCall(api.users.post({
    name: "Maria Silva",
    email: "maria@example.com"
  }))
  
  if (result.success) {
    console.log('Usuário criado:', result.user)
  }
} catch (error) {
  console.error('Erro:', getErrorMessage(error))
}`}</pre>
          </div>
        </div>
      </div>

      <div className="api-features">
        <h3>✨ Funcionalidades</h3>
        <div className="features-list">
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <div>
              <h4>Type Safety</h4>
              <p>Tipos TypeScript inferidos automaticamente</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <div>
              <h4>Auto-complete</h4>
              <p>IntelliSense completo no editor</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">🔄</span>
            <div>
              <h4>Sincronização</h4>
              <p>Mudanças no backend refletem automaticamente no frontend</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">🐛</span>
            <div>
              <h4>Debugging</h4>
              <p>Erros de tipo detectados em tempo de compilação</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderLiveComponents = () => (
    <div className="live-components-content">
      <h2>🔄 Live Components</h2>
      <p className="demo-subtitle">Demonstração de componentes com sincronização em tempo real</p>

      <div className="live-components-grid">
        <div className="live-component-demo">
          <h3>Counter Básico</h3>
          <SimpleLiveCounter 
            initialCount={0}
            userId="user-1"
            showDebug={false}
          />
        </div>

        <div className="live-component-demo">
          <h3>Counter com Debug</h3>
          <SimpleLiveCounter 
            initialCount={10}
            userId="user-2"
            showDebug={true}
          />
        </div>
      </div>

      <div className="live-components-info">
        <h3>🚀 Funcionalidades</h3>
        <div className="features-grid">
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <div>
              <h4>Tempo Real</h4>
              <p>Sincronização automática entre frontend e backend</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">🔄</span>
            <div>
              <h4>Optimistic Updates</h4>
              <p>Interface responsiva com rollback automático</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">🔐</span>
            <div>
              <h4>Conflict Resolution</h4>
              <p>Resolução inteligente de conflitos de estado</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">🐛</span>
            <div>
              <h4>Debug Tools</h4>
              <p>Ferramentas avançadas de debugging integradas</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">📊</span>
            <div>
              <h4>Performance Monitor</h4>
              <p>Monitoramento de performance e memory leaks</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">🔄</span>
            <div>
              <h4>Retry Logic</h4>
              <p>Sistema inteligente de retry com exponential backoff</p>
            </div>
          </div>
        </div>

        <div className="code-example">
          <h4>Exemplo Simplificado (Demonstração):</h4>
          <pre className="code-block">{`import React, { useState } from 'react'

function SimpleLiveCounter({ initialCount = 0 }) {
  const [state, setState] = useState({
    count: initialCount,
    lastUpdate: Date.now()
  })
  const [loading, setLoading] = useState(false)

  const handleIncrement = async () => {
    // Optimistic update
    setState(prev => ({ 
      ...prev, 
      count: prev.count + 1,
      lastUpdate: Date.now()
    }))
    
    // Simulate server call
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 100))
    setLoading(false)
  }

  return (
    <div className="live-counter">
      <h3>Count: {state.count}</h3>
      <button onClick={handleIncrement} disabled={loading}>
        +1
      </button>
      <span>🟢 Demo Mode</span>
    </div>
  )
}

// Full implementation coming soon with:
// - useEnhancedLive hook from Task 4
// - Real-time server communication
// - Global state synchronization
// - Conflict resolution
// - Performance monitoring`}</pre>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              🔥 FluxStack v1.4.0
            </div>
            <nav className="header-tabs">
              <button 
                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📋 Visão Geral
              </button>
              <button 
                className={`tab ${activeTab === 'demo' ? 'active' : ''}`}
                onClick={() => setActiveTab('demo')}
              >
                🚀 Demo
              </button>
              <button 
                className={`tab ${activeTab === 'live-components' ? 'active' : ''}`}
                onClick={() => setActiveTab('live-components')}
              >
                🔄 Live Components
              </button>
              <button 
                className={`tab ${activeTab === 'api-docs' ? 'active' : ''}`}
                onClick={() => setActiveTab('api-docs')}
              >
                📚 API Docs
              </button>
            </nav>
          </div>
          <div className={`status-badge ${apiStatus}`}>
            <span className="status-dot"></span>
            API {apiStatus === 'online' ? 'Online' : 'Offline'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'demo' && renderDemo()}
        {activeTab === 'live-components' && renderLiveComponents()}
        {activeTab === 'api-docs' && renderApiDocs()}
      </main>

      {/* Toast Notification */}
      {message && (
        <div 
          className={`toast ${message.type} show`}
          onClick={() => setMessage(null)}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}

export default App