# Live Components API Reference

## Visão Geral

O **Live Components Plugin** é um sistema de componentes reativos em tempo real que utiliza WebSockets para comunicação bidirecional entre cliente e servidor. Inspirado no Laravel Livewire e Phoenix LiveView.

### Características

- ✅ **WebSocket Nativo**: Implementado com suporte nativo do Elysia
- ✅ **Type Safety**: Inferência automática de tipos com Eden Treaty
- ✅ **Performance Monitoring**: Monitoramento integrado de métricas
- ✅ **Connection Management**: Gerenciamento robusto de conexões
- ✅ **File Upload**: Suporte para upload de arquivos via WebSocket
- ✅ **Connection Pooling**: Pools de conexões para escalabilidade

---

## Endpoints HTTP

Todas as rotas Live Components estão sob o prefixo `/api/live` e agrupadas com a tag **"Live Components"** no Swagger.

### 1. Informações e Estatísticas

#### `GET /api/live/websocket-info`

Retorna informações sobre o endpoint WebSocket e estatísticas do connection manager.

**Tags**: `Live Components`, `WebSocket`

**Response**:
```typescript
{
  success: boolean
  message: string
  endpoint: string              // "ws://localhost:3000/api/live/ws"
  status: string                // "running"
  connectionManager: {
    totalConnections: number
    activeConnections: number
    totalPools: number
    totalQueuedMessages: number
    maxConnections: number
    connectionUtilization: number
  }
}
```

**Exemplo**:
```bash
curl http://localhost:3000/api/live/websocket-info
```

---

#### `GET /api/live/stats`

Retorna estatísticas sobre componentes registrados e instâncias ativas.

**Tags**: `Live Components`, `Monitoring`

**Response**:
```typescript
{
  success: boolean
  stats: {
    components: number           // Total de componentes registrados
    instances: number            // Total de instâncias ativas
    connections: number          // Total de conexões WebSocket
  }
  timestamp: string              // ISO 8601
}
```

---

#### `GET /api/live/health`

Verifica o status de saúde do serviço Live Components.

**Tags**: `Live Components`, `Health`

**Response**:
```typescript
{
  success: boolean
  service: string                // "FluxStack Live Components"
  status: string                 // "operational"
  components: number
  connections: {
    totalConnections: number
    activeConnections: number
    // ... outras métricas
  }
  uptime: number                 // Segundos desde o boot
  timestamp: string
}
```

---

### 2. Gerenciamento de Conexões

#### `GET /api/live/connections`

Lista todas as conexões WebSocket ativas com suas métricas.

**Tags**: `Live Components`, `Connections`

**Response**:
```typescript
{
  success: boolean
  connections: Array<{
    id: string
    connectedAt: string
    lastActivity: string
    messagesSent: number
    messagesReceived: number
    // ... outras métricas
  }>
  systemStats: {
    totalConnections: number
    activeConnections: number
    // ...
  }
  timestamp: string
}
```

---

#### `GET /api/live/connections/:connectionId`

Retorna métricas detalhadas para uma conexão específica.

**Tags**: `Live Components`, `Connections`

**Parameters**:
- `connectionId` (string) - O identificador único da conexão

**Response (sucesso)**:
```typescript
{
  success: true
  connection: {
    id: string
    connectedAt: string
    lastActivity: string
    messagesSent: number
    messagesReceived: number
    components: number           // Componentes montados nesta conexão
    // ... métricas detalhadas
  }
  timestamp: string
}
```

**Response (erro)**:
```typescript
{
  success: false
  error: "Connection not found"
}
```

---

#### `GET /api/live/pools/:poolId/stats`

Retorna estatísticas para um pool de conexões específico.

**Tags**: `Live Components`, `Connections`, `Pools`

**Parameters**:
- `poolId` (string) - O identificador único do pool

**Response (sucesso)**:
```typescript
{
  success: true
  pool: string
  stats: {
    size: number
    active: number
    idle: number
    utilization: number
    // ...
  }
  timestamp: string
}
```

**Response (erro)**:
```typescript
{
  success: false
  error: "Pool not found"
}
```

---

### 3. Monitoramento de Performance

#### `GET /api/live/performance/dashboard`

Retorna dados completos do dashboard de monitoramento de performance.

**Tags**: `Live Components`, `Performance`

**Response**:
```typescript
{
  success: boolean
  dashboard: {
    overview: {
      totalComponents: number
      totalInstances: number
      avgResponseTime: number
      // ...
    }
    metrics: Array<{
      componentId: string
      renderTime: number
      updateTime: number
      messageLatency: number
      // ...
    }>
    alerts: Array<{
      id: string
      severity: "low" | "medium" | "high" | "critical"
      message: string
      timestamp: string
    }>
  }
  timestamp: string
}
```

