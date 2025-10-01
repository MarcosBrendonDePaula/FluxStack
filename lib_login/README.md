# Ed25519 Crypto Auth Library

Sistema de autenticação baseado em criptografia Ed25519 para aplicações web modernas.

## Características

- 🔐 **Zero-friction auth** - Sem cadastros, senhas ou emails
- ✅ **Criptografia Ed25519** - Assinatura criptográfica de todas as requisições
- 🌐 **Cross-platform** - Funciona em qualquer ambiente JavaScript
- 💾 **Stateless backend** - Não precisa de banco para autenticação
- 🎨 **Developer-friendly** - API simples e intuitiva

## Estrutura

```
lib_login/
├── client/          # Código frontend (browser)
├── server/          # Código backend (Node.js)
└── shared/          # Tipos e utilitários compartilhados
```

## Como Funciona

1. **Cliente gera** par de chaves Ed25519 automaticamente
2. **Session ID** = chave pública (64 chars hex)
3. **Todas as requisições** são assinadas com a chave privada
4. **Backend valida** a assinatura Ed25519 em cada request
5. **Admin access** via chaves públicas autorizadas

## Fluxo de Autenticação

```typescript
// 1. Inicializar sessão (client)
const auth = new CryptoAuth()
const session = await auth.initialize()

// 2. Fazer requisição autenticada
const response = await auth.fetch('/api/protected', {
  method: 'POST',
  body: JSON.stringify(data)
})

// 3. Backend valida automaticamente (server)
app.use('/api', cryptoAuthMiddleware({
  adminKeys: ['admin_key_1', 'admin_key_2']
}))
```

## Segurança

- ✅ Assinatura Ed25519 em todas as requisições
- ✅ Nonce para prevenir replay attacks  
- ✅ Validação de timestamp (5 min máximo)
- ✅ Timeout de sessões admin (30 min)
- ✅ Chaves privadas nunca saem do cliente