# Demo do Plugin Crypto Auth

Este exemplo demonstra como usar o plugin de autenticação criptográfica do FluxStack.

## Como executar

1. Certifique-se de que o plugin está habilitado no `fluxstack.config.ts`:

```typescript
plugins: {
  enabled: ['crypto-auth'],
  config: {
    'crypto-auth': {
      enabled: true,
      adminKeys: ['sua_chave_publica_admin_aqui'] // opcional
    }
  }
}
```

2. Execute o FluxStack:

```bash
npm run dev
```

3. Acesse `http://localhost:5173` para ver a demo

## Funcionalidades demonstradas

- ✅ Login automático sem senhas
- ✅ Componentes React prontos
- ✅ Proteção de rotas
- ✅ Chamadas de API autenticadas
- ✅ Área administrativa
- ✅ Informações da sessão

## Testando como Admin

Para testar funcionalidades de admin:

1. Faça login normalmente
2. Copie sua chave pública (Session ID) das informações da sessão
3. Adicione a chave no `fluxstack.config.ts`:

```typescript
'crypto-auth': {
  adminKeys: ['sua_chave_publica_copiada_aqui']
}
```

4. Reinicie o servidor
5. Faça login novamente - agora você será admin!

## Estrutura do código

- `App.tsx` - Componente principal com todas as demonstrações
- Usa todos os componentes do plugin: `AuthProvider`, `LoginButton`, `ProtectedRoute`, `SessionInfo`
- Demonstra chamadas de API autenticadas
- Mostra diferenças entre usuário comum e admin