/**
 * Advanced Class Definition Helpers for LiveAction
 * Facilitates easier class creation with fluent API and intelligent defaults
 */

import { LiveAction } from '../live'
import { SimpleAction, SimpleLifecycle, SimpleValidate } from '../decorators/SimpleDecorators'
import { Validators, ValidationMessages } from '../validators/SimpleValidators'

// Advanced class builder with fluent API
export class LiveActionClassBuilder {
    private className: string
    private properties: Map<string, PropertyDefinition> = new Map()
    private methods: Map<string, MethodDefinition> = new Map()
    private lifecycles: Map<string, string> = new Map()
    private initialState: string = ''

    constructor(className: string) {
        this.className = className
    }

    // Add typed properties with intelligent defaults
    withProperty(name: string, type: PropertyType, options: PropertyOptions = {}) {
        this.properties.set(name, {
            name,
            type,
            required: options.required ?? false,
            defaultValue: options.defaultValue ?? this.getDefaultForType(type),
            validation: options.validation,
            description: options.description
        })
        return this
    }

    // Add validated methods with smart naming
    withAction(name: string, options: ActionOptions = {}) {
        this.methods.set(name, {
            name,
            description: options.description || `Execute ${name} action`,
            validation: options.validation,
            emits: options.emits || [`${name}-completed`],
            body: options.body || this.generateMethodBody(name, options)
        })
        return this
    }

    // Add lifecycle hooks
    withLifecycle(hook: 'mount' | 'unmount', body?: string) {
        this.lifecycles.set(hook, body || this.generateLifecycleBody(hook))
        return this
    }

    // Set custom initial state
    withInitialState(stateGenerator: string | ((props: string) => string)) {
        if (typeof stateGenerator === 'string') {
            this.initialState = stateGenerator
        } else {
            this.initialState = stateGenerator('props')
        }
        return this
    }

    // Generate the complete class code
    build(): string {
        return this.generateClassCode()
    }

    private getDefaultForType(type: PropertyType): string {
        switch (type) {
            case 'string': return "''"
            case 'number': return '0'
            case 'boolean': return 'false'
            case 'array': return '[]'
            case 'object': return '{}'
            default: return "''"
        }
    }

    private generateMethodBody(name: string, options: ActionOptions): string {
        const validation = options.validation ? `
        // Validation already handled by decorator` : ''
        
        const stateUpdates = Array.from(this.properties.keys())
            .filter(prop => options.updatesProperties?.includes(prop))
            .map(prop => `        this.${prop} = ${this.getExampleUpdate(prop)}`)
            .join('\n')

        const emits = options.emits?.map(event => 
            `        this.emit('${event}', { componentId: this.$ID, timestamp: Date.now() })`
        ).join('\n') || ''

        return `        console.log(\`🎯 \${this.constructor.name}.${name}() called\`)${validation}
        
        // Update state
${stateUpdates || '        // Add your state updates here'}
        
        // Emit events
${emits}
        
        return { success: true, message: "${name} completed successfully" }`
    }

    private getExampleUpdate(property: string): string {
        const prop = this.properties.get(property)
        if (!prop) return 'newValue'
        
        switch (prop.type) {
            case 'string': return `"Updated ${property}"`
            case 'number': return 'this.' + property + ' + 1'
            case 'boolean': return '!' + 'this.' + property
            case 'array': return '[...this.' + property + ', newItem]'
            default: return 'newValue'
        }
    }

    private generateLifecycleBody(hook: string): string {
        switch (hook) {
            case 'mount':
                return `        console.log(\`🔌 \${this.constructor.name} component \${this.$ID} mounted\`)
        // Initialize component state
        // Setup event listeners
        // Load initial data`
            case 'unmount':
                return `        console.log(\`🗑️  \${this.constructor.name} component \${this.$ID} unmounted\`)
        // Cleanup resources
        // Remove event listeners
        // Save final state`
            default:
                return `        console.log(\`🔄 \${this.constructor.name} lifecycle: ${hook}\`)`
        }
    }

    private generateInitialState(): string {
        if (this.initialState) return this.initialState

        const stateEntries = Array.from(this.properties.values())
            .map(prop => `            ${prop.name}: props.${prop.name} || ${prop.defaultValue}`)
            .join(',\n')

        return `        return {
${stateEntries || '            // Add your initial state here'}
        }`
    }

