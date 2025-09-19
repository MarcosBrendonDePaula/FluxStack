# FluxStack - AI Context Documentation

## Visão Geral do Projeto

**FluxStack** é um framework full-stack TypeScript moderno que combina:
- **Backend**: Elysia.js com runtime Bun
- **Frontend**: React 19 + Vite
- **Comunicação**: Eden Treaty para type-safety end-to-end
- **Documentação**: Swagger UI integrado
- **Deploy**: Docker configurado e otimizado
- **Testes**: Vitest + Testing Library

## Arquitetura Atual

```
FluxStack/
├── app/
│   ├── client/          # React frontend com Vite
│   │   ├── src/
│   │   │   ├── App.tsx  # Interface principal com tabs integradas
│   │   │   ├── App.css  # Estilos modernos e limpos
│   │   │   └── lib/
│   │   │       └── eden-api.ts  # Cliente Eden Treaty type-safe
│   └── server/          # Backend Elysia.js
│       ├── index.ts     # Entry point com plugins configurados
│       ├── controllers/ # Controladores da aplicação
│       └── routes/      # Rotas da API com documentação Swagger
├── core/                # Framework core
│   ├── server/
│   │   ├── framework.ts # Classe principal FluxStackFramework
│   │   └── plugins/     # Sistema de plugins
│   │       ├── logger.ts   # Plugin de logging
│   │       ├── vite.ts     # Plugin Vite dev server
│   │       ├── swagger.ts  # Plugin Swagger UI
│   │       └── static.ts   # Plugin arquivos estáticos
│   ├── types/          # Tipos TypeScript compartilhados
│   └── config/         # Configurações do framework
└── docker/             # Configurações Docker otimizadas
```

## Estado Atual da Interface

### Frontend Redesignado (App.tsx)
- **Interface em abas integradas no header**: Visão Geral, Demo, API Docs
- **Página principal (/)**: Apresentação da stack com funcionalidades
- **Demo interativo**: CRUD de usuários usando Eden Treaty
- **API Docs**: Swagger UI integrado via iframe + links externos

### Funcionalidades Implementadas
1. **Type-safe API calls** com Eden Treaty
2. **Sistema de notificações** (toasts) para feedback
3. **Estados de carregamento** e tratamento de erros
4. **Interface responsiva** com design moderno
5. **Documentação automática** com Swagger UI

## Configuração do Swagger

### Plugin Swagger (core/server/plugins/swagger.ts)
```typescript
export const swaggerPlugin: Plugin = {
  name: 'swagger',
  setup(context: FluxStackContext, app: any) {
    app.use(swagger({
      path: '/swagger',  // Mudado de /api/swagger para /swagger
      documentation: {
        info: {
          title: 'FluxStack API',
          version: '1.0.0',
          description: 'Modern full-stack TypeScript framework'
        },
        tags: [
          { name: 'Health', description: 'Health check endpoints' },
          { name: 'Users', description: 'User management endpoints' }
        ]
      }
    }))
  }
}
```

### Ordem de Registro (app/server/index.ts)
```typescript
// IMPORTANTE: Swagger deve ser registrado ANTES das rotas
app
  .use(swaggerPlugin)  // Primeiro: Swagger
  .use(loggerPlugin)
  .use(vitePlugin)

app.routes(apiRoutes)    // Depois: Rotas da aplicação
```

### URLs da Documentação
- **Swagger UI**: `http://localhost:3000/swagger`
- **OpenAPI JSON**: `http://localhost:3000/swagger/json`

## Eden Treaty Integration

### Cliente API (app/client/src/lib/eden-api.ts)
```typescript
import { treaty } from '@elysiajs/eden'
import type { App } from '../../../server/app'

const client = treaty<App>(getBaseUrl())
export const api = client.api

// Wrapper para chamadas com tratamento de erro
export const apiCall = async (promise: Promise<any>) => {
  try {
    const response = await promise
    if (response.error) throw new Error(response.error)
    return response.data || response
  } catch (error) {
    throw error
  }
}
```

### Uso no Frontend
```typescript
// Listar usuários
const users = await apiCall(api.users.get())

// Criar usuário
const newUser = await apiCall(api.users.post({
  name: "João Silva",
  email: "joao@example.com"
}))

// Deletar usuário
await apiCall(api.users[userId.toString()].delete())
```

## Rotas Documentadas

### Health Check
- `GET /api/health` - Status da API
- `GET /api/` - Mensagem de boas-vindas

### Users CRUD
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Buscar usuário por ID
- `POST /api/users` - Criar usuário
- `DELETE /api/users/:id` - Deletar usuário

Todas as rotas possuem documentação Swagger completa com tags, descrições e schemas.

## Sistema de Plugins

### Interface Plugin (core/types/index.ts)
```typescript
export interface Plugin {
  name: string
  setup: (context: FluxStackContext, app: any) => void
}
```

### Plugins Disponíveis
1. **loggerPlugin** - Logging de requests/responses
2. **vitePlugin** - Dev server para desenvolvimento
3. **swaggerPlugin** - Documentação automática
4. **staticPlugin** - Servir arquivos estáticos (produção)

## Desenvolvimento

