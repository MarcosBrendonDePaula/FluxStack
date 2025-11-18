# 📋 Live Components - Cheatsheet de Referência Rápida

> **Cole na parede!** Referência rápida para Live Components do FluxStack.

---

## 🚀 Setup Rápido

### 1. Criar Live Component (Servidor)

```typescript
// app/server/live/MeuComponent.ts
import { LiveComponent } from '@/core/types/types'

export class MeuComponent extends LiveComponent {
  // 📦 Estado
  state = {
    valor: 0
  }

  // 🎬 Ações
  async minhaAcao(payload: any) {
    this.state.valor = payload.novoValor
  }

  // 🧹 Cleanup (se usar timers/intervals)
  public destroy() {
    // Limpar resources aqui
    super.destroy()
  }
}
```

### 2. Usar no Frontend (React)

```typescript
// app/client/src/components/MeuComponente.tsx
import { useHybridLiveComponent } from '@/core/client/hooks/useHybridLiveComponent'

export function MeuComponente() {
  const { state, call, status } = useHybridLiveComponent(
    'MeuComponent',  // ← Nome da classe
    { valor: 0 }     // ← Estado inicial
  )

  return (
    <div>
      <p>{state.valor}</p>
      <button onClick={() => call('minhaAcao', { novoValor: 10 })}>
        Clique
      </button>
    </div>
  )
}
```

---

## 🎣 Hook: useHybridLiveComponent

### Sintaxe Básica

```typescript
const {
  state,         // 📦 Estado atual (read-only)
  call,          // 🎬 Chama ação (sem esperar)
  callAndWait,   // ⏳ Chama ação e espera resultado
  status,        // 🔌 Status da conexão
  loading,       // ⏳ Está carregando?
  error,         // ❌ Mensagem de erro
  connected,     // ✅ Está conectado?
  componentId,   // 🆔 ID único do componente
  mount,         // 🔧 Monta manualmente
  unmount        // 🔧 Desmonta manualmente
} = useHybridLiveComponent(
  'NomeDoComponente',  // Nome da classe no servidor
  { /* estado inicial */ },
  {
    autoMount: true,        // Monta automaticamente? (default: true)
    fallbackToLocal: true,  // Usa estado local se servidor falhar?
    room: 'sala-123',       // Sala para broadcast
    userId: 'user-456',     // ID do usuário
    debug: false            // Ativa logs?
  }
)
```

### Exemplos de Uso

```typescript
// ✅ Chamar ação simples
call('increment')

// ✅ Chamar com payload
call('updateName', { name: 'João' })

// ✅ Chamar e esperar resultado
const result = await callAndWait('calcular', { x: 10, y: 20 })
console.log(result)  // { sum: 30 }

// ✅ Verificar se está conectado
if (status === 'synced') {
  console.log('Conectado!')
}

// ✅ Mostrar erro
{error && <div className="error">{error}</div>}

// ✅ Input controlado com helper
const nameField = useControlledField('name', 'updateName')

<input
  value={nameField.value}
  onChange={(e) => nameField.setValue(e.target.value)}
  onBlur={() => nameField.commit()}
/>
```

---

## 📊 Status da Conexão

| Status | Significado | UI Sugerida |
|--------|-------------|-------------|
| `synced` | ✅ Conectado e sincronizado | Badge verde "Online" |
| `connecting` | 🔄 Conectando pela primeira vez | Spinner "Conectando..." |
| `reconnecting` | 🔄 Reconectando após falha | "Reconectando..." |
| `loading` | ⏳ Carregando estado inicial | Skeleton loader |
| `mounting` | ⏳ Montando componente | "Inicializando..." |
| `disconnected` | ❌ Desconectado | Badge vermelho "Offline" |
| `error` | ⚠️ Erro | Mensagem de erro |

### Exemplo Visual de Status

```typescript
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    synced: { color: 'green', text: '✅ Online' },
    connecting: { color: 'yellow', text: '🔄 Conectando...' },
    reconnecting: { color: 'orange', text: '🔄 Reconectando...' },
    loading: { color: 'blue', text: '⏳ Carregando...' },
    mounting: { color: 'blue', text: '⏳ Inicializando...' },
    disconnected: { color: 'red', text: '❌ Offline' },
    error: { color: 'red', text: '⚠️ Erro' }
  }

  const config = statusConfig[status as keyof typeof statusConfig]

  return (
    <span style={{ color: config.color }}>
      {config.text}
    </span>
  )
}
```

---

