# FluxStack State Management with Zustand

FluxStack uses [Zustand](https://github.com/pmndrs/zustand) for state management, providing a simple, fast, and scalable solution.

## 🚀 Quick Start

### Using Stores Directly

```typescript
import { useUserStore, useUIStore } from './store'

function MyComponent() {
  // Access state and actions directly
  const { currentUser, login, logout } = useUserStore()
  const { theme, setTheme, notifications } = useUIStore()
  
  return (
    <div>
      <p>Theme: {theme}</p>
      <p>User: {currentUser?.name}</p>
    </div>
  )
}
```

### Using Utility Hooks

```typescript
import { useAuth, useNotifications } from './store'

function MyComponent() {
  const { isAuthenticated, login } = useAuth()
  const { success, error } = useNotifications()
  
  const handleLogin = async () => {
    try {
      await login({ email: 'user@example.com', password: 'password' })
      success('Welcome!', 'Login successful')
    } catch (err) {
      error('Error', 'Login failed')
    }
  }
}
```

## 📦 Available Stores

### User Store (`useUserStore`)

Manages user authentication and profile data.

**State:**
- `currentUser: User | null`
- `isAuthenticated: boolean`
- `isLoading: boolean`
- `error: string | null`

**Actions:**
- `login(credentials): Promise<void>`
- `register(data): Promise<void>`
- `logout(): void`
- `updateProfile(updates): Promise<void>`
- `clearError(): void`

### UI Store (`useUIStore`)

Manages global UI state like theme, notifications, modals, etc.

**State:**
- `theme: 'light' | 'dark' | 'system'`
- `sidebarOpen: boolean`
- `notifications: Notification[]`
- `modals: Modal[]`
- `loading: { global: boolean, operations: Record<string, boolean> }`

**Actions:**
- `setTheme(theme): void`
- `toggleSidebar(): void`
- `addNotification(notification): void`
- `openModal(modal): void`
- `setGlobalLoading(loading): void`

## 🔧 Creating Custom Stores

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProductState {
  products: Product[]
  loading: boolean
  fetchProducts: () => Promise<void>
  addProduct: (product: Product) => void
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      loading: false,
      
      fetchProducts: async () => {
        set({ loading: true })
        try {
          const response = await fetch('/api/products')
          const products = await response.json()
          set({ products, loading: false })
        } catch (error) {
          set({ loading: false })
        }
      },
      
      addProduct: (product) => set((state) => ({
        products: [...state.products, product]
      }))
    }),
    { name: 'product-store' }
  )
)
```

## 🎯 Best Practices

### 1. Use Selectors for Performance

```typescript
// ❌ Re-renders on any state change
const state = useUserStore()

// ✅ Only re-renders when currentUser changes
const currentUser = useUserStore(state => state.currentUser)
```

### 2. Separate Actions from State

```typescript
// ✅ Good - separate concerns
const currentUser = useUserStore(state => state.currentUser)
const login = useUserStore(state => state.login)
```

### 3. Use Utility Hooks for Common Patterns

```typescript
// ✅ Use provided utility hooks
const { isAuthenticated, login } = useAuth()
const { success, error } = useNotifications()
```

### 4. Persist Important State

```typescript
export const useMyStore = create()(
  persist(
    (set) => ({ /* store definition */ }),
    { 
      name: 'my-store',
      partialize: (state) => ({ 
        // Only persist specific fields
        importantData: state.importantData 
      })
    }
  )
)
```

## 🔄 Migration from Other State Libraries

### From Redux

```typescript
// Redux
const user = useSelector(state => state.user.currentUser)
const dispatch = useDispatch()
dispatch(loginAction(credentials))

// Zustand
const { currentUser, login } = useUserStore()
await login(credentials)
```

### From Context API

```typescript
// Context API
const { user, setUser } = useContext(UserContext)

// Zustand
const { currentUser, login } = useUserStore()
```

## 🛠️ DevTools

Zustand integrates with Redux DevTools automatically in development:

1. Install Redux DevTools browser extension
2. Open DevTools → Redux tab
3. See all state changes and time-travel debug

## 📚 Learn More

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Zustand Recipes](https://github.com/pmndrs/zustand/wiki/Recipes)
- [TypeScript Guide](https://github.com/pmndrs/zustand#typescript)