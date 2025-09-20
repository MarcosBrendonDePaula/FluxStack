#!/usr/bin/env bun

import { FluxStackBuilder } from "../build"
import { ProjectCreator } from "../templates/create-project"
import { getConfigSync } from "../config"
import { cliRegistry } from "./command-registry"
import { pluginDiscovery } from "./plugin-discovery"

const command = process.argv[2]
const args = process.argv.slice(3)

// Register built-in commands
async function registerBuiltInCommands() {
  // Help command
  cliRegistry.register({
    name: 'help',
    description: 'Show help information',
    category: 'General',
    aliases: ['h', '--help', '-h'],
    arguments: [
      {
        name: 'command',
        description: 'Command to show help for',
        required: false
      }
    ],
    handler: async (args, options, context) => {
      if (args[0]) {
        const targetCommand = cliRegistry.get(args[0])
        if (targetCommand) {
          cliRegistry.showCommandHelp(targetCommand)
        } else {
          console.error(`❌ Unknown command: ${args[0]}`)
          cliRegistry.showHelp()
        }
      } else {
        cliRegistry.showHelp()
      }
    }
  })

  // Dev command
  cliRegistry.register({
    name: 'dev',
    description: 'Start full-stack development server',
    category: 'Development',
    usage: 'flux dev [options]',
    examples: [
      'flux dev                    # Start development server',
      'flux dev --port 4000        # Start on custom port'
    ],
    options: [
      {
        name: 'port',
        short: 'p',
        description: 'Port for backend server',
        type: 'number',
        default: 3000
      },
      {
        name: 'frontend-port',
        description: 'Port for frontend server',
        type: 'number',
        default: 5173
      }
    ],
    handler: async (args, options, context) => {
      console.log("⚡ FluxStack Full-Stack Development")
      console.log(`🌐 Frontend: http://localhost:${options['frontend-port']}`)  
      console.log(`🚀 Backend: http://localhost:${options.port}`)
      console.log("🔄 Backend inicia Vite programaticamente - Zero órfãos!")
      console.log("📦 Starting backend server...")
      console.log()
      
      const { spawn } = await import("child_process")
      const devProcess = spawn("bun", ["--watch", "app/server/index.ts"], {
        stdio: "inherit",
        cwd: process.cwd(),
        env: {
          ...process.env,
          FRONTEND_PORT: options['frontend-port'].toString(),
          BACKEND_PORT: options.port.toString()
        }
      })
      
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down gracefully...')
        devProcess.kill('SIGTERM')
        setTimeout(() => {
          devProcess.kill('SIGKILL')
          process.exit(0)
        }, 5000)
      })
      
      devProcess.on('close', (code) => {
        process.exit(code || 0)
      })
      
      // Keep the CLI running until the child process exits
      return new Promise((resolve) => {
        devProcess.on('exit', resolve)
      })
    }
  })

  // Build command
  cliRegistry.register({
    name: 'build',
    description: 'Build the application for production',
    category: 'Build',
    usage: 'flux build [options]',
    examples: [
      'flux build                  # Build both frontend and backend',
      'flux build --frontend-only  # Build only frontend',
      'flux build --backend-only   # Build only backend'
    ],
    options: [
      {
        name: 'frontend-only',
        description: 'Build only frontend',
        type: 'boolean'
      },
      {
        name: 'backend-only',
        description: 'Build only backend',
        type: 'boolean'
      },
      {
        name: 'production',
        description: 'Build for production (minified)',
        type: 'boolean',
        default: true
      }
    ],
    handler: async (args, options, context) => {
      const config = getConfigSync()
      const builder = new FluxStackBuilder(config)
      
      if (options['frontend-only']) {
        await builder.buildClient()
      } else if (options['backend-only']) {
        await builder.buildServer()
      } else {
        await builder.build()
      }
    }
  })

  // Create command  
  cliRegistry.register({
    name: 'create',
    description: 'Create a new FluxStack project',
    category: 'Project',
    usage: 'flux create <project-name> [template]',
    examples: [
      'flux create my-app          # Create basic project',
      'flux create my-app full     # Create full-featured project'
    ],
    arguments: [
      {
        name: 'project-name',
        description: 'Name of the project to create',
        required: true,
        type: 'string'
      },
      {
        name: 'template',
        description: 'Project template to use',
        required: false,
        type: 'string',
        default: 'basic',
        choices: ['basic', 'full']
      }
    ],
    handler: async (args, options, context) => {
      const [projectName, template] = args
      
      if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
        console.error("❌ Project name can only contain letters, numbers, hyphens, and underscores")
        return
      }

      try {
        const creator = new ProjectCreator({
          name: projectName,
          template: template as 'basic' | 'full' || 'basic'
        })
        
        await creator.create()
      } catch (error) {
        console.error("❌ Failed to create project:", error instanceof Error ? error.message : String(error))
        throw error
      }
    }
  })
}

