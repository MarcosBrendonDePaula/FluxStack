# 🔥 FluxStack Component Generator

O FluxStack Component Generator é uma ferramenta CLI similar aos comandos `artisan make:livewire` do Laravel, facilitando a criação rápida de Live Components.

## 🚀 Comandos Principais

### Gerar Componente (Modo Rápido)
```bash
# Básico
bun run make:component ComponentName

# Com opções
bun run make:component UserCard --props --controls
bun run make:component TodoList --lifecycle --events --method=addTodo --method=deleteTodo

# Modo interativo
bun run make:component --interactive
```

### Alias Disponíveis
```bash
bun run generate:component ComponentName  # Alias para make:component
bun run make:component ComponentName      # Comando principal
```

## 🎛️ Opções Disponíveis

| Opção | Descrição | Exemplo |
|-------|-----------|---------|
| `--props` | Adiciona interface de props | Interface TypeScript para propriedades |
| `--lifecycle` | Métodos mount/unmount | Setup e cleanup automático |
| `--events` | Sistema de eventos | Helpers para emitir eventos |
| `--controls` | Controles UI | Botões e formulários no frontend |
| `--method=name` | Método customizado | `--method=loadData --method=refresh` |
| `--force` | Sobrescrever arquivos | Regenera componente existente |
| `--interactive` | Modo wizard | Interface guiada passo-a-passo |

## 📁 Estrutura Gerada

Para cada componente, são criados automaticamente:

```
📁 app/server/live/components/
   └── ComponentNameAction.ts     # Backend LiveAction

📁 app/client/src/components/live/
   └── ComponentName.tsx          # Frontend React component

📝 app/server/live/index.ts       # Atualizado com registro automático
```

## 🎯 Exemplos Práticos

### Componente Básico
```bash
bun run make:component Welcome
```
Cria um componente simples com uma ação básica.

### Formulário Completo
```bash
bun run make:component ContactForm --props --events --controls --method=validateField --method=submitForm
```
Cria um formulário com validação e submissão.

### Dashboard Widget
```bash
bun run make:component DashboardChart --props --lifecycle --events --method=loadData --method=refreshData --method=exportChart
```
Cria um widget de dashboard com dados dinâmicos.

### Modal Dialog
```bash
bun run make:component ConfirmModal --props --lifecycle --events --method=show --method=hide --method=confirm
```
Cria um modal com controle de visibilidade.

## 🧪 Templates Incluídos

O gerador inclui templates otimizados para:

### Backend (LiveAction)
- **Props Interface**: TypeScript interfaces para type safety
- **Initial State**: Método `getInitialState()` configurado
- **Lifecycle Hooks**: `mount()` e `unmount()` opcionais
- **Custom Methods**: Métodos de ação personalizados
- **Event System**: Helpers `emit()` e `broadcast()`
- **Auto-registration**: `LiveAction.add()` automático

### Frontend (React)
- **useLive Hook**: Configurado com event handlers
- **Props Interface**: TypeScript para propriedades
- **UI Controls**: Botões e formulários gerados
- **State Display**: Visualização do estado atual
- **Error Handling**: Display de erros automático
- **Connection Status**: Indicador live/offline
- **Responsive Design**: Estilos responsivos incluídos

## 🔧 Modo Interativo

O modo interativo (`--interactive`) oferece um wizard passo-a-passo:

```bash
bun run make:component --interactive
```

### Fluxo do Wizard:
1. **Nome do Componente**: Validação PascalCase
2. **Props**: Adicionar interface de propriedades?
3. **Lifecycle**: Incluir mount/unmount?
4. **Events**: Sistema de eventos Livewire-style?
5. **Controls**: Gerar controles UI?
6. **Methods**: Métodos customizados (múltiplos)
7. **Force**: Sobrescrever se existir?

## 📊 Presets Planejados (Futuro)

```bash
# Presets pré-configurados
bun run make:component MyCounter --preset=counter
bun run make:component UserTable --preset=data-table  
bun run make:component ChatBox --preset=chat
bun run make:component FileUpload --preset=file-upload
```

## ✅ Validações Incluídas

### Nome do Componente
- ✅ Formato PascalCase obrigatório
- ✅ Não pode estar vazio
- ✅ Apenas letras e números

### Arquivos Existentes
- ⚠️ Aviso se componente já existe
- 🔄 Opção `--force` para sobrescrever
- 📝 Auto-registro inteligente (não duplica)

### Estrutura de Projeto
- 📁 Cria diretórios se necessário
- 🔗 Atualiza imports automaticamente
- 🎯 Preserva estrutura existente

## 🚀 Exemplo de Uso Completo

### 1. Gerar Componente
```bash
bun run make:component ProductCard --props --events --controls --method=addToCart --method=toggleFavorite
```

### 2. Usar no Frontend
```tsx
import { ProductCard } from './components/live/ProductCard'

function App() {
  return (
    <ProductCard 
      componentId="product-123"
      // Props aqui
      onActionCompleted={(data) => console.log('Action:', data)}
      onAddToCart={(data) => toast.success('Added to cart!')}
    />
  )
}
```

### 3. Customizar Backend
```typescript
// app/server/live/components/ProductCardAction.ts
export class ProductCardAction extends LiveAction {
  // Seus métodos customizados aqui
  async addToCart() {
    // Lógica de adicionar ao carrinho
    this.emit('cart-updated', { productId: this.productId })
    return { success: true }
  }
}
```

## 🎉 Vantagens

### ⚡ Produtividade
- **Criação instantânea** de componentes completos
- **Boilerplate automático** - foco na lógica de negócio
- **Type safety** end-to-end configurado

### 🔧 Consistência
- **Padrões unificados** em todos os componentes
- **Estrutura padronizada** fácil de manter
- **Convenções FluxStack** aplicadas automaticamente

### 🚀 Rapidez
- **5 segundos** para componente completo
- **Auto-registro** sem configuração manual
- **Hot reload** funciona imediatamente

---

**O gerador transforma a criação de componentes de 10+ minutos para 5 segundos!** 🚀

Similar ao `php artisan make:livewire` do Laravel, mas otimizado para o ecossistema TypeScript + React + Bun do FluxStack.