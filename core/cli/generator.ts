#!/usr/bin/env bun

import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { liveActionTemplate, frontendComponentTemplate } from './templates/LiveActionTemplate'

/**
 * FluxStack Component Generator
 * Similar to Laravel Artisan commands for creating Livewire components
 */

interface GeneratorOptions {
    name: string
    hasProps?: boolean
    hasLifecycle?: boolean
    hasEvents?: boolean
    hasControls?: boolean
    methods?: string[]
    force?: boolean
}

class ComponentGenerator {
    private projectRoot: string

    constructor() {
        this.projectRoot = process.cwd()
    }

    /**
     * Generate a complete Live Component (backend + frontend)
     */
    async generateLiveComponent(options: GeneratorOptions) {
        const { name, hasProps, hasLifecycle, hasEvents, hasControls, methods, force } = options
        
        console.log(`🎯 Generating Live Component: ${name}`)
        console.log(`📁 Project root: ${this.projectRoot}`)

        try {
            // 1. Generate backend LiveAction
            await this.generateBackendAction(name, { hasProps, hasLifecycle, hasEvents, methods }, force)
            
            // 2. Generate frontend component
            await this.generateFrontendComponent(name, { hasProps, hasEvents, hasControls, methods }, force)
            
            // 3. Update live/index.ts to auto-register
            await this.updateLiveIndex(name)
            
            // 4. Generate usage example
            this.generateUsageExample(name)
            
            console.log(`✅ Successfully generated Live Component: ${name}`)
            console.log(`📦 Files created:`)
            console.log(`   🔧 Backend: app/server/live/components/${name}Action.ts`)
            console.log(`   ⚛️  Frontend: app/client/src/components/live/${name}.tsx`)
            console.log(`   📝 Updated: app/server/live/index.ts`)
            
        } catch (error) {
            console.error(`❌ Error generating component: ${error}`)
            throw error
        }
    }

    /**
     * Generate backend LiveAction component
     */
    private async generateBackendAction(
        name: string, 
        options: { hasProps?: boolean, hasLifecycle?: boolean, hasEvents?: boolean, methods?: string[] },
        force?: boolean
    ) {
        const fileName = `${name}Action.ts`
        const filePath = join(this.projectRoot, 'app', 'server', 'live', 'components', fileName)
        
        // Check if file exists
        if (!force && await this.fileExists(filePath)) {
            throw new Error(`Backend component already exists: ${fileName}. Use --force to overwrite.`)
        }

        const content = liveActionTemplate(name, options)
        
        await this.ensureDirectoryExists(dirname(filePath))
        await fs.writeFile(filePath, content, 'utf-8')
        
        console.log(`🔧 Created backend component: ${fileName}`)
    }

    /**
     * Generate frontend React component
     */
    private async generateFrontendComponent(
        name: string,
        options: { hasProps?: boolean, hasEvents?: boolean, hasControls?: boolean, methods?: string[] },
        force?: boolean
    ) {
        const fileName = `${name}.tsx`
        const filePath = join(this.projectRoot, 'app', 'client', 'src', 'components', 'live', fileName)
        
        // Check if file exists
        if (!force && await this.fileExists(filePath)) {
            throw new Error(`Frontend component already exists: ${fileName}. Use --force to overwrite.`)
        }

        const content = frontendComponentTemplate(name, options)
        
        await this.ensureDirectoryExists(dirname(filePath))
        await fs.writeFile(filePath, content, 'utf-8')
        
        console.log(`⚛️  Created frontend component: ${fileName}`)
    }

