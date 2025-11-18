# Live Components - Guia Prático

> **Pré-requisitos**: React, TypeScript, conceitos de APIs REST

---

## Introdução

Live Components são componentes React que mantêm sincronização bidirecional em tempo real com o servidor via WebSocket. A lógica de negócio roda no backend, e o estado é automaticamente sincronizado com o frontend.

### Comparação com APIs REST

**REST API tradicional**:
```typescript
// Cliente precisa gerenciar tudo manualmente
const [data, setData] = useState()
const [loading, setLoading] = useState(false)
const [error, setError] = useState()

const increment = async () => {
  setLoading(true)
  try {
    const response = await fetch('/api/counter/increment', { method: 'POST' })
    const newData = await response.json()
    setData(newData)
  } catch (err) {
    setError(err)
  } finally {
    setLoading(false)
  }
}
```

**Live Components**:
```typescript
// FluxStack gerencia estado, loading, erros e sincronização
const { state, call, status } = useHybridLiveComponent('CounterComponent', { count: 0 })

const increment = () => call('increment')  // Só isso
```

### Quando usar?

**Use Live Components**:
- Dashboards com dados em tempo real
- Features colaborativas (múltiplos usuários editando simultaneamente)
- Chat, notificações, feeds ao vivo
- Qualquer UI que precisa refletir mudanças server-side imediatamente

**Use REST API**:
- CRUD tradicional sem necessidade de updates em tempo real
- APIs públicas consumidas por terceiros
- Operações stateless onde caching HTTP é importante

---

## Quick Start

### 1. Criar Live Component no Servidor

Crie `app/server/live/CounterComponent.ts`:

```typescript
import { LiveComponent } from '@/core/types/types'

export class CounterComponent extends LiveComponent {
  // Estado inicial - equivalente ao useState no React
  state = {
    count: 0,
    lastUpdated: new Date().toISOString()
  }

  // Actions - métodos que o cliente pode invocar
  async increment() {
    this.state.count++
    this.state.lastUpdated = new Date().toISOString()
    // Não precisa retornar nada - estado é sincronizado automaticamente
  }

  async decrement() {
    this.state.count--
    this.state.lastUpdated = new Date().toISOString()
  }

  async reset() {
    this.state.count = 0
    this.state.lastUpdated = new Date().toISOString()
  }

  // Opcional: validação e lógica de negócio
  async setCount(payload: { value: number }) {
    if (payload.value < 0) {
      throw new Error('Count cannot be negative')
    }
    if (payload.value > 1000) {
      throw new Error('Count cannot exceed 1000')
    }
    this.state.count = payload.value
    this.state.lastUpdated = new Date().toISOString()
  }
}
```

### 2. Usar no Frontend

Crie `app/client/src/components/Counter.tsx`:

```typescript
import { useHybridLiveComponent } from '@/core/client/hooks/useHybridLiveComponent'

export function Counter() {
  const {
    state,      // Estado atual (read-only)
    call,       // Invocar action sem esperar resposta
    status,     // 'synced' | 'connecting' | 'error' | ...
    error       // Mensagem de erro se houver
  } = useHybridLiveComponent('CounterComponent', {
    count: 0,
    lastUpdated: ''
  })

  return (
    <div>
      <h2>Count: {state.count}</h2>
      <p>Last updated: {state.lastUpdated}</p>

      <button onClick={() => call('increment')}>+1</button>
      <button onClick={() => call('decrement')}>-1</button>
      <button onClick={() => call('reset')}>Reset</button>

      <div>
        Status: {status}
        {error && <span style={{ color: 'red' }}> - {error}</span>}
      </div>
    </div>
  )
}
```

### 3. Rodar

```bash
bun run dev
```

Acesse `http://localhost:5173` e teste. Abra múltiplas abas - o estado sincroniza automaticamente.

---

## API: useHybridLiveComponent

```typescript
const {
  state,           // Estado atual (sincronizado com servidor)
  loading,         // true durante mount inicial
  error,           // string | null - mensagem de erro
  connected,       // boolean - WebSocket conectado?
  componentId,     // string | null - ID único da instância
  status,          // Status detalhado da conexão
  call,            // (action: string, payload?: any) => Promise<void>
  callAndWait,     // (action: string, payload?: any) => Promise<result>
  mount,           // () => Promise<void> - montar manualmente
  unmount,         // () => Promise<void> - desmontar manualmente
  useControlledField  // Helper para inputs controlados
} = useHybridLiveComponent<StateType>(
  componentName: string,
  initialState: StateType,
  options?: {
    autoMount?: boolean        // default: true
    fallbackToLocal?: boolean  // default: true
    room?: string             // para broadcasting
    userId?: string           // identificação do usuário
    debug?: boolean           // logs detalhados
  }
)
```

