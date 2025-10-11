# Variáveis de Ambiente – FluxStack

## Precedência
1. Valores definidos em runtime (`process.env` / `Bun.env`).
2. Valores definidos via helpers (`env.set`/`env.update`) durante a execução.
3. Arquivo `.env` carregado na raiz do projeto.
4. Defaults declarados nos schemas (`fluxstack.config.ts`).

O loader `core/utils/env.ts` (exporta `env` e `helpers`) cuida da coerção automática:
- números → `env.get('PORT', 3000)` retorna `number`;
- booleanos → strings como `true`, `1`, `on` são tratadas como `true`;
- arrays → string separada por vírgula é convertida em `string[]`;
- JSON → quando o default é objeto, tenta parsear o conteúdo.

## Variáveis Principais

### Aplicação (`FLUXSTACK_APP_*`)
- `FLUXSTACK_APP_NAME` – nome exibido em logs e UI (default: `FluxStack`).
- `FLUXSTACK_APP_VERSION` – versão da aplicação (default: `1.0.0`).
- `FLUXSTACK_APP_DESCRIPTION` – descrição usada em metadados.

### Servidor
- `PORT` – porta do backend (default: `3000`).
- `HOST` – host do backend (default: `localhost`).
- `API_PREFIX` – prefixo das rotas (`/api` por padrão).
- `CORS_ORIGINS`, `CORS_METHODS`, `CORS_HEADERS` – arrays separados por vírgula.
- `CORS_CREDENTIALS` – habilita credenciais (booleano).
- `CORS_MAX_AGE` – cache do preflight (segundos).

### Cliente / Vite (`VITE_*`)
- `VITE_PORT` – porta do dev server (default: `5173`).
- `VITE_API_URL` – URL usada pelo frontend para chamar a API (se não definido, `helpers.getServerUrl()` é usado).
- `VITE_APP_NAME`, `VITE_APP_VERSION`, `VITE_NODE_ENV` – valores expostos ao bundle.

### Plugins
- `FLUXSTACK_PLUGINS_ENABLED` – lista (separada por vírgula) de plugins a forçar como ativos.
- `FLUXSTACK_PLUGINS_DISABLED` – lista de plugins a desativar.
- Flags específicas:
  - `ENABLE_SWAGGER` (default: `true`)
  - `ENABLE_MONITORING` (default: `false`)
  - `ENABLE_METRICS` (default: `false`)
- `STATIC_PUBLIC_DIR`, `STATIC_UPLOADS_DIR` – caminhos para o `staticFilesPlugin`.
- `STATIC_CACHE_MAX_AGE` – TTL (segundos) para cache HTTP.
- `STATIC_ENABLE_PUBLIC`, `STATIC_ENABLE_UPLOADS` – toggles booleanos.
- `STATIC_PUBLIC_ROUTE`, `STATIC_UPLOADS_ROUTE` – rotas personalizadas (`/api/static`, `/api/uploads` por padrão).

### Logging
- `LOG_LEVEL` – `debug`, `info`, `warn`, `error` (default muda por ambiente).
- `LOG_FORMAT` – `pretty` (dev) ou `json` (prod).
- `LOG_TRANSPORTS` – configuração avançada via JSON (ver `logger.config.ts`).

### Build
- `BUILD_TARGET` – `bun`, `node` ou `docker` (default: `bun`).
- `BUILD_OUTDIR` – diretório de saída (`dist`).
- `BUILD_MINIFY`, `BUILD_TREESHAKE`, `BUILD_SOURCEMAPS`, `BUILD_COMPRESS`, `BUILD_SPLIT_CHUNKS`, `BUILD_ANALYZER`.
- `CLIENT_OUTDIR`, `CLIENT_MINIFY`, `CLIENT_SOURCEMAPS`, `CLIENT_TARGET` (quando precisa sobrepor os valores do bloco `client.build`).

### Monitoring (se ativado)
- `METRICS_INTERVAL`, `HTTP_METRICS`, `SYSTEM_METRICS`, `CUSTOM_METRICS`.
- `PROFILING_SAMPLE_RATE`, `PROFILE_MEMORY`, `PROFILE_CPU`.
- `METRICS_RETENTION` – retenção (ms) das métricas em memória.
- `MONITORING_EXPORTERS` – JSON com configuração avançada de exporters.
- `THRESHOLD_RESPONSE_TIME`, `THRESHOLD_ERROR_RATE`, `THRESHOLD_MEMORY`, `THRESHOLD_CPU`.

### Banco/Serviços (placeholders)
- `DATABASE_URL` ou combinação `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`.
- `REDIS_URL`, `SMTP_HOST`, `SMTP_PORT`, etc. – consumidos por services de exemplo quando presentes.

### Plugin Crypto Auth
Consulte `plugins/crypto-auth/README.md` para variáveis como chaves públicas/privadas ou configuração de CLI, se estiver ativando o plugin.

## Helpers Úteis
- `env.get('KEY', default)` – leitura tipada com cache.
- `env.has('KEY')` – verifica se a chave possui valor.
- `env.require(['KEY1', 'KEY2'])` – lança erro caso alguma esteja ausente.
- `helpers.getServerUrl()` / `helpers.getClientUrl()` – montam URLs com host/port atuais.
- `helpers.isDevelopment()` / `helpers.isProduction()` / `helpers.isTest()` – predicados para facilitar condicionais.

## Dicas
- Mantenha segredos fora do repositório: use `.env` localmente e variáveis no ambiente de deploy.
- Para arrays, use `"valor1,valor2,valor3"` sem espaços ou trate-os no código.
- Caso troque portas, ajuste também reverse proxies ou scripts que dependam das URLs.
- Atualize `project/configuration.md` caso adicione novos blocos ao schema principal.

--- 

Esse mapeamento cobre as variáveis suportadas pelo loader atual. Para novos recursos, adicione entradas em `fluxstack.config.ts` e documente-as aqui para manter consistência.***
