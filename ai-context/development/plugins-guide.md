# Guia de Plugins – FluxStack (v1.8)

## 1. Panorama
FluxStack executa um pipeline de plugins composto por `PluginRegistry` + `PluginManager`, inicializado automaticamente pelo `FluxStackFramework`. Há três origens principais:

1. **Built-in** (`core/plugins/built-in`) – swagger, vite, static, monitoring.
2. **Exports auxiliares** (`core/server/index.ts`) – `staticFilesPlugin`, `liveComponentsPlugin`.
3. **Plugins locais** (`plugins/<nome>`), como `plugins/crypto-auth`.

A lista ativa é filtrada por `fluxstack.config.ts` (`plugins.enabled` / `plugins.disabled`) e pode ser complementada via `app.use(...)` no bootstrap.

---

## 2. Interface de Plugin
Tipo base (`core/plugins/types.ts`):

```ts
export interface Plugin {
  name: string
  version?: string
  description?: string
  author?: string
  dependencies?: string[]
  priority?: number | 'highest' | 'high' | 'normal' | 'low' | 'lowest'
  category?: string
  tags?: string[]

  plugin?: Elysia                        // opcional: expõe rotas/middlewares

  // Hooks de lifecycle
  setup?: (ctx: PluginContext) => Awaitable<void>
  onServerStart?: (ctx: PluginContext) => Awaitable<void>
  onServerStop?: (ctx: PluginContext) => Awaitable<void>
  onRequest?: (ctx: RequestContext) => Awaitable<void>
  onBeforeRoute?: (ctx: RequestContext) => Awaitable<Response | void>
  onResponse?: (ctx: ResponseContext) => Awaitable<void>
  onError?: (ctx: ErrorContext) => Awaitable<void>
  onBuild?: (ctx: BuildContext) => Awaitable<void>
  onBuildComplete?: (ctx: BuildContext) => Awaitable<void>

  // Configuração (deprecated - use config/ folder)
  configSchema?: PluginConfigSchema      // ⚠️ deprecated
  defaultConfig?: unknown                 // ⚠️ deprecated

  // CLI
  commands?: CliCommand[]
}
```

### Cronograma dos Hooks
| Fase              | Descrição                                                                 |
|-------------------|---------------------------------------------------------------------------|
| **discover**      | `PluginRegistry.discoverPlugins` percorre `plugins/` (e built-in).        |
| **setup**         | Executado durante `PluginManager.initialize()` antes das rotas da app.    |
| **plugin**        | Se `plugin` (Elysia) estiver definido, é montado (`app.use`) no framework.|
| **onServerStart** | Chamado após `app.listen`, quando o servidor está pronto.                 |
| **onBeforeRoute** | Antes de executar a rota. Pode encerrar a requisição retornando `Response`.|
| **onRequest**     | Após receber a requisição (útil para logging/métricas).                   |
| **onResponse**    | Após enviar a resposta.                                                   |
| **onError**       | Durante o tratamento de erro central.                                     |
| **onBuild**       | Dentro de `FluxStackBuilder.build()` antes do bundling.                   |
| **onBuildComplete** | Após a otimização/manifesto.                                           |
| **onServerStop**  | No shutdown graceful (`SIGTERM`/`SIGINT` ou `framework.stop()`).          |

Hooks respeitam a `loadOrder` calculada a partir de dependências + `priority`. O shutdown roda na ordem inversa.

---

## 3. PluginContext e PluginUtils
`PluginContext` contém:
- `config`: instância completa de `FluxStackConfig` (mesmo objeto lido em `fluxstack.config.ts`). Ex.: `context.config.staticFiles`, `context.config.plugins.config.myPlugin`.
- `logger`: logger Winston configurado (métodos `debug/info/warn/error`, `child`, `time`, `request`).
- `app`: instância Elysia para registrar rotas ou middlewares.
- `utils`: utilitários fornecidos por `createPluginUtils`:
  - `createTimer(label)` → `{ end(): number }`
  - `formatBytes(bytes)`
  - `isProduction()`, `isDevelopment()`, `getEnvironment()`
  - `createHash(data)`
  - `deepMerge(target, source)`
  - `validateSchema(data, schema)`

Outros hooks recebem contextos especializados (`RequestContext`, `ResponseContext`, `ErrorContext`, `BuildContext`) com informações adicionais (headers, status, duração, etc.).

---

## 4. Ordem de Carga, Dependências e Prioridades
- **Dependências**: liste em `dependencies` os plugins que precisam ser carregados antes (ex.: `['static-files']`). Se não forem encontrados, o registry lança `PLUGIN_DEPENDENCY_ERROR`.
- **Prioridade**: número ou palavra-chave. Valores maiores executam antes dentro do mesmo nível de dependência.
- **Config Enable/Disable**: `FLUXSTACK_PLUGINS_ENABLED` / `FLUXSTACK_PLUGINS_DISABLED` (variáveis) adicionam/removem nomes explicitamente. Default inclui `"logger"` apenas por compatibilidade (não afeta o logger core).
- `pluginRegistry.getLoadOrder()` combina essas informações para definir a sequência usada pelo `FluxStackFramework`.

