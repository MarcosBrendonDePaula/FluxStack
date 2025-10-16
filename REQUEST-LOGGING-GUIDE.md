# 📋 Guia do Sistema de Logging de Requests

## ✨ **Nova Feature: Request Logging Colorido**

FluxStack agora possui um sistema automático de logging de requests HTTP com cores, métricas de performance e configuração flexível.

---

## 🎯 **Formato dos Logs**

```bash
[14:32:15] GET     /api/users                     → 200 (45ms)
[14:32:16] POST    /api/users                     → 201 (123ms)
[14:32:17] DELETE  /api/users/1                   → 404 (12ms)
[14:32:18] PUT     /api/users/1                   → 500 (234ms)
```

### **Cores por Status Code:**
- 🟢 **2xx** (Sucesso) - Verde
- 🔵 **3xx** (Redirect) - Ciano
- 🟡 **4xx** (Erro do Cliente) - Amarelo
- 🔴 **5xx** (Erro do Servidor) - Vermelho (bold)

### **Cores por Método HTTP:**
- 🔵 **GET** - Azul
- 🟢 **POST** - Verde
- 🟡 **PUT** - Amarelo
- 🟣 **PATCH** - Magenta
- 🔴 **DELETE** - Vermelho

### **Cores por Duração:**
- ⚪ **< 500ms** - Cinza
- 🟡 **500-1000ms** - Amarelo (atenção)
- 🔴 **> 1000ms** - Vermelho (lento)

---

## 🚀 **Como Testar**

### **1. Inicie o servidor de desenvolvimento:**
```bash
bun run dev
```

### **2. Em outro terminal, execute o script de testes:**
```bash
bun run test:requests
```

O script fará automaticamente:
- ✅ GET requests (200, 404)
- ✅ POST requests (201)
- ✅ PUT requests (200)
- ✅ PATCH requests
- ✅ DELETE requests (200, 404)
- ✅ Stress test com múltiplas requests em paralelo

### **3. Observe os logs coloridos no terminal do servidor!**

---

## ⚙️ **Configuração**

### **Ativar/Desativar Logging**

Por padrão, o logging está **ativado**. Para desativar:

**Via variável de ambiente (.env):**
```env
ENABLE_REQUEST_LOGGING=false
```

**Via código (config/server.config.ts):**
```typescript
enableRequestLogging: config.boolean('ENABLE_REQUEST_LOGGING', true)
```

### **Nível de Log**

Controle a verbosidade dos logs:

```env
LOG_LEVEL=debug  # Mostra todos os logs
LOG_LEVEL=info   # Padrão - mostra info, warn, error
LOG_LEVEL=warn   # Apenas avisos e erros
LOG_LEVEL=error  # Apenas erros
```

---

## 📊 **Arquitetura da Implementação**

### **1. Função `logger.request()` Melhorada**
**Arquivo:** `core/utils/logger/index.ts`

```typescript
export function request(
  method: string,
  path: string,
  status?: number,
  duration?: number
): void
```

- Formata logs com cores baseadas em status/método
- Destaca requests lentos (> 500ms)
- Usa o sistema Winston do FluxStack

### **2. Hook Automático no Framework**
**Arquivo:** `core/framework/server.ts`

```typescript
private setupHooks() {
  // onRequest: Registra início da request
  this.app.onRequest(async ({ request, set }) => {
    const startTime = Date.now()
    // Armazena timing...
  })

  // onAfterHandle: Registra fim da request + logging
  this.app.onAfterHandle(async ({ request, response, set }) => {
    // Calcula duração...
    logger.request(method, path, status, duration)
  })
}
```

### **3. Configuração Declarativa**
**Arquivo:** `config/server.config.ts`

```typescript
enableRequestLogging: config.boolean('ENABLE_REQUEST_LOGGING', true)
```

---

## 🎨 **Exemplo de Output**

