import { useState, useEffect } from 'react'
import './App.css'
import { api, apiCall, getErrorMessage } from './lib/eden-api'

interface User {
  id: number
  name: string
  email: string
  createdAt?: string
}

function App() {
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
      await apiCall(api.users[userId.toString()].delete())
      
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

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            ⚡ FluxStack
          </div>
          <div className={`status-badge ${apiStatus}`}>
            <span className="status-dot"></span>
            API {apiStatus === 'online' ? 'Online' : 'Offline'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Gerenciar usuários do sistema</p>

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
          <h2 className="section-title">Adicionar Usuário</h2>
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
            <h2 className="section-title">Usuários ({users.length})</h2>
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
              <h3>Nenhum usuário encontrado</h3>
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