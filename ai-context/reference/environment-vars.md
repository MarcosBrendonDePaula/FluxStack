# Variáveis de Ambiente (Environment Variables)

O sistema de configuração declarativa do FluxStack é fortemente influenciado por variáveis de ambiente, que possuem a **maior prioridade** na definição de valores.

## Convenção de Nomenclatura

Todas as variáveis de ambiente que o FluxStack consome diretamente devem ser prefixadas com **`FLUXSTACK_`**.

**Exemplo:** Para configurar a porta do servidor, a variável de ambiente é `FLUXSTACK_SERVER_PORT`.

## Variáveis Comuns

| Variável | Descrição | Configuração Correspondente | Exemplo de Valor |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Define o ambiente de execução. **Crucial** para o *build* e otimizações. | `app.env` | `development`, `production`, `test` |
| `FLUXSTACK_SERVER_PORT` | Porta em que o servidor Elysia será executado. | `server.port` | `3000` |
| `FLUXSTACK_SERVER_HOST` | Host em que o servidor será vinculado. | `server.host` | `0.0.0.0` |
| `FLUXSTACK_API_PREFIX` | Prefixo para todas as rotas da API. | `server.apiPrefix` | `/api/v1` |
| `FLUXSTACK_CORS_ORIGINS` | Lista de origens permitidas para CORS (separadas por vírgula). | `server.cors.origins` | `http://localhost:5173,https://meuapp.com` |
| `FLUXSTACK_LOGGING_LEVEL` | Nível mínimo de log a ser exibido. | `logging.level` | `debug`, `info`, `warn`, `error` |
| `FLUXSTACK_DATABASE_URL` | URL de conexão completa com o banco de dados. | `database.url` | `postgres://user:pass@host:port/db` |
| `FLUXSTACK_JWT_SECRET` | Chave secreta para assinatura de tokens JWT. | `auth.secret` | `uma-chave-secreta-longa` |

## Uso de Arquivos `.env`

Recomenda-se o uso de arquivos `.env` na raiz do projeto para gerenciar as variáveis de ambiente em desenvolvimento. O Bun carrega automaticamente estas variáveis.

```dotenv
# .env
FLUXSTACK_SERVER_PORT=3000
FLUXSTACK_LOGGING_LEVEL=debug
FLUXSTACK_DATABASE_URL=sqlite://./dev.db
```

**Segurança:** Em ambientes de produção, as variáveis de ambiente devem ser injetadas diretamente pelo orquestrador (Docker, Kubernetes, etc.) e **NUNCA** armazenadas em arquivos `.env` no repositório.