## 🎨 Padrões Comuns

### Padrão 1: Contador Simples

```typescript
// Servidor
export class CounterComponent extends LiveComponent {
  state = { count: 0 }

  async increment() {
    this.state.count++
  }

  async decrement() {
    this.state.count--
  }
}

// Cliente
function Counter() {
  const { state, call } = useHybridLiveComponent('CounterComponent', { count: 0 })

  return (
    <div>
      <h1>{state.count}</h1>
      <button onClick={() => call('increment')}>+</button>
      <button onClick={() => call('decrement')}>-</button>
    </div>
  )
}
```

### Padrão 2: Timer/Interval

```typescript
// Servidor
export class TimerComponent extends LiveComponent {
  state = { seconds: 0 }
  private interval: NodeJS.Timeout | null = null

  constructor(initialState: any, ws: any, options?: any) {
    super(initialState, ws, options)

    this.interval = setInterval(() => {
      this.state.seconds++
      this.setState({ seconds: this.state.seconds })
    }, 1000)
  }

  public destroy() {
    if (this.interval) {
      clearInterval(this.interval)  // ⚠️ CRÍTICO!
    }
    super.destroy()
  }
}

// Cliente
function Timer() {
  const { state } = useHybridLiveComponent('TimerComponent', { seconds: 0 })

  return <h1>⏱️ {state.seconds}s</h1>
}
```

### Padrão 3: Formulário com Validação Server-Side

```typescript
// Servidor
export class FormComponent extends LiveComponent {
  state = {
    name: '',
    email: '',
    errors: {} as Record<string, string>
  }

  async updateField(payload: { field: string; value: any }) {
    this.state[payload.field] = payload.value

    // Validação em tempo real
    this.validateField(payload.field, payload.value)
  }

  private validateField(field: string, value: any) {
    const errors = { ...this.state.errors }

    if (field === 'email') {
      if (!value.includes('@')) {
        errors.email = 'E-mail inválido'
      } else {
        delete errors.email
      }
    }

    this.state.errors = errors
  }

  async submit() {
    // Validação final
    if (Object.keys(this.state.errors).length > 0) {
      throw new Error('Formulário contém erros')
    }

    // Salvar no banco de dados
    await db.users.create({
      name: this.state.name,
      email: this.state.email
    })

    return { success: true, message: 'Usuário criado!' }
  }
}

// Cliente
function UserForm() {
  const { state, call, callAndWait } = useHybridLiveComponent('FormComponent', {
    name: '',
    email: '',
    errors: {}
  })

  const handleSubmit = async () => {
    try {
      const result = await callAndWait('submit')
      alert(result.message)
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
      <input
        value={state.name}
        onChange={(e) => call('updateField', { field: 'name', value: e.target.value })}
        placeholder="Nome"
      />

      <input
        value={state.email}
        onChange={(e) => call('updateField', { field: 'email', value: e.target.value })}
        placeholder="E-mail"
      />
      {state.errors.email && <span className="error">{state.errors.email}</span>}

      <button type="submit">Cadastrar</button>
    </form>
  )
}
```

### Padrão 4: Broadcasting (Sala Colaborativa)

```typescript
// Servidor
export class ChatComponent extends LiveComponent {
  state = {
    messages: [] as Array<{ user: string; text: string; time: string }>
  }

  async sendMessage(payload: { user: string; text: string }) {
    const message = {
      user: payload.user,
      text: payload.text,
      time: new Date().toLocaleTimeString()
    }

    this.state.messages.push(message)

    // 📢 Envia para TODOS na mesma sala
    if (this.room) {
      this.broadcast('NEW_MESSAGE', { message })
    }
  }
}

// Cliente
function Chat() {
  const [newMessage, setNewMessage] = useState('')

  const { state, call } = useHybridLiveComponent(
    'ChatComponent',
    { messages: [] },
    { room: 'chat-geral', userId: 'user-123' }  // ← Sala colaborativa
  )

  return (
    <div>
      <div className="messages">
        {state.messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.user}</strong> ({msg.time}): {msg.text}
          </div>
        ))}
      </div>

      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            call('sendMessage', { user: 'João', text: newMessage })
            setNewMessage('')
          }
        }}
      />
    </div>
  )
}
```

---

## ⚠️ Erros Comuns e Soluções

### Erro 1: "Component not found"

**Causa**: Nome do componente errado ou não foi buildado.

**Solução**:
```bash
bun run build  # Re-gera registro de componentes
```

