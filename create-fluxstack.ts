#!/usr/bin/env bun

import { program } from 'commander'
import { resolve, join } from 'path'
import { existsSync, mkdirSync, cpSync, writeFileSync, readFileSync } from 'fs'
import chalk from 'chalk'
import ora from 'ora'
import { FLUXSTACK_VERSION } from './core/utils/version'

const logo = `
⚡ ███████ ██      ██    ██ ██   ██ ███████ ████████  █████   ██████ ██   ██
   ██      ██      ██    ██  ██ ██  ██         ██    ██   ██ ██      ██  ██
   █████   ██      ██    ██   ███   ███████    ██    ███████ ██      █████
   ██      ██      ██    ██  ██ ██       ██    ██    ██   ██ ██      ██  ██
   ██      ███████  ██████  ██   ██ ███████    ██    ██   ██  ██████ ██   ██

${chalk.cyan('💫 Powered by Bun - The Divine Runtime ⚡')}
${chalk.gray(`FluxStack v${FLUXSTACK_VERSION} - Creates full-stack TypeScript apps`)}
`

program
  .name('create-fluxstack')
  .description('⚡ Create FluxStack apps with zero configuration')
  .version('1.0.0')
  .argument('[project-name]', 'Name of the project to create')
  .option('--no-install', 'Skip dependency installation')
  .option('--no-git', 'Skip git initialization')
  .action(async (projectName, options) => {
    console.clear()
    console.log(chalk.magenta(logo))
    
    if (!projectName || projectName.trim().length === 0) {
      console.log(chalk.red('❌ Project name is required'))
      console.log(chalk.gray('Usage: ./create-fluxstack.ts my-app'))
      process.exit(1)
    }
    
    const currentDir = import.meta.dir
    const projectPath = resolve(projectName)
    
    // Check if directory already exists
    if (existsSync(projectPath)) {
      console.log(chalk.red(`❌ Directory ${projectName} already exists`))
      process.exit(1)
    }
    
    console.log(chalk.cyan(`\n🚀 Creating FluxStack project: ${chalk.bold(projectName)}`))
    console.log(chalk.gray(`📁 Location: ${projectPath}`))
    
    // Create project directory
    const spinner = ora('Creating project structure...').start()
    
    try {
      mkdirSync(projectPath, { recursive: true })
      
      // Copy only essential FluxStack files (not node_modules, not test apps, etc.)
      const frameworkDir = currentDir // Use current directory (framework root)
      const filesToCopy = [
        'core',
        'app',
        'config',         // ✅ CRITICAL: Copy config folder with declarative configs
        'plugins',     // TODO: Copy when crypto-auth plugin is complete
        'ai-context',     // ✅ CRITICAL: Copy AI documentation for users
        'bun.lock',       // ✅ CRITICAL: Copy lockfile to maintain working versions
        'package.json',   // ✅ Copy real package.json from framework
        'tsconfig.json',
        'vite.config.ts',
        '.env.example',   // ✅ Use .env.example as template
        'CLAUDE.md',      // ✅ Project instructions for AI assistants
        'README.md'
      ]

      for (const file of filesToCopy) {
        const sourcePath = join(frameworkDir, file)
        const destPath = join(projectPath, file)

        if (existsSync(sourcePath)) {
          cpSync(sourcePath, destPath, { recursive: true })
        }
      }

      // Create empty plugins directory for user plugins
      const pluginsDir = join(projectPath, 'plugins')
      mkdirSync(pluginsDir, { recursive: true })

      // Create a README in plugins folder
      const pluginsReadme = `# Plugins

This folder is for your custom FluxStack plugins.

## 📖 Documentation

For complete plugin development guide, see:
- \`ai-context/development/plugins-guide.md\` - Full plugin documentation
- \`ai-context/examples/\` - Plugin examples

## 📦 Available CLI Commands

\`\`\`bash
# Create a new plugin
bun run cli make:plugin my-plugin                    # Basic plugin
bun run cli make:plugin my-plugin --template full    # Full plugin (server + client)
bun run cli make:plugin my-plugin --template server  # Server-only plugin

# Manage plugin dependencies
bun run cli plugin:deps install    # Install plugin dependencies
bun run cli plugin:deps list       # List plugin dependencies
bun run cli plugin:deps check      # Check for conflicts
bun run cli plugin:deps clean      # Clean unused dependencies
\`\`\`

## 🔌 Plugin Structure

\`\`\`
plugins/
├── my-plugin/
│   ├── plugin.json       # Plugin metadata (name, version, dependencies)
│   ├── index.ts          # Plugin entry point (server-side hooks)
│   ├── server/           # Server-side code (optional)
│   └── client/           # Client-side code (optional)
\`\`\`

## ⚡ Quick Start

1. Create your plugin folder: \`plugins/my-plugin/\`
2. Create \`plugin.json\` with metadata
3. Create \`index.ts\` with your plugin logic
4. Use \`bun run cli plugin:deps install\` if you need extra dependencies

## 🔌 Intercepting Requests

Plugins can intercept and modify requests using hooks:

\`\`\`typescript
// plugins/my-plugin/index.ts
import type { FluxStackPlugin, PluginContext } from '@/core/types/plugin'

export class MyPlugin implements FluxStackPlugin {
  name = 'my-plugin'
  version = '1.0.0'

  // Intercept every request
  async onRequest(context: PluginContext, request: Request): Promise<void> {
    // Example: Add custom headers
    const url = new URL(request.url)
    console.log(\`[\${this.name}] Request to: \${url.pathname}\`)

    // Example: Validate authentication
    const token = request.headers.get('Authorization')
    if (!token && url.pathname.startsWith('/api/protected')) {
      throw new Error('Unauthorized')
    }
  }

  // Intercept every response
  async onResponse(context: PluginContext, response: Response): Promise<void> {
    console.log(\`[\${this.name}] Response status: \${response.status}\`)
  }

  // Handle errors
  async onError(context: PluginContext, error: Error): Promise<void> {
    console.error(\`[\${this.name}] Error:\`, error.message)
    // Example: Send to error tracking service
  }
}
\`\`\`

## 📋 Available Hooks

- **\`setup\`**: Initialize plugin resources (called once at startup)
- **\`onServerStart\`**: Run when server starts
- **\`onRequest\`**: Intercept incoming requests (before route handlers)
- **\`onResponse\`**: Intercept outgoing responses (after route handlers)
- **\`onError\`**: Handle errors globally

## 💡 Common Use Cases

- **Authentication**: Validate tokens in \`onRequest\`
- **Logging**: Log requests/responses for analytics
- **Rate Limiting**: Track request counts per IP
- **CORS**: Add headers in \`onResponse\`
- **Request Transformation**: Modify request body/headers
- **Response Transformation**: Add custom headers, compress responses

See the documentation for detailed examples and best practices.
`
      writeFileSync(join(pluginsDir, 'README.md'), pluginsReadme)
      
      // Generate .gitignore using template (instead of copying)
      const gitignoreContent = `# Dependencies
node_modules/
.pnp
.pnp.js

# Production builds
/dist
/build
/.next/
/out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional stylelint cache
.stylelintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# FluxStack specific
uploads/
public/uploads/
.fluxstack/

# Bun
bun.lockb
`
      writeFileSync(join(projectPath, '.gitignore'), gitignoreContent)
      
      // Customize package.json with project name
      const packageJsonPath = join(projectPath, 'package.json')
      if (existsSync(packageJsonPath)) {
        const packageContent = readFileSync(packageJsonPath, 'utf-8')
        const packageJson = JSON.parse(packageContent)
        
        // Update project-specific fields
        packageJson.name = projectName
        packageJson.description = `${projectName} - FluxStack application`
        packageJson.version = "1.0.0"
        
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
      }
      
      // Create .env from .env.example and set development mode + project name
      const envExamplePath = join(projectPath, '.env.example')
      const envPath = join(projectPath, '.env')
      if (existsSync(envExamplePath)) {
        let envContent = readFileSync(envExamplePath, 'utf-8')
        // Set development mode
        envContent = envContent.replace('NODE_ENV=production', 'NODE_ENV=development')
        // Customize app name to match project name
        envContent = envContent.replace('VITE_APP_NAME=FluxStack', `VITE_APP_NAME=${projectName}`)
        writeFileSync(envPath, envContent)
      }
      
      // Customize README.md
      const readmePath = join(projectPath, 'README.md')
      if (existsSync(readmePath)) {
        const readmeContent = `# ${projectName}

⚡ **FluxStack Application** - Modern full-stack TypeScript framework

## 🚀 Getting Started

\`\`\`bash
# Start development
bun run dev

# Build for production  
bun run build

# Start production server
bun run start
\`\`\`

## 📁 Project Structure

\`\`\`
${projectName}/
├── core/          # FluxStack framework (don't modify)
├── app/           # Your application code
│   ├── server/    # Backend API routes
│   ├── client/    # Frontend React app
│   └── shared/    # Shared types and utilities
└── package.json
\`\`\`

## 🔥 Features

- **⚡ Bun Runtime** - 3x faster than Node.js
- **🔒 Full Type Safety** - Eden Treaty + TypeScript
- **🎨 Modern UI** - React 19 + Tailwind CSS v4
- **📋 Auto Documentation** - Swagger UI generated
- **🔄 Hot Reload** - Backend + Frontend
- **🔌 Plugin System** - Extensible with custom plugins

## 🔌 Adding Plugins

### Built-in Plugins
FluxStack includes several built-in plugins that are ready to use:

\`\`\`typescript
// app/server/index.ts
import { loggerPlugin, swaggerPlugin, staticPlugin } from "@/core/server"

// Add built-in plugins
app.use(loggerPlugin)
app.use(swaggerPlugin)
\`\`\`

### Custom Plugin Example

\`\`\`typescript
// app/server/plugins/auth.ts
import { Elysia } from 'elysia'

export const authPlugin = new Elysia({ name: 'auth' })
  .derive(({ headers }) => ({
    user: getUserFromToken(headers.authorization)
  }))
  .guard({
    beforeHandle({ user, set }) {
      if (!user) {
        set.status = 401
        return { error: 'Unauthorized' }
      }
    }
  })

// Use in app/server/index.ts
import { authPlugin } from './plugins/auth'
app.use(authPlugin)
\`\`\`

### Available Plugin Hooks
- \`setup\` - Initialize plugin resources
- \`onServerStart\` - Run when server starts
- \`onRequest\` - Process incoming requests
- \`onResponse\` - Process outgoing responses
- \`onError\` - Handle errors

## 📖 Learn More

- **Plugin Guide**: Check \`ai-context/development/plugins-guide.md\`
- **FluxStack Docs**: Visit the [FluxStack Repository](https://github.com/MarcosBrendonDePaula/FluxStack)

---

Built with ❤️ using FluxStack
`
        writeFileSync(readmePath, readmeContent)
      }
      
      spinner.succeed('✅ Project structure created!')
      
      // Install dependencies with Bun (THE DIVINE RUNTIME)
      if (options.install) {
        const installSpinner = ora('📦 Installing dependencies with Bun...').start()
        
        try {
          const proc = Bun.spawn(['bun', 'install'], {
            cwd: projectPath,
            stdio: ['ignore', 'pipe', 'pipe']
          })
          
          await proc.exited
          
          if (proc.exitCode === 0) {
            installSpinner.succeed('✅ Dependencies installed!')
          } else {
            installSpinner.fail('❌ Failed to install dependencies')
            console.log(chalk.gray('You can install them manually with: bun install'))
          }
        } catch (error) {
          installSpinner.fail('❌ Failed to install dependencies')
          console.log(chalk.gray('You can install them manually with: bun install'))
        }
      }
      
      // Initialize git
      if (options.git) {
        const gitSpinner = ora('📝 Initializing git repository...').start()
        
        try {
          const initProc = Bun.spawn(['git', 'init'], {
            cwd: projectPath,
            stdio: ['ignore', 'pipe', 'pipe']
          })
          await initProc.exited
          
          // Create initial commit
          const addProc = Bun.spawn(['git', 'add', '.'], {
            cwd: projectPath,
            stdio: ['ignore', 'pipe', 'pipe']
          })
          await addProc.exited
          
          const commitProc = Bun.spawn(['git', 'commit', '-m', `feat: initial ${projectName} with FluxStack`], {
            cwd: projectPath,
            stdio: ['ignore', 'pipe', 'pipe']
          })
          await commitProc.exited
          
          gitSpinner.succeed('✅ Git repository initialized!')
        } catch (error) {
          gitSpinner.fail('❌ Failed to initialize git')
          console.log(chalk.gray('You can initialize it manually with: git init'))
        }
      }
      
      // Success message
      console.log(chalk.green('\n🎉 Project created successfully!'))
      console.log(chalk.cyan('\nNext steps:'))
      console.log(chalk.white(`  cd ${projectName}`))
      if (!options.install) {
        console.log(chalk.white(`  bun install`))
      }
      console.log(chalk.white(`  bun run dev`))
      console.log(chalk.magenta('\nHappy coding with the divine Bun runtime! ⚡🔥'))
      console.log(chalk.gray('\nVisit http://localhost:3000 when ready!'))
      
    } catch (error) {
      spinner.fail('❌ Failed to create project')
      console.error(error)
      process.exit(1)
    }
  })

program.parse()