---

## 5. Descoberta e Estrutura de Diretórios
- **Local padrão**: `plugins/<nome>/index.ts` (ou `plugin.ts`). Qualquer pasta com esse arquivo é detectada.
- **Manifesto opcional**: `plugin.json` pode fornecer metadados extras (versão, hooks suportados, palavras-chave).
- **Built-in**: exportados de `core/plugins/built-in`. Não precisam estar em `plugins.enabled`.
- **CLI Discovery**: `core/cli/plugin-discovery.ts` registra comandos declarados em `plugin.commands`.
- **Resolução de módulos**: `PluginModuleResolver` procura dependências primeiro no `node_modules` do plugin, depois no projeto raiz.

Estrutura mínima:
```
plugins/
└── my-plugin/
    ├── index.ts         # exporta FluxStack.Plugin
    ├── package.json     # (opcional) dependências específicas
    └── README.md        # documentação do plugin
```

---

## 6. Configuração Declarativa

### 6.1. Sistema Recomendado (config/ folder)
**✅ Nova estrutura:** Cada plugin deve ter uma pasta `config/` com arquivos TypeScript usando `defineConfig()`.

```
plugins/
└── my-plugin/
    ├── config/
    │   └── index.ts       # Configuração declarativa
    ├── index.ts           # Plugin principal
    └── server/            # Código do plugin
```

**Exemplo de configuração type-safe:**

```ts
// plugins/my-plugin/config/index.ts
import { defineConfig, config } from '@/core/utils/config-schema'

const myPluginConfigSchema = {
  enabled: config.boolean('MY_PLUGIN_ENABLED', true),
  endpoint: config.string('MY_PLUGIN_ENDPOINT', '', true), // required
  sampleRate: config.number('MY_PLUGIN_SAMPLE_RATE', 0.1),
  features: config.array('MY_PLUGIN_FEATURES', ['feature1', 'feature2']),
} as const

export const myPluginConfig = defineConfig(myPluginConfigSchema)
export type MyPluginConfig = typeof myPluginConfig
export default myPluginConfig
```

**Uso no plugin:**

```ts
// plugins/my-plugin/index.ts
import type { FluxStack, PluginContext } from "@/core/plugins/types"
import { myPluginConfig } from "./config"

export const myPlugin: FluxStack.Plugin = {
  name: "my-plugin",
  version: "1.0.0",

  // ✅ Não precisa de configSchema/defaultConfig
  // Config é gerenciada pela pasta config/

  setup: async (context: PluginContext) => {
    // ✅ Type inference automática!
    if (!myPluginConfig.enabled) return

    context.logger.info('Plugin config', {
      endpoint: myPluginConfig.endpoint,     // string
      sampleRate: myPluginConfig.sampleRate, // number
      features: myPluginConfig.features      // string[]
    })
  }
}
```

**Benefícios:**
- ✅ **Type inference automática** - TypeScript infere tipos literais
- ✅ **Validação em boot time** - Falha rápida com mensagens claras
- ✅ **Zero tipos `any`** - Type safety completo
- ✅ **Hot reload seguro** - Configs podem ser recarregadas
- ✅ **Documentação automática** - Schema serve como documentação

**Exemplo real:** Veja `plugins/crypto-auth/config/` como referência completa.

### 6.2. Sistema Legado (deprecated)

> ⚠️ **DEPRECATED**: `configSchema` e `defaultConfig` são mantidos apenas para compatibilidade com plugins built-in. Use o sistema `config/` para novos plugins.

```ts
// ❌ Sistema antigo (não recomendado)
export const telemetryPlugin: FluxStack.Plugin = {
  name: "telemetry",
  configSchema: {
    type: "object",
    properties: {
      endpoint: { type: "string" },
      sampleRate: { type: "number", minimum: 0, maximum: 1 }
    },
    required: ["endpoint"],
    additionalProperties: false
  },
  defaultConfig: { sampleRate: 0.1 },
  setup: ({ config, logger }) => {
    const options = config.plugins.config.telemetry ?? {}
    logger.info("Telemetry config", options)
  }
}
```

> **Nota**: Plugins built-in (`vite`, `swagger`, `monitoring`, `static`) ainda usam este sistema e serão migrados em versões futuras.

> **Dica**: Documente variáveis de ambiente em `project/configuration.md` e adicione em `.env.example`.

---

## 7. Exemplos de Hooks

### Guard de rota (`onBeforeRoute` + `onResponse`)
```ts
export const authGuard: FluxStack.Plugin = {
  name: "auth-guard",
  onBeforeRoute: async (ctx) => {
    if (!ctx.headers.authorization) {
      ctx.handled = true
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" }
      })
    }
  },
  onResponse: async (ctx) => {
    ctx.response.headers.set("x-request-id", ctx.headers["x-request-id"] ?? crypto.randomUUID())
  }
}
```

