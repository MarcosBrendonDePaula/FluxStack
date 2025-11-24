# Arquitetura Interna do FluxStack

A arquitetura do FluxStack é projetada para ser modular, extensível e com forte ênfase na segurança de tipos e no desempenho.

## O Coração do Framework: `FluxStackFramework`

O ponto central da inicialização do servidor é a classe `FluxStackFramework` em `app/server/index.ts`.

```typescript
// app/server/index.ts
const app = new FluxStackFramework({ /* ...config */ })
  .use(cryptoAuthPlugin)
  .use(vitePlugin)
  .use(staticFilesPlugin)
  .use(liveComponentsPlugin)
  .routes(appInstance) // Rotas da aplicação (app/server/app.ts)
  .use(swaggerPlugin)
  .listen()
```

Esta estrutura de *chaining* (encadeamento) define a ordem de execução dos *plugins* e a montagem das rotas da aplicação.

## Fluxo de Requisição (Request Flow)

1.  **Entrada**: Uma requisição HTTP chega ao servidor Elysia (iniciado por `FluxStackFramework`).
2.  **Plugins Core**: *Plugins* essenciais (como `vitePlugin` para *hot reload* e `staticFilesPlugin` para servir ativos) são executados.
3.  **Plugins da Aplicação**: *Plugins* definidos pelo usuário (ex: `cryptoAuthPlugin`) são executados.
4.  **Roteamento**: A requisição é mapeada para a rota correspondente definida em `app/server/routes/` (montadas via `appInstance`).
5.  **Validação/Transformação**: O Elysia valida o corpo da requisição e os parâmetros contra os *schemas* definidos.
6.  **Lógica de Negócio**: O *controller* ou serviço executa a lógica de negócio.
7.  **Resposta**: A resposta é validada contra o *response schema* e enviada de volta ao cliente.

## Type Safety End-to-End

A segurança de tipos é mantida através de três pilares:

1.  **TypeScript em Todo Lugar**: Uso estrito do TypeScript no frontend e backend.
2.  **Elysia Schemas**: O Elysia utiliza o `t.Object()` do `valibot` (ou similar) para definir *schemas* de requisição e resposta.
3.  **Eden Treaty**: O cliente Eden Treaty é gerado a partir dos *schemas* do Elysia, garantindo que o frontend só possa fazer chamadas que correspondam exatamente ao que o backend espera e retorna.

**Importante:** A centralização de tipos compartilhados em `app/shared/` é crucial para que tanto o backend quanto o frontend utilizem as mesmas definições de dados.
