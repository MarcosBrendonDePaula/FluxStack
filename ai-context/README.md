# AI Context – FluxStack Documentation

Guia otimizado para assistentes compreenderem rapidamente o FluxStack, sua arquitetura e o fluxo de trabalho recomendado.

## Entrada Rápida

- [00-QUICK-START.md](./00-QUICK-START.md): visão geral em poucos minutos com comandos, estrutura e regras essenciais.

## Estrutura Atual

### Projeto (`project/`)
- [overview.md](./project/overview.md): estado atual, stack e componentes principais.
- [architecture.md](./project/architecture.md): detalhes internos do framework.
- [configuration.md](./project/configuration.md): sistema declarativo de configuração e variáveis.
- [build-pipeline.md](./project/build-pipeline.md): bundler, optimizer, manifest e Docker.

### Desenvolvimento (`development/`)
- [patterns.md](./development/patterns.md): fluxo recomendado e boas práticas.
- [eden-treaty-guide.md](./development/eden-treaty-guide.md): guia completo do Eden Treaty.
- [plugins-guide.md](./development/plugins-guide.md): uso do sistema de plugins end-to-end.
- [live-components.md](./development/live-components.md): arquitetura do WebSocket e componentes ao vivo.
- [monitoring.md](./development/monitoring.md): plugin de métricas e observabilidade.

### Referência (`reference/`)
- [environment-vars.md](./reference/environment-vars.md): mapeamento das variáveis e helpers.
- [cli-commands.md](./reference/cli-commands.md): comandos `flux` e opções.
- [config-api.md](./reference/config-api.md): rotas REST de configuração em runtime.
- [troubleshooting.md](./reference/troubleshooting.md): diagnóstico e soluções rápidas.

### Exemplos (`examples/`)
- [crud-complete.md](./examples/crud-complete.md): CRUD completo end-to-end com Eden Treaty.

### Mudanças Recentes (`recent-changes/`)
- [eden-treaty-refactor.md](./recent-changes/eden-treaty-refactor.md): remoção do wrapper e retorno da inferência.
- [type-inference-fix.md](./recent-changes/type-inference-fix.md): lições aprendidas com tipos `unknown`.

## Como Navegar

| Cenário                        | Caminho sugerido                                                                  |
|-------------------------------|-----------------------------------------------------------------------------------|
| Primeira vez no projeto       | `00-QUICK-START.md` → `project/overview.md`                                       |
| Entender arquitetura/config   | `project/architecture.md` → `project/configuration.md`                            |
| Criar nova funcionalidade     | `development/patterns.md` → `examples/crud-complete.md`                          |
| Trabalhar com Eden Treaty     | `development/eden-treaty-guide.md` → `recent-changes/eden-treaty-refactor.md`     |
| Ajustar configuração/ambiente | `project/configuration.md` → `reference/environment-vars.md`                      |
| Resolver problemas            | `reference/troubleshooting.md`                                                    |

## Regras Essenciais

**Nunca**
- Alterar código em `core/` (framework é read-only).
- Reintroduzir wrappers para Eden Treaty (`apiCall()` ou similares).
- Ignorar `response` schemas nas rotas.

**Sempre**
- Trabalhar dentro de `app/`.
- Usar Eden Treaty nativo: `const { data, error } = await api.users.get()`.
- Centralizar tipos compartilhados em `app/shared/`.
- Validar alterações com `bun run dev` e os testes disponíveis.

## Estado Atual (v1.9+)

- Eden Treaty nativo com inferência completa.
- Sistema declarativo de configuração (`fluxstack.config.ts` na raiz + `config/*.config.ts`).
- Plugins core revisados (Vite, Swagger, arquivos estáticos, Live Components) e plugin externo `crypto-auth`.
- Documentação alinhada com o código em janeiro/2025.

## Atalhos de Suporte

1. Erros pontuais → `reference/troubleshooting.md`
2. Fluxo de desenvolvimento → `development/patterns.md`
3. Eden Treaty e tipos → `development/eden-treaty-guide.md`
4. Configuração e ambientes → `project/configuration.md`
5. CLI e automações → `reference/cli-commands.md`
6. Live components/tempo real → `development/live-components.md`
7. Observabilidade → `development/monitoring.md`
8. Exemplo completo → `examples/crud-complete.md`

---

Objetivo: manter assistentes alinhados com o estado real do FluxStack, garantindo respostas corretas e código consistente com os padrões do projeto.
