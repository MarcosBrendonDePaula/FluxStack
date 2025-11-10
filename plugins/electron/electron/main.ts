/**
 * FluxStack Electron Main Process
 * This is the entry point for the Electron application
 */

import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import type { ElectronWindowOptions } from '../types'

// Configuration (will be injected during build)
const CONFIG = {
  width: process.env.ELECTRON_WINDOW_WIDTH ? parseInt(process.env.ELECTRON_WINDOW_WIDTH) : 1280,
  height: process.env.ELECTRON_WINDOW_HEIGHT ? parseInt(process.env.ELECTRON_WINDOW_HEIGHT) : 720,
  minWidth: process.env.ELECTRON_MIN_WIDTH ? parseInt(process.env.ELECTRON_MIN_WIDTH) : 800,
  minHeight: process.env.ELECTRON_MIN_HEIGHT ? parseInt(process.env.ELECTRON_MIN_HEIGHT) : 600,
  devTools: process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV_TOOLS === 'true',
  nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION === 'true',
  contextIsolation: process.env.ELECTRON_CONTEXT_ISOLATION !== 'false',
  enableRemoteModule: process.env.ELECTRON_REMOTE_MODULE === 'true',
}

// Determine if we're in development mode
const isDev = process.env.NODE_ENV === 'development'

// URLs
// FluxStack runs Vite embedded on backend port (default 3000), not standalone on 5173
const DEV_PORT = process.env.ELECTRON_DEV_PORT || process.env.PORT || '3000'
const DEV_URL = `http://localhost:${DEV_PORT}` // FluxStack dev server with embedded Vite
const PROD_URL = `file://${join(__dirname, '../dist/index.html')}` // Production build

let mainWindow: BrowserWindow | null = null

/**
 * Create the main application window
 */
function createWindow(): BrowserWindow {
  const windowOptions: ElectronWindowOptions = {
    width: CONFIG.width,
    height: CONFIG.height,
    minWidth: CONFIG.minWidth,
    minHeight: CONFIG.minHeight,
    show: false, // Don't show until ready
    backgroundColor: '#1a1a1a',
    title: process.env.ELECTRON_PRODUCT_NAME || 'FluxStack App',
    webPreferences: {
      nodeIntegration: CONFIG.nodeIntegration,
      contextIsolation: CONFIG.contextIsolation,
      preload: join(__dirname, 'preload.js'),
    },
  }

  mainWindow = new BrowserWindow(windowOptions)

  // Load the appropriate URL
  const startUrl = isDev ? DEV_URL : PROD_URL
  mainWindow.loadURL(startUrl)

  // Open DevTools in development
  if (CONFIG.devTools && isDev) {
    mainWindow.webContents.openDevTools()
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle external links (open in default browser)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      require('electron').shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  return mainWindow
}

/**
 * App lifecycle events
 */

// App is ready - create the main window
app.whenReady().then(() => {
  createWindow()

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Cleanup before quit
app.on('before-quit', () => {
  // Add any cleanup logic here
})

/**
 * IPC Handlers
 * Define your inter-process communication handlers here
 */

// Example: Get app version
ipcMain.handle('app:version', () => {
  return app.getVersion()
})

// Example: Get platform info
ipcMain.handle('app:platform', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
  }
})

// Example: Minimize window
ipcMain.on('window:minimize', () => {
  mainWindow?.minimize()
})

// Example: Maximize/unmaximize window
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

// Example: Close window
ipcMain.on('window:close', () => {
  mainWindow?.close()
})

// Example: Get window state
ipcMain.handle('window:state', () => {
  return {
    isMaximized: mainWindow?.isMaximized() || false,
    isMinimized: mainWindow?.isMinimized() || false,
    isFullScreen: mainWindow?.isFullScreen() || false,
  }
})

/**
 * Error handling
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})

/**
 * Security best practices
 */

// Prevent navigation to external URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)

    // Only allow navigation to localhost in dev mode
    if (isDev && parsedUrl.host === 'localhost:5173') {
      return
    }

    // Prevent all other navigation
    event.preventDefault()
  })
})

// Disable web view
app.on('web-contents-created', (_, contents) => {
  contents.on('will-attach-webview', (event) => {
    event.preventDefault()
  })
})