```bash
🔥 FluxStack v1.5.5 - Development
🌐 Server: http://localhost:3000
⚛️  Frontend: http://localhost:5173
📚 Swagger: http://localhost:3000/swagger

🔵 [14:32:15] INFO  GET     /api/health                    → 🟢 200 (12ms)
🟢 [14:32:16] INFO  POST    /api/users                     → 🟢 201 (45ms)
🔵 [14:32:17] INFO  GET     /api/users                     → 🟢 200 (23ms)
🟡 [14:32:18] INFO  PUT     /api/users/1                   → 🟢 200 (89ms)
🔴 [14:32:19] INFO  DELETE  /api/users/1                   → 🟢 200 (34ms)
🔵 [14:32:20] WARN GET     /api/users/999                 → 🟡 404 (8ms)
🟢 [14:32:21] ERROR POST   /api/invalid-route             → 🔴 500 (234ms)
```

---

## 🧪 **Script de Teste Detalhado**

O script `test-request-logging.ts` faz:

1. **12 requests individuais** testando todos os métodos HTTP
2. **5 requests em paralelo** (stress test)
3. **Exibe resumo** com estatísticas:
   - Total de requests
   - Taxa de sucesso/falha
   - Tempo médio de resposta
   - Distribuição de status codes

**Exemplo de resumo:**
```
📊 RESUMO DOS TESTES

┌─────────┬──────────────────────────────────┬────────┬──────────┐
│ Método  │ Path                             │ Status │ Duration │
├─────────┼──────────────────────────────────┼────────┼──────────┤
│ GET     │ /api/health                      │ 🟢 200 │    12ms  │
│ POST    │ /api/users                       │ 🟢 201 │    45ms  │
│ PUT     │ /api/users/1                     │ 🟡 404 │     8ms  │
│ DELETE  │ /api/users/1                     │ 🟢 200 │    34ms  │
└─────────┴──────────────────────────────────┴────────┴──────────┘

📈 Estatísticas:
   Total: 17 requests
   ✅ Sucesso: 15
   ❌ Falha: 2
   ⏱️  Tempo médio: 42ms

📊 Status Codes:
   🟢 200: 12 requests
   🟢 201: 3 requests
   🟡 404: 2 requests
```

---

## 🔧 **Customização**

### **Filtrar rotas específicas**

Para não logar certas rotas (ex: health checks em produção):

```typescript
// core/framework/server.ts
if (this.context.config.server.enableRequestLogging !== false) {
  // Adicione filtro aqui
  const excludePaths = ['/health', '/metrics']
  if (!excludePaths.includes(url.pathname)) {
    logger.request(request.method, url.pathname, status, duration)
  }
}
```

### **Adicionar métricas customizadas**

```typescript
logger.request(
  request.method,
  url.pathname,
  status,
  duration,
  { userId, userAgent, ip } // Dados extras
)
```

---

## 📁 **Arquivos Modificados**

- ✅ `core/utils/logger/index.ts` - Função `request()` com cores
- ✅ `core/framework/server.ts` - Hook automático de logging
- ✅ `config/server.config.ts` - Config `enableRequestLogging`
- ✅ `test-request-logging.ts` - Script de teste
- ✅ `package.json` - Comando `test:requests`

---

## 🎯 **Próximos Passos (Opcionais)**

- [ ] Integrar com Prometheus/Grafana para métricas
- [ ] Adicionar logging de query params/body (modo debug)
- [ ] Rate limiting baseado em logs
- [ ] Dashboard web de logs em tempo real
- [ ] Export de logs para serviços externos (DataDog, LogRocket)

---

## 🐛 **Troubleshooting**

### **Logs não aparecem:**
```bash
# Verifique se o logging está habilitado
echo $ENABLE_REQUEST_LOGGING  # Deve ser 'true' ou vazio

# Verifique o nível de log
echo $LOG_LEVEL  # Deve ser 'debug' ou 'info'
```

### **Cores não aparecem:**
```bash
# Certifique-se de estar usando um terminal com suporte a cores
# Windows: Use Windows Terminal ou ConEmu
# macOS/Linux: Terminal padrão já suporta
```

### **Performance degradada:**
```bash
# Desative logging em produção se necessário
ENABLE_REQUEST_LOGGING=false bun run start
```

---

## 📚 **Documentação Relacionada**

- [Sistema de Logger](./docs/logger.md)
- [Configuração Declarativa](./ai-context/project/configuration.md)
- [Arquitetura do Framework](./ai-context/project/architecture.md)

---

**🎉 Aproveite o novo sistema de logging!**
