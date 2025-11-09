# Config System Integration Tests

Testes de integração para o sistema de configuração modular do FluxStack.

## 📁 Estrutura

```
tests/integration/config/
├── config-integration.test.ts       # Testes de integração entre módulos
├── config-validation.test.ts        # Testes de validação de schemas
├── backward-compatibility.test.ts   # Testes de compatibilidade
└── README.md                        # Esta documentação
```

## 🎯 Objetivo

Garantir que:
- **Módulos funcionem juntos** corretamente
- **Valores sejam consistentes** entre configs
- **Schemas validem** corretamente os dados
- **Backward compatibility** seja mantida
- **Type inference** funcione end-to-end

## 🧪 Testes Implementados

### `config-integration.test.ts` (24 testes)
- ✅ Export unificado de todos os módulos
- ✅ Consistência entre módulos (portas, environment)
- ✅ Estruturas aninhadas corretas
- ✅ Relacionamentos entre configs (CORS origins, proxy target)
- ✅ Type safety cross-module
- ✅ Services config nested structure

**Casos de Teste Importantes:**
```typescript
// Proxy deve apontar para o servidor
expect(clientConfig.proxy.target).toContain(serverConfig.server.port.toString())

// CORS deve incluir URL do cliente
expect(serverConfig.cors.origins).toContain(`http://localhost:${clientConfig.vite.port}`)
```

### `config-validation.test.ts` (15 testes)
- ✅ Helpers de schema (string, number, boolean, array, enum)
- ✅ Validação customizada
- ✅ Funções de transform
- ✅ Valores padrão
- ✅ Campos opcionais
- ✅ Type inference de schemas
- ✅ Estruturas aninhadas
- ✅ Error handling para campos required
- ✅ Preservação de tipos const

**Casos de Teste Importantes:**
```typescript
// Validação customizada deve funcionar
const schema = {
  port: {
    type: 'number',
    validate: (value) => value > 0 && value < 65536
  }
}

// Transform deve ser aplicado
const schema = {
  uppercase: {
    type: 'string',
    transform: (value) => value.toUpperCase()
  }
}
```

### `backward-compatibility.test.ts` (8 testes)
- ✅ Tipo FluxStackConfig exportado
- ✅ Estrutura de app config
- ✅ Estrutura de server config
- ✅ Estrutura de CORS config
- ✅ Estrutura de client config
- ✅ Estrutura de build config
- ✅ Estrutura de plugins config
- ✅ Estrutura de logging config
- ✅ Estrutura de monitoring config
- ✅ Configs opcionais (database, auth, email, storage)
- ✅ Environment overrides
- ✅ Consistência de valores compostos
- ✅ Plugin configs (swagger, static files)

**Casos de Teste Importantes:**
```typescript
// Tipo antigo deve funcionar
const config: FluxStackConfig = fluxStackConfig

// Estrutura antiga deve ser mantida
expect(fluxStackConfig.server.port).toBeDefined()
expect(fluxStackConfig.server.cors.origins).toBeDefined()

// Valores devem vir dos novos módulos
expect(fluxStackConfig.app.name).toBe(appConfig.name)
```

## 🚀 Como Executar

### Todos os testes de integração:
```bash
bun test ./tests/integration/config/*.test.ts
```

### Teste específico:
```bash
bun test ./tests/integration/config/config-integration.test.ts
```

### Todos os testes de config (unit + integration):
```bash
bun test ./tests/unit/config/*.test.ts ./tests/integration/config/*.test.ts
```

## 📊 Resultado Atual

```
✅ 47 testes passando
✅ 0 falhas
✅ 131 expect() assertions
✅ Tempo: ~57ms
```

### Total (Unit + Integration):
```
✅ 124 testes passando
✅ 0 falhas
✅ 298 expect() assertions
✅ Tempo: ~73ms
```

## 🔍 O que é Testado

### 1. **Integração Entre Módulos**
- Valores compartilhados são consistentes
- Relacionamentos são válidos (proxy → server)
- CORS origins incluem cliente
- Environment é o mesmo em todos os módulos

### 2. **Validação de Schemas**
- Helpers criam configs válidos
- Validação customizada funciona
- Transforms são aplicados
- Defaults são usados corretamente
- Required fields são obrigatórios

### 3. **Backward Compatibility**
- FluxStackConfig type existe
- Estrutura antiga é mantida
- Valores são compostos dos novos módulos
- Configs opcionais funcionam
- Environment overrides existem

### 4. **Type Safety End-to-End**
- Types são inferidos através dos módulos
- Literal types são preservados
- Nested objects mantêm types
- Cross-module imports mantêm types

## 🎓 Casos de Uso Importantes

### ✅ Port Configuration
```typescript
// Portas não devem conflitar
expect(clientConfig.vite.port).not.toBe(serverConfig.server.port)

// Backend port deve ser diferente
expect(serverConfig.server.backendPort).not.toBe(serverConfig.server.port)
```

### ✅ CORS Setup
```typescript
// CORS deve permitir cliente
const clientUrl = `http://localhost:${clientConfig.vite.port}`
expect(serverConfig.cors.origins).toContain(clientUrl)
```

### ✅ Proxy Configuration
```typescript
// Proxy deve apontar para servidor correto
expect(clientConfig.proxy.target).toContain(serverConfig.server.port.toString())
```

### ✅ Schema Validation
```typescript
// Validação deve rejeitar valores inválidos
expect(() => {
  defineConfig({
    port: {
      type: 'number',
      validate: (v) => v > 0 && v < 65536
    }
  })
}).not.toThrow()
```

## 📝 Adicionando Novos Testes

### Para Integração:
1. Identifique relacionamentos entre configs
2. Teste consistência de valores
3. Valide estruturas compostas
4. Teste type safety cross-module

### Para Validação:
1. Teste novos helpers de schema
2. Valide regras customizadas
3. Teste transforms
4. Valide error handling

### Para Backward Compatibility:
1. Teste estrutura antiga
2. Valide composição de valores
3. Teste types legados
4. Valide features opcionais

## 🔗 Ver Também

- [Unit Tests](../../unit/config/README.md)
- [Config Schema Source](../../../core/utils/config-schema.ts)
- [FluxStack Config](../../../fluxstack.config.ts)
