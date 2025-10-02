# FluxStack Crypto Auth Plugin

Plugin de autenticação criptográfica baseado em Ed25519 para FluxStack.

## Características

- 🔐 **Zero-friction auth** - Sem cadastros, senhas ou emails
- ✅ **Criptografia Ed25519** - Assinatura criptográfica de todas as requisições
- 🌐 **Cross-platform** - Funciona em qualquer ambiente JavaScript
- 💾 **Stateless backend** - Não precisa de banco para autenticação
- 🎨 **Componentes React** - Componentes prontos para uso
- ⚡ **Integração FluxStack** - Plugin nativo do FluxStack

## Instalação

```bash
# O plugin já está incluído na pasta plugins/
# Apenas habilite no fluxstack.config.ts
```

## Configuração

No seu `fluxstack.config.ts`:

```typescript
export const config: FluxStackConfig = {
  // ... outras configurações
  
  plugins: {
    enabled: ['crypto-auth'],
    config: {
      'crypto-auth': {
        enabled: true,
        sessionTimeout: 1800000, // 30 minutos
        maxTimeDrift: 300000, // 5 minutos
        adminKeys: [
          'sua_chave_publica_admin_aqui'
        ],
        protectedRoutes: [
          '/api/admin/*',
          '/api/protected/*'
        ],
        publicRoutes: [
          '/api/auth/*',
          '/api/health',
          '/api/docs'
        ],
        enableMetrics: true
      }
    }
  }
}
```

## Uso no Frontend

### 1. Configurar o Provider

```tsx
import React from 'react'
import { AuthProvider } from '@/plugins/crypto-auth/client'

function App() {
  return (
    <AuthProvider
      config={{
        apiBaseUrl: 'http://localhost:3000',
        storage: 'localStorage'
      }}
      onAuthChange={(isAuth, session) => {
        console.log('Auth changed:', isAuth, session)
      }}
    >
      <YourApp />
    </AuthProvider>
  )
}
```

### 2. Usar o Hook de Autenticação

```tsx
import React from 'react'
import { useAuth } from '@/plugins/crypto-auth/client'

function Dashboard() {
  const { 
    isAuthenticated, 
    isAdmin, 
    permissions, 
    login, 
    logout,
    client 
  } = useAuth()

  const handleApiCall = async () => {
    try {
      const response = await client.fetch('/api/protected/data')
      const data = await response.json()
      console.log(data)
    } catch (error) {
      console.error('Erro na API:', error)
    }
  }

  if (!isAuthenticated) {
    return <button onClick={login}>Entrar</button>
  }

  return (
    <div>
      <h1>Dashboard {isAdmin && '(Admin)'}</h1>
      <p>Permissões: {permissions.join(', ')}</p>
      <button onClick={handleApiCall}>Chamar API</button>
      <button onClick={logout}>Sair</button>
    </div>
  )
}
```

### 3. Componentes Prontos

```tsx
import React from 'react'
import { 
  LoginButton, 
  ProtectedRoute, 
  SessionInfo 
} from '@/plugins/crypto-auth/client'

function MyApp() {
  return (
    <div>
      {/* Botão de login/logout */}
      <LoginButton 
        onLogin={(session) => console.log('Logado:', session)}
        onLogout={() => console.log('Deslogado')}
        showPermissions={true}
      />

      {/* Rota protegida */}
      <ProtectedRoute requireAdmin={true}>
        <AdminPanel />
      </ProtectedRoute>

      {/* Informações da sessão */}
      <SessionInfo 
        showPrivateKey={false}
        compact={true}
      />
    </div>
  )
}
```

### 4. HOC para Proteção

```tsx
import { withAuth } from '@/plugins/crypto-auth/client'

const AdminComponent = () => <div>Área Admin</div>

// Proteger componente
const ProtectedAdmin = withAuth(AdminComponent, {
  requireAdmin: true,
  requiredPermissions: ['admin']
})
```

## Uso no Backend

O plugin automaticamente:

- Registra rotas de autenticação em `/api/auth/*`
- Aplica middleware de autenticação nas rotas protegidas
- Valida assinaturas Ed25519 em cada requisição
- Gerencia sessões em memória

### Rotas Automáticas

- `POST /api/auth/session/init` - Inicializar sessão
- `POST /api/auth/session/validate` - Validar sessão
- `GET /api/auth/session/info` - Informações da sessão
- `POST /api/auth/session/logout` - Encerrar sessão

### Acessar Usuário nas Rotas

```typescript
// Em suas rotas FluxStack
app.get('/api/protected/data', ({ user }) => {
  // user estará disponível se autenticado
  if (!user) {
    return { error: 'Não autenticado' }
  }
  
  return {
    message: 'Dados protegidos',
    user: {
      sessionId: user.sessionId,
      isAdmin: user.isAdmin,
      permissions: user.permissions
    }
  }
})
```

## Como Funciona

1. **Cliente gera** par de chaves Ed25519 automaticamente
2. **Session ID** = chave pública (64 chars hex)
3. **Todas as requisições** são assinadas com a chave privada
4. **Backend valida** a assinatura Ed25519 em cada request
5. **Admin access** via chaves públicas autorizadas

## Segurança

- ✅ Assinatura Ed25519 em todas as requisições
- ✅ Nonce para prevenir replay attacks  
- ✅ Validação de timestamp (5 min máximo)
- ✅ Timeout de sessões (30 min padrão)
- ✅ Chaves privadas nunca saem do cliente
- ✅ Stateless - sem dependência de banco de dados

## Desenvolvimento

Para desenvolver o plugin:

```bash
# Instalar dependências
npm install @noble/curves @noble/hashes

# Para desenvolvimento com React
npm install --save-dev @types/react react
```

## Licença

MIT