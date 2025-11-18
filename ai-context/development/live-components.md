# Live Components - Documentação

> **Novo aqui?** Comece pelo [Guia Prático](./live-components-guide.md) com exemplos práticos.
>
> **Referência rápida?** Veja o [Cheatsheet](./live-components-cheatsheet.md).

---

## Visão Geral

Live Components do FluxStack conectam frontend e backend via WebSocket, permitindo sincronização bidirecional em tempo real. A lógica de negócio roda no servidor, e o estado é automaticamente sincronizado com o cliente.

**Arquitetura**:
```
[React Component] ←WebSocket→ [LiveComponent (Server)]
     ↓                              ↓
useHybridLiveComponent     State + Business Logic
```

**Principais features**:
- Auto-discovery de componentes em `app/server/live/`
- State persistence e rehydration automáticos
- Broadcasting para múltiplos clientes
- Monitoramento de performance integrado
- Upload de arquivos via WebSocket
- Reconnection automática

---

## Como Funciona

### 1. Auto-Discovery

Componentes em `app/server/live/*.ts` são automaticamente descobertos durante o build:

```bash
bun run build  # Gera core/server/live/auto-generated-components.ts
```

Qualquer classe que estenda `LiveComponent` é registrada automaticamente.

### 2. Lifecycle

```
Cliente conecta
    ↓
COMPONENT_MOUNT enviado
    ↓
Servidor cria instância de LiveComponent
    ↓
COMPONENT_MOUNTED com estado inicial
    ↓
Cliente renderiza UI
    ↓
CALL_ACTION quando usuário interage
    ↓
Servidor processa action
    ↓
STATE_UPDATE enviado ao cliente
    ↓
UI re-renderiza automaticamente
    ↓
COMPONENT_UNMOUNT quando componente desmonta
    ↓
Servidor limpa instância e resources
```

### 3. WebSocket Messages

**Cliente → Servidor**:

| Tipo | Descrição | Payload |
|------|-----------|---------|
| `COMPONENT_MOUNT` | Monta componente | `{ component, props, room?, userId? }` |
| `COMPONENT_UNMOUNT` | Desmonta componente | `{ componentId }` |
| `COMPONENT_REHYDRATE` | Restaura estado | `{ componentName, signedState, room?, userId? }` |
| `CALL_ACTION` | Invoca action | `{ componentId, action, payload? }` |
| `PROPERTY_UPDATE` | Atualiza propriedade | `{ componentId, property, value }` |
| `COMPONENT_PING` | Keep-alive | `{ componentId }` |

**Servidor → Cliente**:

| Tipo | Descrição | Payload |
|------|-----------|---------|
| `CONNECTION_ESTABLISHED` | Confirmação de conexão | `{ connectionId, timestamp, features }` |
| `COMPONENT_MOUNTED` | Componente montado | `{ componentId, success, result?, error? }` |
| `COMPONENT_REHYDRATED` | Estado restaurado | `{ success, result: { newComponentId } }` |
| `COMPONENT_UPDATE` | Atualização de estado | `{ componentId, state, timestamp }` |
| `STATE_UPDATE` | Estado atualizado | `{ state, signedState? }` |
| `ACTION_RESPONSE` | Resposta de action | `{ success, result?, error? }` |
| `COMPONENT_PONG` | Resposta ao ping | `{ componentId, success, timestamp }` |
| `ERROR` | Erro genérico | `{ error, timestamp }` |

---

## State Persistence e Rehydration

O sistema automaticamente:

1. **Assina estado** usando chave criptográfica server-side
2. **Persiste no localStorage** quando cliente recebe updates
3. **Restaura estado** quando reconecta (se < 1 hora)
4. **Valida assinatura** para prevenir tampering

```typescript
// Fluxo de rehydration
Cliente desconecta
    ↓
Estado assinado salvo em localStorage
    ↓
Cliente reconecta
    ↓
Envia COMPONENT_REHYDRATE com estado assinado
    ↓
Servidor valida assinatura
    ↓
Se válido: restaura estado completo
Se inválido: monta componente novo
```

### Implementação Técnica

```typescript
// State signature validation (server-side)
const isValid = StateValidator.verify(signedState, secretKey)

if (isValid) {
  // Restaura estado existente
  const restoredState = StateValidator.decrypt(signedState)
  return new LiveComponent(restoredState, ws, options)
} else {
  // Cria novo componente
  return new LiveComponent(initialState, ws, options)
}
```

---

## Broadcasting

Componentes podem enviar mensagens para múltiplos clientes simultaneamente usando rooms:

