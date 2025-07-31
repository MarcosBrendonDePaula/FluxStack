# ⚡ FluxStack

**Modern full-stack TypeScript framework with Elysia + React + Bun**

Um framework moderno e ultra-performático para criar aplicações full-stack com type-safety end-to-end e experiência de desenvolvimento excepcional.

## ✨ Características

- 🚀 **Bun** - Runtime ultra-rápido
- 🦊 **Elysia** - Web framework performático  
- ⚛️ **React + Vite** - Frontend moderno
- 🔒 **TypeScript** - Type-safety completo
- 🔌 **Sistema de Plugins** - Extensível
- 🏗️ **CLI Integrado** - Comandos simples
- 📦 **Build Otimizado** - Produção ready
- 🎯 **Criação de Projetos** - `flux create` comando
- 🧪 **Sistema de Testes** - Vitest + Testing Library
- 📚 **API Documentation** - Swagger UI integrado
- 🔗 **Eden Treaty** - Type-safe API client
- 📋 **Documentação AI** - Guias para IAs em `CLAUDE.md`

## 🚀 Início Rápido

### Criar Novo Projeto
```bash
# Instalar FluxStack globalmente (opcional)
bun add -g fluxstack

# Criar novo projeto
flux create meu-projeto
cd meu-projeto

# Ou clonar este repositório
git clone https://github.com/fluxstack/fluxstack.git
cd fluxstack
bun install
```

### Desenvolvimento
```bash
bun run dev
```

**URLs disponíveis:**
- 🌐 **Frontend**: `http://localhost:3000`
- 📚 **API Docs (Swagger)**: `http://localhost:3000/swagger`
- 🔍 **Health Check**: `http://localhost:3000/api/health`

### Testes
```bash
bun run test              # Modo watch
bun run test:run         # Executar uma vez
bun run test:coverage    # Com cobertura
```

### Produção
```bash
bun run build
bun run start
```

## 📁 Estrutura do Projeto

```
fluxstack/
├── core/                    # 🔧 Framework (não editar)
│   ├── server/             # Servidor base Elysia
│   │   ├── framework.ts    # Core do framework
│   │   └── plugins/        # Plugins do sistema
│   ├── client/             # Cliente base React
│   ├── build/              # Sistema de build
│   ├── cli/                # CLI tools
│   ├── templates/          # Templates para flux create
│   └── types/              # Types do framework
├── app/                    # 👨‍💻 Seu código aqui
│   ├── server/             # APIs e controllers
│   │   ├── controllers/    # Lógica de negócio
│   │   ├── routes/         # Definição de rotas (com Swagger docs)
│   │   └── index.ts        # Entry point da app
│   ├── client/             # Frontend React moderno
│   │   ├── src/
│   │   │   ├── App.tsx     # Interface com tabs integradas
│   │   │   ├── App.css     # Estilos modernos
│   │   │   └── lib/
│   │   │       └── eden-api.ts  # Cliente Eden Treaty
│   └── shared/             # Types compartilhados
├── tests/                  # 🧪 Sistema de testes
│   ├── unit/               # Testes unitários
│   ├── integration/        # Testes de integração
│   ├── __mocks__/          # Mocks para testes
│   └── fixtures/           # Dados de teste
├── CLAUDE.md               # 📋 Documentação AI (contexto completo)
├── context_ai/             # 📋 Documentação para IAs (legado)
│   ├── project-overview.md # Visão geral do projeto
│   ├── architecture-guide.md # Guia de arquitetura
│   └── development-patterns.md # Padrões de desenvolvimento
├── config/                 # ⚙️ Configurações
│   └── fluxstack.config.ts # Config principal
├── vitest.config.ts        # Configuração de testes
└── dist/                   # 📦 Build de produção
```

## 🔧 CLI Comandos

### **Full-Stack (Padrão)**
```bash
# Desenvolvimento completo (frontend + backend)
flux dev                    # ou bun run dev

# Build completo
flux build                  # ou bun run build

# Produção completa
flux start                  # ou bun run start
```

