/**
 * FluxStack Electron Plugin Configuration
 */

import { defineConfig, config } from '@/core/utils/config-schema'

const electronConfigSchema = {
  enabled: config.boolean('ELECTRON_ENABLED', true),

  // Window Configuration
  width: config.number('ELECTRON_WINDOW_WIDTH', 1280),
  height: config.number('ELECTRON_WINDOW_HEIGHT', 720),
  minWidth: config.number('ELECTRON_MIN_WIDTH', 800),
  minHeight: config.number('ELECTRON_MIN_HEIGHT', 600),

  // Application Configuration
  productName: config.string('ELECTRON_PRODUCT_NAME', 'FluxStack App', true),
  appId: config.string('ELECTRON_APP_ID', 'com.fluxstack.app', true),

  // Build Configuration
  outputDir: config.string('ELECTRON_OUTPUT_DIR', 'dist-electron', true),
  buildDir: config.string('ELECTRON_BUILD_DIR', 'build', true),

  // Development Configuration
  devTools: config.boolean('ELECTRON_DEV_TOOLS', true),

  // Production Configuration
  asar: config.boolean('ELECTRON_ASAR', true),
  compression: config.enum('ELECTRON_COMPRESSION', ['store', 'normal', 'maximum'] as const, 'normal'),

  // Platform-specific
  macCategory: config.string('ELECTRON_MAC_CATEGORY', 'public.app-category.developer-tools'),
  windowsTarget: config.string('ELECTRON_WINDOWS_TARGET', 'nsis'),
  linuxTarget: config.string('ELECTRON_LINUX_TARGET', 'AppImage'),

  // Security
  nodeIntegration: config.boolean('ELECTRON_NODE_INTEGRATION', false),
  contextIsolation: config.boolean('ELECTRON_CONTEXT_ISOLATION', true),
  enableRemoteModule: config.boolean('ELECTRON_REMOTE_MODULE', false),

  // Auto-updater
  autoUpdate: config.boolean('ELECTRON_AUTO_UPDATE', false),
  updateChannel: config.enum('ELECTRON_UPDATE_CHANNEL', ['stable', 'beta', 'alpha'] as const, 'stable'),
} as const

export const electronConfig = defineConfig(electronConfigSchema)

// Export type for TypeScript inference
export type ElectronConfig = typeof electronConfig
