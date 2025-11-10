/**
 * FluxStack Electron Plugin
 * Enables building desktop applications with Electron
 */

import type { FluxStack, PluginContext, BuildContext } from "@/core/plugins/types"
import { buildElectronCommand } from "./cli/build-electron.command"
import { devElectronCommand } from "./cli/dev-electron.command"
import { electronConfig } from "./config"
import { spawn } from "child_process"
import { existsSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from "fs"
import { join } from "path"

type Plugin = FluxStack.Plugin

export const electronPlugin: Plugin = {
  name: "electron",
  version: "1.0.0",
  description: "Build desktop applications with Electron for Windows, macOS, and Linux",
  author: "FluxStack Team",
  priority: 50,
  category: "build",
  tags: ["electron", "desktop", "build", "packaging", "cross-platform"],
  dependencies: [],

  configSchema: {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
        description: "Enable Electron plugin"
      },
      width: {
        type: "number",
        description: "Default window width"
      },
      height: {
        type: "number",
        description: "Default window height"
      },
      productName: {
        type: "string",
        description: "Application product name"
      },
      appId: {
        type: "string",
        description: "Application ID (reverse domain notation)"
      },
      outputDir: {
        type: "string",
        description: "Output directory for built applications"
      },
      devTools: {
        type: "boolean",
        description: "Enable DevTools in development"
      },
      nodeIntegration: {
        type: "boolean",
        description: "Enable Node.js integration in renderer"
      },
      contextIsolation: {
        type: "boolean",
        description: "Enable context isolation (recommended)"
      }
    },
    additionalProperties: false
  },

  defaultConfig: {
    enabled: true,
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    productName: "FluxStack App",
    appId: "com.fluxstack.app",
    outputDir: "dist-electron",
    buildDir: "build",
    devTools: true,
    asar: true,
    compression: "normal",
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
  },

  // CLI Commands
  commands: [
    buildElectronCommand,
    devElectronCommand
  ],

  setup: async (context: PluginContext) => {
    if (!electronConfig.enabled) {
      context.logger.info('Electron plugin is disabled')
      return
    }

    context.logger.info("✅ Electron plugin initialized", {
      productName: electronConfig.productName,
      appId: electronConfig.appId,
      outputDir: electronConfig.outputDir,
      commands: [
        'bun run cli dev:electron - Run Electron in dev mode',
        'bun run cli build:electron - Build Electron app'
      ]
    })

    // Ensure build resources directory exists
    const buildDir = join(process.cwd(), electronConfig.buildDir)
    if (!existsSync(buildDir)) {
      mkdirSync(buildDir, { recursive: true })
      context.logger.info(`Created build directory: ${buildDir}`)
    }
  },

  onBuild: async (context: BuildContext) => {
    if (!electronConfig.enabled) {
      return
    }

    const { config, mode } = context

    // Only run in production builds
    if (mode !== 'production') {
      return
    }

    context.config.logger?.info('📦 [Electron] Preparing for Electron build...')

    // Create dist-electron directory
    const distElectron = join(process.cwd(), 'dist-electron')
    if (!existsSync(distElectron)) {
      mkdirSync(distElectron, { recursive: true })
    }

    // Build main and preload scripts
    await buildElectronScripts(context)

    context.config.logger?.info('✅ [Electron] Ready for electron-builder')
  },

  onBuildComplete: async (context: BuildContext) => {
    if (!electronConfig.enabled) {
      return
    }

    const { mode } = context

    // Only run in production builds
    if (mode !== 'production') {
      return
    }

    context.config.logger?.info('📦 [Electron] Build complete')
    context.config.logger?.info('💡 [Electron] To build desktop app, run: bun run cli build:electron')
  },

  onServerStart: async (context: PluginContext) => {
    if (!electronConfig.enabled) {
      return
    }

    context.logger.info("✅ Electron plugin active", {
      mode: 'desktop',
      productName: electronConfig.productName,
      devCommands: [
        'dev:electron - Start Electron in development mode',
        'build:electron - Build desktop application'
      ]
    })
  }
}

/**
 * Build Electron main and preload scripts
 */
async function buildElectronScripts(context: BuildContext): Promise<void> {
  const logger = context.config.logger
  const rootDir = process.cwd()
  const mainFile = join(rootDir, 'plugins/electron/electron/main.ts')
  const preloadFile = join(rootDir, 'plugins/electron/electron/preload.ts')
  const outDir = join(rootDir, 'dist-electron')

  logger?.info('  Building Electron main process...')

  // Build main.js
  await runBuildCommand([
    'build',
    mainFile,
    '--target=node',
    '--format=cjs',
    '--outfile=' + join(outDir, 'main.js'),
    '--minify',
    '--external=electron'
  ])

  logger?.info('  Building Electron preload script...')

  // Build preload.js (MUST be CommonJS for Electron)
  await runBuildCommand([
    'build',
    preloadFile,
    '--target=node',
    '--format=cjs',
    '--outfile=' + join(outDir, 'preload.js'),
    '--minify',
    '--external=electron'
  ])

  logger?.info('  ✅ Electron scripts built successfully')

  // Copy electron-builder config to root
  const configSource = join(rootDir, 'plugins/electron/electron-builder.yml')
  const configDest = join(rootDir, 'electron-builder.yml')

  if (existsSync(configSource)) {
    copyFileSync(configSource, configDest)
    logger?.info('  Copied electron-builder.yml to root')
  }
}

/**
 * Run a Bun build command
 */
function runBuildCommand(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('bun', args, {
      stdio: 'pipe',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    })

    let stderr = ''

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Build command failed: ${stderr}`))
      } else {
        resolve()
      }
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}

export default electronPlugin
