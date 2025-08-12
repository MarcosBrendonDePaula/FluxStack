# FluxStack - AI Context Documentation

## Visão Geral do Projeto

**FluxStack** é um framework full-stack TypeScript moderno que combina:
- **Backend**: Elysia.js com runtime Bun
- **Frontend**: React 19 + Vite
- **Comunicação**: Eden Treaty para type-safety end-to-end + WebSocket Live Components
- **LiveActions**: Sistema de componentes em tempo real com estado sincronizado
- **Helpers**: Sistema completo de decorators, validadores e CLI para desenvolvimento rápido
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
│   ├── decorators/     # Sistema de decorators para LiveAction
│   │   ├── LiveActionDecorators.ts  # Decorators avançados (experimentais)
│   │   └── SimpleDecorators.ts      # Decorators simples e funcionais
│   ├── helpers/        # Helpers para desenvolvimento LiveAction
│   │   └── LiveActionHelpers.ts     # Utilities e builders type-safe
│   ├── validators/     # Sistema de validação
│   │   ├── LiveActionValidators.ts  # Validação avançada (experimental)
│   │   └── SimpleValidators.ts      # Validadores simples e funcionais
│   ├── cli/           # Gerador CLI de componentes
│   │   ├── generator.ts    # CLI principal para gerar componentes
│   │   ├── wizard.ts       # Wizard interativo
│   │   └── templates/      # Templates para geração
│   ├── types/          # Tipos TypeScript compartilhados
│   ├── config/         # Configurações do framework
│   └── index.ts        # Export central unificado
├── app/server/live/    # Sistema Live Components
│   ├── index.ts        # Registry de todos os componentes Live
│   └── components/     # LiveAction components
│       ├── CounterAction.ts     # Exemplo: contador em tempo real
│       ├── ClockAction.ts       # Exemplo: relógio sincronizado
│       ├── CalculatorAction.ts  # Exemplo: calculadora com funções async
│       ├── ToastAction.ts       # Sistema de notificações
│       └── ExampleEnhancedAction.ts  # Exemplo usando todos os helpers
└── docker/             # Configurações Docker otimizadas
```

## Sistema Live Components

### Conceito
Live Components são componentes React que mantêm estado sincronizado entre cliente e servidor via WebSocket, similar ao Laravel Livewire.

### Arquitetura
- **Backend**: LiveAction classes que gerenciam estado e lógica de negócio
- **Frontend**: React components que usam hook `useLive()` para sincronização
- **Comunicação**: WebSocket para atualizações bidirecionais em tempo real
- **Estado**: Sincronizado automaticamente entre todos os clientes conectados

### Fluxo de Funcionamento
1. Cliente chama `callMethod('actionName', params)`
2. WebSocket envia requisição para o servidor
3. LiveAction executa o método e atualiza o estado
4. Servidor envia novo estado via WebSocket
5. Todos os clientes recebem atualização automaticamente

### Hook useLive()
```typescript
const { 
  state,           // Estado atual do componente
  loading,         // Indica se uma ação está executando
  error,           // Erro da última operação
  connected,       // Status da conexão WebSocket
  callMethod,      // Função para chamar métodos do servidor
  componentId      // ID único do componente
} = useLive({
  name: 'MyAction',              // Nome da LiveAction class
  props: { initialValue: 'test' }, // Props para inicialização
  componentId: 'my-unique-id',   // ID opcional do componente
  eventHandlers: {               // Event handlers estilo Livewire
    'custom-event': (data) => console.log(data)
  }
})
```

### Componentes Live Disponíveis
- **Counter**: Contador compartilhado com incremento/decremento
- **Clock**: Relógio sincronizado com múltiplos fusos horários  
- **Calculator**: Calculadora com funções síncronas e assíncronas
- **Toast**: Sistema de notificações com persistência
- **ExampleEnhanced**: Demonstração completa dos helpers

## Estado Atual da Interface

### Frontend Redesignado (App.tsx)
- **Interface em abas integradas no header**: 5 abas principais
- **📋 Visão Geral**: Apresentação da stack com recursos e tecnologias
- **🚀 Demo**: CRUD de usuários interativo usando Eden Treaty
- **📚 API Docs**: Swagger UI integrado via iframe + links externos  
- **🔥 Live Components**: Demonstrações dos componentes em tempo real
- **🍞 Toast & Hydration**: Testes de estado persistente e recuperação

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

## Sistema de Helpers para Definição de Classes LiveAction

### Visão Geral
FluxStack inclui um sistema completo para facilitar a criação e definição de classes LiveAction, eliminando código repetitivo e padronizando logging, validação e lifecycle.

### Configuração TypeScript Necessária
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Import Unificado
```typescript
import { 
  LiveAction, 
  SimpleAction, 
  SimpleLifecycle, 
  SimpleValidate, 
  Validators, 
  ValidationMessages 
} from '@/core'
```

### Decorators Simples (Recomendados)

#### @SimpleAction - Logging Automático
```typescript
export class UserAction extends LiveAction {
  @SimpleAction('Atualizar nome do usuário')
  updateName(newName: string) {
    // Automaticamente loga: "🎯 UserAction.updateName() called"
    // + descrição da ação
    this.name = newName
    return { success: true }
  }
}
```

#### @SimpleLifecycle - Lifecycle com Logging
```typescript
@SimpleLifecycle('mount')
mount() {
  // Automaticamente loga: "🔄 UserAction lifecycle: mount (component-id)"
  console.log('Componente inicializado')
}

