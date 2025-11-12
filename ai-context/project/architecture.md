# Arquitetura do FluxStack (v1.8)

## Panorama
FluxStack organiza-se como um monorepo onde o framework (`core/`) permanece estável e a aplicação (`app/`) concentra o código editável. A base oferece:
- Backend Bun + Elysia com sistema de plugins.
- Frontend React 19 + Vite com integração Eden Treaty.
- CLI `flux` para desenvolvimento, build e geração de código.
- Sistema declarativo de configuração com presets por ambiente.
- Pipeline de build com manifest e artefatos Docker.

## Estrutura de Alto Nível
```
┌─────────────────────────────────────────────┬──────────────┐
│                 FluxStack Monorepo          │              │
├─────────────────────────────────────────────┼──────────────┤
│ app/                                        │ core/        │
│  ├─ Frontend (React + Vite)                 │  ├─ Framework│
│  ├─ Backend (Elysia API)                    │  ├─ Plugins  │
│  └─ Shared Types / Utils                    │  └─ Build/CLI│
└─────────────────────────────────────────────┴──────────────┘
```

## Estrutura de Pastas
```
FluxStack/
├─ core/                    # Framework (read-only)
│  ├─ framework/            # FluxStackFramework (Elysia + plugins)
│  ├─ plugins/              # Registro, discovery e built-ins
│  ├─ build/                # Bundler + optimizer + manifest/Docker
│  ├─ cli/                  # Comandos flux
│  ├─ config/               # Helpers e schema loaders
│  └─ utils/                # Logger, env helpers, etc.
├─ app/                     # Aplicação gerada (editável)
│  ├─ client/               # React + Vite
│  │  ├─ Components & Pages
│  │  ├─ Hooks & Utils
│  │  └─ Eden Treaty Client ←───────────────┐  # Consome API tipada
│  ├─ server/               # Elysia API     │
│  │  ├─ Controllers & Services             │
│  │  └─ Routes + Schemas ──────────────────┘  # Inferência compartilhada
│  └─ shared/               # Tipos comuns
├─ config/                  # Config files derivados do schema central
├─ plugins/                 # Plugins externos (ex.: crypto-auth)
├─ examples/, tests/   # Exemplos e testes
└─ ai-context/              # Documentação para assistentes
```

## Núcleo (`core/`)
### FluxStackFramework (`core/framework/server.ts`)
- Instancia Elysia, carrega `FluxStackConfig` e cria `FluxStackContext`.
- Configura CORS, handlers HEAD e tratamento de erros padrão.
- Utiliza `PluginManager` para descobrir, validar e executar hooks (`setup`, `onServerStart`, `onRequest`, `onResponse`, `onError`, `onBuild`, `onBuildComplete`, `onServerStop`).
- `listen()` monta banner, registra sinais (`SIGINT`, `SIGTERM`) e inicia o servidor.

### Sistema de plugins
- `core/plugins/registry.ts`: mantém metadados, dependências e ordem de carga.
- `core/plugins/manager.ts`: executa hooks respeitando prioridades e dependências.
- `core/plugins/dependency-manager.ts`: instala dependências externas (`bun add`).
- Built-ins: `swagger`, `vite`, `static`, `monitoring`, além do plugin auxiliar `staticFilesPlugin` (arquivos públicos) e `liveComponentsPlugin`.

### CLI (`core/cli`)
- Comandos principais: `flux dev`, `flux frontend`, `flux backend`, `flux build`, `flux build:frontend`, `flux build:backend`, `flux start`, `flux create`.
- Geradores e utilitários: `flux make:plugin`, `flux generate`, `flux plugin:deps {install|list|check|clean}`.

### Build (`core/build`)
- `FluxStackBuilder` orquestra bundler (backend) e build Vite (frontend).
- `Optimizer` aplica treeshake/minify/compress quando habilitado.
- Gera manifest e `dist/Dockerfile` + `dist/docker-compose.yml`.

## Aplicação (`app/`)
### Backend (`app/server`)
- Usa o framework com plugins personalizados (ex.: crypto-auth).
- Rotas em `routes/`, controllers/serviços focados em negócios, middlewares dedicados.
- Live components expostos via WebSocket (`live/`).

### Frontend (`app/client`)
- SPA React com componentes de demonstração, hooks (`useAuth`, `useNotifications`), store Zustand.
- `src/lib/eden-api.ts` expõe cliente tratado pelo Eden Treaty (`const { data, error } = await api.users.get()`).
- `frontend-only.ts` permite servir apenas o frontend (`flux frontend`).

### Compartilhados (`app/shared`)
- Tipos e utilidades reaproveitados por client/server (garantem inferência compartilhada).

## Configuração (`config/` + `fluxstack.config.ts`)
- Schemas declarativos com `defineConfig` suportam defaults, validação e overrides por env (`FLUXSTACK_*`).
- `config/index.ts` agrega todos os módulos (`appConfig`, `serverConfig`, `loggerConfig`, etc.) e reexporta parâmetros específicos.
- Rotas `/api/config/*` permitem inspecionar/recarregar configuração em runtime (ver `reference/config-api.md`).

## Plugins externos
- `plugins/crypto-auth` é o exemplo principal: inclui CLI, client e server; registra middlewares de autenticação e comandos adicionais.
- Novos plugins seguem estrutura `plugins/<nome>/` com `index.ts`, `config/`, `package.json` e hooks definidos em `FluxStack.Plugin`.

## Fluxo de execução
1. CLI (`bun run dev`/`flux dev`) inicializa backend + Vite (proxy reverso em `http://localhost:3000`).
2. `FluxStackFramework.listen()` sobe Elysia; `vitePlugin` monitora Vite no modo dev.
3. Frontend consome `api` tipada via Eden Treaty.
4. Live Components comunicam-se via `/api/live/ws` (plugin WebSocket).
5. Para executar apenas um lado: `flux frontend` ou `flux backend`.

## Build e deploy
- `flux build` gera artefatos completos (backend + frontend + manifest + Dockerfile).
- Deploy containerizado: `bun run docker:build`, `docker run -p 3000:3000 fluxstack-app`.
- Builds separados: `flux build:frontend`, `flux build:backend` quando necessário.

## Testes e observabilidade
- Testes: Vitest (`bun run test`), scripts específicos (`scripts/test-live-components.ts`).
- Logger Winston configurável (`config/logger.config.ts`).
- Monitoring plugin (opt-in) coleta métricas HTTP/Sistema e exporta via console/prometheus/json/arquivo (ver `development/monitoring.md`).

## Extensibilidade
- Plugins podem adicionar rotas, registrar hooks e expor comandos CLI.
- Configuração declarativa facilita oferecer novos blocos (`fluxstack.config.ts` + `config/*.config.ts`).
- `ai-context/` reúne toda a documentação contextualizada para assistentes (este arquivo faz parte).