### **Frontend Apenas** ⚛️
```bash
# Desenvolvimento frontend (Vite dev server)
flux frontend               # ou bun run dev:frontend
# Porta: 5173

# Build frontend
flux build:frontend         # ou bun run build:frontend
```

### **Backend Apenas** 🦊
```bash
# Desenvolvimento backend (API server)
flux backend                # ou bun run dev:backend  
# API: http://localhost:3001
# Health: http://localhost:3001/health

# Build backend
flux build:backend          # ou bun run build:backend
```

### **Criação de Projetos**
```bash
# Criar novo projeto FluxStack
flux create my-app          # Projeto básico
flux create my-app basic    # Projeto básico (explícito)
flux create my-app full     # Projeto completo com exemplos

# O comando cria:
# - Estrutura completa do projeto
# - Configurações (package.json, tsconfig, etc.)
# - Dependências instaladas automaticamente
# - Repositório git inicializado
# - Pronto para 'bun run dev'
```

### **Sistema de Testes**
```bash
# Executar testes
bun run test               # Modo watch (desenvolvimento)
bun run test:run          # Executar uma vez
bun run test:ui           # Interface visual do Vitest
bun run test:coverage     # Relatório de cobertura
bun run test:watch        # Modo watch explícito

# Estrutura de testes
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
├── e2e/           # Testes end-to-end
├── __mocks__/     # Mocks para testes
└── fixtures/      # Dados de teste
```

### **Outros Comandos**
```bash
# Help
flux                        # Mostra todos os comandos
```

### **Variáveis de Ambiente**
```bash
FRONTEND_PORT=5173          # Porta do frontend
BACKEND_PORT=3001           # Porta do backend
API_URL=http://localhost:3001  # URL da API para o frontend
```

### **🌐 Mapeamento de Portas**

| Modo | Frontend | Backend | Observações |
|------|----------|---------|-------------|
| **Full-Stack** | - | `3000` | Elysia serve tudo junto |
| **Frontend Only** | `5173` | - | Vite dev server + proxy para API externa |
| **Backend Only** | - | `3001` | API standalone |
| **Separados** | `5173` | `3001` | **Proxy**: `/api/*` → `3001` |

### **📋 Testando APIs**

```bash
# Modo Full-Stack (porta 3000)
curl http://localhost:3000/api/users

# Modo Backend Only (porta 3001)
curl http://localhost:3001/api/users

# Modo Frontend + Backend separados
# Frontend: http://localhost:5173
# API via proxy: http://localhost:5173/api/users → 3001
curl http://localhost:5173/api/users
```

## 🔌 Sistema de Plugins

O framework possui um sistema de plugins extensível:

### Plugins Inclusos:
- **Logger**: Log automático de requests/responses
- **Swagger**: Documentação automática da API
- **Vite**: Integração com Vite dev server
- **Static**: Servir arquivos estáticos

### Criando um Plugin:
```typescript
import type { Plugin } from "../core/types"

export const meuPlugin: Plugin = {
  name: "meu-plugin",
  setup: (context, app) => {
    console.log("🔌 Meu plugin ativado")
    // Sua lógica aqui - agora com acesso ao app Elysia
  }
}
```

## 📖 Desenvolvimento

### **Cenários de Uso** 🎯

#### **1. Full-Stack Integrado** (Recomendado para pequenos/médios projetos)
```bash
flux dev  # Frontend + Backend juntos
```
- ✅ Um só comando para tudo
- ✅ Proxy automático Elysia → Vite
- ✅ Ideal para desenvolvimento rápido

#### **2. Frontend e Backend Separados** (Ideal para equipes grandes)
```bash
# Terminal 1: Backend API (porta 3001)
flux backend
# API disponível em: http://localhost:3001

# Terminal 2: Frontend (porta 5173)  
flux frontend  
# Frontend disponível em: http://localhost:5173
# Proxy automático: /api/* → http://localhost:3001
```
- ✅ Desenvolvimento independente
- ✅ Equipes separadas (front/back)
- ✅ Deploy independente
- ✅ Microserviços ready
- ✅ **Proxy automático configurado**

