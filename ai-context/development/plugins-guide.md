# Guia de Plugins

O FluxStack é construído em torno de um sistema de *plugins* que estende a funcionalidade do servidor Elysia e integra recursos essenciais.

## Integração de Plugins

Os *plugins* são integrados ao servidor Elysia através do método `.use()` na inicialização do `FluxStackFramework` em `app/server/index.ts`.

```typescript
// app/server/index.ts (Trecho)
// ...
const app = new FluxStackFramework({ /* ...config */ })
  .use(cryptoAuthPlugin) // Plugin externo
  .use(vitePlugin)       // Plugin core
  // ...
  .listen()
```

A ordem em que os *plugins* são usados é importante, pois afeta a ordem de execução dos *middlewares* e *handlers* do Elysia.

## Tipos de Plugins

### 1. Plugins Core (`core/server/`)

Estes são *plugins* essenciais que fornecem a funcionalidade básica do *framework*:

*   `vitePlugin`: Gerencia o *hot reload* e o *proxy* para o frontend em desenvolvimento.
*   `staticFilesPlugin`: Serve arquivos estáticos das pastas `public/` e `uploads/`.
*   `liveComponentsPlugin`: Habilita a comunicação em tempo real via WebSockets.
*   `swaggerPlugin`: Gera e serve a documentação da API (Swagger/OpenAPI) com base nos *schemas* do Elysia.

### 2. Plugins da Aplicação (`plugins/`)

Estes são *plugins* específicos do projeto, como o `cryptoAuthPlugin` que foi analisado.

*   **`cryptoAuthPlugin`**: Fornece funcionalidades de autenticação e autorização baseadas em criptografia.

## Configuração de Plugins

A configuração dos *plugins* é centralizada em `config/plugins.config.ts`.

**Exemplo (Swagger):**

Para configurar o título da documentação Swagger, você ajusta `plugins.config.ts`, e o valor é automaticamente injetado no `swaggerPlugin` durante a inicialização do `FluxStackFramework`.

**Plugins Externos:**

Plugins externos (como `cryptoAuthPlugin`) podem gerenciar sua própria configuração em seu diretório (`plugins/crypto-auth/config/index.ts`), mas são ativados e integrados via `app/server/index.ts`.
