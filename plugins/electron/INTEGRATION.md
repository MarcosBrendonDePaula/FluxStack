# 🔌 Electron Plugin Integration Guide

This guide shows how to integrate the Electron plugin into your FluxStack application.

## 📋 Prerequisites

1. Electron plugin installed and enabled
2. Dependencies installed: `cd plugins/electron && bun install`
3. Plugin registered in your app

## 🚀 Quick Start

### 1. Register the Plugin

In `app/server/index.ts`:

```typescript
import { electronPlugin } from '@/plugins/electron'

// ... your other imports

const app = new Elysia()
  .use(swagger())
  .use(cors())
  .use(electronPlugin) // ✅ Add this
  // ... rest of your plugins
```

### 2. Add Electron Controls to Your UI

In `app/client/src/App.tsx`:

```typescript
import { ElectronControls } from '@/plugins/electron/client'

export function App() {
  return (
    <div className="app">
      {/* Your existing UI */}

      {/* Add Electron controls */}
      <ElectronControls />

      {/* Rest of your app */}
    </div>
  )
}
```

### 3. Use Electron API in Your Components

```typescript
import { useEffect, useState } from 'react'

export function MyComponent() {
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    // Check if running in Electron
    if (window.electron) {
      setIsElectron(true)

      // Get app version
      window.electron.invoke('app:version').then(version => {
        console.log('App version:', version)
      })

      // Listen for events
      window.electron.on('app:update', (info) => {
        console.log('Update available:', info)
      })
    }
  }, [])

  return (
    <div>
      {isElectron ? (
        <p>Running as desktop app ✅</p>
      ) : (
        <p>Running in browser 🌐</p>
      )}
    </div>
  )
}
```

## 🔧 Custom IPC Handlers

### Add a Custom Handler

#### 1. In `plugins/electron/electron/main.ts`:

```typescript
// Add your handler
ipcMain.handle('database:query', async (event, query: string) => {
  // Perform database query
  const results = await db.query(query)
  return results
})

ipcMain.handle('file:save', async (event, path: string, content: string) => {
  // Save file
  await fs.writeFile(path, content)
  return { success: true }
})

// Send events to renderer
mainWindow?.webContents.send('app:notification', {
  title: 'Hello',
  message: 'Something happened!'
})
```

#### 2. In `plugins/electron/electron/preload.ts`:

```typescript
const ALLOWED_CHANNELS = {
  invoke: [
    'app:version',
    'app:platform',
    'window:state',
    'database:query',  // ✅ Add your invoke channels
    'file:save'
  ],
  send: [
    'window:minimize',
    'window:maximize',
    'window:close'
  ],
  on: [
    'app:update',
    'app:notification'  // ✅ Add your event channels
  ],
}
```

#### 3. Use in Your React Components:

```typescript
// Invoke handler (request-response)
const results = await window.electron?.invoke('database:query', 'SELECT * FROM users')

const saved = await window.electron?.invoke('file:save', '/path/to/file.txt', 'content')

// Listen for events
window.electron?.on('app:notification', (notification) => {
  showToast(notification.title, notification.message)
})
```

## 🎨 Custom Window Controls

Create a custom title bar:

```typescript
export function CustomTitleBar() {
  return (
    <div className="flex items-center justify-between bg-gray-900 text-white px-4 py-2">
      {/* App title */}
      <div className="flex items-center gap-2">
        <img src="/logo.svg" className="h-6 w-6" />
        <span className="font-semibold">My App</span>
      </div>

      {/* Window controls (only show in Electron) */}
      {window.electron && (
        <div className="flex gap-1">
          <button
            onClick={() => window.electron?.send('window:minimize')}
            className="px-3 py-1 hover:bg-gray-700 rounded transition"
          >
            −
          </button>
          <button
            onClick={() => window.electron?.send('window:maximize')}
            className="px-3 py-1 hover:bg-gray-700 rounded transition"
          >
            □
          </button>
          <button
            onClick={() => window.electron?.send('window:close')}
            className="px-3 py-1 hover:bg-red-600 rounded transition"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
```

For a frameless window, set in `.env`:

```bash
# Make the window frameless (no native title bar)
ELECTRON_FRAME=false
```

Then add `-webkit-app-region: drag` CSS to make your custom title bar draggable:

```css
.custom-title-bar {
  -webkit-app-region: drag;
}

.custom-title-bar button {
  -webkit-app-region: no-drag;
}
```

## 🔐 Type Safety

Add type definitions for your custom handlers:

```typescript
// types/electron.d.ts
import type { ElectronPreloadAPI } from '@/plugins/electron/types'

declare global {
  interface Window {
    electron?: ElectronPreloadAPI & {
      // Add your custom handlers here
      database: {
        query: (query: string) => Promise<any[]>
      }
      file: {
        save: (path: string, content: string) => Promise<{ success: boolean }>
        read: (path: string) => Promise<string>
      }
    }
  }
}
```

Then create wrapper functions:

```typescript
// lib/electron.ts
export const electronAPI = {
  database: {
    query: async (query: string) => {
      return window.electron?.invoke('database:query', query)
    }
  },
  file: {
    save: async (path: string, content: string) => {
      return window.electron?.invoke('file:save', path, content)
    },
    read: async (path: string) => {
      return window.electron?.invoke('file:read', path)
    }
  }
}

// Usage
import { electronAPI } from '@/lib/electron'

const users = await electronAPI.database.query('SELECT * FROM users')
```

## 🎯 Best Practices

### 1. Feature Detection

Always check if running in Electron:

```typescript
if (window.electron) {
  // Electron-specific code
} else {
  // Fallback for web
}
```

### 2. Error Handling

Wrap IPC calls in try-catch:

```typescript
try {
  const result = await window.electron?.invoke('my:handler', data)
} catch (error) {
  console.error('IPC error:', error)
  // Show user-friendly error
}
```

### 3. Cleanup Listeners

Remove event listeners when component unmounts:

```typescript
useEffect(() => {
  const handler = (data: any) => {
    console.log('Event received:', data)
  }

  window.electron?.on('my:event', handler)

  return () => {
    window.electron?.removeListener('my:event', handler)
  }
}, [])
```

### 4. Progressive Enhancement

Build your app to work in both browser and Electron:

```typescript
// Save data
const saveData = async (data: any) => {
  if (window.electron) {
    // Save to local file in Electron
    await window.electron.invoke('file:save', 'data.json', JSON.stringify(data))
  } else {
    // Save to localStorage in browser
    localStorage.setItem('data', JSON.stringify(data))
  }
}
```

## 📦 Production Build

### 1. Build Your App

```bash
bun run build
```

### 2. Build Electron App

```bash
# For your platform
bun run cli build:electron

# For all platforms (requires macOS for Mac builds)
bun run cli build:electron --platform=all
```

### 3. Distribute

The built executables are in `dist-electron/`:

- **Windows**: `.exe` installer
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage`, `.deb`, `.rpm`

## 🚀 Next Steps

- [ ] Add custom IPC handlers for your app
- [ ] Create a custom title bar
- [ ] Add app icons in `build/` directory
- [ ] Configure code signing for distribution
- [ ] Set up auto-updates
- [ ] Add native system tray support

## 📚 Resources

- [Electron IPC Tutorial](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)
- [electron-builder Docs](https://www.electron.build/)

---

Need help? Check the [README.md](./README.md) or create an issue!