@SimpleLifecycle('unmount')
unmount() {
  // Automaticamente loga: "🔄 UserAction lifecycle: unmount (component-id)"
  console.log('Componente finalizado')
}
```

#### @SimpleValidate - Validação Automática
```typescript
@SimpleAction('Enviar mensagem')
@SimpleValidate(
  Validators.safeString(2, 100),
  ValidationMessages.safeString(2, 100)
)
sendMessage(message: string) {
  // Validação aplicada automaticamente ANTES da execução
  // Se inválida, método nem executa e erro é lançado
  this.messages.push(message)
  return { success: true }
}
```

### Sistema de Validadores Pré-definidos

#### Validadores Básicos
```typescript
Validators.required        // Campo obrigatório
Validators.email          // Formato de email
Validators.positive       // Números positivos
Validators.minLength(n)   // Comprimento mínimo
Validators.maxLength(n)   // Comprimento máximo
Validators.range(min,max) // Faixa numérica
Validators.alphanumeric   // Apenas letras, números e espaços
Validators.stringRange(min,max) // String com tamanho específico
```

#### Validadores Compostos
```typescript
Validators.safeString(2, 50)  // String segura: 2-50 chars, alfanumérica, sem "teste"
Validators.and(validator1, validator2)  // Todos devem passar
Validators.or(validator1, validator2)   // Pelo menos um deve passar
```

#### Mensagens de Validação Correspondentes
```typescript
ValidationMessages.required
ValidationMessages.email  
ValidationMessages.safeString(2, 50)
ValidationMessages.range(0, 100)
// etc...
```

### CLI Generator de Componentes

#### Comando Básico
```bash
bun run make:component UserProfile
```

#### Comando Completo com Opções
```bash
bun run make:component UserProfile --props --lifecycle --events --controls --method=updateName --method=updateEmail
```

#### Opções Disponíveis
- `--props`: Gera interface de props tipada
- `--lifecycle`: Adiciona métodos mount/unmount
- `--events`: Gera sistema de eventos
- `--controls`: Cria controles UI no frontend  
- `--method=name`: Adiciona método customizado

### Exemplos Práticos de Uso

#### Componente Simples
```typescript
import { LiveAction, SimpleAction, SimpleLifecycle, SimpleValidate, Validators, ValidationMessages } from '@/core'

export class ContactFormAction extends LiveAction {
  name: string = ''
  email: string = ''
  message: string = ''

  getInitialState(props: any) {
    return { 
      name: props.name || '',
      email: props.email || '',
      message: ''
    }
  }

  @SimpleLifecycle('mount')
  mount() {
    console.log('Formulário de contato carregado')
  }