### Plugin que expõe rotas Elysia
```ts
export const healthPlugin: FluxStack.Plugin = {
  name: "health-check",
  plugin: new Elysia({ prefix: "/health" })
    .get("/", () => ({ status: "ok" }))
    .get("/metrics", ({ set }) => {
      set.headers["content-type"] = "text/plain"
      return "uptime 1\n"
    })
}
```

### Hook de build
```ts
export const buildReporter: FluxStack.Plugin = {
  name: "build-reporter",
  onBuild: async ({ mode, outDir, logger }) => {
    logger.info("Iniciando build", { mode, outDir })
  },
  onBuildComplete: async ({ mode, outDir, logger }) => {
    logger.info("Build concluído", { mode, outDir })
  }
}
```

---

## 8. Geradores e Criação de Plugins
FluxStack oferece geradores via CLI (veja `core/cli/index.ts`). O comando principal:

```bash
# Sintaxe
flux make:plugin <nome> [--template basic|server|client|full] [--description "texto"] [--force]

# Exemplos
flux make:plugin audit-log                     # template básico
flux make:plugin realtime --template server    # estrutura apenas servidor
flux make:plugin crm --template client         # apenas client-side
flux make:plugin crypto --template full        # server + client + config completos
```

Notas:
- Use caracteres alfanuméricos, hífen ou sublinhado no nome.
- `--force` permite sobrescrever pastas existentes.
- O gerador cria estrutura inicial com:
  - ✅ `config/` - Configuração declarativa com `defineConfig()`
  - ✅ `server/` - Código do plugin
  - ✅ `client/` - Componentes React (se aplicável)
  - ✅ `types.ts` - Tipos compartilhados
  - ✅ `README.md` - Documentação
  - ✅ `package.json` - Dependências (se necessário)
- Para rodar dentro do projeto, use `bun run cli make:plugin ...` ou adicione alias via `package.json`.

Além disso, `flux plugin:deps` auxilia na gestão de dependências dos plugins:

```bash
flux plugin:deps install        # instala dependências declaradas
flux plugin:deps list           # lista dependências detectadas
flux plugin:deps check          # verifica conflitos
flux plugin:deps clean          # remove pacotes não usados
```

## 9. CLI Integrado ao Plugin
Defina `commands` para expor comandos `flux`. O discovery adiciona prefixo `nome:comando` automaticamente.

```ts
export const migrationPlugin: FluxStack.Plugin = {
  name: "migrations",
  commands: [
    {
      name: "up",
      description: "Aplica migrations",
      options: [
        { name: "seed", description: "Executa seeds", type: "boolean" }
      ],
      handler: async (_args, options, { logger }) => {
        logger.info("Executando migrations", { seed: options.seed })
      }
    }
  ]
}
```

Uso:
```bash
bun run cli migrations:up --seed
```

---

## 10. Dependências Externas
- Crie `package.json` dentro do plugin. `PluginDependencyManager` detecta `dependencies`/`peerDependencies` e tenta instalar com `bun add`.
- `flux plugin:deps` oferece utilitários:
  - `install`, `list`, `check`, `clean`.
- Dependências são resolvidas com fallback para o projeto principal. Conflitos aparecem no log como `Plugin 'X' tem conflitos de dependências`.

---

## 11. Boas Práticas
- **Idempotência**: garanta que `setup` e `onServerStart` não assumam múltiplas execuções.
- **Limpeza**: pare timers/conexões em `onServerStop`.
- **Logs**: use `context.logger` (respeita `LOG_LEVEL`/transports).
- **Prioridades**: declare dependências quando o plugin construir rotas/middlewares que outros plugins precisam.
- **Configuração**: propague novas chaves para `.env.example` e `project/configuration.md`.
- **Testes**: use Vitest para instanciar o plugin isoladamente ou com uma instância Elysia de teste; o exemplo `plugins/crypto-auth` é uma boa referência.

---

## 12. Referências Úteis
- **Código-fonte do sistema**: `core/plugins/*` (registry, manager, config, dependency-manager, module-resolver).
- **Exemplo completo com novo sistema de config**: `plugins/crypto-auth` - demonstra:
  - ✅ Configuração declarativa em `config/` com `defineConfig()`
  - ✅ Type inference automática sem `configSchema`/`defaultConfig`
  - ✅ Estrutura completa: server, CLI commands, hooks
- **Documentação complementar**:
  - `project/architecture.md` - Arquitetura geral
  - `project/configuration.md` - Sistema de configuração
  - `reference/environment-vars.md` - Variáveis de ambiente

Com essas informações, é possível projetar plugins que interajam com todo o ciclo do FluxStack (rotas, middlewares, build, CLI e configuração declarativa) sem consultar o código-fonte diretamente.***
