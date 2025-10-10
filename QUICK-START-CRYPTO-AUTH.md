# ⚡ Quick Start: Crypto-Auth em 5 Minutos

## 🎯 Como Criar uma Rota Protegida

### 🚀 Opção 1: CLI (Recomendado)

Use o comando `make:protected-route` para gerar rotas automaticamente:

```bash
# Rota com autenticação obrigatória (padrão)
bun flux make:protected-route users

# Rota apenas para admins
bun flux make:protected-route admin-panel --auth admin

# Rota com autenticação opcional
bun flux make:protected-route blog --auth optional

# Rota pública (sem auth)
bun flux make:protected-route public-api --auth public
```

O comando cria automaticamente:
- ✅ Arquivo de rotas em `app/server/routes/[nome].routes.ts`
- ✅ Middlewares de autenticação configurados
- ✅ Templates de CRUD completos
- ✅ Exemplos de uso de `getCryptoAuthUser()`

**Tipos de `--auth` disponíveis:**
- `required` - Autenticação obrigatória (padrão)
- `admin` - Apenas administradores
- `optional` - Auth opcional (rota pública com conteúdo extra para autenticados)
- `public` - Completamente pública (sem middleware)

---

### ⚙️ Opção 2: Manual

#### 1️⃣ Criar Arquivo de Rotas

```typescript
// app/server/routes/minhas-rotas.routes.ts
import { Elysia } from 'elysia'
import { cryptoAuthRequired, getCryptoAuthUser } from '@/plugins/crypto-auth/server'

export const minhasRotas = new Elysia({ prefix: '/minhas-rotas' })

  // Rota pública
  .get('/publica', () => ({ message: 'Todos podem ver' }))

  // Rota protegida
  .guard({}, (app) =>
    app.use(cryptoAuthRequired())
      .get('/protegida', ({ request }) => {
        const user = getCryptoAuthUser(request)!
        return {
          message: 'Área restrita',
          user: user.publicKey.substring(0, 8) + '...'
        }
      })
  )
```

#### 2️⃣ Registrar no Router

```typescript
// app/server/routes/index.ts
import { minhasRotas } from './minhas-rotas.routes'

export const apiRoutes = new Elysia({ prefix: '/api' })
  .use(minhasRotas)  // ✅ Adicionar aqui
```

#### 3️⃣ Testar

```bash
# Pública (funciona)
curl http://localhost:3000/api/minhas-rotas/publica
# ✅ {"message": "Todos podem ver"}

# Protegida (sem auth)
curl http://localhost:3000/api/minhas-rotas/protegida
# ❌ {"error": {"message": "Authentication required", "code": "CRYPTO_AUTH_REQUIRED", "statusCode": 401}}
```

## 🔐 Tipos de Middleware

### `cryptoAuthRequired()` - Autenticação Obrigatória
```typescript
.guard({}, (app) =>
  app.use(cryptoAuthRequired())
    .get('/protegida', ({ request }) => {
      const user = getCryptoAuthUser(request)!  // ✅ Sempre existe
      return { user }
    })
)
```

### `cryptoAuthAdmin()` - Apenas Administradores
```typescript
.guard({}, (app) =>
  app.use(cryptoAuthAdmin())
    .delete('/deletar/:id', ({ request, params }) => {
      const user = getCryptoAuthUser(request)!  // ✅ Sempre admin
      return { message: `${params.id} deletado` }
    })
)
```

### `cryptoAuthOptional()` - Autenticação Opcional
```typescript
.guard({}, (app) =>
  app.use(cryptoAuthOptional())
    .get('/feed', ({ request }) => {
      const user = getCryptoAuthUser(request)  // ⚠️ Pode ser null

      if (user) {
        return { message: 'Feed personalizado', user }
      }
      return { message: 'Feed público' }
    })
)
```

### `cryptoAuthPermissions([...])` - Permissões Específicas
```typescript
.guard({}, (app) =>
  app.use(cryptoAuthPermissions(['write', 'delete']))
    .put('/editar/:id', ({ request }) => {
      const user = getCryptoAuthUser(request)!  // ✅ Tem as permissões
      return { message: 'Editado' }
    })
)
```

## 📊 Exemplo Real Funcionando

Veja o arquivo criado: **`app/server/routes/exemplo-posts.routes.ts`**

Rotas disponíveis:
- ✅ `GET /api/exemplo-posts` - Pública
- ✅ `GET /api/exemplo-posts/:id` - Auth opcional
- ✅ `GET /api/exemplo-posts/meus-posts` - Protegida
- ✅ `POST /api/exemplo-posts/criar` - Protegida
- ✅ `GET /api/exemplo-posts/admin/todos` - Admin
- ✅ `DELETE /api/exemplo-posts/admin/:id` - Admin

## 🧪 Testando Agora

```bash
# Pública
curl http://localhost:3000/api/exemplo-posts
# ✅ {"success":true,"posts":[...]}

# Auth opcional (sem auth)
curl http://localhost:3000/api/exemplo-posts/1
# ✅ {"success":true,"post":{"premiumContent":null,"viewer":"Visitante anônimo"}}

# Protegida (sem auth)
curl http://localhost:3000/api/exemplo-posts/meus-posts
# ❌ {"error":{"message":"Authentication required"}}

# Admin (sem auth)
curl http://localhost:3000/api/exemplo-posts/admin/todos
# ❌ {"error":{"message":"Authentication required"}}
```

## 🔑 Helpers Úteis

```typescript
import {
  getCryptoAuthUser,
  isCryptoAuthAuthenticated,
  isCryptoAuthAdmin,
  hasCryptoAuthPermission
} from '@/plugins/crypto-auth/server'

({ request }) => {
  const user = getCryptoAuthUser(request)  // User | null
  const isAuth = isCryptoAuthAuthenticated(request)  // boolean
  const isAdmin = isCryptoAuthAdmin(request)  // boolean
  const canDelete = hasCryptoAuthPermission(request, 'delete')  // boolean
}
```

## ⚠️ Importante

### ✅ Fazer
```typescript
// Isolar middlewares com .guard({})
.guard({}, (app) =>
  app.use(cryptoAuthRequired())
    .get('/protected', () => {})
)

// Verificar null em auth opcional
.guard({}, (app) =>
  app.use(cryptoAuthOptional())
    .get('/feed', ({ request }) => {
      const user = getCryptoAuthUser(request)
      if (user) { /* autenticado */ }
    })
)
```

### ❌ Não Fazer
```typescript
// ❌ Usar .use() sem .guard() (afeta TODAS as rotas seguintes)
export const myRoutes = new Elysia()
  .use(cryptoAuthRequired())  // ❌ ERRADO
  .get('/publica', () => {})  // Esta rota ficará protegida!
```

## 📚 Documentação Completa

- **Guia Detalhado**: `EXEMPLO-ROTA-PROTEGIDA.md`
- **Referência de Middlewares**: `CRYPTO-AUTH-MIDDLEWARE-GUIDE.md`

---

**Pronto!** Agora você pode criar rotas protegidas em minutos. 🚀
