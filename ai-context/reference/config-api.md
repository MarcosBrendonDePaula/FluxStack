# API de Configuração em Runtime (Config API)

O FluxStack pode expor uma API RESTful para gerenciar a configuração da aplicação em tempo de execução, embora o uso principal seja via arquivos de configuração declarativa.

## Propósito

A Config API é útil para:

1.  **Inspeção**: Ler o estado atual da configuração da aplicação (útil para ferramentas de diagnóstico).
2.  **Atualização Dinâmica**: Em ambientes que exigem mudanças de configuração sem *restart* (ex: nível de log, *feature flags*).

## Acesso e Segurança

*   **Endpoint**: O *endpoint* padrão é geralmente `/config` ou similar, e deve ser acessado com cautela.
*   **Segurança**: **É crucial** que o acesso a esta API seja restrito e protegido por autenticação e autorização robustas, especialmente em ambientes de produção. A exposição não autorizada pode levar a vulnerabilidades de segurança ou instabilidade da aplicação.

## Uso

A API de Configuração permite operações como:

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/config` | Retorna a configuração atual da aplicação (filtrando segredos). |
| `PATCH` | `/config` | Atualiza dinamicamente partes da configuração (ex: `logging.level`). |

**Nota:** A implementação exata desta API pode variar. Consulte o código-fonte em `core/server/plugins/config-api.ts` (se existir) para a implementação específica e os *schemas* de requisição/resposta.

**Recomendação:** Para a maioria das configurações, prefira o sistema declarativo via arquivos e variáveis de ambiente, que é mais rastreável e seguro. Use a Config API apenas para necessidades de gerenciamento dinâmico.
