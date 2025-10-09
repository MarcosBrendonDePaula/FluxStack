import type { Generator } from "./index.js"
import type { GeneratorContext, GeneratorOptions, Template } from "./types.js"
import { templateEngine } from "./template-engine.js"
import { join } from "path"

export class PluginGenerator implements Generator {
    name = 'plugin'
    description = 'Generate a new FluxStack plugin'

    async generate(context: GeneratorContext, options: GeneratorOptions): Promise<void> {
        const template = this.getTemplate(options.template)

        if (template.hooks?.beforeGenerate) {
            await template.hooks.beforeGenerate(context, options)
        }

        const files = await templateEngine.processTemplate(template, context, options)

        if (options.dryRun) {
            console.log(`\n📋 Would generate plugin '${options.name}':\n`)
            for (const file of files) {
                console.log(`${file.action === 'create' ? '📄' : '✏️'} ${file.path}`)
            }
            return
        }

        await templateEngine.generateFiles(files, options.dryRun)

        if (template.hooks?.afterGenerate) {
            const filePaths = files.map(f => f.path)
            await template.hooks.afterGenerate(context, options, filePaths)
        }

        console.log(`\n✅ Generated plugin '${options.name}' with ${files.length} files`)
        console.log(`\n📦 Next steps:`)
        console.log(`   1. Edit plugins/${options.name}/plugin.json with your plugin metadata`)
        console.log(`   2. Implement your plugin logic in plugins/${options.name}/index.ts`)
        console.log(`   3. Add server-side code in plugins/${options.name}/server/ (optional)`)
        console.log(`   4. Add client-side code in plugins/${options.name}/client/ (optional)`)
        console.log(`   5. Run: bun run cli plugin:deps install`)
    }

    private getTemplate(templateName?: string): Template {
        switch (templateName) {
            case 'full':
                return this.getFullTemplate()
            case 'server':
                return this.getServerOnlyTemplate()
            case 'client':
                return this.getClientOnlyTemplate()
            default:
                return this.getBasicTemplate()
        }
    }

    private getBasicTemplate(): Template {
        return {
            name: 'basic-plugin',
            description: 'Basic plugin template with essential files',
            files: [
                {
                    path: 'plugins/{{name}}/plugin.json',
                    content: `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "{{description}}",
  "author": "Your Name",
  "type": "fluxstack-plugin",
  "main": "index.ts",
  "dependencies": {},
  "fluxstack": {
    "minVersion": "1.4.0"
  },
  "hooks": {
    "setup": true,
    "onServerStart": false,
    "onRequest": false,
    "onResponse": false,
    "onError": false
  }
}
`
                },
                {
                    path: 'plugins/{{name}}/index.ts',
                    content: `import type { FluxStackPlugin, PluginContext } from '@/core/types/plugin'

/**
 * {{pascalName}} Plugin
 * {{description}}
 */
export class {{pascalName}}Plugin implements FluxStackPlugin {
  name = '{{name}}'
  version = '1.0.0'

  /**
   * Setup hook - called when plugin is loaded
   */
  async setup(context: PluginContext): Promise<void> {
    console.log(\`[{{name}}] Plugin initialized\`)

    // Add your initialization logic here
    // Example: Register middleware, setup database connections, etc.
  }

  /**
   * Server start hook - called when server starts
   */
  async onServerStart?(context: PluginContext): Promise<void> {
    console.log(\`[{{name}}] Server started\`)

    // Add logic to run when server starts
  }

  /**
   * Request hook - called on each request
   */
  async onRequest?(context: PluginContext, request: Request): Promise<void> {
    // Add request processing logic
  }

  /**
   * Response hook - called on each response
   */
  async onResponse?(context: PluginContext, response: Response): Promise<void> {
    // Add response processing logic
  }

  /**
   * Error hook - called when errors occur
   */
  async onError?(context: PluginContext, error: Error): Promise<void> {
    console.error(\`[{{name}}] Error:\`, error)

    // Add error handling logic
  }
}

// Export plugin instance
export default new {{pascalName}}Plugin()
`
                },
                {
                    path: 'plugins/{{name}}/README.md',
                    content: `# {{pascalName}} Plugin

{{description}}

## Installation

This plugin is already in your FluxStack project. To use it:

1. Make sure the plugin is enabled in your configuration
2. Install any additional dependencies (if needed):
   \`\`\`bash
   bun run cli plugin:deps install
   \`\`\`

## Usage

\`\`\`typescript
// The plugin is automatically loaded by FluxStack
// Configure it in your app/server/index.ts if needed
\`\`\`

## Configuration

Add configuration options here.

## API

Document your plugin's API here.

## Hooks

This plugin uses the following hooks:
- \`setup\`: Initialize plugin resources
- \`onServerStart\`: Run when server starts (optional)
- \`onRequest\`: Process incoming requests (optional)
- \`onResponse\`: Process outgoing responses (optional)
- \`onError\`: Handle errors (optional)

## Development

To modify this plugin:

1. Edit \`index.ts\` with your logic
2. Update \`plugin.json\` with metadata
3. Test with: \`bun run dev\`

## License

MIT
`
                }
            ]
        }
    }

    private getServerOnlyTemplate(): Template {
        const basic = this.getBasicTemplate()
        return {
            ...basic,
            name: 'server-plugin',
            description: 'Plugin with server-side code',
            files: [
                ...basic.files,
                {
                    path: 'plugins/{{name}}/server/index.ts',
                    content: `/**
 * Server-side logic for {{pascalName}} plugin
 */

export class {{pascalName}}Service {
  async initialize() {
    console.log(\`[{{name}}] Server service initialized\`)
  }

  // Add your server-side methods here
}

export const {{camelName}}Service = new {{pascalName}}Service()
`
                }
            ]
        }
    }

    private getClientOnlyTemplate(): Template {
        const basic = this.getBasicTemplate()
        return {
            ...basic,
            name: 'client-plugin',
            description: 'Plugin with client-side code',
            files: [
                ...basic.files,
                {
                    path: 'plugins/{{name}}/client/index.ts',
                    content: `/**
 * Client-side logic for {{pascalName}} plugin
 */

export class {{pascalName}}Client {
  initialize() {
    console.log(\`[{{name}}] Client initialized\`)
  }

  // Add your client-side methods here
}

export const {{camelName}}Client = new {{pascalName}}Client()
`
                }
            ]
        }
    }

    private getFullTemplate(): Template {
        const basic = this.getBasicTemplate()
        const server = this.getServerOnlyTemplate()
        const client = this.getClientOnlyTemplate()

        return {
            ...basic,
            name: 'full-plugin',
            description: 'Complete plugin with server and client code',
            files: [
                ...basic.files,
                ...server.files.slice(basic.files.length), // Add server files
                ...client.files.slice(basic.files.length), // Add client files
                {
                    path: 'plugins/{{name}}/types.ts',
                    content: `/**
 * Type definitions for {{pascalName}} plugin
 */

export interface {{pascalName}}Config {
  // Add your configuration types here
  enabled: boolean
}

export interface {{pascalName}}Options {
  // Add your options types here
}
`
                }
            ]
        }
    }
}
