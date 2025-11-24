# Visão Geral do Projeto FluxStack (v1.10+)

O FluxStack é um *framework* full-stack revolucionário, projetado para oferecer uma experiência de desenvolvimento rápida, segura e *type-safe* de ponta a ponta. Ele combina tecnologias de alto desempenho com um sistema de configuração declarativa robusto.

## Stack Tecnológico

O projeto é construído sobre uma *stack* moderna e otimizada para o ecossistema JavaScript/TypeScript:

| Componente | Tecnologia | Função |
| :--- | :--- | :--- |
| **Runtime/Package Manager** | **Bun** | Utilizado para execução, gerenciamento de pacotes e CLI. |
| **Backend/API** | **ElysiaJS** | *Framework* HTTP rápido e minimalista, baseado em Bun, para construção de APIs. |
| **Frontend/UI** | **React** | Biblioteca para construção da interface do usuário. |
| **Bundler** | **Vite** | Ferramenta de *build* para o frontend, otimizada para desenvolvimento rápido. |
| **Type Safety** | **Eden Treaty** | Cliente de API gerado automaticamente para garantir a segurança de tipos entre frontend e backend. |

## Arquitetura Core vs. Aplicação

A arquitetura do FluxStack é rigidamente dividida para garantir a estabilidade do *framework* e a liberdade do desenvolvedor:

*   **`core/` (Framework)**: Contém a lógica interna do FluxStack, *plugins* essenciais e a CLI. Este diretório é **somente leitura** e não deve ser modificado pelo código da aplicação.
*   **`app/` (Aplicação)**: Contém todo o código específico do projeto (serviços, rotas, componentes, tipos compartilhados). É o único local onde o código da aplicação deve residir.
*   **`config/` (Configuração)**: Contém os arquivos modulares que definem a configuração declarativa do projeto.

## Componentes Principais

1.  **Sistema de Configuração Declarativa**: A configuração é tipada e modularizada em `config/*.config.ts`, sendo composta em `fluxstack.config.ts`. Isso permite uma gestão de ambiente e *features* altamente controlada.
2.  **Eden Treaty Nativo**: O projeto exige o uso direto do cliente Eden Treaty para manter a inferência de tipos completa, eliminando a necessidade de *wrappers* de API.
3.  **Live Components**: Um sistema integrado de WebSockets que permite a criação de componentes de interface em tempo real, utilizando o `liveComponentsPlugin`.
4.  **CLI Integrada**: A ferramenta de linha de comando (`bun run cli`) facilita tarefas como *build*, *dev* e geração de *scaffolding* (ex: `make:component`).