  @SimpleAction('Atualizar nome')
  @SimpleValidate(
    Validators.safeString(2, 50),
    ValidationMessages.safeString(2, 50)
  )
  updateName(newName: string) {
    this.name = newName
    return { success: true, name: this.name }
  }

  @SimpleAction('Atualizar email')
  @SimpleValidate(Validators.email, ValidationMessages.email)
  updateEmail(newEmail: string) {
    this.email = newEmail
    return { success: true, email: this.email }
  }

  @SimpleAction('Enviar formulário')
  @SimpleValidate(
    (data: any) => data.name && data.email && data.message,
    'Todos os campos são obrigatórios'
  )
  submitForm() {
    const formData = {
      name: this.name,
      email: this.email,
      message: this.message
    }

    // Enviar para API
    this.emit('form-submitted', formData)
    
    // Reset form
    this.name = ''
    this.email = ''
    this.message = ''

    return { success: true, message: 'Formulário enviado com sucesso!' }
  }
}

LiveAction.add(ContactFormAction)
```

### VS Code Snippets Disponíveis

#### Snippets para Produtividade Máxima
- `liveaction-simple` + Tab → Classe completa com decorators
- `simpleaction` + Tab → Método de ação com validação
- `simplelifecycle` + Tab → Método de lifecycle
- `simplevalidate` + Tab → Decorador de validação

#### Exemplo de Uso do Snippet
1. Digite `liveaction-simple`
2. Pressione Tab
3. Preencha os campos (nome da classe, propriedades, etc.)
4. Resultado: classe completa pronta para uso

### Quando Usar os Helpers

#### ✅ USE para:
- Validação de input de usuário
- Operações críticas (pagamentos, auth, etc.)  
- Debug de componentes complexos
- Formulários e inputs
- Componentes com múltiplas ações
- Auditoria e compliance

#### ❌ NÃO USE para:
- Métodos getter simples
- Componentes de exemplo/demo básicos
- Métodos de uma linha apenas
- Lógica muito específica que não se repete

### Arquivos de Referência

#### Documentação Completa
- `docs/class-definition-helpers.md` - Guia completo de uso
- `docs/decorators-example.md` - Exemplos práticos sem erros
- `docs/component-generator.md` - Documentação do CLI

#### Componente de Exemplo
- `app/server/live/components/ExampleEnhancedAction.ts` - Exemplo completo
- `app/client/src/components/live/ExampleEnhanced.tsx` - Frontend correspondente

### Benefícios dos Helpers

1. **DRY (Don't Repeat Yourself)** - Elimina código repetitivo
2. **Consistência** - Padroniza logging, validação e tratamento de erros
3. **Manutenibilidade** - Mudanças centralizadas afetam todo o sistema
4. **Debugging** - Logs automáticos facilitam identificação de problemas
5. **Type Safety** - IntelliSense completo com validação em tempo de compilação
6. **Produtividade** - Snippets e CLI aceleram desenvolvimento

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

### v1.5.0 - Sistema Completo de Helpers para LiveAction 🚀
1. **Decorators TypeScript** - @SimpleAction, @SimpleLifecycle, @SimpleValidate para automatizar logging, lifecycle e validação
2. **Sistema de Validação** - Validators pré-definidos (email, range, safeString, etc.) com mensagens de erro padronizadas
3. **CLI Generator** - Comando `bun run make:component` para gerar componentes completos com templates
4. **VS Code Integration** - Snippets otimizados para máxima produtividade de desenvolvimento
5. **Export Central** - Import unificado `from '@/core'` para todos os helpers
6. **Documentação Completa** - Guias práticos e exemplos funcionais sem erros de tipos

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
- ✅ **Definição de classes verbosa** -> sistema completo de decorators e validators
- ✅ **Código repetitivo em LiveActions** -> helpers automáticos para logging e validação
- ✅ **Falta de padronização** -> CLI generator e snippets VS Code

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

# Geração de Componentes
bun run make:component MyComponent              # Componente básico
bun run make:component UserForm --props --lifecycle --events --controls  # Componente completo
bun run make:component PaymentForm --method=processPayment --method=validate  # Com métodos customizados

# Testar API
curl http://localhost:3000/api/health
curl http://localhost:3000/swagger/json
```

