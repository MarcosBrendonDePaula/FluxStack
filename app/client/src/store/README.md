# FluxStack State Management

This directory contains your application's state management using FluxStack's core state utilities.

## Using FluxStack Core State

FluxStack provides core utilities for state management that are protected from accidental modification:

```typescript
// Import from core
import { createUserStore, createFluxStore } from '../../../core/client/state/index.js'

// Create stores using FluxStack conventions
export const useUserStore = createUserStore({
  name: 'user-store',
  persist: true
})

// Create custom stores
export const useAppStore = createFluxStore(
  (set, get) => ({
    // Your app-specific state
  }),
  {
    name: 'app-store',
    persist: false
  }
)
```

## Available Core Features

- **createUserStore()**: Pre-built user authentication store
- **createFluxStore()**: Factory for custom stores with persistence
- **createAuthHook()**: Authentication hook factory

## Benefits

- ✅ **Protected Core**: Framework code is safe from accidental changes
- ✅ **Consistent API**: All stores follow FluxStack conventions
- ✅ **Built-in Features**: Persistence, logging, error handling
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Extensible**: Easy to customize for your needs