# Configuração Declarativa no FluxStack

O FluxStack utiliza um sistema de configuração modular e declarativo, centralizado no diretório `config/`. Este sistema garante que a configuração seja tipada, fácil de gerenciar e que se adapte a diferentes ambientes (desenvolvimento, produção, teste).

## Arquitetura da Configuração

A configuração é composta a partir de múltiplos arquivos em `config/` e consolidada em `fluxstack.config.ts` na raiz do projeto.

| Arquivo em `config/` | Responsabilidade |
| :--- | :--- |
| `app.config.ts` | Metadados da aplicação (nome, versão, ambiente). |
| `server.config.ts` | Configurações do servidor Elysia (porta, host, CORS, prefixo da API). |
| `client.config.ts` | Configurações do cliente/Vite (porta, proxy, opções de *build*). |
| `database.config.ts` | Credenciais e configurações de conexão com o banco de dados. |
| `monitoring.config.ts` | Configurações de métricas, *profiling* e *exporters*. |
| `plugins.config.ts` | Configurações específicas para plugins (Swagger, arquivos estáticos). |
| `logger.config.ts` | Nível de log e transportes (console, arquivo). |

## Prioridade e Ambientes

O sistema segue uma hierarquia de prioridade para determinar o valor final de uma configuração:

1.  **Variáveis de Ambiente (`.env`)**: Possuem a maior prioridade. Variáveis prefixadas com `FLUXSTACK_` sobrescrevem qualquer valor no código.
2.  **Configuração do Ambiente (`fluxstack.config.ts` -> `environments`)**: A seção `environments` em `fluxstack.config.ts` define *overrides* específicos para `development`, `production` e `test`.
3.  **Configuração Modular (`config/*.config.ts`)**: Os valores base definidos nos arquivos modulares.
4.  **Padrões do Framework (`core/`)**: Os valores *default* definidos no *core* do FluxStack.

**Exemplo de Uso:**

Para alterar a porta do servidor, você pode:

1.  Definir a variável de ambiente: `FLUXSTACK_SERVER_PORT=8080` (Prioridade Máxima).
2.  Modificar o valor em `config/server.config.ts` (Prioridade Média).

## Configuração de Produção (`production` environment)

A configuração para o ambiente de `production` em `fluxstack.config.ts` é otimizada para desempenho e observabilidade:

*   **Logging**: Nível `warn` ou superior, formato `json`, com transporte para arquivo (`logs/error.log`) para erros.
*   **Build**: `minify: true`, `sourceMaps: false`.
*   **Monitoring**: Ativado com métricas HTTP e de sistema, e *profiling* com baixa taxa de amostragem (`sampleRate: 0.01`).

**Recomendação:** Sempre utilize variáveis de ambiente para credenciais sensíveis (banco de dados, chaves de API) e para ajustes de ambiente (portas, hosts).