```typescript
// Servidor
export class ChatComponent extends LiveComponent {
  async sendMessage(payload: { text: string }) {
    const message = { ...payload, timestamp: Date.now() }

    this.state.messages.push(message)

    // Broadcast para todos na mesma room
    if (this.room) {
      this.broadcast('NEW_MESSAGE', { message })
    }
  }
}

// Cliente
const { state } = useHybridLiveComponent(
  'ChatComponent',
  { messages: [] },
  { room: 'chat-room-123' }  // Todos com mesmo room recebem broadcasts
)
```

### Room Management

- **Rooms são strings arbitrárias**: `'chat-general'`, `'team-123'`, `'game-456'`
- **Clientes se juntam via options**: `{ room: 'room-name' }`
- **Servidor gerencia automaticamente**: connection manager mantém mapeamento room → conexões
- **Broadcasting é eficiente**: mensagem enviada uma vez, distribuída para múltiplos clientes

---

## Upload de Arquivos

Live Components suportam upload via WebSocket em chunks:

### Fluxo de Upload

```
Cliente
    ↓
FILE_UPLOAD_START { fileName, fileSize, mimeType }
    ↓
Servidor reserva upload e retorna uploadId
    ↓
FILE_UPLOAD_CHUNK { uploadId, chunkIndex, data (base64) }
    ↓
Servidor processa chunk e envia FILE_UPLOAD_PROGRESS
    ↓
Repeat até todos chunks enviados
    ↓
FILE_UPLOAD_COMPLETE { uploadId }
    ↓
Servidor valida, consolida arquivo, retorna metadados
```

### Configuração

Uploads são salvos no diretório configurado em `staticFilesPlugin`:
- **Default**: `public/uploads/`
- **URL pública**: `/api/uploads/:filename`

### Validação

```typescript
// Servidor - FileUploadManager
const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

if (fileSize > MAX_FILE_SIZE) {
  throw new Error('File too large')
}

if (!ALLOWED_TYPES.includes(mimeType)) {
  throw new Error('File type not allowed')
}
```

---

## Monitoramento e Performance

### Component Registry

O `ComponentRegistry` mantém metadados de todos componentes:

```typescript
interface ComponentMetadata {
  id: string
  name: string
  version: string
  state: any
  dependencies: string[]
  healthStatus: 'healthy' | 'degraded' | 'unhealthy'
  metrics: {
    renderCount: number
    errorCount: number
    avgRenderTime: number
    lastRenderTime: number
    createdAt: Date
    lastAccessedAt: Date
  }
}
```

### Health Checks

Executados automaticamente a cada 30s:

```typescript
// core/server/live/ComponentRegistry.ts
private async performHealthChecks() {
  for (const [componentId, metadata] of this.components) {
    const { renderCount, errorCount, avgRenderTime } = metadata.metrics

    // Marca unhealthy se:
    // - Taxa de erro > 50%
    // - Render time > 1000ms
    // - Não acessado há > 1 hora

    if (errorCount / renderCount > 0.5) {
      metadata.healthStatus = 'unhealthy'
      await this.recoverComponent(componentId)
    }
  }
}
```

### Performance Monitoring

```bash
# Dashboard de performance
GET /api/live/performance/dashboard

# Métricas de componente específico
GET /api/live/performance/components/:componentId

# Response:
{
  avgRenderTime: 45,      // ms
  avgUpdateTime: 12,      // ms
  avgMessageLatency: 8,   // ms
  totalRenders: 1234,
  totalUpdates: 5678,
  errorRate: 0.02,        // 2%
  alerts: [/* ... */],
  suggestions: [/* ... */]
}
```

---

## Connection Management

### Connection Pooling

O sistema usa pools de conexões para distribuir carga:

```typescript
// Configuração (conceitual)
const connectionManager = new ConnectionManager({
  maxConnectionsPerPool: 1000,
  poolStrategy: 'round-robin',  // ou 'least-connections'
  healthCheckInterval: 30000
})
```

### Métricas de Conexão

```bash
# Todas conexões
GET /api/live/connections

# Conexão específica
GET /api/live/connections/:connectionId

# Pool específico
GET /api/live/pools/:poolId/stats
```

---

## Boas Práticas Técnicas

### 1. Component IDs

O registry gera IDs únicos automaticamente:

```typescript
// Formato: componentName-timestamp-randomId
const componentId = `CounterComponent-1705512345678-a7b3c9d1`
```

Mantenha referências consistentes para debugging:

```typescript
// Cliente - use ID estável durante lifecycle do componente
const [componentId] = useState(`counter-${userId}`)

const { state } = useHybridLiveComponent(
  'CounterComponent',
  initialState,
  { }  // componentId gerado automaticamente
)
```

