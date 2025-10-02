# 🐻 Zustand Study - State Management for FluxStack

## 📋 Overview

Zustand é uma biblioteca de state management para React extremamente leve (~1KB) e simples, que pode complementar perfeitamente nossa arquitetura de Live Components no FluxStack.

## 🏗️ Core Architecture

### **Philosophy: "Bear necessities"**
```typescript
// Zustand = "state" em alemão 🇩🇪
// Philosophy: Minimal, fast, unopinionated
const useStore = create((set) => ({
  // Your state and actions here
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
}))
```

### **Key Characteristics**
- **No providers**: Não precisa wrappear app
- **Hook-based**: Estado acessível via hooks
- **Immutable by default**: Updates criam novo estado
- **TypeScript-first**: Excelente suporte a tipos
- **Minimal boilerplate**: Código simples e direto

## 🎯 Basic Usage

### **Creating a Store**
```typescript
import { create } from 'zustand'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))
```

### **Using in Components**
```typescript
function Counter() {
  const { count, increment, decrement, reset } = useCounterStore()
  
  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}

// Selective subscription (performance)
function DisplayOnly() {
  const count = useCounterStore((state) => state.count)
  return <span>{count}</span>
}
```

## 🔧 Advanced Features

### **1. Middleware Stack**

```typescript
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface TodoStore {
  todos: Todo[]
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
}

const useTodoStore = create<TodoStore>()(
  devtools(                    // Redux DevTools integration
    persist(                   // Local storage persistence
      subscribeWithSelector(   // Fine-grained subscriptions
        immer(                 // Immutable updates with Immer
          (set) => ({
            todos: [],
            addTodo: (text) => set((state) => {
              state.todos.push({ id: Date.now(), text, completed: false })
            }),
            toggleTodo: (id) => set((state) => {
              const todo = state.todos.find(t => t.id === id)
              if (todo) todo.completed = !todo.completed
            }),
          })
        )
      ),
      { name: 'todo-storage' } // Persist config
    ),
    { name: 'TodoStore' }      // DevTools name
  )
)
```

### **2. Slice Pattern (Modular Stores)**

```typescript
import { StateCreator } from 'zustand'

// Bear slice
type BearSlice = {
  bears: number
  addBear: () => void
  eatFish: () => void
}

const createBearSlice: StateCreator<
  JungleStore,
  [['zustand/devtools', never]],
  [],
  BearSlice
> = (set, get) => ({
  bears: 0,
  addBear: () => set(
    (state) => ({ bears: state.bears + 1 }),
    undefined,
    'jungle:bear/addBear'
  ),
  eatFish: () => {
    get().removeFish() // Cross-slice communication
    set((state) => ({ bears: state.bears + 1 }))
  },
})

// Fish slice
type FishSlice = {
  fishes: number
  addFish: () => void
  removeFish: () => void
}

const createFishSlice: StateCreator<JungleStore, [], [], FishSlice> = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
  removeFish: () => set((state) => ({ fishes: state.fishes - 1 })),
})

// Combined store
type JungleStore = BearSlice & FishSlice

const useJungleStore = create<JungleStore>()(
  devtools((...args) => ({
    ...createBearSlice(...args),
    ...createFishSlice(...args),
  }))
)
```

### **3. Async Actions & Side Effects**

```typescript
interface UserStore {
  user: User | null
  loading: boolean
  error: string | null
  fetchUser: (id: string) => Promise<void>
  logout: () => void
}

const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  
  fetchUser: async (id) => {
    set({ loading: true, error: null })
    try {
      const user = await api.users.get(id)
      set({ user, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  logout: () => {
    set({ user: null })
    // Side effects
    localStorage.removeItem('token')
    window.location.href = '/login'
  },
}))
```

### **4. Computed Values & Selectors**

```typescript
interface StoreState {
  todos: Todo[]
  filter: 'all' | 'active' | 'completed'
  
  // Computed getters
  get filteredTodos(): Todo[]
  get activeCount(): number
  get completedCount(): number
}

const useTodoStore = create<StoreState>((set, get) => ({
  todos: [],
  filter: 'all',
  
  get filteredTodos() {
    const { todos, filter } = get()
    switch (filter) {
      case 'active': return todos.filter(t => !t.completed)
      case 'completed': return todos.filter(t => t.completed)
      default: return todos
    }
  },
  
  get activeCount() {
    return get().todos.filter(t => !t.completed).length
  },
  
  get completedCount() {
    return get().todos.filter(t => t.completed).length
  },
}))

// Usage with computed values
function TodoStats() {
  const activeCount = useTodoStore((state) => state.activeCount)
  const completedCount = useTodoStore((state) => state.completedCount)
  
  return (
    <div>
      Active: {activeCount} | Completed: {completedCount}
    </div>
  )
}
```

