/**
 * FluxStack Electron Build Command
 * CLI command to build the Electron application
 */

import type { CliCommand, CliContext } from '@/core/plugins/types'
import { spawn } from 'child_process'
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { electronConfig } from '../config'

export const buildElectronCommand: CliCommand = {
  name: 'build:electron',
  description: 'Build the Electron desktop application',
  usage: 'build:electron [options]',
  category: 'build',
  aliases: ['electron:build'],

  options: [
    {
      name: 'platform',
      short: 'p',
      description: 'Target platform (win32, darwin, linux, all)',
      type: 'string',
      default: process.platform,
      choices: ['win32', 'darwin', 'linux', 'all']
    },
    {
      name: 'arch',
      short: 'a',
      description: 'Target architecture (x64, arm64, ia32, all)',
      type: 'string',
      default: process.arch,
      choices: ['x64', 'arm64', 'ia32', 'all']
    },
    {
      name: 'publish',
      description: 'Publish the build (requires publish config)',
      type: 'boolean',
      default: false
    },
    {
      name: 'dir',
      description: 'Build unpacked directory instead of installers',
      type: 'boolean',
      default: false
    }
  ],

  examples: [
    'build:electron',
    'build:electron --platform=darwin --arch=arm64',
    'build:electron --platform=all',
    'build:electron --publish'
  ],

  handler: async (args, options, context: CliContext) => {
    const { logger } = context

    if (!electronConfig.enabled) {
      logger.error('Electron plugin is disabled. Enable it in your config.')
      process.exit(1)
    }

    logger.info('🚀 Building Electron application...')

    try {
      // Step 1: Build the FluxStack application first
      logger.info('📦 Building FluxStack application...')
      await runCommand('bun', ['run', 'build'], context)

      // Step 2: Build Electron main process
      logger.info('⚙️  Building Electron main process...')
      await buildElectronMain(context)

      // Step 3: Copy electron-builder config
      logger.info('📋 Preparing electron-builder config...')
      await prepareElectronBuilder(context)

      // Step 4: Run electron-builder
      logger.info('📦 Packaging with electron-builder...')
      await runElectronBuilder(options, context)

      logger.info('✅ Electron application built successfully!')
      logger.info(`📁 Output directory: ${electronConfig.outputDir}`)

    } catch (error: any) {
      logger.error('❌ Electron build failed:', error.message)
      process.exit(1)
    }
  }
}

/**
 * Build the Electron main process with Bun
 */
async function buildElectronMain(context: CliContext): Promise<void> {
  const { logger } = context
  const mainFile = join(process.cwd(), 'plugins/electron/electron/main.ts')
  const preloadFile = join(process.cwd(), 'plugins/electron/electron/preload.ts')
  const outDir = join(process.cwd(), 'dist-electron')

  // Create output directory
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true })
  }

  // Build main process
  logger.info('  Building main.js...')
  await runCommand('bun', [
    'build',
    mainFile,
    '--target=node',
    '--format=cjs',
    '--outfile=' + join(outDir, 'main.js'),
    '--minify',
    '--external=electron'
  ], context)

  // Build preload script (MUST be CommonJS for Electron)
  logger.info('  Building preload.js...')
  await runCommand('bun', [
    'build',
    preloadFile,
    '--target=node',
    '--format=cjs',
    '--outfile=' + join(outDir, 'preload.js'),
    '--minify',
    '--external=electron'
  ], context)

  logger.info('  ✅ Main process built successfully')
}

/**
 * Prepare electron-builder configuration
 */
async function prepareElectronBuilder(context: CliContext): Promise<void> {
  const { logger } = context
  const rootDir = process.cwd()
  const configSource = join(rootDir, 'plugins/electron/electron-builder.yml')
  const configDest = join(rootDir, 'electron-builder.yml')

  // Copy electron-builder.yml to root
  if (existsSync(configSource)) {
    copyFileSync(configSource, configDest)
    logger.info('  Copied electron-builder.yml to project root')
  }

  // Create package.json for electron-builder (in dist directory)
  const packageJson = {
    name: electronConfig.appId,
    version: context.packageInfo.version,
    main: 'dist-electron/main.js',
    description: context.config.app?.description || 'FluxStack Application',
    author: electronConfig.productName,
    license: 'MIT'
  }

  writeFileSync(
    join(rootDir, 'package-electron.json'),
    JSON.stringify(packageJson, null, 2)
  )

  logger.info('  Created package-electron.json')
}

/**
 * Run electron-builder
 */
async function runElectronBuilder(options: any, context: CliContext): Promise<void> {
  const args = ['electron-builder']

  // Platform
  if (options.platform && options.platform !== 'all') {
    if (options.platform === 'win32') args.push('--win')
    else if (options.platform === 'darwin') args.push('--mac')
    else if (options.platform === 'linux') args.push('--linux')
  }

  // Architecture
  if (options.arch && options.arch !== 'all') {
    args.push('--' + options.arch)
  }

  // Publish
  if (options.publish) {
    args.push('--publish', 'always')
  }

  // Directory build
  if (options.dir) {
    args.push('--dir')
  }

  // Config file
  args.push('--config', 'electron-builder.yml')

  await runCommand('bunx', args, context)
}

/**
 * Run a command and wait for completion
 */
function runCommand(command: string, args: string[], context: CliContext): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        // Inject config as env vars for electron-builder
        ELECTRON_APP_ID: electronConfig.appId,
        ELECTRON_PRODUCT_NAME: electronConfig.productName,
        ELECTRON_OUTPUT_DIR: electronConfig.outputDir,
        ELECTRON_BUILD_DIR: electronConfig.buildDir,
        ELECTRON_ASAR: String(electronConfig.asar),
        ELECTRON_COMPRESSION: electronConfig.compression,
        ELECTRON_MAC_CATEGORY: electronConfig.macCategory,
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
