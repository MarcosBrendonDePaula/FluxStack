# Referência de Comandos CLI

O FluxStack utiliza uma interface de linha de comando (CLI) unificada, acessível através do script `bun run cli`.

## Comandos Principais

| Comando | Script Equivalente | Descrição |
| :--- | :--- | :--- |
| `bun run dev` | `bun run core/cli/index.ts dev` | Inicia o servidor de desenvolvimento (backend + frontend) com *hot reload*. |
| `bun run dev:frontend` | `bun run core/cli/index.ts frontend` | Inicia apenas o frontend (Vite), útil para desenvolvimento focado na UI. |
| `bun run dev:backend` | `bun run core/cli/index.ts backend` | Inicia apenas o backend (Elysia), útil para desenvolvimento focado na API. |
| `bun run build` | `bun run core/cli/index.ts build` | Executa o *build* completo para produção, gerando a pasta `dist/`. |
| `bun run start` | `bun run core/cli/index.ts start` | Inicia o servidor de produção a partir dos artefatos em `dist/`. |

## Comandos de Geração (`make:`)

Estes comandos são usados para gerar *scaffolding* de código, garantindo que novos arquivos sigam a estrutura e os padrões do FluxStack.

| Comando | Descrição | Exemplo de Uso |
| :--- | :--- | :--- |
| `bun run cli make:component` | Gera um novo componente React no diretório `app/client/src/components/`. | `bun run cli make:component Button` |
| `bun run cli make:live` | Gera um novo componente *Live* (WebSocket) no diretório `app/server/live/` e o *scaffolding* do cliente. | `bun run cli make:live ChatRoom` |
| `bun run cli make:route` | Gera um novo arquivo de rota Elysia em `app/server/routes/`. | `bun run cli make:route Analytics` |

## Comandos de Utilitário

| Comando | Descrição |
| :--- | :--- |
| `bun run sync-version` | Sincroniza a versão do projeto entre os arquivos de configuração e `package.json`. |
| `bun run build:exe` | Cria um executável *standalone* do projeto (requer `bun run build` prévio). |
| `bun run test` | Executa os testes unitários e de integração com Vitest. |
| `bun run test:coverage` | Executa os testes e gera um relatório de cobertura de código. |