    private generateClassCode(): string {
        const properties = Array.from(this.properties.values())
            .map(prop => {
                const comment = prop.description ? `    // ${prop.description}` : ''
                return `${comment}
    public ${prop.name}: ${this.getTypeString(prop.type)} = ${prop.defaultValue}`
            }).join('\n')

        const methods = Array.from(this.methods.values())
            .map(method => {
                const validation = method.validation ? 
                    `    @SimpleValidate(${method.validation.validator}, ${method.validation.message})` : ''
                const action = `    @SimpleAction('${method.description}')`
                
                return `${action}${validation ? '\n' + validation : ''}
    ${method.name}() {
${method.body}
    }`
            }).join('\n\n')

        const lifecycles = Array.from(this.lifecycles.entries())
            .map(([hook, body]) => `    @SimpleLifecycle('${hook}')
    ${hook}() {
${body}
    }`).join('\n\n')

        return `import { LiveAction, SimpleAction, SimpleLifecycle, SimpleValidate, Validators, ValidationMessages } from '@/core'

export class ${this.className} extends LiveAction {
${properties}

    getInitialState(props: any) {
${this.generateInitialState()}
    }

${lifecycles}

${methods}
}

// Auto-register the component
LiveAction.add(${this.className})`
    }

    private getTypeString(type: PropertyType): string {
        switch (type) {
            case 'array': return 'any[]'
            case 'object': return 'Record<string, any>'
            default: return type
        }
    }
}

// Smart class generator with templates
export class SmartClassGenerator {
    // Generate CRUD operations for a model
    static generateCrudClass(modelName: string, fields: CrudField[]): LiveActionClassBuilder {
        const className = `${modelName}Action`
        const builder = new LiveActionClassBuilder(className)

        // Add model fields as properties
        fields.forEach(field => {
            builder.withProperty(field.name, field.type, {
                required: field.required,
                defaultValue: field.defaultValue,
                validation: field.validation
            })
        })

        // Add standard CRUD methods
        builder
            .withAction('create', {
                description: `Create new ${modelName}`,
                emits: [`${modelName.toLowerCase()}-created`, 'data-changed'],
                validation: fields.some(f => f.required) ? {
                    validator: 'Validators.required',
                    message: 'ValidationMessages.required'
                } : undefined
            })
            .withAction('update', {
                description: `Update ${modelName}`,
                emits: [`${modelName.toLowerCase()}-updated`, 'data-changed'],
                updatesProperties: fields.map(f => f.name)
            })
            .withAction('delete', {
                description: `Delete ${modelName}`,
                emits: [`${modelName.toLowerCase()}-deleted`, 'data-changed']
            })
            .withAction('validate', {
                description: `Validate ${modelName} data`,
                emits: ['validation-completed']
            })
            .withLifecycle('mount')

        return builder
    }

    // Generate form management class
    static generateFormClass(formName: string, fields: FormField[]): LiveActionClassBuilder {
        const className = `${formName}FormAction`
        const builder = new LiveActionClassBuilder(className)

        // Add form fields
        fields.forEach(field => {
            builder.withProperty(field.name, field.type, {
                required: field.required,
                validation: field.validation
            })
        })

        // Add form state properties
        builder
            .withProperty('isValid', 'boolean', { defaultValue: 'false' })
            .withProperty('errors', 'object', { defaultValue: '{}' })
            .withProperty('isSubmitting', 'boolean', { defaultValue: 'false' })

        // Add form methods
        builder
            .withAction('updateField', {
                description: 'Update form field value',
                emits: ['field-updated', 'validation-triggered']
            })
            .withAction('validateForm', {
                description: 'Validate entire form',
                emits: ['form-validated']
            })
            .withAction('submitForm', {
                description: 'Submit form data',
                emits: ['form-submitted', 'form-success', 'form-error']
            })
            .withAction('resetForm', {
                description: 'Reset form to initial state',
                emits: ['form-reset']
            })
            .withLifecycle('mount')

        return builder
    }

    // Generate list management class
    static generateListClass(itemName: string, itemType: PropertyType = 'string'): LiveActionClassBuilder {
        const className = `${itemName}ListAction`
        const builder = new LiveActionClassBuilder(className)

        builder
            .withProperty('items', 'array', { defaultValue: '[]' })
            .withProperty('selectedIndex', 'number', { defaultValue: '-1' })
            .withProperty('filter', 'string', { defaultValue: "''" })
            .withProperty('sortBy', 'string', { defaultValue: "'name'" })

        builder
            .withAction('addItem', {
                description: `Add new ${itemName}`,
                emits: ['item-added', 'list-changed'],
                validation: {
                    validator: 'Validators.required',
                    message: 'ValidationMessages.required'
                }
            })
            .withAction('removeItem', {
                description: `Remove ${itemName}`,
                emits: ['item-removed', 'list-changed']
            })
            .withAction('selectItem', {
                description: `Select ${itemName}`,
                emits: ['item-selected']
            })
            .withAction('filterItems', {
                description: `Filter ${itemName} list`,
                emits: ['list-filtered']
            })
            .withAction('sortItems', {
                description: `Sort ${itemName} list`,
                emits: ['list-sorted']
            })
            .withLifecycle('mount')

        return builder
    }
}

