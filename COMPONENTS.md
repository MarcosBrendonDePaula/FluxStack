# 🔥 FluxStack Live Components Generator

Guia completo para criar Live Components usando o gerador CLI do FluxStack.

## 🚀 **Comandos Rápidos**

```bash
# Usando scripts do package.json (recomendado)
bun run make:component UserProfile
bun run make:live TodoCounter --type counter

# Usando CLI direto
bun run cli make:component ContactForm --type form
bun run core/cli/index.ts make:component LiveChat --type chat
```

## 📋 **Tipos de Componentes Disponíveis**

### 🔹 **Basic** (padrão)
Componente simples com estado e métodos básicos.
```bash
bun run make:component MyComponent
bun run make:component MyComponent --type basic
```

### 🔢 **Counter**
Componente contador com increment/decrement e step configurável.
```bash
bun run make:component MyCounter --type counter
```

### 📝 **Form**
Componente formulário com validação e submissão.
```bash
bun run make:component ContactForm --type form
```

### 💬 **Chat**
Componente chat multi-usuário com mensagens em tempo real.
```bash
bun run make:component LiveChat --type chat --room chatroom
```

## ⚙️ **Opções Avançadas**

### 🏠 **Multi-usuário com Rooms**
```bash
# Componente com suporte a salas multi-usuário
bun run make:component GameLobby --room lobby
bun run make:component TeamChat --type chat --room team-alpha
```

### 🎯 **Apenas Servidor**
```bash
# Criar apenas o componente servidor (sem client)
bun run make:component BackgroundTask --no-client
```

### 🔄 **Sobrescrever Existentes**
```bash
# Forçar sobrescrita de arquivos existentes
bun run make:component MyComponent --force
```

## 📁 **Estrutura dos Arquivos Gerados**

```
app/
├── server/live/
│   └── MyComponentComponent.ts  # 🔥 Lógica do servidor
└── client/src/components/
    └── MyComponent.tsx          # ⚛️ Interface React
```

## 🎯 **Exemplos Completos**

### Contador Multi-usuário
```bash
bun run make:component GameScore --type counter --room game-123
```

### Chat de Suporte
```bash
bun run make:component SupportChat --type chat --room support
```

### Formulário de Contato
```bash
bun run make:component ContactForm --type form
```

### Tarefa de Background
```bash
bun run make:component DataProcessor --no-client
```

## 🔄 **Fluxo de Trabalho Recomendado**

1. **Criar Componente**
   ```bash
   bun run make:component MyAwesomeFeature --type counter
   ```

2. **Importar no App.tsx**
   ```tsx
   import { MyAwesomeFeature } from './components/MyAwesomeFeature'
   ```

3. **Usar no JSX**
   ```tsx
   <MyAwesomeFeature />
   ```

4. **Iniciar Dev Server**
   ```bash
   bun run dev
   ```

## 📚 **Imports Recomendados**

Todos os componentes gerados usam o import moderno:

```tsx
// ✅ Recomendado - Alias limpo
import { useHybridLiveComponent } from 'fluxstack'

// ⚠️ Alternativo - Direct core import
import { useHybridLiveComponent } from '@/core/client'
```

## 🔍 **Ajuda e Validação**

```bash
# Ver ajuda geral
bun run cli --help

# Ver exemplos de nomes válidos
bun run make:component invalidname  # Mostra exemplos

# Ver tipos disponíveis
bun run make:component MyComponent --type invalid  # Lista tipos
```

## ✨ **Recursos dos Componentes**

### 🔄 **Estado Sincronizado**
- Estado automático entre cliente e servidor
- Re-hidratação automática em reconexão
- Persistência de estado durante desenvolvimento

### 🌐 **Multi-usuário Ready**
- Suporte nativo a rooms/salas
- Broadcast automático de mudanças
- Sincronização em tempo real

### 🎨 **UI Moderna**
- Templates com Tailwind CSS
- Estados de loading e conexão
- Componentes responsivos

### 🛡️ **Type Safety**
- TypeScript 100% tipado
- Inferência automática de tipos
- Validação de payload

---

**🎯 Dica**: Use `bun run make:component --help` para ver todas as opções disponíveis!