#!/usr/bin/env bun
/**
 * FluxStack CLI - Simplified Command Line Interface
 *
 * Minimal CLI that routes commands to the appropriate entry points.
 * This replaced the complex core/cli system with a lightweight alternative.
 */

import { spawn } from 'child_process'
import { FluxStackBuilder } from '@/core/build'

const command = process.argv[2]
const args = process.argv.slice(3)

// Helper to run a command
function run(cmd: string, cmdArgs: string[] = [], options: any = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, cmdArgs, {
      stdio: 'inherit',
      shell: true,
      ...options
    })

    proc.on('exit', (code) => {
      if (code === 0) resolve(code)
      else reject(new Error(`Command exited with code ${code}`))
    })

    proc.on('error', reject)
  })
}

// Command handlers
const commands: Record<string, () => Promise<void>> = {
  async dev() {
    console.log('🚀 Starting FluxStack in development mode...\n')
    await run('bun', ['run', 'app/server/index.ts'])
  },

  async frontend() {
    console.log('⚛️  Starting frontend only...\n')
    await run('bun', ['run', 'app/client/frontend-only.ts'])
  },

  async backend() {
    console.log('🔧 Starting backend only...\n')
    await run('bun', ['run', 'app/server/backend-only.ts'])
  },

  async build() {
    console.log('🔨 Building FluxStack for production...\n')

    // Load config
    const { getConfigSync } = await import('@/core/config')
    const config = getConfigSync()

    // Build
    const builder = new FluxStackBuilder(config)

    console.log('📦 Building client...')
    await builder.buildClient()

    console.log('🔧 Building server...')
    await builder.buildServer()

    console.log('✅ Build complete!\n')
  },

  async 'build:frontend'() {
    console.log('📦 Building frontend only...\n')
    await run('vite', ['build', '--config', 'vite.config.ts', '--emptyOutDir'])
  },

  async 'build:backend'() {
    console.log('🔧 Building backend only...\n')
    const { getConfigSync } = await import('@/core/config')
    const config = getConfigSync()
    const builder = new FluxStackBuilder(config)
    await builder.buildServer()
  },

  async start() {
    console.log('🚀 Starting FluxStack in production mode...\n')
    await run('bun', ['run', 'dist/index.js'])
  },

  async help() {
    console.log(`
⚡ FluxStack CLI - Modern TypeScript Framework

Usage: bun run flux-cli.ts [command]

Commands:
  dev              Start full-stack development server (backend + frontend)
  frontend         Start frontend development server only
  backend          Start backend development server only
  build            Build for production (backend + frontend)
  build:frontend   Build frontend only
  build:backend    Build backend only
  start            Start production server
  help             Show this help message

Examples:
  bun run flux-cli.ts dev          # Start development
  bun run flux-cli.ts build        # Build for production
  bun run flux-cli.ts start        # Run production build

For more information, visit: https://github.com/MarcosBrendonDePaula/FluxStack
`)
  }
}

// Execute command
async function main() {
  if (!command || command === 'help') {
    await commands.help()
    process.exit(0)
  }

  const handler = commands[command]

  if (!handler) {
    console.error(`❌ Unknown command: ${command}\n`)
    await commands.help()
    process.exit(1)
  }

  try {
    await handler()
  } catch (error) {
    console.error(`❌ Command failed:`, error)
    process.exit(1)
  }
}

main()
