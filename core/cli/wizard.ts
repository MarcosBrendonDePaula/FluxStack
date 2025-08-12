#!/usr/bin/env bun

import { ComponentGenerator, type GeneratorOptions } from './generator'

/**
 * Interactive Component Wizard
 * Provides a user-friendly interface for creating components
 */

class ComponentWizard {
    private generator: ComponentGenerator

    constructor() {
        this.generator = new ComponentGenerator()
    }

    /**
     * Run interactive wizard
     */
    async run() {
        console.log(`
🔥 FluxStack Component Wizard
════════════════════════════════════════

Let's create a new Live Component! 🚀
`)

        try {
            const options = await this.collectOptions()
            await this.generator.generateLiveComponent(options)
            
        } catch (error) {
            if (error === 'CANCELLED') {
                console.log('\n❌ Generation cancelled by user')
                return
            }
            console.error(`\n❌ Error: ${error}`)
            process.exit(1)
        }
    }

    /**
     * Collect options interactively
     */
    private async collectOptions(): Promise<GeneratorOptions> {
        // Component name
        const name = await this.askQuestion(
            '📝 Component name (PascalCase, e.g., UserProfile): ',
            (input) => {
                if (!input.trim()) return 'Component name is required'
                if (!/^[A-Z][a-zA-Z0-9]*$/.test(input.trim())) {
                    return 'Name must be PascalCase (e.g., MyComponent)'
                }
                return true
            }
        )

        console.log(`\n🎯 Creating component: ${name}`)
        console.log('   📁 Backend: app/server/live/components/' + name + 'Action.ts')
        console.log('   📁 Frontend: app/client/src/components/live/' + name + '.tsx')

        // Props
        const hasProps = await this.askYesNo(
            '\n❓ Does your component need props? (y/n): ',
            'This adds a props interface for passing data to your component'
        )

        // Lifecycle methods
        const hasLifecycle = await this.askYesNo(
            '\n❓ Add lifecycle methods (mount/unmount)? (y/n): ',
            'Useful for setup/cleanup when component is created/destroyed'
        )

        // Event system
        const hasEvents = await this.askYesNo(
            '\n❓ Include event system? (y/n): ',
            'Adds helpers for emitting events to the frontend (Livewire-style)'
        )

        // Controls
        const hasControls = await this.askYesNo(
            '\n❓ Generate with UI controls? (y/n): ',
            'Creates buttons and form elements in the frontend component'
        )

        // Custom methods
        const methods: string[] = []
        if (await this.askYesNo('\n❓ Add custom methods? (y/n): ', 'Add your own action methods')) {
            console.log('\n🔧 Add custom methods (empty line to finish):')
            
            while (true) {
                const method = await this.askQuestion('   Method name: ', (input) => {
                    if (!input.trim()) return true // Allow empty to finish
                    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(input.trim())) {
                        return 'Method name must be camelCase'
                    }
                    return true
                })
                
                if (!method.trim()) break
                methods.push(method.trim())
                console.log(`   ✅ Added method: ${method}`)
            }
        }

        // Force overwrite
        const force = await this.askYesNo(
            '\n❓ Overwrite existing files? (y/n): ',
            'Use this if you want to regenerate an existing component'
        )

        return {
            name: name.trim(),
            hasProps,
            hasLifecycle,
            hasEvents,
            hasControls,
            methods: methods.length > 0 ? methods : undefined,
            force
        }
    }

    /**
     * Ask a question and validate the answer
     */
    private async askQuestion(
        question: string, 
        validator?: (input: string) => boolean | string
    ): Promise<string> {
        process.stdout.write(question)
        
        for await (const line of console) {
            const input = line.trim()
            
            if (validator) {
                const result = validator(input)
                if (result === true) {
                    return input
                } else if (typeof result === 'string') {
                    console.log(`   ❌ ${result}`)
                    process.stdout.write(question)
                    continue
                }
            }
            
            return input
        }
        
        throw 'CANCELLED'
    }

    /**
     * Ask a yes/no question
     */
    private async askYesNo(question: string, hint?: string): Promise<boolean> {
        if (hint) {
            console.log(`   💡 ${hint}`)
        }
        
        const answer = await this.askQuestion(question, (input) => {
            const lower = input.toLowerCase()
            if (!['y', 'n', 'yes', 'no'].includes(lower)) {
                return 'Please enter y/n or yes/no'
            }
            return true
        })
        
        return ['y', 'yes'].includes(answer.toLowerCase())
    }
}

/**
 * Quick component generator (non-interactive)
 */
async function quickGenerate() {
    const args = process.argv.slice(2)
    
    if (args.includes('--help') || args.includes('-h')) {
        showQuickHelp()
        return
    }

    const name = args[0]
    if (!name) {
        console.error('❌ Component name is required')
        showQuickHelp()
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
    await generator.generateLiveComponent(options)
}

function showQuickHelp() {
    console.log(`
🔥 FluxStack Component Generator - Quick Mode

Usage:
  bun run make:component <ComponentName> [options]

Options:
  --props          Add props interface
  --lifecycle      Add mount/unmount methods
  --events         Add event helpers
  --controls       Add UI controls
  --method=name    Add custom method
  --force          Overwrite existing files
  --help, -h       Show this help

Examples:
  bun run make:component UserCard --props --controls
  bun run make:component TodoList --lifecycle --events --method=addTodo
  
Interactive Mode:
  bun run make:component --interactive
    `)
}

/**
 * Main entry point
 */
async function main() {
    const args = process.argv.slice(2)
    
    if (args.includes('--interactive') || args.length === 0) {
        const wizard = new ComponentWizard()
        await wizard.run()
    } else {
        await quickGenerate()
    }
}

// Run if executed directly
if (import.meta.main) {
    main().catch(console.error)
}

export { ComponentWizard }