### Status da Conexão

| Status | Descrição |
|--------|-----------|
| `synced` | Conectado e sincronizado |
| `connecting` | Primeira conexão em andamento |
| `reconnecting` | Reconectando após desconexão |
| `loading` | Carregando estado inicial |
| `mounting` | Montando componente no servidor |
| `disconnected` | Desconectado |
| `error` | Erro durante operação |

### Exemplo de UI de Status

```typescript
function ConnectionStatus({ status }: { status: string }) {
  const statusMap = {
    synced: { icon: '●', color: '#22c55e', label: 'Connected' },
    connecting: { icon: '○', color: '#eab308', label: 'Connecting...' },
    reconnecting: { icon: '◐', color: '#f97316', label: 'Reconnecting...' },
    loading: { icon: '◷', color: '#3b82f6', label: 'Loading...' },
    mounting: { icon: '◷', color: '#3b82f6', label: 'Mounting...' },
    disconnected: { icon: '○', color: '#ef4444', label: 'Disconnected' },
    error: { icon: '✕', color: '#ef4444', label: 'Error' }
  }

  const config = statusMap[status as keyof typeof statusMap] || statusMap.disconnected

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ color: config.color, fontSize: '20px' }}>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  )
}
```

---

## Exemplos Práticos

### Exemplo 1: Relógio em Tempo Real

**Servidor** (`app/server/live/ClockComponent.ts`):

```typescript
import { LiveComponent } from '@/core/types/types'

export class ClockComponent extends LiveComponent {
  state = {
    time: new Date().toISOString(),
    format: '24h' as '12h' | '24h'
  }

  private interval: NodeJS.Timeout | null = null

  constructor(initialState: any, ws: any, options?: any) {
    super(initialState, ws, options)
    this.startClock()
  }

  private startClock() {
    this.interval = setInterval(() => {
      this.setState({ time: new Date().toISOString() })
    }, 1000)
  }

  async setFormat(payload: { format: '12h' | '24h' }) {
    this.setState({ format: payload.format })
  }

  // IMPORTANTE: Cleanup de resources
  public destroy() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    super.destroy()
  }
}
```

**Cliente**:

```typescript
import { useHybridLiveComponent } from '@/core/client/hooks/useHybridLiveComponent'

export function LiveClock() {
  const { state, call } = useHybridLiveComponent('ClockComponent', {
    time: new Date().toISOString(),
    format: '24h' as '12h' | '24h'
  })

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return state.format === '12h'
      ? date.toLocaleTimeString('en-US', { hour12: true })
      : date.toLocaleTimeString('pt-BR', { hour12: false })
  }

  return (
    <div>
      <h1>{formatTime(state.time)}</h1>
      <button onClick={() => call('setFormat', { format: '12h' })}>12h</button>
      <button onClick={() => call('setFormat', { format: '24h' })}>24h</button>
    </div>
  )
}
```

### Exemplo 2: Formulário com Validação Server-Side

**Servidor**:

```typescript
import { LiveComponent } from '@/core/types/types'

interface UserFormState {
  name: string
  email: string
  errors: Record<string, string>
  submitting: boolean
}

export class UserFormComponent extends LiveComponent<UserFormState> {
  state: UserFormState = {
    name: '',
    email: '',
    errors: {},
    submitting: false
  }

  async updateField(payload: { field: keyof UserFormState; value: any }) {
    this.state[payload.field] = payload.value as never

    // Validação em tempo real
    await this.validateField(payload.field, payload.value)
  }

  private async validateField(field: string, value: any) {
    const errors = { ...this.state.errors }

    switch (field) {
      case 'name':
        if (!value || value.length < 3) {
          errors.name = 'Name must be at least 3 characters'
        } else {
          delete errors.name
        }
        break

      case 'email':
        if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          errors.email = 'Invalid email format'
        } else {
          // Verificar se email já existe (async)
          const exists = await this.checkEmailExists(value)
          if (exists) {
            errors.email = 'Email already registered'
          } else {
            delete errors.email
          }
        }
        break
    }

    this.state.errors = errors
  }

  private async checkEmailExists(email: string): Promise<boolean> {
    // Simular query no banco
    await new Promise(resolve => setTimeout(resolve, 100))
    return email === 'test@example.com' // exemplo
  }

  async submit() {
    this.state.submitting = true

    try {
      // Validação final
      if (Object.keys(this.state.errors).length > 0) {
        throw new Error('Form contains errors')
      }

      // Salvar no banco (simulated)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Reset form
      this.state = {
        name: '',
        email: '',
        errors: {},
        submitting: false
      }

      return { success: true, message: 'User created successfully' }

    } catch (error: any) {
      this.state.submitting = false
      throw error
    }
  }
}
```

