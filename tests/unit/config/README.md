# Config System Unit Tests

Testes unitários para o sistema de configuração modular do FluxStack.

## 📁 Estrutura

```
tests/unit/config/
├── app.config.test.ts         # Testes para config/app.config.ts
├── server.config.test.ts      # Testes para config/server.config.ts (nested)
├── client.config.test.ts      # Testes para config/client.config.ts (nested)
├── plugins.config.test.ts     # Testes para config/plugins.config.ts
├── monitoring.config.test.ts  # Testes para config/monitoring.config.ts (nested)
└── README.md                  # Esta documentação
```

## 🎯 Objetivo

Garantir que cada módulo de configuração:
- **Carregue corretamente** os valores das variáveis de ambiente
- **Valide** os tipos e valores
- **Preserve** type safety e inferência automática
- **Mantenha** estrutura aninhada correta (para configs nested)
- **Forneça** valores padrão adequados

## 🧪 Testes Implementados

### `app.config.test.ts` (12 testes)
- ✅ Propriedades básicas (name, version, description)
- ✅ Configurações de ambiente (env, debug)
- ✅ Feature flags (swagger, metrics, monitoring)
- ✅ Configurações de segurança (trustProxy, sessionSecret)
- ✅ Type safety e literal types

### `server.config.test.ts` (17 testes)
- ✅ Estrutura aninhada (server, cors)
- ✅ Configurações do servidor (port, host, apiPrefix)
- ✅ Configurações CORS (origins, methods, headers)
- ✅ Validação de portas e métodos HTTP
- ✅ Type safety para objetos aninhados

### `client.config.test.ts` (21 testes)
- ✅ Estrutura aninhada (vite, proxy, build)
- ✅ Configurações Vite (port, host, flags)
- ✅ Configurações de proxy (target, changeOrigin, ws)
- ✅ Configurações de build (outDir, sourceMaps, minify)
- ✅ Validação de URLs e números positivos

### `plugins.config.test.ts` (15 testes)
- ✅ Gerenciamento de plugins (enabled, disabled, autoDiscover)
- ✅ Configurações Swagger (title, version, path)
- ✅ Configurações Static Files (directories, cache)
- ✅ Flags de plugins individuais
- ✅ Validação de arrays e paths

### `monitoring.config.test.ts` (12 testes)
- ✅ Estrutura aninhada (monitoring, metrics, profiling)
- ✅ Configurações de monitoring (enabled, exporters, health checks)
- ✅ Configurações de métricas (intervals, tipos, exporters)
- ✅ Configurações de profiling (sampleRate, tipos, output)
- ✅ Validação de ranges (0-1 para sampleRate)

## 🚀 Como Executar

### Todos os testes unitários:
```bash
bun test ./tests/unit/config/*.test.ts
```

### Teste específico:
```bash
bun test ./tests/unit/config/app.config.test.ts
```

### Com coverage:
```bash
bun test --coverage ./tests/unit/config/*.test.ts
```

## 📊 Resultado Atual

```
✅ 77 testes passando
✅ 0 falhas
✅ 167 expect() assertions
✅ Tempo: ~54ms
```

## 🔍 O que é Testado

### 1. **Tipos e Valores**
- Cada propriedade tem o tipo correto (string, number, boolean, array)
- Valores estão dentro de ranges válidos
- Enums contêm apenas valores permitidos

### 2. **Validação**
- Portas estão entre 1-65535
- URLs são válidas
- Paths começam com `/`
- Semver é válido (x.y.z)

### 3. **Estruturas Aninhadas**
- Objetos nested existem (server.server, server.cors)
- Propriedades aninhadas são acessíveis
- Types são inferidos corretamente

### 4. **Type Safety**
- Literal types preservados (`'development' | 'production' | 'test'`)
- Inferência automática funcionando
- Nenhum tipo `any` ou `unknown`

## 🎓 Boas Práticas

1. **Cada teste é independente** - Não há dependências entre testes
2. **Testes são rápidos** - ~54ms para toda a suite
3. **Mensagens claras** - Descrições explicam o que está sendo testado
4. **Cobertura completa** - Todos os módulos principais testados
5. **Type safety** - Testes validam tipos em compile-time e runtime

## 📝 Adicionando Novos Testes

Ao adicionar um novo módulo de config:

1. Crie um arquivo `nome.config.test.ts`
2. Teste a estrutura básica
3. Teste propriedades aninhadas (se houver)
4. Teste validações específicas
5. Teste type safety
6. Execute a suite completa

Exemplo:
```typescript
import { describe, it, expect } from 'vitest'
import { novaConfig } from '@/config/nova.config'

describe('Nova Configuration', () => {
  it('should have required properties', () => {
    expect(novaConfig.propriedade).toBeDefined()
    expect(typeof novaConfig.propriedade).toBe('string')
  })
})
```

## 🔗 Ver Também

- [Integration Tests](../../integration/config/README.md)
- [Config Schema Documentation](../../../config/README.md)