## 🔄 Subscriptions & Reactive Updates

### **External Subscriptions**
```typescript
// Listen to store changes outside React
const unsubscribe = useTodoStore.subscribe(
  (state) => state.todos,
  (todos) => {
    console.log('Todos changed:', todos)
    // Sync with external service
    syncWithServer(todos)
  }
)

// Cleanup
unsubscribe()
```

### **Custom Hooks**
```typescript
// Custom hook for derived state
function useTodoStats() {
  return useTodoStore((state) => ({
    total: state.todos.length,
    active: state.todos.filter(t => !t.completed).length,
    completed: state.todos.filter(t => t.completed).length,
  }))
}

// Usage
function TodoHeader() {
  const { total, active, completed } = useTodoStats()
  return <h2>{active} of {total} todos remaining</h2>
}
```

## 🚀 Zustand vs Other Solutions

### **Zustand vs Redux**
| Aspect | Redux | Zustand |
|--------|-------|---------|
| **Bundle Size** | ~60KB | ~1KB |
| **Boilerplate** | Heavy | Minimal |
| **Provider** | Required | Not needed |
| **DevTools** | Built-in | Via middleware |
| **TypeScript** | Complex | Simple |
| **Learning Curve** | Steep | Gentle |

### **Zustand vs Context API**
| Aspect | Context API | Zustand |
|--------|-------------|---------|
| **Performance** | Re-renders entire tree | Selective re-renders |
| **Provider Hell** | Yes | No |
| **Global State** | Awkward | Native |
| **DevTools** | No | Yes (with middleware) |
| **Persistence** | Manual | Built-in middleware |

### **Zustand vs Live Components**
| Aspect | Zustand | Live Components |
|--------|---------|-----------------|
| **State Location** | Client-only | Server + Client |
| **Real-time** | Manual | Automatic |
| **Type Safety** | Client types | End-to-end types |
| **Multi-user** | Manual sync | Built-in |
| **Persistence** | Local storage | Database |
| **Complexity** | Simple | Moderate |

## 💡 Integration with FluxStack Live Components

### **Hybrid Architecture**

```typescript
// Live Component for server state
const { state: serverState, call } = useLiveComponent('TodoList', {
  listId: 'shared-list'
})

// Zustand for client-only state
const useUIStore = create((set) => ({
  sidebarOpen: false,
  theme: 'light',
  selectedTab: 'all',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setSelectedTab: (tab) => set({ selectedTab: tab }),
}))

function TodoApp() {
  // Server state via Live Components
  const { todos, addTodo, toggleTodo } = serverState
  
  // UI state via Zustand
  const { sidebarOpen, theme, selectedTab, toggleSidebar } = useUIStore()
  
  return (
    <div className={`app theme-${theme}`}>
      {sidebarOpen && <Sidebar />}
      <TodoList 
        todos={todos} 
        filter={selectedTab}
        onAdd={addTodo}
        onToggle={toggleTodo} 
      />
    </div>
  )
}
```

### **State Synchronization Patterns**

```typescript
// Sync Zustand with Live Components
const useSyncedTodoStore = create((set, get) => ({
  localTodos: [],
  filter: 'all',
  
  // Sync from server state
  syncFromServer: (serverTodos) => {
    set({ localTodos: serverTodos })
  },
  
  // Optimistic updates
  addTodoOptimistic: (todo) => {
    set((state) => ({ localTodos: [...state.localTodos, todo] }))
  },
  
  // Revert on error
  revertOptimisticAdd: (todoId) => {
    set((state) => ({
      localTodos: state.localTodos.filter(t => t.id !== todoId)
    }))
  },
}))

// Integration hook
function useTodoIntegration() {
  const { state, call } = useLiveComponent('TodoList')
  const { syncFromServer, addTodoOptimistic, revertOptimisticAdd } = useSyncedTodoStore()
  
  // Sync server state to Zustand
  useEffect(() => {
    syncFromServer(state.todos)
  }, [state.todos])
  
  const addTodo = async (text) => {
    const optimisticTodo = { id: 'temp-' + Date.now(), text, completed: false }
    
    // Optimistic update
    addTodoOptimistic(optimisticTodo)
    
    try {
      await call('addTodo', text)
    } catch (error) {
      // Revert on error
      revertOptimisticAdd(optimisticTodo.id)
      throw error
    }
  }
  
  return { addTodo, ...state }
}
```