Verifique se o nome está correto:
```typescript
// ❌ ERRADO
const { state } = useHybridLiveComponent('counter', ...)  // lowercase

// ✅ CORRETO
const { state } = useHybridLiveComponent('CounterComponent', ...)  // Nome da classe
```

### Erro 2: Memory Leak (Servidor não para)

**Causa**: Não limpou timers/intervals.

**Solução**:
```typescript
// ✅ SEMPRE implemente destroy() se usar setInterval/setTimeout
public destroy() {
  if (this.interval) clearInterval(this.interval)
  if (this.timeout) clearTimeout(this.timeout)
  super.destroy()
}
```

### Erro 3: Estado não atualiza

**Causa**: Esqueceu de usar `this.setState()` ou `this.state.x =`.

**Solução**:
```typescript
// ❌ ERRADO
async increment() {
  const newCount = this.state.count + 1  // Só cria variável local
}

// ✅ CORRETO (Opção 1)
async increment() {
  this.state.count++  // Modifica diretamente
}

// ✅ CORRETO (Opção 2)
async increment() {
  this.setState({ count: this.state.count + 1 })  // Usa setState
}
```

### Erro 4: WebSocket não conecta

**Causa**: Servidor não está rodando ou firewall bloqueando.

**Solução**:
```bash
# 1. Verificar se servidor está rodando
curl http://localhost:3000/api/live/health

# 2. Verificar WebSocket info
curl http://localhost:3000/api/live/websocket-info

# 3. Restart servidor
bun run dev
```

### Erro 5: "Unauthorized" ou "Forbidden"

**Causa**: Tentando executar ação que requer autenticação.

**Solução**:
```typescript
// Servidor - Adicionar validação
async deleteUser(payload: { userId: string }) {
  // Verificar se usuário tem permissão
  if (this.userId !== payload.userId) {
    throw new Error('Unauthorized: Cannot delete other users')
  }

  await db.users.delete(payload.userId)
}
```

---

## 🔧 Debugging

### Ativar Logs de Debug

```typescript
// Cliente
const { state, call } = useHybridLiveComponent(
  'CounterComponent',
  { count: 0 },
  { debug: true }  // ← Ativa logs detalhados
)
```

### Verificar Status do Servidor

```bash
# Health check
curl http://localhost:3000/api/live/health

# Estatísticas
curl http://localhost:3000/api/live/stats

# Conexões ativas
curl http://localhost:3000/api/live/connections

# Performance de componente específico
curl http://localhost:3000/api/live/performance/components/CounterComponent
```

### Logs Úteis no Console

```typescript
// Cliente
console.log('Estado atual:', state)
console.log('Status conexão:', status)
console.log('Component ID:', componentId)
console.log('Conectado?', connected)
console.log('Erro:', error)
```

---

## 📚 Glossário Rápido

| Termo | Significado |
|-------|-------------|
| **Live Component** | Componente que roda no servidor e sincroniza com frontend via WebSocket |
| **State** | Estado do componente (vive no servidor) |
| **Action** | Função que o cliente pode chamar no servidor |
| **Mount** | Criar instância do componente no servidor |
| **Unmount** | Destruir instância do componente |
| **Broadcasting** | Enviar mensagem para múltiplos clientes |
| **Room** | "Sala" virtual - clientes na mesma sala recebem broadcasts |
| **Rehydration** | Restaurar estado após reconnection |
| **WebSocket** | Protocolo de comunicação bidirecional em tempo real |

---

## ✅ Checklist de Boas Práticas

Antes de ir para produção, verifique:

- [ ] Todos os `setInterval`/`setTimeout` têm cleanup em `destroy()`
- [ ] Validação de inputs em todas as actions
- [ ] Error handling com try/catch
- [ ] Não expor dados sensíveis no estado
- [ ] Testar com múltiplos clientes simultâneos
- [ ] Testar reconnection (desligar/ligar servidor)
- [ ] Status UI implementado para feedback ao usuário
- [ ] Logs de debug desativados em produção
- [ ] WebSocket usando `wss://` (não `ws://`) em produção

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
bun run dev              # Backend + Frontend

# Build
bun run build            # Gera registro de componentes

# Testes
bun run test             # Suite de testes

# Verificação TypeScript
bunx tsc --noEmit        # Verifica erros de tipo

# Health check
curl http://localhost:3000/api/live/health
```

---

**💡 Dica Final**: Cole este cheatsheet ao lado do seu monitor. Em 2 dias você não precisará mais consultar!

**Última atualização**: Janeiro 2025