### 2. State Signature Validation

Estado é assinado com HMAC-SHA256:

```typescript
// Server-side
const signature = crypto
  .createHmac('sha256', secretKey)
  .update(JSON.stringify(state))
  .digest('hex')

const signedState = { state, signature, timestamp: Date.now() }
```

Validação previne:
- **Tampering**: Cliente não pode modificar estado offline
- **Replay attacks**: Timestamp valida idade do estado
- **Data leaks**: Assinatura vincula estado a servidor específico

### 3. Resource Sharing

Compartilhe conexões de banco de dados, cache, etc:

```typescript
// Registrar serviço global
ComponentRegistry.services.register('database', dbConnection)

// Usar em componente
export class UserComponent extends LiveComponent {
  async fetchUser(payload: { userId: string }) {
    const db = ComponentRegistry.services.get('database')
    const user = await db.users.findById(payload.userId)
    this.setState({ user })
  }
}
```

### 4. Error Handling Granular

Trate erros sem marcar componente como unhealthy:

```typescript
async riskyOperation() {
  try {
    const result = await externalAPI.call()
    this.setState({ result, error: null })
  } catch (error: any) {
    // Log error mas NÃO propaga
    console.error('Operation failed:', error)
    this.setState({ error: error.message })
    // Component continua healthy
  }
}
```

### 5. File Upload Validation

```typescript
// Server-side
async handleFileUpload(uploadId: string, chunkIndex: number, data: string) {
  const upload = this.fileUploadManager.getUpload(uploadId)

  // Validações
  if (!upload) throw new Error('Upload not found')
  if (chunkIndex !== upload.expectedChunk) throw new Error('Invalid chunk order')
  if (data.length > upload.chunkSize * 1.5) throw new Error('Chunk too large')

  // Validate base64
  if (!this.isValidBase64(data)) throw new Error('Invalid data encoding')

  // Process chunk
  await this.fileUploadManager.processChunk(uploadId, chunkIndex, data)
}
```

---

## Migração de Estado

Para evoluir componentes sem perder dados de usuários:

```typescript
// ComponentRegistry.ts
private async migrateComponentState(
  componentName: string,
  oldVersion: string,
  newVersion: string,
  state: any
): Promise<any> {
  const migrations = this.migrations.get(componentName)

  if (!migrations) return state

  let migratedState = state

  for (const migration of migrations) {
    if (migration.from === oldVersion && migration.to === newVersion) {
      migratedState = await migration.migrate(migratedState)
    }
  }

  return migratedState
}
```

### Exemplo de Migração

```typescript
// Registrar migração
ComponentRegistry.registerMigration('UserProfileComponent', {
  from: '1.0.0',
  to: '2.0.0',
  migrate: async (oldState) => {
    // v1.0.0: { name: string }
    // v2.0.0: { firstName: string, lastName: string }

    const [firstName, lastName] = oldState.name.split(' ')

    return {
      firstName,
      lastName: lastName || ''
    }
  }
})
```

---

## Arquivos de Configuração

### Static Files Plugin

Live Components herda configuração de upload do `staticFilesPlugin`:

```typescript
// core/config/server.config.ts
export const staticFilesConfig = {
  publicDir: path.join(process.cwd(), 'public'),
  uploadsDir: path.join(process.cwd(), 'public/uploads'),
  maxFileSize: 10 * 1024 * 1024,  // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain'
  ]
}
```

### WebSocket Configuration

```typescript
// core/server/live/websocket-plugin.ts
const wsConfig = {
  path: '/api/live/ws',
  compression: true,
  maxPayload: 1024 * 1024,  // 1MB
  idleTimeout: 120,          // 2 minutos
  heartbeatInterval: 30      // 30 segundos
}
```

---

## Referências

### Código Fonte
- **Server**: `core/server/live/`
- **Client**: `core/client/hooks/useHybridLiveComponent.ts`
- **Types**: `core/types/types.ts`
- **Tests**: `core/server/live/__tests__/`

### Documentação
- **Guia Prático**: [`live-components-guide.md`](./live-components-guide.md) - Exemplos práticos
- **Cheatsheet**: [`live-components-cheatsheet.md`](./live-components-cheatsheet.md) - Referência rápida
- **API Reference**: [`../../reference/live-components-api.md`](../../reference/live-components-api.md) - API completa

### Exemplos
- **Clock**: `app/server/live/LiveClockComponent.ts`
- **System Monitor**: Implementação de monitoramento em tempo real
- **Chat**: Exemplo de broadcasting e rooms

---

**Última atualização**: Janeiro 2025
