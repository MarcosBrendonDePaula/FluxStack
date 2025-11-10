/**
 * FluxStack Electron Dev Command
 * CLI command to run Electron in development mode
 */

import type { CliCommand, CliContext } from '@/core/plugins/types'
import { spawn } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { electronConfig } from '../config'

export const devElectronCommand: CliCommand = {
  name: 'dev:electron',
  description: 'Run Electron in development mode',
  usage: 'dev:electron',
  category: 'development',
  aliases: ['electron:dev', 'electron'],

  options: [
    {
      name: 'inspect',
      description: 'Enable Node.js inspector for debugging',
      type: 'boolean',
      default: false
    },
    {
      name: 'port',
      short: 'p',
      description: 'FluxStack dev server port (with embedded Vite)',
      type: 'number',
      default: 3000
    }
  ],

  examples: [
    'dev:electron',
    'dev:electron --inspect',
    'dev:electron --port=3000'
  ],

  handler: async (args, options, context: CliContext) => {
    const { logger } = context

    if (!electronConfig.enabled) {
      logger.error('Electron plugin is disabled. Enable it in your config.')
      process.exit(1)
    }

    logger.info('🚀 Starting Electron in development mode...')

    try {
      // Step 1: Ensure dist-electron exists
      const outDir = join(process.cwd(), 'dist-electron')
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true })
      }

      // Step 2: Build Electron main process in watch mode
      logger.info('⚙️  Building Electron main process...')
      await buildElectronMainDev(context)

      // Step 3: Wait for FluxStack dev server to be ready (with embedded Vite)
      logger.info('⏳ Waiting for FluxStack dev server...')
      await waitForServer(options.port, context)

      // Step 4: Start Electron
      logger.info('🖥️  Starting Electron...')
      await startElectron(options, context)

    } catch (error: any) {
      logger.error('❌ Electron dev failed:', error.message)
      process.exit(1)
    }
  }
}

/**
 * Build Electron main process for development (no minification)
 */
async function buildElectronMainDev(context: CliContext): Promise<void> {
  const { logger } = context
  const mainFile = join(process.cwd(), 'plugins/electron/electron/main.ts')
  const preloadFile = join(process.cwd(), 'plugins/electron/electron/preload.ts')
  const outDir = join(process.cwd(), 'dist-electron')

  // Build main process
  logger.info('  Building main.js...')
  await runCommand('bun', [
    'build',
    mainFile,
    '--target=node',
    '--outfile=' + join(outDir, 'main.js'),
    '--external=electron'
  ], context, false)

  // Build preload script
  logger.info('  Building preload.js...')
  await runCommand('bun', [
    'build',
    preloadFile,
    '--target=node',
    '--outfile=' + join(outDir, 'preload.js'),
    '--external=electron'
  ], context, false)

  logger.info('  ✅ Main process built successfully')
}

/**
 * Wait for FluxStack dev server to be ready (with embedded Vite)
 */
async function waitForServer(port: number, context: CliContext): Promise<void> {
  const maxAttempts = 30
  const delayMs = 1000

  context.logger.info(`  Checking http://localhost:${port}...`)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`http://localhost:${port}`)
      if (response.ok) {
        context.logger.info('  ✅ FluxStack dev server is ready!')
        return
      }
    } catch {
      // Server not ready yet
      if (attempt === 1) {
        context.logger.info('  Server not ready yet, waiting...')
      }
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  throw new Error(`FluxStack dev server did not start in time on port ${port}.\n\nPlease run "bun run dev" first in another terminal.`)
}

/**
 * Start Electron with the dev server
 */
async function startElectron(options: any, context: CliContext): Promise<void> {
  const { logger } = context
  const electronArgs = [
    'electron',
    'dist-electron/main.js'
  ]

  // Add inspector if requested
  if (options.inspect) {
    electronArgs.splice(1, 0, '--inspect=5858')
  }

  const env = {
    ...process.env,
    NODE_ENV: 'development',
    ELECTRON_DEV_PORT: String(options.port), // Pass the port to Electron
    ELECTRON_DEV_TOOLS: 'true',
    ELECTRON_WINDOW_WIDTH: String(electronConfig.width),
    ELECTRON_WINDOW_HEIGHT: String(electronConfig.height),
    ELECTRON_MIN_WIDTH: String(electronConfig.minWidth),
    ELECTRON_MIN_HEIGHT: String(electronConfig.minHeight),
    ELECTRON_NODE_INTEGRATION: String(electronConfig.nodeIntegration),
    ELECTRON_CONTEXT_ISOLATION: String(electronConfig.contextIsolation),
    ELECTRON_REMOTE_MODULE: String(electronConfig.enableRemoteModule),
    ELECTRON_PRODUCT_NAME: electronConfig.productName,
  }

  logger.info('  Electron is starting...')
  logger.info(`  Frontend: http://localhost:${options.port}`)
  logger.info('  Press Ctrl+C to stop')

  // Run electron (don't wait for it to finish)
  const child = spawn('bunx', electronArgs, {
    stdio: 'inherit',
    shell: true,
    env
  })

  child.on('close', (code) => {
    logger.info(`Electron exited with code ${code}`)
    process.exit(code || 0)
  })

  child.on('error', (error) => {
    logger.error('Electron error:', error)
    process.exit(1)
  })

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    logger.info('Stopping Electron...')
    child.kill()
    process.exit(0)
  })

  // Keep the process alive
  await new Promise(() => {})
}

/**
 * Run a command and wait for completion
 */
function runCommand(
  command: string,
  args: string[],
  context: CliContext,
  inheritStdio = true
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: inheritStdio ? 'inherit' : 'pipe',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development',
      }
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`))
      } else {
        resolve()
      }
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}
