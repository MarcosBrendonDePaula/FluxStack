# Arquitetura do FluxStack (v1.5)

## Panorama
FluxStack organiza-se como um monorepo onde o framework (`core/`) é imutável e a aplicação (`app/`) concentra todo o código editável. A base oferece:
- Runtime backend em Bun + Elysia com sistema de plugins.
- SPA React 19 com Vite e integração automática via Eden Treaty.
- CLI única (`flux`) para dev/build/create e gestão de plugins.
- Sistema declarativo de configuração com presets por ambiente.
- Pipeline de build e distribuição com suporte a Docker.

```
FluxStack/
├─ core/                # Framework (read-only)
│  ├─ framework/        # FluxStackFramework (Elysia + plugins)
│  ├─ plugins/          # Registro, discovery e plugins built-in
│  ├─ build/            # Bundler + optimizer + manifest/Docker
│  ├─ cli/              # Comandos flux
│  ├─ config/           # Helpers e schema loaders
│  └─ utils/            # Logger, env helpers, etc.
├─ app/                 # Aplicação gerada (editável)
│  ├─ server/           # Rotas, controllers, middleware, live
│  ├─ client/           # React + Vite
│  └─ shared/           # Tipos compartilhados
├─ config/              # Configurações derivadas do schema
├─ plugins/             # Plugins externos (ex.: crypto-auth)
├─ docs/, examples/, tests/
└─ ai-context/          # Documentação assistente
```

## Núcleo do Framework (`core/`)
### FluxStackFramework (`core/framework/server.ts`)
- Instancia um app Elysia.
- Carrega configuração via `getConfigSync()`.
- Cria contexto (`FluxStackContext`) com helpers (timer, hash, merge).
- Inicializa o `PluginManager`, aplica middlewares básicos (CORS, HEAD responses, hooks de segurança), configura error handler.
- Sequência de lifecycle:
  1. `registerPlugins()` – built-in + descobertos.
  2. `setup` (se definido) para cada plugin na ordem calculada.
  3. `app.use(plugin.plugin)` quando é um plugin Elysia.
  4. `onServerStart`.
  5. `listen()` aplica banner opcional, registra sinais de encerramento.
- `stop()` percorre `onServerStop` em ordem reversa.

### Sistema de Plugins
- `core/plugins/registry.ts`: mantém metadados, dependências e ordem de carga.
- `core/plugins/manager.ts`: resolve o que habilitar/desabilitar conforme config (`FLUXSTACK_PLUGINS_ENABLED/DISABLED`).
- `core/plugins/dependency-manager.ts`: instala/verifica dependências externas.
- Built-ins em `core/plugins/built-in/`:
  - `swagger` – documentação automática;
  - `vite` – monitora dev server e faz proxy quando ativo;
  - `static` – entrega assets em produção;
  - `monitoring` – coleta métricas/opcional.
- Exportações adicionais em `core/server/index.ts`:
  - `staticFilesPlugin` – serve `public/` ou `dist/client`;
  - `liveComponentsPlugin` – integra live components via WebSocket.

### CLI (`core/cli`)
- Usa `cliRegistry` para registrar comandos.
- Comandos principais: `dev`, `frontend`, `backend`, `build`, `build:frontend`, `build:backend`, `start`, `create`, `help`.
- Utilitários: geradores (`generate`, `generate:interactive`), `plugin:deps` para instalar/listar/verificar/limpar dependências dos plugins.

### Build Pipeline (`core/build`)
- `FluxStackBuilder` orquestra `Bundler` (frontend/backend) e `Optimizer`.
- Gera manifest com metadados de build, estatísticas e artefatos.
- Cria Dockerfile e docker-compose prontos no diretório `dist/`.

### Config Helpers
- `core/config/schema` define tipos base (`FluxStackConfig`).
- `core/utils/config-schema` + `defineConfig` suportam declaração de schemas com validação simples.
- `core/utils/env.ts` expõe `env` (loader com cache, coerção) e `helpers` (métodos `isDevelopment`, `getServerUrl`, etc.).

