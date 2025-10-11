# CLI `flux` – Referência Completa

O comando `flux` (ou `bun run cli`) centraliza operações de desenvolvimento, build e geração de código. Os comandos são registrados em `core/cli/index.ts`.

## Desenvolvimento
| Comando                 | Descrição                                                            |
|-------------------------|-----------------------------------------------------------------------|
| `flux dev`              | Inicia backend e frontend com hot reload (porta 3000/5173).          |
| `flux frontend`         | Apenas o Vite dev server.                                             |
| `flux backend`          | Apenas o backend Elysia com `bun --watch`.                            |
| `flux dev:clean`        | Variante do dev com logs enxutos (`run-clean.ts`).                    |

> `flux dev` executa o Vite atrás do backend via proxy reverso. Mesmo assim, você pode rodar cada parte isolada com `flux frontend` ou `flux backend` quando desejar separar os processos.***
Opções comuns (quando aplicável):
- `--port <n>`: porta customizada para backend.  
- `--frontend-port <n>`: porta customizada para Vite.

## Build & Produção
| Comando                 | Descrição                                                            |
|-------------------------|-----------------------------------------------------------------------|
| `flux build`            | Build completo (frontend + backend) via `FluxStackBuilder`.          |
| `flux build:frontend`   | Executa apenas build do frontend (Vite).                             |
| `flux build:backend`    | Gera bundle do backend.                                              |
| `flux start`            | Inicia servidor a partir de `dist/index.js`.                         |

### Docker Helpers (via scripts npm/bun)
No `package.json` há aliases:
```bash
bun run docker:build   # builda imagem a partir de dist/
bun run docker:run     # sobe container local (porta 3000)
bun run docker:compose # usa docker-compose.yml em dist/
```

## Geração e Scaffold
- `flux make:plugin <nome> [opções]`  
  - `--template basic|server|client|full`  
  - `--description "<texto>"`  
  - `--force` (sobrescreve diretório existente)  
  Cria estrutura inicial em `plugins/<nome>/`.

- `flux generate ...` / `flux g ...`  
  - Geradores cadastrados no registry (`core/cli/generators/`). Consulte `generate --help` para listar.

## Gestão de Plugins
- `flux plugin:deps install`  
- `flux plugin:deps list`  
- `flux plugin:deps check`  
- `flux plugin:deps clean`  

Esses comandos usam o `PluginDependencyManager` para instalar/listar conferir dependências declaradas nos `package.json` dos plugins.

## CLI dos Plugins
Plugins podem registrar comandos próprios (`plugin.commands`). O discovery os expõe como:
- `flux <plugin>:<comando>` – forma prefixada (evita conflito).
- `flux <comando>` – se não houver outro comando com o mesmo nome.

Exemplo (plugin `migrations`):
```bash
flux migrations:up --seed
flux up --seed            # se não houver conflito de nome
```

## Utilização
- Execução via script (recomendado): `bun run cli <comando>`.
- A CLI roda em Bun e lê `fluxstack.config.ts` antes de executar cada comando, garantindo consistência de configuração.

## Dicas
- Use `flux help` para lista completa ou `flux help <comando>` para detalhes.
- Comandos falhos retornam código != 0; automatize CI/CD de acordo.
- Para estender a CLI, registre novos comandos no `cliRegistry` (veja `core/cli/index.ts` e `core/cli/command-registry.ts`).***
