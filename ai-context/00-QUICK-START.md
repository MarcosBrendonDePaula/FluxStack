# FluxStack – Quick Start para Assistentes

Objetivo: saber onde mexer, quais comandos usar e como manter a type safety em menos de dois minutos.

## Comandos Essenciais

```bash
# Desenvolvimento (escolha um)
bun run dev          # backend + frontend com hot reload
bun run dev          # logs automaticamente filtrados

# Build e produção
bun run build        # build completo (frontend + backend)
bun run start        # inicia servidor de produção a partir de dist/
```

Portas padrão:
- Backend/API: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- Swagger: `http://localhost:3000/swagger`

## Estrutura Fundamental

```
FluxStack/
├─ core/         # framework (não alterar)
├─ app/          # código da aplicação
│  ├─ server/    # controllers, routes, serviços
│  ├─ client/    # React, pages, componentes
│  └─ shared/    # tipos compartilhados
├─ config/       # camadas declarativas consumidas pela app
├─ plugins/      # plugins adicionais (ex.: crypto-auth)
└─ ai-context/   # esta documentação
```

## Regras de Ouro

**Nunca**
- editar arquivos em `core/`;
- envolver Eden Treaty em wrappers (`apiCall()` etc.);
- omitir `response` schemas nas rotas.

**Sempre**
- trabalhar dentro de `app/` e `config/`;
- usar Eden Treaty nativo: `const { data, error } = await api.users.get();`;
- manter tipos compartilhados em `app/shared/`;
- rodar `bun run dev` (ou testes) após alterações críticas.

## Próximo Passo

Escolha o cenário:
- Entender o estado atual -> `project/overview.md`
- Conhecer a arquitetura/configuração -> `project/architecture.md` + `project/configuration.md`
- Preparar build/deploy -> `project/build-pipeline.md`
- Trabalhar com CLI/geradores -> `reference/cli-commands.md`
- Criar novas features -> `development/patterns.md`
- Trabalhar com Eden Treaty -> `development/eden-treaty-guide.md`
- Live Components/tempo real -> `development/live-components.md`
- Observabilidade -> `development/monitoring.md`
- Resolver problemas -> `reference/troubleshooting.md`

---

Com estes pontos você já consegue navegar, configurar e alterar o FluxStack com segurança. Boa sessão!
