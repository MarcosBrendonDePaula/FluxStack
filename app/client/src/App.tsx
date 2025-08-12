import { useState, useEffect } from 'react'
import './App.css'
import { api, apiCall, getErrorMessage } from './lib/eden-api'
import { LiveProvider, LiveDebugPanel } from './components/live/LiveProvider'
import { Counter } from './components/live/Counter'
import { Clock } from './components/live/Clock'
import { Calculator } from './components/live/Calculator'
import { Toast } from './components/live/Toast'
import { UserProfile } from './components/live/UserProfile'
import { ExampleEnhanced } from './components/live/ExampleEnhanced'

interface User {
  id: number
  name: string
  email: string
  createdAt?: string
}

type TabType = 'overview' | 'demo' | 'api-docs' | 'live-components' | 'toast-test'

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
      const data = await apiCall(api.users.get()) as any
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
    <div className="live-components-demo">
      <div className="demo-header">
        <h2>🔥 FluxStack Live Components</h2>
        <p className="demo-subtitle">
          Componentes interativos em tempo real com WebSocket + Zustand + Elysia
        </p>
      </div>

      <div className="demo-description">
        <div className="info-card">
          <h3>✨ Como funciona:</h3>
          <ul>
            <li>🔌 <strong>WebSocket</strong>: Comunicação bidirecional em tempo real</li>
            <li>🐻 <strong>Zustand</strong>: Estado global otimizado no frontend</li>
            <li>⚡ <strong>LiveAction</strong>: Classes no backend para lógica de negócio</li>
            <li>🔄 <strong>Sincronização</strong>: Estado sincronizado automaticamente</li>
            <li>🎯 <strong>Type-safe</strong>: Tipagem end-to-end completa</li>
          </ul>
        </div>
      </div>

      <div className="counters-demo">
        <h3>🧮 Demo: Contadores Interativos</h3>
        <p>Cada contador tem seu próprio estado isolado no servidor:</p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '1rem',
          marginTop: '2rem'
        }}>
          {/* Counter básico */}
          <Counter 
            initialCount={0}
            step={1}
            label="Contador Básico"
            maxCount={50}
            componentId="basic-counter"
            showDebug={false}
            onCountChanged={(data) => console.log(`📊 Basic counter: ${data.count} (${data.action})`)}
            onLimitReached={(data) => console.log(`⚠️ Basic counter limit reached: ${data.limit}`)}
          />
          
          {/* Counter avançado */}
          <Counter 
            initialCount={10}
            step={2}
            label="Contador Rápido"
            maxCount={100}
            minCount={5}
            componentId="fast-counter"
            showDebug={false}
            onStepChanged={(data) => console.log(`⚡ Fast counter step changed to: ${data.step}`)}
            onCounterReset={() => console.log(`🔄 Fast counter was reset!`)}
          />
          
          {/* Counter com debug */}
          <Counter 
            initialCount={25}
            step={5}
            label="Contador Debug"
            maxCount={200}
            componentId="debug-counter"
            showDebug={true}
            onInvalidValue={(data) => console.log(`❌ Debug counter invalid value: ${data.attempted}`)}
            onCountChanged={(data) => console.log(`📊 Debug counter count: ${data.count}`)}
          />
        </div>

        <div className="demo-explanation" style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
          <h4>🎯 Teste os recursos:</h4>
          <ul>
            <li>Clique nos botões +/- para ver atualizações em tempo real</li>
            <li>Use o controle deslizante de Step</li>
            <li>Teste os botões +10, Reset e Random (🎲)</li>
            <li>Observe as notificações quando atingir limites</li>
            <li>Abra múltiplas abas para ver sincronização entre clients</li>
            <li>Verifique o painel de debug no terceiro contador</li>
            <li><strong>🔥 Event Handlers Livewire-style:</strong> Abra o console do navegador para ver os event handlers sendo chamados automaticamente!</li>
          </ul>
        </div>
      </div>

      <div className="clocks-demo" style={{ marginTop: '3rem' }}>
        <h3>⏰ Demo: Relógios em Tempo Real</h3>
        <p>Relógios sincronizados com o servidor - atualizações automáticas a cada segundo:</p>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginTop: '2rem'
        }}>
          {/* Clock Brasil - único para debug */}
          <Clock 
            timezone="America/Sao_Paulo"
            format="24h"
            theme="light"
            componentId="clock-brazil"
            showDate={true}
            showControls={true}
            onClockStarted={(data) => console.log(`🟢 Clock Brazil started:`, data)}
            onClockStopped={(data) => console.log(`🔴 Clock Brazil stopped:`, data)}
            onTick={(data) => { /* Silent for reduced logs */ }}
            onTimezoneChanged={(data) => console.log(`🌍 Brazil timezone changed:`, data)}
            onFormatChanged={(data) => console.log(`🕐 Brazil format changed:`, data)}
            onServerInfo={(data) => console.log(`🖥️ Brazil server info:`, data)}
          />
        </div>

        <div className="demo-explanation" style={{ marginTop: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
          <h4>⏰ Recursos do Clock:</h4>
          <ul>
            <li><strong>Tempo Real:</strong> Servidor envia atualizações automáticas a cada segundo</li>
            <li><strong>Múltiplos Fusos:</strong> Cada relógio pode ter timezone diferente</li>
            <li><strong>Formato 12h/24h:</strong> Alternância dinâmica de formato</li>
            <li><strong>Controles Live:</strong> Start/Stop, mudança de timezone</li>
            <li><strong>Temas:</strong> Light, Dark e Neon com estilos diferentes</li>
            <li><strong>Server Info:</strong> Informações do servidor em tempo real</li>
            <li><strong>Push Updates:</strong> Servidor envia dados sem requisição do cliente</li>
            <li><strong>🔥 Event Handlers:</strong> onTick, onClockStarted, onTimezoneChanged - estilo Livewire!</li>
          </ul>
        </div>
      </div>

      <div className="calculator-demo" style={{ marginTop: '3rem' }}>
        <h3>🧮 Demo: Calculator com Funções Síncronas e Assíncronas</h3>
        <p>Calculadora demonstrando chamadas de funções com retorno de valores:</p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '2rem',
          marginTop: '2rem'
        }}>
          {/* Calculator Standard */}
          <Calculator 
            componentId="calculator-standard"
            theme="standard"
            onCalculationCompleted={(data) => console.log(`🧮 Calculation completed:`, data)}
            onExpressionValidated={(data) => console.log(`📝 Expression validated:`, data)}
          />
        </div>

        <div className="demo-explanation" style={{ marginTop: '2rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
          <h4>🧮 Funcionalidades da Calculadora:</h4>
          <ul>
            <li><strong>🔄 Funções Síncronas:</strong> addDigit(), setOperation(), equals(), clear() - retorno imediato</li>
            <li><strong>⏳ Funções Assíncronas:</strong> calculateSquareRoot() (2s), calculateFactorial() (steps), validateExpression() (1.5s)</li>
            <li><strong>🎯 Estado de Loading:</strong> isFunctionLoading indica se função async está executando</li>
            <li><strong>📊 Retorno de Valores:</strong> Todas as funções retornam valores que podem ser capturados</li>
            <li><strong>🔥 Event Handlers:</strong> onCalculationCompleted, onExpressionValidated</li>
            <li><strong>❌ Tratamento de Erros:</strong> Erros síncronos e assíncronos com functionError</li>
            <li><strong>⚠️ Teste Erros:</strong> safeDivision() por zero, factorial() &gt; 20, sqrt() números negativos</li>
            <li><strong>📋 Histórico:</strong> Resultados das operações ficam salvos com timestamp</li>
            <li><strong>🐛 Debug:</strong> Painel de debug mostra estado da última chamada de função</li>
          </ul>
        </div>
      </div>
    </div>
  )

  return (
    <LiveProvider debug={true}>
      {/* Debug panel - uncomment to see WebSocket activity */}
      <LiveDebugPanel />
      
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
                className={`tab ${activeTab === 'api-docs' ? 'active' : ''}`}
                onClick={() => setActiveTab('api-docs')}
              >
                📚 API Docs
              </button>
              <button 
                className={`tab ${activeTab === 'live-components' ? 'active' : ''}`}
                onClick={() => setActiveTab('live-components')}
              >
                🔥 Live Components
              </button>
              <button 
                className={`tab ${activeTab === 'toast-test' ? 'active' : ''}`}
                onClick={() => setActiveTab('toast-test')}
              >
                🍞 Toast & Hydration
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
        {activeTab === 'api-docs' && renderApiDocs()}
        {activeTab === 'live-components' && renderLiveComponents()}
        {activeTab === 'toast-test' && (
          <div className="toast-test-demo">
            <div className="demo-header">
              <h2>🍞 Toast & Hydration Test</h2>
              <p className="demo-subtitle">
                Test state persistence and recovery with Toast notifications
              </p>
            </div>

            <div className="demo-description">
              <div className="info-card">
                <h3>🧪 How to Test Hydration:</h3>
                <ol>
                  <li>🍞 <strong>Create Toasts</strong>: Click buttons to create different types of toasts</li>
                  <li>🧪 <strong>Test Hydration</strong>: Click "Test Hydration" to create multiple toasts</li>
                  <li>🔄 <strong>Refresh Page</strong>: Press F5 - toasts should be restored from localStorage</li>
                  <li>🔌 <strong>Restart Server</strong>: Stop (Ctrl+C) and start server - state should recover</li>
                  <li>💾 <strong>Check Storage</strong>: DevTools → Application → LocalStorage → see snapshots</li>
                  <li>🔍 <strong>Monitor Logs</strong>: Console shows hydration process with fingerprints</li>
                </ol>
              </div>

              <div className="info-card" style={{ marginTop: '2rem' }}>
                <h3>🎯 Hydration Features:</h3>
                <ul>
                  <li>🔒 <strong>Hash Validation</strong>: SHA-256 checksums prevent state tampering</li>
                  <li>💾 <strong>Local Persistence</strong>: State saved in localStorage with fingerprints</li>
                  <li>⏱️ <strong>Auto Expiration</strong>: Snapshots expire after 1 hour</li>
                  <li>🔄 <strong>Smart Recovery</strong>: Automatic hydration on server reconnection</li>
                  <li>🧹 <strong>Auto Cleanup</strong>: Expired toasts and snapshots cleaned automatically</li>
                  <li>🛡️ <strong>Security</strong>: Secret key prevents state manipulation</li>
                </ul>
              </div>
            </div>

            {/* Toast Component */}
            <Toast 
              componentId="main-toast-manager"
              maxToasts={6}
              defaultDuration={8000}
              position="top-right"
              onToastShown={(data) => console.log(`🍞 Toast shown:`, data)}
              onToastDismissed={(data) => console.log(`🗑️ Toast dismissed:`, data)}
              onToastsCleared={(data) => console.log(`🧹 All toasts cleared:`, data)}
              onToastsAutoCleaned={(data) => console.log(`🧹 Auto-cleaned toasts:`, data)}
              onStatsRequested={(data) => console.log(`📊 Toast stats:`, data)}
            />

            {/* Test Generated Component */}
            <div style={{ marginTop: '2rem' }}>
              <h3>🧪 Teste: Componente Gerado</h3>
              <UserProfile 
                componentId="test-user-profile"
                onActionCompleted={(data) => console.log(`👤 UserProfile action:`, data)}
              />
            </div>

            {/* Test Enhanced Component with All Features */}
            <div style={{ marginTop: '3rem' }}>
              <h3>🚀 Teste: Componente Enhanced com Helpers</h3>
              <p style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                Este componente demonstra todos os helpers criados: decorators, validação, state management e event handling.
              </p>
              <ExampleEnhanced 
                componentId="example-enhanced"
                title="Exemplo com Helpers"
                maxItems={15}
                isEnabled={true}
                onItemAdded={(data) => console.log(`➕ Item added:`, data)}
                onItemRemoved={(data) => console.log(`➖ Item removed:`, data)}
                onAllItemsCleared={(data) => console.log(`🧹 All items cleared:`, data)}
                onTitleUpdated={(data) => console.log(`✏️ Title updated:`, data)}
                onStateToggled={(data) => console.log(`🔄 State toggled:`, data)}
                onComponentChanged={(data) => console.log(`🔄 Component changed:`, data)}
              />
              
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: '#f0f9ff', 
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#1e40af'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>🎯 Recursos testados:</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  <li><strong>@Action decorators</strong> com auto-emit de eventos</li>
                  <li><strong>@State decorators</strong> com validação automática</li>
                  <li><strong>@Validate decorators</strong> com ValidationRules</li>
                  <li><strong>@Lifecycle decorators</strong> para mount/unmount</li>
                  <li><strong>@LiveComponent</strong> auto-registration</li>
                  <li><strong>Event handlers</strong> estilo Livewire</li>
                  <li><strong>Type safety</strong> end-to-end</li>
                </ul>
              </div>
            </div>
          </div>
        )}
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
    </LiveProvider>
  )
}

export default App