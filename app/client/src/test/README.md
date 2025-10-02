# FluxStack Testing Guide

Este guia explica como testar o sistema de estado baseado em Zustand no FluxStack.

## 🧪 **Estrutura de Testes**

```
app/client/src/
├── store/
│   ├── __tests__/
│   │   ├── userSlice.test.ts      # Testes do store de usuário
│   │   └── uiSlice.test.ts        # Testes do store de UI
├── hooks/
│   ├── __tests__/
│   │   ├── useAuth.test.ts        # Testes do hook de auth
│   │   └── useNotifications.test.ts # Testes do hook de notificações
├── components/
│   └── __tests__/
│       └── StateDemo.test.tsx     # Testes de integração
└── test/
    ├── setup.ts                   # Configuração global
    ├── types.ts                   # Tipos para testes
    └── README.md                  # Este arquivo
```

## 🔧 **Configuração**

### Dependências necessárias:

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^14.5.1",
    "jsdom": "^22.1.0",
    "vitest": "^0.34.6"
  }
}
```

### Configuração do Vitest:

O arquivo `vitest.config.ts` está configurado para:
- Usar jsdom como ambiente
- Configurar aliases para imports
- Incluir setup global
- Configurar coverage

## 🧪 **Testando Stores Zustand**

### Exemplo básico:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useUserStore } from '../slices/userSlice'

describe('useUserStore', () => {
  beforeEach(() => {
    // Reset store state
    useUserStore.setState({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    })
  })

  it('should login successfully', async () => {
    const { result } = renderHook(() => useUserStore())

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password'
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
  })
})
```

### Padrões importantes:

1. **Reset do estado**: Sempre resetar o store antes de cada teste
2. **act()**: Usar `act()` para mudanças de estado assíncronas
3. **Mock de APIs**: Mockar fetch para testes isolados

## 🎯 **Testando Hooks Utilitários**

```typescript
import { renderHook } from '@testing-library/react'
import { useAuth } from '../useAuth'

describe('useAuth', () => {
  it('should detect admin user', () => {
    // Set admin user in store
    useUserStore.setState({
      currentUser: { role: 'admin', /* ... */ },
      isAuthenticated: true
    })

    const { result } = renderHook(() => useAuth())
    
    expect(result.current.isAdmin).toBe(true)
  })
})
```

## 🧩 **Testando Componentes com Estado**

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from '../MyComponent'
import { useUIStore } from '../../store/slices/uiSlice'

describe('MyComponent', () => {
  beforeEach(() => {
    // Reset stores
    useUIStore.setState({ /* initial state */ })
  })

  it('should update theme when button clicked', () => {
    render(<MyComponent />)
    
    fireEvent.click(screen.getByText('Dark Theme'))
    
    expect(screen.getByText('Current theme: dark')).toBeInTheDocument()
  })
})
```

## 🔄 **Mocking APIs**

```typescript
// Mock fetch globally
global.fetch = vi.fn()

beforeEach(() => {
  vi.resetAllMocks()
})

it('should handle API success', async () => {
  // Mock successful response
  ;(global.fetch as any).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ user: mockUser })
  })

  // Test your component/hook
})
```

## 📊 **Coverage**

Execute testes com coverage:

```bash
npm run test:coverage
```

Isso gerará um relatório em `coverage/index.html`.

## 🎨 **Boas Práticas**

### 1. **Isolamento de Testes**
- Sempre resetar stores antes de cada teste
- Mockar APIs externas
- Não depender de ordem de execução

### 2. **Testes Descritivos**
```typescript
// ❌ Ruim
it('should work', () => { /* ... */ })

// ✅ Bom
it('should login successfully with valid credentials', () => { /* ... */ })
```

### 3. **Arrange-Act-Assert**
```typescript
it('should add notification', () => {
  // Arrange
  const { result } = renderHook(() => useNotifications())
  
  // Act
  act(() => {
    result.current.success('Title', 'Message')
  })
  
  // Assert
  expect(result.current.notifications).toHaveLength(1)
})
```

### 4. **Testar Comportamentos, não Implementação**
```typescript
// ❌ Ruim - testa implementação
expect(mockSetState).toHaveBeenCalledWith({ loading: true })

// ✅ Bom - testa comportamento
expect(result.current.isLoading).toBe(true)
```

## 🚀 **Executando Testes**

```bash
# Todos os testes
npm run test:run

# Modo watch
npm run test:watch

# Com UI
npm run test:ui

# Apenas stores
npm run test:client -- store

# Apenas hooks
npm run test:client -- hooks

# Apenas componentes
npm run test:client -- components
```

## 🐛 **Debugging**

### Console logs em testes:
```typescript
it('should debug state', () => {
  const { result } = renderHook(() => useUserStore())
  
  console.log('Current state:', result.current)
  
  // Seu teste aqui
})
```

### Usando screen.debug():
```typescript
it('should render correctly', () => {
  render(<MyComponent />)
  
  screen.debug() // Mostra o DOM atual
  
  // Seu teste aqui
})
```

## 📝 **Exemplos Completos**

Veja os arquivos de teste existentes para exemplos completos:
- `store/__tests__/userSlice.test.ts` - Testes de store
- `hooks/__tests__/useAuth.test.ts` - Testes de hooks
- `components/__tests__/StateDemo.test.tsx` - Testes de integração