#### **3. Apenas Frontend** (Para criar SPAs)
```bash
flux frontend
# Configure API_URL para API externa
```

#### **4. Apenas Backend** (Para criar APIs)
```bash
flux backend  
# API standalone na porta 3001
```

### **Adicionando Rotas com Swagger**
```typescript
// app/server/routes/example.routes.ts
import { Elysia, t } from "elysia"

export const exampleRoutes = new Elysia({ prefix: "/example" })
  .get("/", () => ({ message: "Hello World!" }), {
    detail: {
      tags: ['Example'],
      summary: 'Get example message',
      description: 'Returns a simple hello world message'
    }
  })
  .post("/", ({ body }) => ({ received: body }), {
    body: t.Object({
      message: t.String()
    }),
    detail: {
      tags: ['Example'],
      summary: 'Echo message',
      description: 'Echoes back the received message'
    }
  })
```

### **Criando Controllers**
```typescript
// app/server/controllers/example.controller.ts
export class ExampleController {
  static async getData() {
    return { data: "exemplo" }
  }
}
```

### **Componentes React com Eden Treaty**
```tsx
// app/client/src/components/Example.tsx
import { useState, useEffect } from 'react'
import { api, apiCall } from '@/lib/eden-api'

export function Example() {
  const [data, setData] = useState<any>(null)
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await apiCall(api.example.get())
        setData(result)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }
    
    loadData()
  }, [])
  
  return (
    <div>
      <h2>Exemplo com Eden Treaty</h2>
      {data ? <p>{data.message}</p> : <p>Carregando...</p>}
    </div>
  )
}
```

## 🔀 **Path Aliases (@)**

FluxStack suporta aliases de path para imports mais limpos e organizados:

### **Alias Disponíveis:**

```typescript
// Framework
"@/core/*"       // ./core/*
"@/app/*"        // ./app/*  
"@/config/*"     // ./config/*
"@/shared/*"     // ./app/shared/*

// Frontend (dentro do client)
"@/*"            // ./src/*
"@/components/*" // ./src/components/*
"@/utils/*"      // ./src/utils/*
"@/hooks/*"      // ./src/hooks/*
"@/assets/*"     // ./src/assets/*
"@/lib/*"        // ./src/lib/*
"@/types/*"      // ./src/types/*
```

### **Exemplos de Uso:**

#### **Frontend (React):**
```tsx
// ❌ Antes
import { api } from '../../../lib/api'
import Logo from '../../../assets/logo.svg'
import { Button } from '../../components/Button'

// ✅ Agora
import { api } from '@/lib/api'
import Logo from '@/assets/logo.svg'
import { Button } from '@/components/Button'
```

#### **Backend (Server):**
```typescript
// ❌ Antes  
import { FluxStackFramework } from '../../core/server'
import { config } from '../../config/fluxstack.config'
import { UserType } from '../shared/types'

// ✅ Agora
import { FluxStackFramework } from '@/core/server'
import { config } from '@/config/fluxstack.config'
import { UserType } from '@/shared/types'
```

### **Configuração Automática:**
✅ **TypeScript**: `tsconfig.json` + `tsconfig.app.json`  
✅ **Vite**: `vite.config.ts`  
✅ **Bun**: `bunfig.toml`  
✅ **Intellisense**: Autocomplete funciona em VSCode

## 🏗️ Build e Deploy

### Build Local
```bash
bun run build
```

### Deploy
O build gera:
- `dist/index.js` - Servidor otimizado
- `app/client/dist/` - Assets do React

### Variáveis de Ambiente
```bash
NODE_ENV=production  # Modo produção
PORT=3000           # Porta do servidor
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

**Built with ❤️ by the FluxStack Team using Bun, Elysia and React**