// Quick generators for common patterns
export const QuickGenerators = {
    // Counter with increment/decrement
    counter: (name: string = 'Counter') => 
        new LiveActionClassBuilder(`${name}Action`)
            .withProperty('count', 'number', { defaultValue: '0' })
            .withProperty('step', 'number', { defaultValue: '1' })
            .withAction('increment', {
                description: 'Increment counter',
                emits: ['count-changed'],
                updatesProperties: ['count']
            })
            .withAction('decrement', {
                description: 'Decrement counter',
                emits: ['count-changed'],
                updatesProperties: ['count']
            })
            .withAction('reset', {
                description: 'Reset counter',
                emits: ['count-reset']
            })
            .withLifecycle('mount'),

    // Toggle state
    toggle: (name: string = 'Toggle') =>
        new LiveActionClassBuilder(`${name}Action`)
            .withProperty('isEnabled', 'boolean', { defaultValue: 'false' })
            .withProperty('label', 'string', { defaultValue: "'Toggle'" })
            .withAction('toggle', {
                description: 'Toggle state',
                emits: ['toggled'],
                updatesProperties: ['isEnabled']
            })
            .withAction('enable', {
                description: 'Enable toggle',
                emits: ['enabled']
            })
            .withAction('disable', {
                description: 'Disable toggle',
                emits: ['disabled']
            })
            .withLifecycle('mount'),

    // Input field with validation
    input: (name: string = 'Input', validation?: ValidationConfig) =>
        new LiveActionClassBuilder(`${name}Action`)
            .withProperty('value', 'string', { defaultValue: "''" })
            .withProperty('placeholder', 'string', { defaultValue: "'Enter value'" })
            .withProperty('isValid', 'boolean', { defaultValue: 'true' })
            .withProperty('error', 'string', { defaultValue: "''" })
            .withAction('updateValue', {
                description: 'Update input value',
                emits: ['value-changed', 'validated'],
                validation: validation,
                updatesProperties: ['value', 'isValid', 'error']
            })
            .withAction('validate', {
                description: 'Validate input',
                emits: ['validation-completed']
            })
            .withAction('clear', {
                description: 'Clear input',
                emits: ['cleared']
            })
            .withLifecycle('mount')
}

// Type definitions
export type PropertyType = 'string' | 'number' | 'boolean' | 'array' | 'object'

export interface PropertyDefinition {
    name: string
    type: PropertyType
    required: boolean
    defaultValue: string
    validation?: ValidationConfig
    description?: string
}

export interface PropertyOptions {
    required?: boolean
    defaultValue?: string
    validation?: ValidationConfig
    description?: string
}

export interface MethodDefinition {
    name: string
    description: string
    validation?: ValidationConfig
    emits: string[]
    body: string
}

export interface ActionOptions {
    description?: string
    validation?: ValidationConfig
    emits?: string[]
    body?: string
    updatesProperties?: string[]
}

export interface ValidationConfig {
    validator: string
    message: string
}

export interface CrudField {
    name: string
    type: PropertyType
    required?: boolean
    defaultValue?: string
    validation?: ValidationConfig
}

export interface FormField {
    name: string
    type: PropertyType
    required?: boolean
    validation?: ValidationConfig
    placeholder?: string
}

// Utility to generate class from JSON config
export function generateClassFromConfig(config: ClassConfig): string {
    const builder = new LiveActionClassBuilder(config.className)

    // Add properties
    config.properties?.forEach(prop => {
        builder.withProperty(prop.name, prop.type, prop.options)
    })

    // Add methods
    config.methods?.forEach(method => {
        builder.withAction(method.name, method.options)
    })

    // Add lifecycles
    config.lifecycles?.forEach(lifecycle => {
        builder.withLifecycle(lifecycle.hook, lifecycle.body)
    })

    return builder.build()
}

export interface ClassConfig {
    className: string
    properties?: Array<{
        name: string
        type: PropertyType
        options?: PropertyOptions
    }>
    methods?: Array<{
        name: string
        options?: ActionOptions
    }>
    lifecycles?: Array<{
        hook: 'mount' | 'unmount'
        body?: string
    }>
}