    /**
     * Update app/server/live/index.ts to register new component
     */
    private async updateLiveIndex(name: string) {
        const indexPath = join(this.projectRoot, 'app', 'server', 'live', 'index.ts')
        
        try {
            const content = await fs.readFile(indexPath, 'utf-8')
            const newImport = `import './components/${name}Action'`
            
            // Check if import already exists
            if (content.includes(newImport)) {
                console.log(`📝 Component already registered in index.ts`)
                return
            }
            
            // Add import after existing component imports
            const lines = content.split('\n')
            const importSectionEnd = lines.findIndex(line => line.trim() === '')
            
            if (importSectionEnd === -1) {
                // No empty line found, add at the end of imports
                const lastImportIndex = lines.findLastIndex(line => line.startsWith('import '))
                lines.splice(lastImportIndex + 1, 0, newImport)
            } else {
                lines.splice(importSectionEnd, 0, newImport)
            }
            
            await fs.writeFile(indexPath, lines.join('\n'), 'utf-8')
            console.log(`📝 Updated live/index.ts with new component registration`)
            
        } catch (error) {
            console.warn(`⚠️  Could not update live/index.ts: ${error}`)
            console.log(`🔧 Manual step: Add this import to app/server/live/index.ts:`)
            console.log(`   import './components/${name}Action'`)
        }
    }

    /**
     * Generate usage example
     */
    private generateUsageExample(name: string) {
        console.log(`\n📋 Usage Example:`)
        console.log(`\n// Add to your React component or App.tsx:`)
        console.log(`import { ${name} } from './components/live/${name}'`)
        console.log(`\n// Use in JSX:`)
        console.log(`<${name}`)
        console.log(`  componentId="my-${name.toLowerCase()}"`)
        console.log(`  // Add props here`)
        console.log(`  onActionCompleted={(data) => console.log('Action completed:', data)}`)
        console.log(`/>`)
        console.log(`\n🎯 Your component is ready! Start the dev server with: bun run dev`)
    }

    /**
     * Utility: Check if file exists
     */
    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath)
            return true
        } catch {
            return false
        }
    }

    /**
     * Utility: Ensure directory exists
     */
    private async ensureDirectoryExists(dirPath: string) {
        try {
            await fs.mkdir(dirPath, { recursive: true })
        } catch (error) {
            // Directory might already exist, ignore error
        }
    }
}

/**
 * CLI Interface
 */
async function main() {
    const args = process.argv.slice(2)
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        showHelp()
        return
    }

    const name = args[0]
    if (!name) {
        console.error('❌ Component name is required')
        showHelp()
        process.exit(1)
    }

    // Validate component name
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
        console.error('❌ Component name must be PascalCase (e.g., MyComponent)')
        process.exit(1)
    }

    const options: GeneratorOptions = {
        name,
        hasProps: args.includes('--props'),
        hasLifecycle: args.includes('--lifecycle'),
        hasEvents: args.includes('--events'),
        hasControls: args.includes('--controls'),
        methods: args.filter(arg => arg.startsWith('--method=')).map(arg => arg.split('=')[1]),
        force: args.includes('--force')
    }

    const generator = new ComponentGenerator()
    
    try {
        await generator.generateLiveComponent(options)
    } catch (error) {
        console.error(`❌ Generation failed: ${error}`)
        process.exit(1)
    }
}

function showHelp() {
    console.log(`
🔥 FluxStack Component Generator

Usage:
  bun run generate:component <ComponentName> [options]

Arguments:
  ComponentName    PascalCase component name (e.g., MyComponent)

Options:
  --props          Generate with props interface
  --lifecycle      Add mount/unmount lifecycle methods
  --events         Add event emission helpers
  --controls       Generate with UI controls
  --method=name    Add custom method (can be used multiple times)
  --force          Overwrite existing files
  --help, -h       Show this help message

Examples:
  bun run generate:component UserProfile
  bun run generate:component TodoList --props --lifecycle --events
  bun run generate:component Dashboard --controls --method=loadData --method=refresh
  bun run generate:component Modal --props --events --force

Generated Files:
  📁 app/server/live/components/ComponentNameAction.ts (Backend)
  📁 app/client/src/components/live/ComponentName.tsx (Frontend) 
  📝 app/server/live/index.ts (Updated for auto-registration)
    `)
}

// Run CLI if this file is executed directly
if (import.meta.main) {
    main().catch(console.error)
}

export { ComponentGenerator, type GeneratorOptions }