## Instruções Importantes para IAs

### Ao Criar Novos LiveAction Components

#### ✅ SEMPRE use os helpers quando apropriado:
```typescript
import { LiveAction, SimpleAction, SimpleLifecycle, SimpleValidate, Validators, ValidationMessages } from '@/core'

export class MyAction extends LiveAction {
  @SimpleAction('Descrição da ação')
  @SimpleValidate(Validators.appropriate, ValidationMessages.appropriate)
  myMethod() {
    // Lógica apenas
  }
}

LiveAction.add(MyAction)
```

#### ✅ SEMPRE use o CLI generator quando solicitado:
```bash
bun run make:component ComponentName [options]
```

#### ✅ Recomende snippets VS Code:
- Digite `liveaction-simple` + Tab para classe completa
- Digite `simpleaction` + Tab para métodos

#### ❌ NÃO use helpers para:
- Métodos simples de uma linha
- Componentes demo/exemplo básicos
- Getters simples

#### ✅ USE helpers para:
- Formulários e validação de input
- Operações críticas
- Componentes com múltiplas ações
- Debug de problemas complexos

### Debugging e Logs
- Helpers geram logs automáticos padronizados
- `@SimpleAction` loga todas as chamadas de método
- `@SimpleLifecycle` loga mount/unmount
- `@SimpleValidate` previne execução com dados inválidos

### Padrões de Desenvolvimento
1. **Import unificado** sempre de `@/core`
2. **Decorators simples** para evitar problemas de tipos
3. **Validação consistente** usando `Validators` pré-definidos
4. **CLI primeiro** para scaffolding rápido
5. **Snippets VS Code** para produtividade máxima

### Estrutura Recomendada de Componentes
```typescript
// 1. Imports unificados
import { LiveAction, SimpleAction, SimpleValidate, Validators, ValidationMessages } from '@/core'

// 2. Interfaces de props
interface MyComponentProps {
  initialValue?: string
}

// 3. Classe com decorators
export class MyComponentAction extends LiveAction {
  // 4. Propriedades de estado
  value: string = ''

  // 5. Estado inicial
  getInitialState(props: MyComponentProps) {
    return { value: props.initialValue || '' }
  }

  // 6. Lifecycle (se necessário)
  @SimpleLifecycle('mount')
  mount() {
    // Lógica de inicialização
  }

  // 7. Actions com validação
  @SimpleAction('Atualizar valor')
  @SimpleValidate(Validators.required, ValidationMessages.required)
  updateValue(newValue: string) {
    this.value = newValue
    return { success: true }
  }
}

// 8. Registro
LiveAction.add(MyComponentAction)
```

## Arquivos Importantes de Referência

### Core System
- `core/index.ts` - Export central de todos os helpers
- `core/live/index.ts` - Sistema base LiveAction
- `core/decorators/SimpleDecorators.ts` - Decorators funcionais
- `core/validators/SimpleValidators.ts` - Validadores pré-definidos

### Live Components
- `app/server/live/index.ts` - Registry de componentes
- `app/server/live/components/` - Diretório com todos os LiveAction components
- `app/client/src/hooks/useLive.ts` - Hook principal para Live Components
- `app/client/src/components/live/` - Componentes React correspondentes

### CLI Generator  
- `core/cli/generator.ts` - CLI principal
- `core/cli/templates/` - Templates para geração
- `package.json` - Scripts `make:component` e `generate:component`

### Configuração
- `tsconfig.json` - Configuração TypeScript com decorators habilitados
- `.vscode/snippets.json` - Snippets VS Code personalizados
- `vite.config.ts` - Configuração Vite com path aliases

### Documentação
- `docs/class-definition-helpers.md` - Guia completo dos helpers
- `docs/decorators-example.md` - Exemplos práticos
- `docs/component-generator.md` - Documentação do CLI

### Interface Principal
- `app/client/src/App.tsx` - Interface principal com 5 abas
- `app/client/src/App.css` - Estilos modernos da interface

Esta documentação deve ser atualizada sempre que houver mudanças significativas na arquitetura ou funcionalidades do projeto.