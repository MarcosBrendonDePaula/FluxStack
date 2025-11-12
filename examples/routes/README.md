# 🛣️ FluxStack Route Examples

Este diretório contém **exemplos de implementação de rotas** para FluxStack.

## 📁 Rotas Disponíveis

### **example-with-crypto-auth.routes.ts**
Exemplos completos de uso do plugin **crypto-auth** com diferentes níveis de autorização.

#### Rotas Implementadas:

1. **protectedRoutes** - Rotas que requerem autenticação
   - `GET /api/protected/profile`
   - `POST /api/protected/settings`

2. **adminRoutes** - Rotas restritas a administradores
   - `GET /api/admin/users`
   - `DELETE /api/admin/users/:id`

3. **writeRoutes** - Rotas que requerem permissão de escrita
   - `POST /api/write/documents`
   - `PUT /api/write/documents/:id`

4. **mixedRoutes** - Rotas com diferentes níveis de acesso
   - `GET /api/mixed/public` (público)
   - `GET /api/mixed/private` (protegido)

5. **customRoutes** - Rotas com validação customizada
   - `GET /api/custom/advanced`

## 🎯 Como Usar Este Exemplo

### 1. Copiar para o Projeto

```bash
cp examples/routes/example-with-crypto-auth.routes.ts app/server/routes/
```

### 2. Registrar as Rotas

```typescript
// app/server/index.ts
import { allExampleRoutes } from './routes/example-with-crypto-auth.routes'

const app = new Elysia()
  .use(cryptoAuth(cryptoAuthConfig))
  .use(allExampleRoutes)
```

### 3. Testar com Cliente

```typescript
// Frontend
import { treaty } from '@elysiajs/eden'
import type { App } from '@/app/server/app'

const api = treaty<App>('http://localhost:3000')

// Acessar rota protegida
const { data } = await api.protected.profile.get({
  headers: {
    'X-Public-Key': userPublicKey,
    'X-Signature': signature,
    'X-Timestamp': timestamp
  }
})
```

## 🔐 Sistema de Autenticação Criptográfica

O crypto-auth usa **assinatura de curva elíptica (Ed25519)** para autenticação:

1. **Cliente gera par de chaves**: pública + privada
2. **Cliente assina requisição**: `sign(timestamp + publicKey)`
3. **Servidor valida**: verifica assinatura com chave pública
4. **Autorização**: valida roles e permissions no token

### Exemplo de Assinatura (Cliente)

```typescript
import { ed25519 } from '@noble/curves/ed25519'
import { sha256 } from '@noble/hashes/sha256'

// Gerar par de chaves
const privateKey = ed25519.utils.randomPrivateKey()
const publicKey = ed25519.getPublicKey(privateKey)

// Assinar requisição
const timestamp = Date.now().toString()
const message = timestamp + Buffer.from(publicKey).toString('hex')
const signature = ed25519.sign(sha256(message), privateKey)

// Headers da requisição
const headers = {
  'X-Public-Key': Buffer.from(publicKey).toString('hex'),
  'X-Signature': Buffer.from(signature).toString('hex'),
  'X-Timestamp': timestamp
}
```

## 📚 Níveis de Autorização

### 1. **requireAuth** - Apenas autenticação
```typescript
.get('/profile', { requireAuth: true })
```

### 2. **requireRoles** - Roles específicas
```typescript
.get('/admin', {
  requireAuth: true,
  requireRoles: ['admin']
})
```

### 3. **requirePermissions** - Permissões específicas
```typescript
.post('/documents', {
  requireAuth: true,
  requirePermissions: ['write']
})
```

### 4. **customValidation** - Validação customizada
```typescript
.get('/advanced', {
  requireAuth: true,
  customValidation: (user) => {
    return user.isEmailVerified && user.roles.includes('premium')
  }
})
```

## 🚀 Boas Práticas

1. **Sempre use HTTPS em produção** - Ed25519 é seguro, mas headers podem ser interceptados
2. **Implemente refresh de chaves** - Rotacione chaves periodicamente
3. **Valide timestamps** - Previne replay attacks
4. **Log tentativas de acesso** - Monitore acessos não autorizados
5. **Use rate limiting** - Combine com middleware de rate limit

## 📖 Referências

- [Plugin crypto-auth](../../plugins/crypto-auth/README.md)
- [Elysia Security](https://elysiajs.com/plugins/security)
- [Ed25519 (@noble/curves)](https://github.com/paulmillr/noble-curves)
- [Development Patterns](../../ai-context/development/patterns.md)

---

**Nota:** Este é um exemplo educacional. Para produção, considere adicionar:
- Key rotation automática
- Rate limiting integrado
- Logging de auditoria
- Token revocation
- MFA (Multi-Factor Authentication)
