/**
 * FluxStack Electron Plugin Types
 */

export interface ElectronBuildOptions {
  platform?: 'win32' | 'darwin' | 'linux' | 'all'
  arch?: 'x64' | 'arm64' | 'ia32' | 'all'
  target?: string[]
  publish?: boolean
  buildVersion?: string
}

export interface ElectronWindowOptions {
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  resizable?: boolean
  frame?: boolean
  fullscreen?: boolean
  kiosk?: boolean
  title?: string
  icon?: string
  show?: boolean
  backgroundColor?: string
  webPreferences?: {
    nodeIntegration?: boolean
    contextIsolation?: boolean
    enableRemoteModule?: boolean
    preload?: string
  }
}

export interface ElectronAppInfo {
  name: string
  version: string
  description?: string
  author?: string
  homepage?: string
}

export interface ElectronBuilderConfig {
  appId: string
  productName: string
  copyright?: string
  directories: {
    output: string
    buildResources?: string
  }
  files: string[]
  extraFiles?: string[]
  asar: boolean
  compression?: 'store' | 'normal' | 'maximum'
  mac?: {
    category?: string
    target?: string[]
    icon?: string
  }
  win?: {
    target?: string[]
    icon?: string
  }
  linux?: {
    target?: string[]
    icon?: string
    category?: string
  }
  publish?: {
    provider: string
    url?: string
  }[]
}

export interface ElectronPreloadAPI {
  versions: {
    node: string
    chrome: string
    electron: string
  }
  platform: string
  // Add your custom IPC handlers here
  invoke: (channel: string, ...args: any[]) => Promise<any>
  send: (channel: string, ...args: any[]) => void
  on: (channel: string, listener: (...args: any[]) => void) => void
  once: (channel: string, listener: (...args: any[]) => void) => void
  removeListener: (channel: string, listener: (...args: any[]) => void) => void
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    electron?: ElectronPreloadAPI
  }
}
