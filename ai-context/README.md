# AI Context – FluxStack Documentation (v1.10+)

Guia otimizado para assistentes compreenderem rapidamente o FluxStack, sua arquitetura e o fluxo de trabalho recomendado, alinhado com a versão v1.10+.

## Entrada Rápida

- [00-QUICK-START.md](./00-QUICK-START.md): Visão geral em poucos minutos com comandos, estrutura e regras essenciais.

## Estrutura de Conteúdo

### Projeto (`project/`)
- [overview.md](./project/overview.md): Estado atual, stack (Elysia, React, Bun) e componentes principais.
- [architecture.md](./project/architecture.md): Detalhes internos do framework e separação Core/App.
- [configuration.md](./project/configuration.md): **Sistema Declarativo de Configuração** e prioridade de ambientes.
- [build-pipeline.md](./project/build-pipeline.md): Processo de *build* com Bun/Vite e *deployment*.

### Desenvolvimento (`development/`)
- [patterns.md](./development/patterns.md): Fluxo recomendado e boas práticas (uso de `app/shared/`).
- [eden-treaty-guide.md](./development/eden-treaty-guide.md): **Guia Completo do Eden Treaty Nativo** e a importância dos *response schemas*.
- [plugins-guide.md](./development/plugins-guide.md): Uso do sistema de plugins end-to-end.
- [live-components.md](./development/live-components.md): Arquitetura do WebSocket e componentes ao vivo.
- [monitoring.md](./development/monitoring.md): Configuração de métricas e observabilidade.

### Referência (`reference/`)
- [environment-vars.md](./reference/environment-vars.md): Mapeamento das variáveis de ambiente.
- [cli-commands.md](./reference/cli-commands.md): Comandos `bun run cli` e opções.
- [config-api.md](./reference/config-api.md): Rotas REST de configuração em runtime (se aplicável).
- [troubleshooting.md](./reference/troubleshooting.md): Diagnóstico e soluções rápidas.

### Exemplos (`examples/`)
- [crud-complete.md](./examples/crud-complete.md): Exemplo de CRUD completo utilizando o Eden Treaty nativo.

## Como Navegar

| Cenário | Caminho sugerido |
| :--- | :--- |
| Primeira vez no projeto | `00-QUICK-START.md` → `project/overview.md` |
| Entender arquitetura/config | `project/architecture.md` → `project/configuration.md` |
| Criar nova funcionalidade | `development/patterns.md` → `examples/crud-complete.md` |
| Trabalhar com Eden Treaty | `development/eden-treaty-guide.md` |
| Ajustar configuração/ambiente | `project/configuration.md` → `reference/environment-vars.md` |
| Resolver problemas | `reference/troubleshooting.md` |

## Regras Essenciais (Mandatórias)

**NUNCA**
- Alterar código em `core/` (o framework é **somente leitura**).
- Reintroduzir *wrappers* para Eden Treaty (`apiCall()` ou similares).
- Ignorar `response` schemas nas rotas Elysia.

**SEMPRE**
- Trabalhar dentro de `app/` e `config/`.
- Usar Eden Treaty nativo: `const { data, error } = await api.users.get()`.
- Centralizar tipos compartilhados em `app/shared/`.
- Validar alterações com `bun run dev` e os testes disponíveis.

## Estado Atual (v1.10+)

- **Stack:** Elysia (Backend), React (Frontend), Bun (Runtime/Package Manager), Vite (Bundler).
- **Type Safety:** Eden Treaty nativo com inferência completa.
- **Configuração:** Sistema declarativo modular (`config/*.config.ts`).
- **Plugins:** Core revisados e plugin externo `crypto-auth` integrado.

---

**Objetivo:** Manter assistentes alinhados com o estado real do FluxStack, garantindo respostas corretas e código consistente com os padrões do projeto.
