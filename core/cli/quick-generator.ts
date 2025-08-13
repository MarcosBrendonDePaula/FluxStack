#!/usr/bin/env bun
/**
 * Quick Generator CLI - Interactive class builder for common patterns
 */

import { QuickGenerators, SmartClassGenerator, LiveActionClassBuilder } from '../helpers/AdvancedClassHelpers'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

interface QuickGenOptions {
    name: string
    type: 'counter' | 'toggle' | 'input' | 'crud' | 'form' | 'list' | 'custom'
    output?: string
    preview?: boolean
}

class QuickGenerator {
    async run() {
        const args = process.argv.slice(2)
        
        if (args.length === 0) {
            this.showHelp()
            return
        }

        const options = this.parseArgs(args)
        
        if (options.preview) {
            this.previewClass(options)
        } else {
            await this.generateClass(options)
        }
    }

    private parseArgs(args: string[]): QuickGenOptions {
        const options: QuickGenOptions = {
            name: args[0] || 'MyComponent',
            type: 'counter'
        }

        for (let i = 1; i < args.length; i++) {
            const arg = args[i]
            
            if (arg === '--preview') {
                options.preview = true
            } else if (arg.startsWith('--type=')) {
                options.type = arg.split('=')[1] as any
            } else if (arg.startsWith('--output=')) {
                options.output = arg.split('=')[1]
            }
        }

        return options
    }

    private previewClass(options: QuickGenOptions) {
        console.log(`\n🔍 Preview: ${options.name} (${options.type})\n`)
        
        const code = this.generateCode(options)
        console.log(code)
        
        console.log(`\n✨ To generate this class, run:`)
        console.log(`bun run quick:gen ${options.name} --type=${options.type}`)
    }

    private async generateClass(options: QuickGenOptions) {
        const code = this.generateCode(options)
        const outputPath = this.getOutputPath(options)
        
        // Ensure directory exists
        const dir = require('path').dirname(outputPath)
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true })
        }

        // Write file
        writeFileSync(outputPath, code)
        
        console.log(`✅ Generated ${options.type} class: ${outputPath}`)
        
        // Auto-register in live/index.ts
        await this.autoRegister(options.name)
    }

    private generateCode(options: QuickGenOptions): string {
        switch (options.type) {
            case 'counter':
                return QuickGenerators.counter(options.name).build()
            
            case 'toggle':
                return QuickGenerators.toggle(options.name).build()
            
            case 'input':
                return QuickGenerators.input(options.name).build()
            
            case 'crud':
                return SmartClassGenerator.generateCrudClass(options.name, [
                    { name: 'id', type: 'string', required: true },
                    { name: 'name', type: 'string', required: true },
                    { name: 'email', type: 'string', required: false },
                    { name: 'createdAt', type: 'string', required: false }
                ]).build()
            
            case 'form':
                return SmartClassGenerator.generateFormClass(options.name, [
                    { name: 'firstName', type: 'string', required: true },
                    { name: 'lastName', type: 'string', required: true },
                    { name: 'email', type: 'string', required: true },
                    { name: 'message', type: 'string', required: false }
                ]).build()
            
            case 'list':
                return SmartClassGenerator.generateListClass(options.name).build()
            
            case 'custom':
                return new LiveActionClassBuilder(`${options.name}Action`)
                    .withProperty('customProperty', 'string')
                    .withAction('customAction')
                    .withLifecycle('mount')
                    .build()
            
            default:
                throw new Error(`Unknown type: ${options.type}`)
        }
    }

    private getOutputPath(options: QuickGenOptions): string {
        if (options.output) {
            return options.output
        }
        
        const fileName = `${options.name}Action.ts`
        return join(process.cwd(), 'app', 'server', 'live', 'components', fileName)
    }

    private async autoRegister(componentName: string) {
        const indexPath = join(process.cwd(), 'app', 'server', 'live', 'index.ts')
        
        if (!existsSync(indexPath)) {
            console.log('⚠️  Live index file not found, skipping auto-registration')
            return
        }

        const importLine = `import './components/${componentName}Action'`
        const content = require('fs').readFileSync(indexPath, 'utf-8')
        
        if (content.includes(importLine)) {
            console.log('📝 Component already registered')
            return
        }

        const lines = content.split('\n')
        const importIndex = lines.findIndex(line => line.includes('import \'./components/'))
        
        if (importIndex >= 0) {
            lines.splice(importIndex + 1, 0, importLine)
        } else {
            lines.push('', importLine)
        }

        require('fs').writeFileSync(indexPath, lines.join('\n'))
        console.log('📝 Auto-registered component in live/index.ts')
    }

    private showHelp() {
        console.log(`
🚀 FluxStack Quick Generator

Usage: bun run quick:gen <ComponentName> [options]

Types:
  --type=counter    Counter with increment/decrement (default)
  --type=toggle     Boolean toggle component
  --type=input      Input field with validation
  --type=crud       Full CRUD operations
  --type=form       Form management with validation
  --type=list       List management with filter/sort
  --type=custom     Custom component template

Options:
  --preview         Preview code without generating
  --output=path     Custom output path

Examples:
  bun run quick:gen UserCounter
  bun run quick:gen StatusToggle --type=toggle
  bun run quick:gen ContactForm --type=form
  bun run quick:gen ProductList --type=list --preview
  bun run quick:gen MyWidget --type=custom --output=./custom.ts

Quick Start:
  bun run quick:gen MyCounter --preview   # See what will be generated
  bun run quick:gen MyCounter             # Generate the component
        `)
    }
}

// Run if called directly
if (import.meta.main) {
    const generator = new QuickGenerator()
    generator.run().catch(console.error)
}

export { QuickGenerator }