**Cliente**:

```typescript
import { useHybridLiveComponent } from '@/core/client/hooks/useHybridLiveComponent'

export function UserForm() {
  const { state, call, callAndWait } = useHybridLiveComponent('UserFormComponent', {
    name: '',
    email: '',
    errors: {},
    submitting: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const result = await callAndWait('submit')
      alert(result.message)
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name:</label>
        <input
          type="text"
          value={state.name}
          onChange={(e) => call('updateField', { field: 'name', value: e.target.value })}
          disabled={state.submitting}
        />
        {state.errors.name && <span className="error">{state.errors.name}</span>}
      </div>

      <div>
        <label>Email:</label>
        <input
          type="email"
          value={state.email}
          onChange={(e) => call('updateField', { field: 'email', value: e.target.value })}
          disabled={state.submitting}
        />
        {state.errors.email && <span className="error">{state.errors.email}</span>}
      </div>

      <button type="submit" disabled={state.submitting || Object.keys(state.errors).length > 0}>
        {state.submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
```

### Exemplo 3: Broadcasting - Chat em Tempo Real

**Servidor**:

```typescript
import { LiveComponent } from '@/core/types/types'

interface Message {
  id: string
  userId: string
  username: string
  text: string
  timestamp: string
}

interface ChatState {
  messages: Message[]
  usersOnline: string[]
}

export class ChatComponent extends LiveComponent<ChatState> {
  state: ChatState = {
    messages: [],
    usersOnline: []
  }

  async sendMessage(payload: { text: string }) {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      userId: this.userId || 'anonymous',
      username: this.userId || 'Anonymous',
      text: payload.text,
      timestamp: new Date().toISOString()
    }

    this.state.messages.push(message)

    // Broadcasting: envia para todos na mesma room
    if (this.room) {
      this.broadcast('NEW_MESSAGE', { message })
    }
  }

  async onMount() {
    // Adicionar usuário à lista de online
    if (this.userId && !this.state.usersOnline.includes(this.userId)) {
      this.state.usersOnline.push(this.userId)

      if (this.room) {
        this.broadcast('USER_JOINED', { userId: this.userId })
      }
    }
  }

  async onUnmount() {
    // Remover usuário da lista
    if (this.userId) {
      this.state.usersOnline = this.state.usersOnline.filter(id => id !== this.userId)

      if (this.room) {
        this.broadcast('USER_LEFT', { userId: this.userId })
      }
    }
  }
}
```

**Cliente**:

```typescript
import { useState } from 'react'
import { useHybridLiveComponent } from '@/core/client/hooks/useHybridLiveComponent'

export function Chat({ roomId, userId }: { roomId: string; userId: string }) {
  const [messageText, setMessageText] = useState('')

  const { state, call, status } = useHybridLiveComponent(
    'ChatComponent',
    { messages: [], usersOnline: [] },
    { room: roomId, userId }
  )

  const handleSend = () => {
    if (messageText.trim()) {
      call('sendMessage', { text: messageText })
      setMessageText('')
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Room: {roomId}</h3>
        <span>{state.usersOnline.length} online</span>
        <ConnectionStatus status={status} />
      </div>

      <div className="messages">
        {state.messages.map(msg => (
          <div key={msg.id} className="message">
            <strong>{msg.username}</strong>
            <span className="time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          disabled={status !== 'synced'}
        />
        <button onClick={handleSend} disabled={status !== 'synced'}>
          Send
        </button>
      </div>
    </div>
  )
}
```

---

## Boas Práticas

### 1. Resource Management

**SEMPRE limpe resources em `destroy()`**:

```typescript
export class MyComponent extends LiveComponent {
  private interval: NodeJS.Timeout | null = null
  private timeout: NodeJS.Timeout | null = null
  private subscription: any = null

  constructor(...) {
    super(...)
    this.interval = setInterval(...)
    this.timeout = setTimeout(...)
    this.subscription = externalService.subscribe(...)
  }

  public destroy() {
    if (this.interval) clearInterval(this.interval)
    if (this.timeout) clearTimeout(this.timeout)
    if (this.subscription) this.subscription.unsubscribe()
    super.destroy()
  }
}
```