## 🎯 Use Cases in FluxStack

### **Perfect for Zustand:**
- ✅ **UI State**: Modals, tabs, forms
- ✅ **Client Preferences**: Theme, language, layout
- ✅ **Temporary Data**: Drafts, filters, search
- ✅ **Cache Management**: API responses, computed values
- ✅ **Navigation State**: Active routes, history

### **Perfect for Live Components:**
- ✅ **Business Logic**: CRUD operations, validation
- ✅ **Shared Data**: Multi-user collaboration
- ✅ **Persistent State**: Database entities
- ✅ **Real-time Updates**: Notifications, live feeds
- ✅ **Server-side Validation**: Forms, complex rules

### **Hybrid Approach:**
```typescript
// Complex form with mixed state
function UserProfileForm() {
  // Server state - persistent user data
  const { state: user, call: updateUser } = useLiveComponent('UserProfile', {
    userId: currentUserId
  })
  
  // Client state - form UI and temporary data
  const {
    isDirty,
    validationErrors,
    showAdvancedOptions,
    setDirty,
    setErrors,
    toggleAdvanced
  } = useFormStore()
  
  const handleSubmit = async (formData) => {
    try {
      await updateUser('update', formData)
      setDirty(false)
      setErrors({})
    } catch (error) {
      setErrors(error.validationErrors)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        defaultValue={user.name}
        onChange={() => setDirty(true)}
      />
      {validationErrors.name && <Error>{validationErrors.name}</Error>}
      
      <button onClick={toggleAdvanced}>
        {showAdvancedOptions ? 'Hide' : 'Show'} Advanced
      </button>
      
      {showAdvancedOptions && <AdvancedSettings />}
      
      <button disabled={!isDirty}>Save</button>
    </form>
  )
}
```

## 📊 Benefits of Hybrid Approach

### ✅ **Best of Both Worlds**
- **Server State**: Real-time, persistent, multi-user
- **Client State**: Fast, local, UI-focused
- **Type Safety**: End-to-end with both systems
- **Performance**: Optimal re-renders and updates
- **Developer Experience**: Right tool for each job

### ✅ **Clear Separation of Concerns**
- **Live Components**: "What should be shared/persistent?"
- **Zustand**: "What is UI-specific/temporary?"
- **Easy to reason about**: Clear boundaries
- **Easier testing**: Isolated concerns

### ✅ **Gradual Adoption**
- Start with Zustand for simple client state
- Add Live Components for real-time features
- Migrate as needed without big refactors
- Learn one pattern at a time

## 🎪 Example: Chat Application

```typescript
// Server state - messages, users, rooms
const { state: chatState, call: chatActions } = useLiveComponent('Chat', {
  roomId: 'general'
})

// Client state - UI, drafts, preferences
const useChatUIStore = create((set) => ({
  messageInput: '',
  showEmojiPicker: false,
  sidebarCollapsed: false,
  notifications: true,
  
  setMessageInput: (input) => set({ messageInput: input }),
  toggleEmojiPicker: () => set((state) => ({ showEmojiPicker: !state.showEmojiPicker })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))

function ChatApp() {
  const { messages, users, typingUsers } = chatState
  const { sendMessage, startTyping, stopTyping } = chatActions
  
  const { 
    messageInput, 
    showEmojiPicker, 
    sidebarCollapsed,
    setMessageInput,
    toggleEmojiPicker,
    toggleSidebar 
  } = useChatUIStore()
  
  const handleSendMessage = () => {
    sendMessage(messageInput)
    setMessageInput('') // Clear input after sending
  }
  
  return (
    <div className={`chat-app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar users={users} onToggle={toggleSidebar} />
      <MessageList messages={messages} />
      <TypingIndicator users={typingUsers} />
      <MessageInput
        value={messageInput}
        onChange={setMessageInput}
        onSend={handleSendMessage}
        onFocus={startTyping}
        onBlur={stopTyping}
      />
      {showEmojiPicker && (
        <EmojiPicker onSelect={(emoji) => {
          setMessageInput(messageInput + emoji)
          toggleEmojiPicker()
        }} />
      )}
    </div>
  )
}
```

---

**Conclusão**: Zustand complementa perfeitamente os Live Components, criando uma arquitetura híbrida poderosa onde cada ferramenta é usada para o que faz melhor!