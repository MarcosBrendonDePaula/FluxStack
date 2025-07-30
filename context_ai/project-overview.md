# FluxStack - Visão Geral do Projeto

## O que é o FluxStack?

FluxStack é um framework full-stack moderno em TypeScript que combina:
- **Backend**: Elysia.js (web framework ultra-performático)
- **Frontend**: React + Vite (desenvolvimento moderno)
- **Runtime**: Bun (JavaScript runtime ultra-rápido)
- **Type Safety**: Eden Treaty para APIs completamente tipadas

## Estrutura do Projeto

```
FluxStack/
├── core/                    # 🔧 Core do Framework (NÃO EDITAR)
│   ├── server/
│   │   ├── framework.ts     # Classe principal FluxStackFramework
│   │   ├── plugins/         # Sistema de plugins (logger, vite, static)
│   │   └── standalone.ts    # Servidor standalone
│   ├── client/
│   │   └── standalone.ts    # Cliente standalone
│   ├── build/
│   │   └── index.ts         # Sistema de build FluxStackBuilder
│   ├── cli/
│   │   └── index.ts         # CLI do framework
│   ├── templates/
│   │   └── create-project.ts # Sistema de criação de projetos
│   └── types/
│       └── index.ts         # Tipos do framework
├── app/                     # 👨‍💻 Código da Aplicação (EDITAR AQUI)
│   ├── server/
│   │   ├── controllers/     # Lógica de negócio
│   │   ├── routes/          # Definição de rotas API
│   │   ├── types/           # Tipos do servidor
│   │   ├── index.ts         # Entry point da aplicação
│   │   └── backend-only.ts  # Modo backend standalone
│   ├── client/
│   │   ├── src/
│   │   │   ├── components/  # Componentes React
│   │   │   ├── lib/         # Utilitários (API client)
│   │   │   ├── types/       # Tipos do cliente
│   │   │   └── App.tsx      # Componente principal
│   │   └── frontend-only.ts # Modo frontend standalone
│   └── shared/
│       └── types.ts         # Tipos compartilhados entre client/server
├── tests/                   # 🧪 Sistema de Testes
│   ├── unit/                # Testes unitários
│   ├── integration/         # Testes de integração  
│   ├── e2e/                 # Testes end-to-end
│   ├── __mocks__/           # Mocks para testes
│   ├── fixtures/            # Dados de teste
│   └── utils/               # Utilitários de teste
├── context_ai/              # 📋 Documentação para IAs
│   ├── project-overview.md  # Este arquivo
│   ├── architecture-guide.md # Arquitetura detalhada
│   ├── development-patterns.md # Padrões de desenvolvimento
│   └── api-reference.md     # Referência completa de APIs
├── config/
│   └── fluxstack.config.ts  # Configuração principal
├── vitest.config.ts         # Configuração de testes
└── dist/                    # Build de produção
```

## Comandos Principais

### Criação de Projetos
```bash
# Criar novo projeto FluxStack
flux create meu-projeto         # Projeto básico
flux create meu-projeto basic   # Projeto básico (explícito)
flux create meu-projeto full    # Projeto completo

# O comando automaticamente:
# - Cria estrutura completa do projeto
# - Instala todas as dependências
# - Configura TypeScript, Vite, testes
# - Inicializa repositório git
# - Projeto pronto para 'bun run dev'
```

### Desenvolvimento
```bash
# Full-stack (recomendado)
bun run dev              # Frontend + Backend integrados (porta 3000)

# Separados (para equipes grandes)
bun run dev:frontend     # Frontend apenas (porta 5173)
bun run dev:backend      # Backend apenas (porta 3001)
```

### Testes
```bash
bun run test            # Modo watch (desenvolvimento)
bun run test:run        # Executar testes uma vez
bun run test:ui         # Interface visual do Vitest
bun run test:coverage   # Relatório de cobertura
bun run test:watch      # Modo watch explícito
```

### Produção
```bash
bun run build           # Build completo
bun run start           # Iniciar servidor de produção
```

## Modos de Operação

### 1. Full-Stack Integrado (Padrão)
- Elysia serve frontend e backend juntos
- Proxy automático Vite ↔ Elysia
- Porta única: 3000
- Ideal para projetos pequenos/médios

### 2. Frontend + Backend Separados
- Frontend: Vite dev server (porta 5173)
- Backend: API standalone (porta 3001)
- Proxy automático: `/api/*` → 3001
- Ideal para equipes grandes e microserviços

### 3. Apenas Frontend
- SPA standalone com API externa
- Configurar `API_URL` para API remota

### 4. Apenas Backend
- API pura para mobile/outros frontends
- Health check em `/health`

## Path Aliases

O framework suporta aliases para imports limpos:

### Framework Level
```typescript
"@/core/*"     // ./core/*
"@/app/*"      // ./app/*
"@/config/*"   // ./config/*
"@/shared/*"   // ./app/shared/*
```

### Frontend Level (dentro de app/client)
```typescript
"@/*"            // ./src/*
"@/components/*" // ./src/components/*
"@/lib/*"        // ./src/lib/*
"@/types/*"      // ./src/types/*
```

## Type Safety com Eden Treaty

FluxStack usa Eden Treaty para APIs completamente tipadas:

```typescript
// Backend: definir API
export const usersRoutes = new Elysia({ prefix: "/users" })
  .get("/", () => UsersController.getUsers())
  .post("/", ({ body }) => UsersController.createUser(body))

// Frontend: usar API tipada
const { data } = await api.api.users.get()  // Tipos automáticos!
```

## Principais Tecnologias

- **Elysia.js**: Web framework com performance excepcional
- **Bun**: Runtime JavaScript ultra-rápido
- **React**: Biblioteca de interface moderna
- **Vite**: Build tool com HMR instantâneo
- **TypeScript**: Type safety completo
- **Eden Treaty**: Cliente HTTP type-safe

## Sistema de Testes

FluxStack inclui sistema de testes completo com **Vitest + Testing Library**:

### Estrutura de Testes
```
tests/
├── unit/                   # Testes unitários
│   ├── core/              # Testes do framework
│   ├── app/               # Testes da aplicação
│   │   ├── controllers/   # Testes de controllers
│   │   └── client/        # Testes de componentes React
├── integration/           # Testes de integração (APIs)
├── e2e/                   # Testes end-to-end (futuro)
├── __mocks__/             # Mocks para testes
├── fixtures/              # Dados de teste
└── utils/                 # Utilitários de teste
```

### Comandos de Teste
```bash
bun run test               # Modo watch (desenvolvimento)
bun run test:run          # Executar uma vez
bun run test:ui           # Interface visual do Vitest
bun run test:coverage     # Relatório de cobertura
```

### Tipos de Testes Incluídos
- **Unit Tests**: Controllers, componentes React, funções
- **Integration Tests**: Rotas de API, endpoints
- **Component Tests**: Renderização, interação com usuário
- **Mocks**: APIs, dados de teste, fixtures

## Para IAs: Pontos Importantes

1. **NÃO EDITAR** arquivos em `core/` - são do framework
2. **SEMPRE EDITAR** em `app/` - código da aplicação
3. **Usar path aliases** para imports limpos
4. **Manter tipos compartilhados** em `app/shared/types.ts`
5. **Seguir padrão MVC**: Controllers → Routes → Framework
6. **Type safety**: Sempre usar Eden Treaty para APIs
7. **Criar testes** para novas funcionalidades em `tests/`
8. **Usar `flux create`** para novos projetos