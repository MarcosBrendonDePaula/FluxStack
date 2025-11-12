# FluxStack – Visão Geral do Projeto (Janeiro/2025)

## Resumo Executivo
FluxStack é um gerador e runtime full-stack sobre o ecossistema Bun, composto por:
- **Backend**: Elysia 1.4.x + TypeScript 5.8, com plugins de descoberta automática e middlewares prontos.
- **Frontend**: React 19.1 + Vite 7.1 e Tailwind 4, com componentes demonstrativos e hooks integrados ao Eden Treaty.
- **Infra**: CLI própria, pipeline de build otimizado, suporte a Docker e sistema declarativo de configuração.
- **Autenticação opcional**: plugin externo `plugins/crypto-auth` com CLI, client e server próprios.

O repositório serve tanto como template quanto como referência de integração completa (API + SPA + documentação).

## Destaques da Versão 1.8
- Eden Treaty nativo (sem wrappers) com inferência 100% funcional.
- Sistema declarativo de configuração (`fluxstack.config.ts` na raiz + `config/*.config.ts`).
- Plugins core revisados: Vite (dev proxy), Swagger, arquivos estáticos, Live Components, Monitoring (opt-in).
- Exemplo prático de autenticação assinada por chaves (`plugins/crypto-auth`).
- Oficina de live components/monitoramento exibida no app de exemplo.
- Centralização da app instance como fonte única de verdade.
- Sistema de versão unificado (package.json ↔ version.ts).

## Stack Atual
| Camada          | Tecnologia                                     |
|-----------------|------------------------------------------------|
| Runtime         | Bun >= 1.2.0                                   |
| Backend         | Elysia ^1.4.6, TypeScript ^5.8.3               |
| Frontend        | React ^19.1.0, Vite ^7.1.7, Tailwind ^4.1.13   |
| Tooling         | Vitest ^3.2.4, ESLint ^9.30, Eden Treaty ^1.3  |
| Observabilidade | Winston 3 + logger integrado, Monitoring plugin opcional |

As versões estão definidas em `package.json` e bloqueadas em `bun.lock`.

## Arquitetura em Camadas
1. **Core (`core/`)** – framework imutável:
   - `framework/server.ts`: orquestra Elysia, plugins, lifecycle (`start/stop/listen`).
   - `plugins/*`: registro, discovery, dependency manager e plugins built-in.
   - `build/`: bundler + optimizer + geração de manifest/Docker.
   - `cli/`: comandos `flux` (dev/build/create, generators, plugin deps).
2. **Aplicação (`app/`)** – código editável:
   - `server/`: controllers, routes, services, middlewares, live components.
   - `client/`: React SPA com páginas demo e integração Eden Treaty.
   - `shared/`: tipos comuns (User etc.).
3. **Configuração (`config/`)**:
   - Arquivos especializados (`server.config.ts`, `logger.config.ts`...) que usam o schema declarativo.
4. **Plugins externos (`plugins/`)**:
   - Ex.: `crypto-auth` com CLI, client e server integrados.

## Estrutura do Projeto
```
FluxStack/
├─ core/               # framework (não alterar)
├─ app/                # aplicação exemplo
│  ├─ server/          # API Elysia + live components
│  ├─ client/          # React 19 + Vite
│  └─ shared/          # tipos compartilhados
├─ config/             # camadas declarativas
├─ plugins/            # plugins opcionais (ex.: crypto-auth)
├─ ai-context/         # documentação para LLMs
├─ examples/           # exemplos externos
├─ tests/              # unit/integration e scaffolds E2E
└─ ai-context/         # documentação para LLMs
```

## Funcionalidades-chave
- **Type Safety end-to-end**: Eden Treaty exporta `api` com `{ data, error }` tipados automaticamente.
- **Documentação automática**: rotas com `response` schema produzem Swagger em `/swagger`.
- **Hot reload independente**: `bun run dev` aciona backend e proxy Vite coordenados.
- **Sistema de plugins**: descoberta automática, hooks (`setup`, `onServerStart`, `onServerStop`, `onRequest`, etc.), resolução de dependências.
- **Build pronto para produção**: `bun run build` gera artefatos no `dist/`, Dockerfile e manifest.
- **Configuração declarativa**: presets para development/production/test, com override via `FLUXSTACK_*` ou `.env`.

## Fluxo de Desenvolvimento
1. Rodar `bun run dev` para iniciar backend (porta 3000) + frontend (porta 5173).
2. Criar tipos em `app/shared/`, controllers/serviços em `app/server/`, rotas com schemas e componentes React consumindo `api`.
3. Ajustar comportamento global em `config/` (porta, plugins, logging).
4. Validar com `bun run test`, `bun run build` e (quando necessário) Docker commands (`bun run docker:*`).

> O comando `bun run dev` (ou `flux dev`) habilita um proxy reverso no backend: o Vite é iniciado pelo `vitePlugin` e as rotas front-end são servidas por trás do mesmo host:porta (`http://localhost:3000`). Caso precise executar apenas um lado, use `bun run dev:frontend` ou `bun run dev:backend`; em produção, é possível empacotar e publicar cada parte separadamente (`flux build:frontend`, `flux build:backend`).***

## Roadmap Resumido
- Integração nativa de banco (camada de dados).
- Autenticação nativa além do plugin crypto-auth.
- Melhorias em monitoring/metrics e exporters.
- Adaptações para deploy serverless (handlers dedicados).

---

Use esta visão geral em conjunto com `project/architecture.md` e `project/configuration.md` para detalhes profundos sobre cada camada.***
