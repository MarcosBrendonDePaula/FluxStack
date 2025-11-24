# FluxStack – Início Rápido para Assistentes (v1.10+)

**Objetivo:** Fornecer uma visão geral rápida para que assistentes de IA possam interagir, configurar e modificar o projeto com segurança, mantendo a consistência e a *type safety*.

## Comandos Essenciais

O projeto utiliza **Bun** como *runtime* e gerenciador de pacotes.

| Comando | Descrição | URL Padrão |
| :--- | :--- | :--- |
| `bun run dev` | Inicia o backend (Elysia) e o frontend (React/Vite) com *hot reload*. | Backend: `http://localhost:3000` |
| `bun run build` | Executa o *build* completo (frontend e backend) para produção. | Frontend: `http://localhost:5173` |
| `bun run start` | Inicia o servidor de produção a partir da pasta `dist/`. | Swagger: `http://localhost:3000/swagger` |
| `bun run cli` | Acessa a interface de linha de comando (CLI) para tarefas como geração de componentes. | |

## Estrutura Fundamental

A arquitetura do FluxStack é baseada na separação clara entre o *Core* (somente leitura) e a *Aplicação* (código do usuário).

```
FluxStack/
├─ core/         # Framework (NÃO ALTERAR)
├─ app/          # Código da Aplicação (Onde você trabalha)
│  ├─ server/    # Controllers, rotas Elysia, serviços
│  ├─ client/    # React, páginas, componentes
│  └─ shared/    # Tipos e interfaces compartilhadas (CRÍTICO para type safety)
├─ config/       # Arquivos de Configuração Declarativa
├─ plugins/      # Plugins adicionais (ex.: crypto-auth)
└─ ai-context/   # Esta documentação
```

## Regras de Ouro

Estas regras são **mandatórias** para garantir a estabilidade e a integridade do projeto:

**NUNCA**
1.  **Alterar arquivos em `core/`**: O diretório `core/` contém o *framework* e deve ser tratado como **somente leitura**.
2.  **Envolver o Eden Treaty em *wrappers***: Não crie funções como `apiCall()` ou similares. Isso quebra a inferência de tipos nativa.
3.  **Omitir *response* schemas nas rotas**: A definição explícita do *schema* de resposta é crucial para a *type safety* e para o funcionamento correto do Eden Treaty.

**SEMPRE**
1.  **Trabalhar dentro de `app/` e `config/`**: Todo o código da aplicação e as configurações devem residir nestes diretórios.
2.  **Usar Eden Treaty nativo**: A chamada deve ser direta para o cliente gerado: `const { data, error } = await api.users.get();`.
3.  **Manter tipos compartilhados em `app/shared/`**: Tipos e interfaces usados tanto no frontend quanto no backend devem ser centralizados aqui.

## Próximo Passo

Para um entendimento mais aprofundado, consulte:

*   **Sistema de Configuração**: `project/configuration.md`
*   **Guia Eden Treaty**: `development/eden-treaty-guide.md`
*   **Arquitetura**: `project/architecture.md`
*   **Resolução de Problemas**: `reference/troubleshooting.md`
