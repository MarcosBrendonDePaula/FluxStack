# Runtime Config API

FluxStack expõe um conjunto de rotas REST para inspecionar e recarregar a configuração declarativa em tempo de execução. As rotas são definidas em `app/server/routes/config.ts` com prefixo `/api/config`.

## Endpoints

| Método | Rota                 | Descrição                                               |
|--------|----------------------|---------------------------------------------------------|
| GET    | `/api/config/`       | Retorna snapshot atual (`appRuntimeConfig.values`).     |
| POST   | `/api/config/reload` | Recarrega valores a partir das variáveis de ambiente.   |
| GET    | `/api/config/:field` | Busca um campo específico; inclui tipo e valor atual.   |
| GET    | `/api/config/:field/exists` | Verifica se o campo existe.                    |
| GET    | `/api/config/health` | Health-check do sistema de configuração.                |

### Resposta – Snapshot
```jsonc
{
  "success": true,
  "config": {
    "app": { "name": "FluxStack", "env": "development" },
    "server": { "port": 3000, "host": "localhost" },
    "...": "..."
  },
  "timestamp": "2025-10-11T12:00:00.000Z"
}
```

### Recarregar Configuração
O POST `/api/config/reload` lê novamente `.env` + `process.env` e exibe as diferenças detectadas:
```jsonc
{
  "success": true,
  "message": "Configuration reloaded successfully",
  "changes": {
    "server.port": { "old": 3000, "new": 4000 },
    "logging.level": { "old": "debug", "new": "info" }
  }
}
```

Use com cuidado: alterações só produzem efeito quando a leitura é dinâmica (valores capturados em módulos estáticos precisam de reinicialização manual).

### Erros
- Campo inexistente → `success: false`, HTTP 200 com mensagem `Field 'xyz' not found`.
- Falha ao recarregar (ex.: valor inválido) → `success: false` e `error` com descrição.

## Segurança
- Por padrão, as rotas não aplicam autenticação. Em produção, proteja-as com middleware (ex.: `auth.middleware.ts`) ou desabilite a exposição importando as rotas condicionalmente.
- Evite exibir secrets; a resposta inclui todos os campos presentes em `appRuntimeConfig`.

## Integração com o Sistema Declarativo
- `appRuntimeConfig` encapsula `defineConfig` e permite:
  - `values`: objeto atual.
  - `reload()`: reaplica env/defaults.
  - `get(key)`, `has(key)`.
- A documentação detalhada dos schemas está em `project/configuration.md`.

## Boas Práticas
- Use `POST /reload` apenas em ambientes controlados (dev/staging).
- Combine com logging para auditar mudanças.
- Se adicionar novos campos a `fluxstack.config.ts`, atualize também `project/configuration.md` para manter a lista de chaves sincronizada.***