---

#### `GET /api/live/performance/components/:componentId`

Retorna métricas de performance, alertas e sugestões para um componente específico.

**Tags**: `Live Components`, `Performance`

**Parameters**:
- `componentId` (string) - O identificador único do componente

**Response (sucesso)**:
```typescript
{
  success: true
  component: string
  metrics: {
    avgRenderTime: number
    avgUpdateTime: number
    avgMessageLatency: number
    totalRenders: number
    totalUpdates: number
    errorRate: number
    // ...
  }
  alerts: Array<{
    id: string
    type: string
    severity: string
    message: string
    timestamp: string
  }>
  suggestions: Array<{
    type: string
    priority: string
    description: string
    estimatedImpact: string
  }>
  timestamp: string
}
```

**Response (erro)**:
```typescript
{
  success: false
  error: "Component metrics not found"
}
```

---

#### `POST /api/live/performance/alerts/:alertId/resolve`

Marca um alerta de performance como resolvido.

**Tags**: `Live Components`, `Performance`, `Alerts`

**Parameters**:
- `alertId` (string) - O identificador único do alerta

**Response**:
```typescript
{
  success: boolean
  message: string                // "Alert resolved" ou "Alert not found"
  timestamp: string
}
```

---

## WebSocket Endpoint

### `WS /api/live/ws`

Endpoint WebSocket para comunicação em tempo real com Live Components.

#### Conexão

```javascript
const ws = new WebSocket('ws://localhost:3000/api/live/ws')

ws.onopen = () => {
  console.log('Connected to Live Components')
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  console.log('Received:', message)
}
```

#### Tipos de Mensagens

##### Cliente → Servidor

**COMPONENT_MOUNT** - Monta um componente
```typescript
{
  type: "COMPONENT_MOUNT"
  componentId: string
  payload: {
    componentName: string
    props?: Record<string, any>
    room?: string
    userId?: string
  }
  requestId?: string
  expectResponse?: boolean
}
```

**COMPONENT_UNMOUNT** - Desmonta um componente
```typescript
{
  type: "COMPONENT_UNMOUNT"
  componentId: string
  requestId?: string
}
```

**CALL_ACTION** - Chama uma ação no componente
```typescript
{
  type: "CALL_ACTION"
  componentId: string
  action: string
  payload?: any
  requestId?: string
  expectResponse?: boolean
}
```

**PROPERTY_UPDATE** - Atualiza propriedade do componente
```typescript
{
  type: "PROPERTY_UPDATE"
  componentId: string
  payload: {
    property: string
    value: any
  }
  requestId?: string
}
```

**COMPONENT_PING** - Mantém a conexão ativa
```typescript
{
  type: "COMPONENT_PING"
  componentId: string
  requestId?: string
}
```

##### Servidor → Cliente

**CONNECTION_ESTABLISHED** - Confirmação de conexão
```typescript
{
  type: "CONNECTION_ESTABLISHED"
  connectionId: string
  timestamp: number
  features: {
    compression: boolean
    encryption: boolean
    offlineQueue: boolean
    loadBalancing: boolean
  }
}
```

**COMPONENT_MOUNTED** - Componente montado com sucesso
```typescript
{
  type: "COMPONENT_MOUNTED"
  componentId: string
  success: boolean
  result?: any
  error?: string
  requestId?: string
  timestamp: number
}
```

**COMPONENT_UPDATE** - Atualização do estado do componente
```typescript
{
  type: "COMPONENT_UPDATE"
  componentId: string
  state: any
  timestamp: number
}
```

**ACTION_RESPONSE** - Resposta de uma ação
```typescript
{
  type: "ACTION_RESPONSE"
  componentId: string
  success: boolean
  result?: any
  error?: string
  requestId?: string
  timestamp: number
}
```

**COMPONENT_PONG** - Resposta ao ping
```typescript
{
  type: "COMPONENT_PONG"
  componentId: string
  success: boolean
  requestId?: string
  timestamp: number
}
```

**ERROR** - Erro genérico
```typescript
{
  type: "ERROR"
  error: string
  timestamp: number
}
```

---

## Criando Live Components

### Estrutura Base

Crie seu componente em `app/server/live/`:

```typescript
// app/server/live/MyComponent.ts
import { LiveComponent } from '@/core/server/live/LiveComponent'

export class MyComponent extends LiveComponent {
  // Estado inicial
  state = {
    counter: 0,
    message: 'Hello'
  }

  // Ações disponíveis
  async increment() {
    this.state.counter++
    await this.emit('updated', { counter: this.state.counter })
  }

  async updateMessage(newMessage: string) {
    this.state.message = newMessage
    await this.emit('message-changed', { message: this.state.message })
  }

  // Lifecycle hooks
  async onMount() {
    console.log('Component mounted:', this.componentId)
  }

  async onUnmount() {
    console.log('Component unmounted:', this.componentId)
  }
}
```

### Auto-Discovery

Componentes em `app/server/live/` são automaticamente descobertos durante o build:

```bash
bun run build  # Gera core/server/live/auto-generated-components.ts
```

---

## Exemplo Completo

### Servidor (Live Component)

```typescript
// app/server/live/CounterComponent.ts
import { LiveComponent } from '@/core/server/live/LiveComponent'

export class CounterComponent extends LiveComponent {
  state = {
    count: 0,
    history: [] as number[]
  }

  async increment() {
    this.state.count++
    this.state.history.push(this.state.count)

    // Emite atualização para o cliente
    await this.emit('count-updated', {
      count: this.state.count,
      history: this.state.history
    })
  }

  async reset() {
    this.state.count = 0
    this.state.history = []
    await this.emit('count-reset', { count: 0 })
  }

  async onMount() {
    // Inicialização quando o componente é montado
    console.log('Counter mounted')
  }
}
```

### Cliente (React/TypeScript)

```typescript
// app/client/src/components/LiveCounter.tsx
import { useEffect, useState } from 'react'

export function LiveCounter() {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [count, setCount] = useState(0)
  const [componentId] = useState(`counter-${Date.now()}`)

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3000/api/live/ws')

    websocket.onopen = () => {
      // Monta o componente no servidor
      websocket.send(JSON.stringify({
        type: 'COMPONENT_MOUNT',
        componentId,
        payload: {
          componentName: 'CounterComponent'
        }
      }))
    }

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'COMPONENT_UPDATE') {
        setCount(message.state.count)
      }
    }

    setWs(websocket)

    return () => {
      // Desmonta o componente
      websocket.send(JSON.stringify({
        type: 'COMPONENT_UNMOUNT',
        componentId
      }))
      websocket.close()
    }
  }, [])

  const handleIncrement = () => {
    if (ws) {
      ws.send(JSON.stringify({
        type: 'CALL_ACTION',
        componentId,
        action: 'increment'
      }))
    }
  }

  const handleReset = () => {
    if (ws) {
      ws.send(JSON.stringify({
        type: 'CALL_ACTION',
        componentId,
        action: 'reset'
      }))
    }
  }

  return (
    <div>
      <h2>Live Counter: {count}</h2>
      <button onClick={handleIncrement}>Increment</button>
      <button onClick={handleReset}>Reset</button>
    </div>
  )
}
```

---

## Performance e Escalabilidade

### Connection Pooling

O sistema suporta pools de conexões para melhor distribuição de carga:

```typescript
// Configuração de pools (exemplo conceitual)
const poolConfig = {
  maxConnectionsPerPool: 1000,
  poolStrategy: 'round-robin', // ou 'least-connections'
  healthCheckInterval: 30000
}
```

### Monitoramento

Use os endpoints de performance para monitorar:

- **Latência de mensagens**
- **Tempo de renderização**
- **Taxa de erro**
- **Utilização de conexões**

```bash
# Dashboard completo
curl http://localhost:3000/api/live/performance/dashboard

# Métricas de um componente específico
curl http://localhost:3000/api/live/performance/components/CounterComponent
```

---

## Troubleshooting

### Conexão WebSocket falha

**Sintoma**: `WebSocket connection failed`

**Solução**:
1. Verifique se o servidor está rodando: `curl http://localhost:3000/api/live/health`
2. Confirme que WebSockets não estão bloqueados por proxy/firewall
3. Use `ws://` para desenvolvimento, `wss://` para produção

### Componente não encontrado

**Sintoma**: `Component 'MyComponent' not found`

**Solução**:
1. Certifique-se que o componente está em `app/server/live/`
2. Execute `bun run build` para regenerar o registro
3. Verifique se a classe estende `LiveComponent`

### Mensagens não chegam ao cliente

**Sintoma**: Cliente não recebe atualizações

**Solução**:
1. Verifique se `await this.emit()` está sendo chamado
2. Confirme que o `componentId` está correto
3. Monitore logs do servidor para erros

---

## Referências

- **Código fonte**: `core/server/live/`
- **Exemplo**: `app/server/live/LiveClockComponent.ts`
- **Testes**: `core/server/live/__tests__/`
- **Documentação geral**: `ai-context/development/live-components.md`