// Main CLI logic
async function main() {
  // Register built-in commands
  await registerBuiltInCommands()
  
  // Discover and register plugin commands
  await pluginDiscovery.discoverAndRegisterCommands()
  
  // Handle special cases first
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    await cliRegistry.execute('help', args)
    return
  }
  
  // Check if it's a registered command (built-in or plugin)
  if (cliRegistry.has(command)) {
    const exitCode = await cliRegistry.execute(command, args)
    process.exit(exitCode)
    return
  }
  
  // Fallback to legacy command handling for backward compatibility
  await handleLegacyCommands()
}

// Legacy command handling for backward compatibility
async function handleLegacyCommands() {
  switch (command) {
  case "dev":
    console.log("⚡ FluxStack Full-Stack Development")
    console.log("🌐 Frontend: http://localhost:5173")  
    console.log("🚀 Backend: http://localhost:3000")
    console.log("🔄 Backend inicia Vite programaticamente - Zero órfãos!")
    console.log("📦 Starting backend server...")
    console.log()
    
    // Start only backend - it will start Vite programmatically
    const { spawn } = await import("child_process")
    const devProcess = spawn("bun", ["--watch", "app/server/index.ts"], {
      stdio: "inherit",
      cwd: process.cwd()
    })
    
    // Handle process cleanup
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down gracefully...')
      devProcess.kill('SIGTERM')
      setTimeout(() => {
        devProcess.kill('SIGKILL')
        process.exit(0)
      }, 5000)
    })
    
    devProcess.on('close', (code) => {
      process.exit(code || 0)
    })
    
    // Keep the CLI running until the child process exits
    await new Promise((resolve) => {
      devProcess.on('exit', resolve)
    })
    break

  case "frontend":
    console.log("🎨 FluxStack Frontend Development")
    console.log("🌐 Frontend: http://localhost:5173")
    console.log("📦 Starting Vite dev server...")
    console.log()
    
    const { spawn: spawnFrontend } = await import("child_process")
    const frontendProcess = spawnFrontend("vite", ["--config", "vite.config.ts"], {
      stdio: "inherit",
      cwd: process.cwd()
    })
    
    process.on('SIGINT', () => {
      frontendProcess.kill('SIGINT')
      process.exit(0)
    })
    break

  case "backend":
    console.log("⚡ FluxStack Backend Development")
    console.log("🚀 API Server: http://localhost:3001")
    console.log("📦 Starting backend with hot reload...")
    console.log()
    
    // Start backend with Bun watch for hot reload
    const { spawn: spawnBackend } = await import("child_process")
    const backendProcess = spawnBackend("bun", ["--watch", "app/server/backend-only.ts"], {
      stdio: "inherit",
      cwd: process.cwd()
    })
    
    // Handle process cleanup
    process.on('SIGINT', () => {
      backendProcess.kill('SIGINT')
      process.exit(0)
    })
    break

  case "build":
    const config = getConfigSync()
    const builder = new FluxStackBuilder(config)
    await builder.build()
    break

  case "build:frontend":
    const frontendConfig = getConfigSync()
    const frontendBuilder = new FluxStackBuilder(frontendConfig)
    await frontendBuilder.buildClient()
    break

  case "build:backend":
    const backendConfig = getConfigSync()
    const backendBuilder = new FluxStackBuilder(backendConfig)
    await backendBuilder.buildServer()
    break

  case "start":
    console.log("🚀 Starting FluxStack production server...")
    await import(process.cwd() + "/dist/index.js")
    break

  case "create":
    const projectName = process.argv[3]
    const template = process.argv[4]
    
    if (!projectName) {
      console.error("❌ Please provide a project name: flux create my-app")
      console.error()
      console.error("Usage:")
      console.error("  flux create <project-name> [template]")
      console.error()
      console.error("Templates:")
      console.error("  basic    Basic FluxStack project (default)")
      console.error("  full     Full-featured project with examples")
      process.exit(1)
    }

    // Validate project name
    if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
      console.error("❌ Project name can only contain letters, numbers, hyphens, and underscores")
      process.exit(1)
    }

    try {
      const creator = new ProjectCreator({
        name: projectName,
        template: template as 'basic' | 'full' || 'basic'
      })
      
      await creator.create()
    } catch (error) {
      console.error("❌ Failed to create project:", error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
    break

  default:
    console.log(`
⚡ FluxStack Framework CLI

Usage:
  flux dev             Start full-stack development server
  flux frontend        Start frontend only (Vite dev server)
  flux backend         Start backend only (API server)
  flux build           Build both frontend and backend
  flux build:frontend  Build frontend only
  flux build:backend   Build backend only
  flux start           Start production server
  flux create          Create new project

Examples:
  flux dev                    # Full-stack development
  flux frontend               # Frontend only (port 5173)
  flux backend                # Backend only (port 3001)
  flux create my-app          # Create new project

Alternative commands:
  fluxstack dev              # Same as flux dev
  bun run dev:frontend       # Direct frontend start
  bun run dev:backend        # Direct backend start

Environment Variables:
  FRONTEND_PORT=5173         # Frontend port
  BACKEND_PORT=3001          # Backend port  
  API_URL=http://localhost:3001  # API URL for frontend
    `)
  }
}

// Run main CLI
main().catch(error => {
  console.error('❌ CLI Error:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})