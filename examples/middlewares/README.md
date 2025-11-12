# 🔧 FluxStack Middleware Examples

Este diretório contém **exemplos de implementação de middlewares** para FluxStack.

## ⚠️ Importante

Estes middlewares são **apenas para demonstração e aprendizado**. Eles **não estão sendo usados** no aplicativo principal.

## 📁 Middlewares Disponíveis

### 1. **auth.ts** - Autenticação JWT (Mock)
```typescript
import { authMiddleware, requireRole } from './auth'

// Exemplo de uso
app.use(authMiddleware())
app.use(requireRole(['admin']))
```
**Status:** Mock implementation - substituído pelo plugin `crypto-auth`

### 2. **validation.ts** - Validação de Request
```typescript
import { validationMiddleware, commonSchemas } from './validation'

// Exemplo de uso
app.post('/users', validationMiddleware(commonSchemas.createUser), handler)
```
**Status:** Elysia já possui validação nativa via TypeBox

### 3. **rateLimit.ts** - Rate Limiting
```typescript
import { rateLimitMiddleware, rateLimitConfigs } from './rateLimit'

// Exemplo de uso
app.use(rateLimitMiddleware(rateLimitConfigs.strict))
```
**Status:** In-memory store - não adequado para produção

### 4. **requestLogging.ts** - Request Logging
```typescript
import { requestLoggingMiddleware, requestLoggingConfigs } from './requestLogging'

// Exemplo de uso
app.use(requestLoggingMiddleware(requestLoggingConfigs.detailed))
```
**Status:** Framework já possui sistema de logging integrado

### 5. **errorHandling.ts** - Error Handling
```typescript
import { errorHandlingMiddleware } from './errorHandling'

// Exemplo de uso
app.onError(errorHandlingMiddleware())
```
**Status:** Core já possui error handling integrado

## 🎯 Como Usar Estes Exemplos

1. **Copie** o middleware desejado para `app/server/middleware/`
2. **Adapte** para suas necessidades específicas
3. **Aplique** nas suas rotas em `app/server/routes/`
4. **Teste** com `bun run dev`

## 🚀 Exemplo de Aplicação

```typescript
// app/server/routes/users.routes.ts
import { authMiddleware } from '@/app/server/middleware/auth'
import { rateLimitMiddleware } from '@/app/server/middleware/rateLimit'

export const usersRoutes = (app: Elysia) =>
  app
    .use(authMiddleware())
    .use(rateLimitMiddleware({ limit: 100 }))
    .get('/users', async ({ user }) => {
      return { user }
    })
```

## 📚 Referências

- [Elysia Middleware Docs](https://elysiajs.com/essential/middleware.html)
- [FluxStack Architecture](../../ai-context/project/architecture.md)
- [Development Patterns](../../ai-context/development/patterns.md)

---

**Nota:** Para produção, considere usar plugins oficiais do Elysia ou implementações battle-tested como `@elysiajs/jwt`, `@elysiajs/rate-limit`, etc.