### Instalação Unificada ⚡
```bash
git clone <repo>
cd FluxStack
bun install          # Uma única instalação para todo o projeto! 🎉
```

### Comandos Principais
```bash
bun run dev          # ✅ Full-stack: Backend (3000) + Vite integrado (5173)
bun run dev:clean    # ✅ Servidor com output limpo (filtra erros HEAD do Elysia)
bun run dev:backend  # ✅ Backend apenas com hot reload (porta 3001)
bun run dev:frontend # ✅ Frontend apenas com Vite (porta 5173)
bun run build        # Build para produção
bun run test         # Executa testes
bun run test:ui      # Interface visual do Vitest
bun run test:coverage # Relatório de cobertura
bun run legacy:dev   # Comando direto com Bun watch (alternativo)
```

### Estrutura de Desenvolvimento
- **Hot reload independente** - Backend e frontend se recarregam separadamente
- **Vite integrado** - Frontend roda no mesmo processo do backend (portas diferentes)
- **Detecção inteligente** - Não reinicia Vite se já estiver rodando
- **Type safety** end-to-end com TypeScript
- **API auto-documentada** com Swagger
- **Testes integrados** com Vitest

## Mudanças Recentes Importantes

### v1.4.0 - Monorepo Unificado 🎯
1. **Estrutura monorepo** - Um único `package.json` para todo o projeto
2. **Instalação simplificada** - Apenas `bun install` une backend e frontend
3. **Dependências centralizadas** - Sem duplicação, gerenciamento mais fácil
4. **Configuração unificada** - Vite, ESLint e TypeScript no root
5. **Build otimizado** - Sistema de build simplificado e mais rápido

### v1.3.1 - Hot Reload & Vite Integration Fix
1. **Hot reload backend corrigido** - CLI agora usa `bun --watch` para recarregamento automático
2. **Vite integrado ao backend** - Frontend e backend no mesmo processo, hot reload independente
3. **Detecção inteligente** - Plugin verifica se Vite já está rodando antes de iniciar
4. **Backend isolamento melhorado** - Comando `bun run dev:backend` com hot reload próprio
5. **Comando legacy atualizado** - `bun run legacy:dev` agora usa watch mode

### v1.3.0 - Complete Integration & Install Fix
1. **Swagger UI integrado** com iframe na aba API Docs
2. **Frontend completamente redesenhado** com interface em abas
3. **Eden Treaty otimizado** com tratamento de erros melhorado
4. **Documentação automática** para todos os endpoints
5. **Interface moderna** com design limpo e responsivo
6. **Script de instalação corrigido** com postinstall hook
7. **Documentação AI atualizada** com contexto completo

### Problemas Resolvidos
- ✅ Compatibilidade de tipos Eden Treaty entre client/server
- ✅ Sistema de tabs confuso -> tabs integrados no header
- ✅ Botão delete não funcionava -> implementado Eden Treaty
- ✅ Plugin system error -> interface atualizada
- ✅ Swagger sem rotas -> ordem de registro corrigida
- ✅ Script install com loop infinito -> mudado para postinstall hook
- ✅ **Hot reload backend não funcionava** -> CLI agora usa `bun --watch`
- ✅ **Teste deleteUser falhava** -> adicionado reset de dados entre testes
- ✅ **Erros TypeScript na build** -> tipos corrigidos em routes e frontend
- ✅ **Estrutura de instalação complexa** -> unificado em monorepo
- ✅ **Duplicação de dependências** -> centralizadas no root
- ✅ **Build em 2 etapas** -> processo unificado e otimizado
- ✅ **Spam de erros HEAD do Elysia** -> comando `dev:clean` filtra erros desnecessários

## Próximos Passos Sugeridos

### Funcionalidades Pendentes
1. **Database integration** - Adicionar suporte a banco de dados
2. **Authentication system** - Sistema de autenticação
3. **Error handling** - Melhorar tratamento de erros global
4. **Real-time features** - WebSockets/Server-Sent Events
5. **API versioning** - Versionamento da API

### Melhorias Técnicas
- Implementar middleware de validação customizado
- Adicionar cache de responses
- Otimizar bundle size do frontend
- Implementar CI/CD pipeline
- Adicionar monitoring e métricas

## Comandos de Desenvolvimento Úteis

```bash
# Instalação completa (backend + frontend)
bun install

# Desenvolvimento
bun run dev                    # Full-stack development server
bun run dev:clean             # Servidor com output limpo (sem erros HEAD)
bun run dev:frontend          # Frontend apenas (porta 5173)
bun run dev:backend           # Backend apenas (porta 3001)

# Testes
bun run test                  # Modo watch
bun run test:run             # Executar uma vez
bun run test:ui              # Interface visual
bun run test:coverage        # Com cobertura

# Build
bun run build                # Build completo
bun run build:frontend       # Build frontend
bun run build:backend        # Build backend

# Produção
bun run start                # Servidor de produção

# Docker development
docker-compose up -d

# Testar API
curl http://localhost:3000/api/health
curl http://localhost:3000/swagger/json
```

Esta documentação deve ser atualizada sempre que houver mudanças significativas na arquitetura ou funcionalidades do projeto.