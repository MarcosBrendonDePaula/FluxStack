# Sistema de Configuração do FluxStack

## Visão Geral
- Arquivo central: `fluxstack.config.ts` (raiz) – declara schemas tipados para todas as áreas (app, server, client, build, plugins, logging, monitoring, etc.).
- Camada de consumo: arquivos em `config/` (ex.: `server.config.ts`, `app.config.ts`, `logger.config.ts`) convertem os schemas em objetos prontos para a aplicação.
- Loader de ambiente: `core/utils/env.ts` fornece acesso dinâmico a variáveis (`env`) e helpers (`helpers`) que respeitam a precedência `process.env` → runtime → `.env` → defaults.

O objetivo é permitir ajustes via código ou variáveis de ambiente sem perder type-safety.

## Camadas e Precedência
1. **Defaults declarados** nos schemas (`configHelpers.string/number/boolean/array/enum`).
2. **Overrides por ambiente** (blocos `environments.development`, `production`, `test` em `fluxstack.config.ts`).
3. **Variáveis de ambiente** (prefíxos `FLUXSTACK_`, `BUILD_`, `CORS_`, etc.), processadas pelo helper.
4. **Arquivo `.env`** (carregado automaticamente).
5. **Valores em runtime** (via `env.set`/`env.update` se necessário).

O helper `env.get(key, default)` cuida de coerção para number/boolean/array/JSON, evitando erros comuns.

## Arquivos Importantes
- `fluxstack.config.ts`: define o schema principal com `defineConfig`, incluindo presets dev/prod/test.
- `config/index.ts`: ponto único que reexporta as configurações específicas.
- `config/server.config.ts`: porta, host, prefixos, CORS, recursos ligados ao servidor Elysia.
- `config/app.config.ts`: metadados gerais da aplicação (nome, versão, descrição, ambiente).
- `config/logger.config.ts`: níveis e formatos (console/file) utilizados pelo `core/utils/logger`.
- `config/runtime.config.ts`, `config/system.config.ts`, `config/services.config.ts`: valores auxiliares consumidos pelos serviços/app.

## Consumindo Configuração
- No backend: `app/server/index.ts` instancia o `FluxStackFramework` com dados de `serverConfig`, `appConfig`, `loggerConfig` e helpers (`helpers.getServerUrl()`).
- Em plugins/core: `FluxStackFramework` usa `getConfigSync()` para recuperar a configuração processada.
- No frontend: valores expostos via Vite podem ser lidos com `import.meta.env` (quando definidos com prefixo `VITE_`).

## Variáveis de Ambiente Relevantes
As mais utilizadas:
- `FLUXSTACK_APP_NAME`, `FLUXSTACK_APP_VERSION`, `FLUXSTACK_APP_DESCRIPTION`.
- `PORT`, `HOST`, `API_PREFIX`, `VITE_PORT`.
- `FLUXSTACK_PLUGINS_ENABLED`, `FLUXSTACK_PLUGINS_DISABLED`.
- `LOG_LEVEL`, `LOG_FORMAT`.
- `ENABLE_SWAGGER`, `ENABLE_MONITORING`, `ENABLE_METRICS`.
- Flags de build: `BUILD_TARGET`, `BUILD_OUTDIR`, `BUILD_MINIFY`, `BUILD_SOURCEMAPS`.

Consulte `reference/environment-vars.md` para a lista expandida.

## Ajustando Configurações
1. **Por código**: edite os arquivos em `config/`. Ex.: alterar `serverConfig.port`.
2. **Por ambiente**: defina variáveis no `.env` (ou em `process.env`) usando os nomes documentados.
3. **Por preset**: modifique os blocos em `fluxstack.config.ts` dentro de `environments.{development,production,test}` para ajustar defaults.

### Exemplo: alterar porta do backend para 4000
```bash
export PORT=4000
bun run dev
# helpers.getServerUrl() agora resolve para http://localhost:4000
```

### Exemplo: habilitar monitoring em desenvolvimento
```ts
// fluxstack.config.ts (bloco environments.development)
monitoring: {
  enabled: true,
  metrics: { enabled: true, httpMetrics: true, systemMetrics: true, customMetrics: false },
  profiling: { enabled: false, sampleRate: 0.1, memoryProfiling: false, cpuProfiling: false },
  exporters: ['console']
}
```

## Boas Práticas
- Mantenha secrets fora do repositório; use placeholders e injete valores no ambiente (ver `.env.example`).
- Use `configHelpers.enum/array` para validações simples antes de runtime.
- Utilize `helpers.getServerUrl()` e `helpers.getClientUrl()` ao formar URLs para evitar divergências.
- Para novos módulos, exponha schemas em `fluxstack.config.ts` e crie um arquivo em `config/` para centralizar defaults + overrides.

---

Resumo: o sistema de configuração combina schemas tipados, overrides por ambiente e leitura inteligente de variáveis, garantindo consistência entre ambientes e facilitando ajustes sem quebrar a experiência de desenvolvimento.***
