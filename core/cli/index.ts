#!/usr/bin/env bun

import { FluxStackBuilder } from "@/core/build"
import { ProjectCreator } from "@/core/templates/create-project"
import { getConfigSync } from "@/core/config"
import { cliRegistry } from "./command-registry"
import { pluginDiscovery } from "./plugin-discovery"
import { generateCommand, interactiveGenerateCommand } from "./generators/index"
import { startGroup, endGroup, logBox, logInGroup } from "@/core/utils/logger/group-logger"

const command = process.argv[2]
const args = process.argv.slice(3)

// Register built-in commands
async function registerBuiltInCommands() {
  // Register generate commands
  cliRegistry.register(generateCommand)
  cliRegistry.register(interactiveGenerateCommand)
  
  // Register plugin dependency commands
  cliRegistry.register({
    name: 'plugin:deps',
    description: 'Gerenciar dependências de plugins',
    category: 'Plugins',
    handler: async (args, options, context) => {
      if (args.length === 0) {
        console.log(`
⚡ FluxStack Plugin Dependencies Manager

Usage:
  flux plugin:deps install     Install plugin dependencies
  flux plugin:deps list        List plugin dependencies  
  flux plugin:deps check       Check for dependency conflicts
  flux plugin:deps clean       Clean unused dependencies

Examples:
  flux plugin:deps install --dry-run    # Show what would be installed
  flux plugin:deps list --plugin crypto-auth  # Show specific plugin deps
  flux plugin:deps check                # Check for conflicts
        `)
        return
      }
      
      // Handle subcommands
      const subcommand = args[0]
      const subArgs = args.slice(1)
      
      // Import dinamicamente para evitar problemas de inicialização
      const { createPluginDepsCommand } = await import('./commands/plugin-deps')
      const cmd = createPluginDepsCommand()
      
      switch (subcommand) {
        case 'install':
          const installCmd = cmd.commands.find(c => c.name() === 'install')
          if (installCmd) {
            await installCmd.parseAsync(['node', 'cli', ...subArgs], { from: 'user' })
          }
          break
        case 'list':
          const listCmd = cmd.commands.find(c => c.name() === 'list')
          if (listCmd) {
            await listCmd.parseAsync(['node', 'cli', ...subArgs], { from: 'user' })
          }
          break
        case 'check':
          const checkCmd = cmd.commands.find(c => c.name() === 'check')
          if (checkCmd) {
            await checkCmd.parseAsync(['node', 'cli', ...subArgs], { from: 'user' })
          }
          break
        case 'clean':
          const cleanCmd = cmd.commands.find(c => c.name() === 'clean')
          if (cleanCmd) {
            await cleanCmd.parseAsync(['node', 'cli', ...subArgs], { from: 'user' })
          }
          break
        default:
          console.error(`❌ Unknown subcommand: ${subcommand}`)
          console.error('Available subcommands: install, list, check, clean')
      }
    }
  })
  
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
      // Grouped startup messages
      startGroup({
        title: 'FluxStack Development Server',
        icon: '',
        color: 'cyan'
      })

      logInGroup(`Server: http://localhost:${options.port}`, '')
      logInGroup(`API: http://localhost:${options.port}/api`, '')
      logInGroup(`Swagger: http://localhost:${options.port}/swagger`, '')
      logInGroup('Starting with hot reload...', '')

      endGroup()
      console.log('') // Separator line
      
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

  // Make:plugin command (shortcut for generate plugin)
  cliRegistry.register({
    name: 'make:plugin',
    description: 'Create a new FluxStack plugin',
    category: 'Plugins',
    usage: 'flux make:plugin <name> [options]',
    aliases: ['create:plugin'],
    examples: [
      'flux make:plugin my-plugin              # Create basic plugin',
      'flux make:plugin my-plugin --template full    # Create full plugin with server/client',
      'flux make:plugin auth --template server       # Create server-only plugin'
    ],
    arguments: [
      {
        name: 'name',
        description: 'Name of the plugin to create',
        required: true,
        type: 'string'
      }
    ],
    options: [
      {
        name: 'template',
        short: 't',
        description: 'Plugin template to use',
        type: 'string',
        choices: ['basic', 'full', 'server', 'client'],
        default: 'basic'
      },
      {
        name: 'description',
        short: 'd',
        description: 'Plugin description',
        type: 'string',
        default: 'A FluxStack plugin'
      },
      {
        name: 'force',
        short: 'f',
        description: 'Overwrite existing plugin',
        type: 'boolean',
        default: false
      }
    ],
    handler: async (args, options, context) => {
      const [name] = args

      if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
        console.error("❌ Plugin name can only contain letters, numbers, hyphens, and underscores")
        return
      }

      // Use the plugin generator
      const { generatorRegistry } = await import('./generators/index')
      const pluginGenerator = generatorRegistry.get('plugin')

      if (!pluginGenerator) {
        console.error("❌ Plugin generator not found")
        return
      }

      const generatorContext = {
        workingDir: context.workingDir,
        config: context.config,
        logger: context.logger,
        utils: context.utils
      }

      const generatorOptions = {
        name,
        template: options.template,
        force: options.force,
        dryRun: false,
        description: options.description
      }

      try {
        await pluginGenerator.generate(generatorContext, generatorOptions)
      } catch (error) {
        console.error("❌ Failed to create plugin:", error instanceof Error ? error.message : String(error))
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

  // Command not found - show error and help
  console.error(`❌ Unknown command: ${command}`)
  console.error()
  await cliRegistry.execute('help', args)
  process.exit(1)
}

// Run main CLI
main().catch(error => {
  console.error('❌ CLI Error:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})