### 2. Input Validation

**Valide TODOS os inputs do cliente**:

```typescript
async updatePrice(payload: { price: number }) {
  // Validação de tipo
  if (typeof payload.price !== 'number') {
    throw new Error('Price must be a number')
  }

  // Validação de range
  if (payload.price < 0 || payload.price > 1000000) {
    throw new Error('Price must be between 0 and 1,000,000')
  }

  // Validação de permissão
  if (!this.userHasPermission('update_prices')) {
    throw new Error('Unauthorized')
  }

  this.state.price = payload.price
}
```

### 3. Error Handling

```typescript
async fetchUserData(payload: { userId: string }) {
  try {
    const user = await api.getUser(payload.userId)
    this.setState({ user, error: null, loading: false })
  } catch (error: any) {
    console.error('Failed to fetch user:', error)
    this.setState({
      error: error.message || 'Failed to load user',
      loading: false
    })
    // Component continua funcionando
  }
}
```

### 4. Performance - Throttling

```typescript
export class MouseTrackerComponent extends LiveComponent {
  state = { x: 0, y: 0 }
  private lastEmit = 0
  private readonly THROTTLE_MS = 100

  async updatePosition(payload: { x: number; y: number }) {
    // Atualiza estado local sempre
    this.state.x = payload.x
    this.state.y = payload.y

    // Mas só emite update a cada 100ms
    const now = Date.now()
    if (now - this.lastEmit >= this.THROTTLE_MS) {
      this.setState({ x: this.state.x, y: this.state.y })
      this.lastEmit = now
    }
  }
}
```

### 5. State Design

**Evite estado duplicado ou derivado**:

```typescript
// ❌ Ruim - estado duplicado
state = {
  users: [],
  userCount: 0,     // Derivado de users.length
  hasUsers: false   // Derivado de users.length > 0
}

// ✅ Bom - single source of truth
state = {
  users: []
}

// Calcule valores derivados no getter ou no cliente
get userCount() {
  return this.state.users.length
}
```

### 6. Broadcasting com Cuidado

```typescript
// ✅ Broadcasting apropriado - dado público
async createPost(payload: { title: string; content: string }) {
  const post = await db.posts.create(payload)

  if (this.room) {
    this.broadcast('POST_CREATED', { post })  // Todos veem
  }
}

// ❌ NUNCA faça broadcast de dados sensíveis
async updatePassword(payload: { oldPassword: string; newPassword: string }) {
  await this.changePassword(payload)

  // ❌ NUNCA!
  // this.broadcast('PASSWORD_CHANGED', payload)
}
```

---

## Troubleshooting

### Component não encontrado

```bash
# Rebuild para registrar novos componentes
bun run build
```

### Estado não atualiza

Verifique se está modificando o estado corretamente:

```typescript
// ✅ Correto
this.state.count++

// ✅ Também correto
this.setState({ count: this.state.count + 1 })

// ❌ Errado - apenas cria variável local
const newCount = this.state.count + 1
```

### Memory leak

Se o processo do servidor não libera memória:

```typescript
// Verifique se implementou destroy()
public destroy() {
  // Limpar TODOS timers, intervals, subscriptions
  super.destroy()
}
```

### WebSocket não conecta

```bash
# Verificar se servidor está rodando
curl http://localhost:3000/api/live/health

# Verificar configuração WebSocket
curl http://localhost:3000/api/live/websocket-info
```

---

## Debugging

### Ativar Logs Detalhados

```typescript
const { state } = useHybridLiveComponent(
  'MyComponent',
  initialState,
  { debug: true }  // Ativa logs no console
)
```

### Monitorar Performance

```bash
# Dashboard de performance
curl http://localhost:3000/api/live/performance/dashboard

# Métricas de componente específico
curl http://localhost:3000/api/live/performance/components/MyComponent

# Conexões ativas
curl http://localhost:3000/api/live/connections
```

---

## Referências

- **API Reference Completa**: `ai-context/reference/live-components-api.md`
- **Código Fonte**: `core/server/live/` e `core/client/hooks/`
- **Exemplo Real**: `app/server/live/LiveClockComponent.ts`
- **Cheatsheet**: `ai-context/development/live-components-cheatsheet.md`

---

**Última atualização**: Janeiro 2025
