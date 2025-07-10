import { useState, useEffect } from 'react'
import reactLogo from '@/assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { api } from '@/lib/api'

interface User {
  id: number
  name: string
  email: string
}

function App() {
  const [count, setCount] = useState(0)
  const [apiMessage, setApiMessage] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [newUser, setNewUser] = useState({ name: '', email: '' })

  useEffect(() => {
    // Buscar mensagem da API
    api.api.index.get().then(({ data }) => {
      if (data) {
        setApiMessage(data.message)
      }
    }).catch(err => console.error('Erro ao buscar API:', err))

    // Buscar usuários
    api.api.users.get().then(({ data }) => {
      if (data) {
        setUsers(data.users)
      }
    }).catch(err => console.error('Erro ao buscar usuários:', err))
  }, [])

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return
    
    const { data } = await api.api.users.post(newUser)
    if (data?.success) {
      setUsers([...users, { id: Date.now(), ...newUser }])
      setNewUser({ name: '', email: '' })
    }
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>FluxStack - Elysia + React + Eden</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>API Response: {apiMessage || 'Carregando...'}</p>
        
        <div style={{ marginTop: '20px', textAlign: 'left' }}>
          <h3>Usuários (Type-safe with Eden):</h3>
          <ul>
            {users.map(user => (
              <li key={user.id}>{user.name} - {user.email}</li>
            ))}
          </ul>
          
          <div style={{ marginTop: '10px' }}>
            <input
              placeholder="Nome"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
            <input
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              style={{ marginLeft: '10px' }}
            />
            <button onClick={handleAddUser} style={{ marginLeft: '10px' }}>
              Adicionar Usuário
            </button>
          </div>
        </div>
        
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Backend Elysia + Frontend React + Eden Treaty (Type-safe API)
      </p>
    </>
  )
}

export default App
