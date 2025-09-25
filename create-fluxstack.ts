#!/usr/bin/env bun

import { program } from 'commander'
import { resolve, join } from 'path'
import { existsSync, mkdirSync, cpSync, writeFileSync, readFileSync } from 'fs'
import chalk from 'chalk'
import ora from 'ora'

const logo = `
⚡ ███████ ██      ██    ██ ██   ██ ███████ ████████  █████   ██████ ██   ██ 
   ██      ██      ██    ██  ██ ██  ██         ██    ██   ██ ██      ██  ██  
   █████   ██      ██    ██   ███   ███████    ██    ███████ ██      █████   
   ██      ██      ██    ██  ██ ██       ██    ██    ██   ██ ██      ██  ██  
   ██      ███████  ██████  ██   ██ ███████    ██    ██   ██  ██████ ██   ██ 

${chalk.cyan('💫 Powered by Bun - The Divine Runtime ⚡')}
${chalk.gray('Creates FluxStack apps by copying the working framework')}
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
        'ai-context',     // ✅ CRITICAL: Copy AI documentation for users
        'bun.lock',       // ✅ CRITICAL: Copy lockfile to maintain working versions
        'tsconfig.json',
        'vite.config.ts',
        '.env.example',   // ✅ Use .env.example as template
        '.gitignore',     // ✅ Git ignore file for proper repository setup
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
      
      // Create package.json from template
      const packageJsonPath = join(projectPath, 'package.json')
      const templatePath = join(import.meta.dir, 'package-template.json')
      
      if (existsSync(templatePath)) {
        const templateContent = readFileSync(templatePath, 'utf-8')
        const packageTemplate = templateContent.replace(/PROJECT_NAME/g, projectName)
        writeFileSync(packageJsonPath, packageTemplate)
      } else {
        // Fallback template if package-template.json doesn't exist
        const fallbackPackageJson = {
          "name": projectName,
          "version": "1.0.0",
          "description": `${projectName} - FluxStack application`,
          "keywords": ["fluxstack", "bun", "typescript", "full-stack", "elysia", "react", "vite"],
          "author": "Your Name",
          "license": "MIT",
          "type": "module",
          "scripts": {
            "dev": "bun core/cli/index.ts dev",
            "dev:clean": "bun run-clean.ts",
            "dev:backend": "bun core/cli/index.ts dev:backend",
            "dev:frontend": "bun core/cli/index.ts dev:frontend",
            "build": "bun core/cli/index.ts build",
            "build:backend": "bun core/cli/index.ts build:backend",
            "build:frontend": "bun core/cli/index.ts build:frontend",
            "start": "NODE_ENV=production bun app/server/index.ts",
            "typecheck": "bunx tsc --noEmit"
          }
        }
        writeFileSync(packageJsonPath, JSON.stringify(fallbackPackageJson, null, 2))
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