## Aplicação (`app/`)
### Backend (`app/server`)
- `index.ts`: instancia `FluxStackFramework` com valores de `config/`, registra plugin `crypto-auth`, aplica plugins core (Vite ou Static, StaticFiles, LiveComponents, Swagger) e rotas.
- `routes/`: grupos modulares (ex.: `config.ts`, `crypto-auth-demo.routes.ts`, `users.routes.ts`). `routes/index.ts` agrega, incluindo `GET /health`.
- `controllers/` e `services/`: lógica de domínio e utilidades (ex.: `NotificationService`, `UserService`).
- `middleware/`: autenticação, rate limiting, validação, logging.
- `live/`: componentes server-side interativos (SystemMonitor, FluxStackConfig, etc.).
- `app.ts`: exporta tipo `App` para Eden Treaty.

### Frontend (`app/client`)
- `src/lib/eden-api.ts`: cria cliente Eden Treaty tipado (`treaty<App>`).
- Componentes de demonstração (Dashboard, Config, Live Components) em `src/components` e `src/pages`.
- Hooks (`useAuth`, `useNotifications`), store Zustand e scripts de live components.
- `frontend-only.ts` permite iniciar apenas o frontend via `bun run start:frontend`.

### Tipos Compartilhados (`app/shared`)
- Tipos básicos (User, etc.) centralizados para uso em server/client.

## Configuração (`config/`)
- Cada arquivo (`server.config.ts`, `app.config.ts`, `logger.config.ts`, `system.config.ts`, etc.) lê `defineConfig` e `env` para montar objetos prontos.
- Combina presets definidos em `fluxstack.config.ts` com variáveis de ambiente.
- `config/index.ts` reexporta os módulos para consumo no restante da aplicação.
- `project/configuration.md` explica o fluxo completo.

## Plugins Externos
- `plugins/crypto-auth`: plugin assíncrono com CLI, client e server; fornece autenticação baseada em assinaturas criptográficas. Integrado em `app/server/index.ts`.
- Outros plugins podem ser adicionados seguindo a estrutura: `plugins/<nome>/` com `package.json` próprio, `index.ts` exportando `FluxStackPlugin`.

## Fluxo de Execução
1. CLI (`bun run dev`) → `core/cli/index.ts` → modo `dev`.
2. Backend: `FluxStackFramework.listen()` inicia server Bun/Elysia em `PORT` (default 3000).
3. Se `isDevelopment`, Vite plugin monitora dev server (porta 5173). Caso contrário, `staticPlugin`/`staticFilesPlugin` servem assets de produção.
4. Eden Treaty cliente (`app/client/src/lib/eden-api.ts`) consome rotas exportadas por `app/server/app.ts`.
5. Live components usam WebSockets via `liveComponentsPlugin`.

## Build e Deploy
- `bun run build` chama `FluxStackBuilder.build()`:
  - bundle backend (`app/server/index.ts`) e frontend (Vite) com base nas opções de `config`.
  - aplica otimizações (minify, treeshake, compress) conforme configuração.
  - gera `dist/` com `index.js`, `client/`, manifest e Dockerfile.
- Docker:
  - `bun run docker:build` / `docker:run` / `docker:compose`.
  - Dockerfile usa multi-stage com `oven/bun`.

## Testes e Garantia de Qualidade
- Unit/Integration: Vitest (`bun run test`, `test:watch`, `test:coverage`).
- Config: testes específicos em `core/config/__tests__/`.
- Live components: scripts em `scripts/test-live-components.ts`.
- O diretório `tests/` contém fixtures e scaffolds (E2E/Playwright opcional).

## Observabilidade e Logging
- Logger central (`core/utils/logger`) baseado em Winston com transports configuráveis (`config/logger.config.ts`).
- Monitoring plugin (opt-in) coleta métricas HTTP/sistema e pode exportar para console/arquivo.
- Middleware de logging (`app/server/middleware/requestLogging.ts`) utiliza logger integrado.

## Extensibilidade
- Plugins podem:
  - adicionar rotas Elysia (`plugin.plugin`);
  - registrar hooks (`setup`, `onServerStart`, `onServerStop`, `onRequest`, etc.);
  - interagir com o contexto (`config`, `logger`, `utils`).
- Configuração pode ser ampliada adicionando novos blocos ao schema e arquivos em `config/`.
- CLI aceita registro de novos comandos via `cliRegistry.register`.

---

Para aprofundar cada tema, consulte:
- `project/configuration.md` – detalhes do sistema declarativo.
- `development/plugins-guide.md` – criação/uso de plugins.
- `development/patterns.md` – fluxo de features end-to-end.
- Código-fonte em `core/` para compreender implementações específicas.***
