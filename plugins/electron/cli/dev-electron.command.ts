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

    let backendProcess: any = null
    let backendStartedByUs = false

    try {
      // Step 1: Ensure dist-electron exists
      const outDir = join(process.cwd(), 'dist-electron')
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true })
      }

      // Step 2: Build Electron main process
      logger.info('⚙️  Building Electron main process...')
      await buildElectronMainDev(context)

      // Step 3: Check if FluxStack dev server is already running
      logger.info('🔍 Checking if FluxStack dev server is running...')
      const isServerRunning = await checkServerRunning(options.port)

      if (!isServerRunning) {
        // Start FluxStack dev server automatically
        logger.info('📦 Starting FluxStack dev server automatically...')
        backendProcess = await startBackendServer(context)
        backendStartedByUs = true

        // Wait for server to be ready
        logger.info('⏳ Waiting for FluxStack dev server to be ready...')
        await waitForServer(options.port, context, 60) // Longer timeout for initial startup
      } else {
        logger.info('✅ FluxStack dev server is already running!')
      }

      // Step 4: Start Electron
      logger.info('🖥️  Starting Electron...')
      await startElectron(options, context, backendProcess, backendStartedByUs)

    } catch (error: any) {
      logger.error('❌ Electron dev failed:', error.message)

      // Cleanup backend if we started it
      if (backendStartedByUs && backendProcess) {
        logger.info('🧹 Cleaning up backend server...')
        backendProcess.kill()
      }

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
 * Check if server is already running on the given port
 */
async function checkServerRunning(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(1000) // 1 second timeout
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Start FluxStack backend server in background
 */
async function startBackendServer(context: CliContext): Promise<any> {
  const { logger } = context

  logger.info('  Starting backend with: bun --watch app/server/index.ts')

  const backendProcess = spawn('bun', ['--watch', 'app/server/index.ts'], {
    stdio: ['ignore', 'pipe', 'pipe'], // Capture stdout/stderr
    shell: true,
    cwd: process.cwd(),
    detached: false
  })

  // Log backend output (optional, helps with debugging)
  backendProcess.stdout?.on('data', (data: Buffer) => {
    const output = data.toString().trim()
    if (output) {
      console.log(`[Backend] ${output}`)
    }
  })

  backendProcess.stderr?.on('data', (data: Buffer) => {
    const output = data.toString().trim()
    if (output && !output.includes('Debugger listening')) {
      console.error(`[Backend Error] ${output}`)
    }
  })

  backendProcess.on('error', (error) => {
    logger.error('Backend process error:', error)
  })

  return backendProcess
}

/**
 * Wait for FluxStack dev server to be ready (with embedded Vite)
 */
async function waitForServer(port: number, context: CliContext, maxSeconds: number = 30): Promise<void> {
  const maxAttempts = maxSeconds
  const delayMs = 1000

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`http://localhost:${port}`)
      if (response.ok) {
        context.logger.info('  ✅ FluxStack dev server is ready!')
        return
      }
    } catch {
      // Server not ready yet
      if (attempt % 5 === 0) {
        context.logger.info(`  Still waiting... (${attempt}/${maxAttempts}s)`)
      }
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  throw new Error(`FluxStack dev server did not start in time on port ${port}.`)
}

/**
 * Start Electron with the dev server
 */
async function startElectron(
  options: any,
  context: CliContext,
  backendProcess: any = null,
  backendStartedByUs: boolean = false
): Promise<void> {
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
  if (backendStartedByUs) {
    logger.info('  Backend will stop when you close Electron')
  }
  logger.info('  Press Ctrl+C to stop')

  // Run electron (don't wait for it to finish)
  const child = spawn('bunx', electronArgs, {
    stdio: 'inherit',
    shell: true,
    env
  })

  // Cleanup function
  const cleanup = (code: number = 0) => {
    if (backendStartedByUs && backendProcess) {
      logger.info('🧹 Stopping backend server...')
      try {
        backendProcess.kill('SIGTERM')
        // Force kill after 5 seconds
        setTimeout(() => {
          if (!backendProcess.killed) {
            backendProcess.kill('SIGKILL')
          }
        }, 5000)
      } catch (error) {
        // Process might already be dead
      }
    }
    process.exit(code)
  }

  child.on('close', (code) => {
    logger.info(`\n✅ Electron closed`)
    cleanup(code || 0)
  })

  child.on('error', (error) => {
    logger.error('Electron error:', error)
    cleanup(1)
  })

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    logger.info('\n⚠️  Received Ctrl+C, shutting down...')
    child.kill('SIGINT')
    cleanup(0)
  })

  // Handle process termination
  process.on('SIGTERM', () => {
    logger.info('\n⚠️  Received termination signal, shutting down...')
    child.kill('SIGTERM')
    cleanup(0)
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
