# Padrões de Desenvolvimento e Boas Práticas

O desenvolvimento no FluxStack deve seguir padrões específicos para manter a coesão, a *type safety* e a manutenibilidade do projeto.

## Fluxo de Trabalho Recomendado

1.  **Início**: Sempre comece com `bun run dev` para garantir que o *hot reload* esteja ativo e que o ambiente de desenvolvimento esteja configurado corretamente.
2.  **Separação de Responsabilidades**:
    *   **Backend (`app/server/`)**: Use o Elysia para definir rotas e *handlers*. Mantenha a lógica de negócio complexa em arquivos de serviço separados, chamados pelos *handlers* das rotas.
    *   **Frontend (`app/client/`)**: Use o React para a interface. Mantenha a lógica de estado em *stores* (ex: Zustand) e a lógica de comunicação com a API estritamente via cliente Eden Treaty.
3.  **Tipagem Compartilhada**:
    *   **Localização**: Todos os tipos, interfaces e *schemas* que são usados tanto no frontend quanto no backend (ex: `User`, `Post`, `APIResponse`) devem ser definidos em `app/shared/`.
    *   **Propósito**: Isso garante que o Eden Treaty e o TypeScript tenham uma fonte única de verdade para a estrutura dos dados.

## Boas Práticas de Código

### 1. Rotas Elysia

*   **Prefixos**: Use prefixos claros para agrupar rotas relacionadas (ex: `/users`, `/posts`).
*   **Response Schemas**: **Obrigatório** definir o `response` schema em todas as rotas. A ausência de um *schema* é considerada um erro de desenvolvimento no FluxStack.
*   **Validação**: Use os *schemas* do Elysia para validar *body*, *query* e *params* para garantir que a entrada seja segura.

### 2. Uso do Eden Treaty

*   **Direto e Nativo**: Conforme detalhado em `development/eden-treaty-guide.md`, o uso deve ser direto: `await api.resource.method()`.
*   **Tratamento de Erros**: O Eden Treaty retorna um objeto `{ data, error }`. Sempre verifique a propriedade `error` para tratar falhas de API de forma *type-safe*.

### 3. Configuração

*   **Configuração de Aplicação**: Use o sistema de configuração declarativa (`config/*.config.ts`) para todas as configurações de ambiente, portas, logs, etc.
*   **Segredos**: **NUNCA** *hardcode* segredos. Use variáveis de ambiente (`FLUXSTACK_...`) para credenciais sensíveis.

## Exemplo de Fluxo (CRUD)

1.  Defina o tipo de dado em `app/shared/types.ts`.
2.  Crie a rota e o *handler* em `app/server/routes/` com o `response` schema obrigatório.
3.  No frontend (`app/client/`), importe o cliente Eden Treaty.
4.  Use o cliente Eden Treaty para chamar a rota, aproveitando a inferência de tipos para `data` e `error`.
5.  Para um exemplo completo, consulte `examples/crud-complete.md`.
