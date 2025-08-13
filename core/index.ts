/**
 * FluxStack Core - Unified Exports
 * Central export point for all core LiveAction utilities
 */

// Core LiveAction
export { LiveAction } from './live'

// Simple decorators que funcionam sem problemas de tipos
export {
    SimpleAction,
    SimpleLifecycle,
    SimpleValidate,
    AutoRegister
} from './decorators/SimpleDecorators'

// Simple validators que funcionam perfeitamente com os decorators
export {
    Validators,
    ValidationMessages,
    CommonValidations
} from './validators/SimpleValidators'

// Decorators for easier class definition (experimental - podem ter problemas de tipos)
export {
    Action,
    State,
    Lifecycle,
    Emit,
    LiveComponent,
    Validators as ComplexValidators,
    createStateProperty,
    type ActionMetadata,
    type ComponentMetadata
} from './decorators/LiveActionDecorators'

// Helper functions and utilities
export {
    createTypedAction,
    StateProperty,
    CommonEvents,
    LiveActionUtils,
    LiveActionBuilder,
    createLiveAction,
    createTypedLiveAction,
    type LiveActionConfig
} from './helpers/LiveActionHelpers'

// Core utilities
export {
    generateUUID,
    generateShortUUID,
    isValidUUID,
    generatePrefixedUUID,
    uuid,
    Utils
} from './utils'

// Advanced class definition helpers (NEW)
export {
    LiveActionClassBuilder,
    SmartClassGenerator,
    QuickGenerators,
    generateClassFromConfig,
    type PropertyType,
    type PropertyDefinition,
    type ActionOptions,
    type ValidationConfig,
    type CrudField,
    type FormField,
    type ClassConfig
} from './helpers/AdvancedClassHelpers'

// Validation system
export {
    ValidationRules,
    Validate,
    ValidateState,
    ValidateParams,
    ConditionalValidate,
    AsyncValidate,
    ValidationError,
    validateValue,
    validateObject,
    validateSchema,
    ValidationUtils,
    type ValidationResult,
    type ValidationRule,
    type ValidationSchema
} from './validators/LiveActionValidators'

// Framework core
export { FluxStackFramework } from './server/framework'
export type { FluxStackContext, Plugin } from './types'

// Quick start templates
export const QuickStart = {
    // Simple LiveAction template
    simpleAction: (name: string) => `
import { LiveAction, Action, State, LiveComponent } from '@/core'

@LiveComponent()
export class ${name}Action extends LiveAction {
    @State({ required: true, type: 'string' })
    message: string = 'Hello FluxStack!'

    getInitialState(props: any) {
        return { message: this.message }
    }

    @Action({ description: 'Update message', emit: 'message-updated' })
    updateMessage(newMessage: string) {
        this.message = newMessage
        return { success: true, message: this.message }
    }
}
`,

    // Advanced LiveAction with validation
    advancedAction: (name: string) => `
import { 
    LiveAction, 
    Action, 
    State, 
    Lifecycle, 
    LiveComponent, 
    Validate, 
    ValidationRules 
} from '@/core'

interface ${name}Props {
    initialValue?: string
    maxLength?: number
}

@LiveComponent()
export class ${name}Action extends LiveAction {
    @State({ required: true, type: 'string' })
    @Validate(
        ValidationRules.required(),
        ValidationRules.maxLength(100)
    )
    value: string = ''

    @State({ type: 'number' })
    @Validate(ValidationRules.positive())
    counter: number = 0

    getInitialState(props: ${name}Props) {
        return {
            value: props.initialValue || '',
            counter: 0
        }
    }

    @Lifecycle('mount')
    mount() {
        console.log('${name} mounted')
    }

    @Action({ 
        description: 'Update value with validation', 
        emit: ['value-updated', 'validation-passed'] 
    })
    @Validate(ValidationRules.required(), ValidationRules.maxLength(100))
    updateValue(newValue: string) {
        this.value = newValue
        this.counter++
        return { 
            success: true, 
            value: this.value, 
            counter: this.counter 
        }
    }

    @Action({ description: 'Reset all values' })
    reset() {
        this.value = ''
        this.counter = 0
        return { success: true }
    }
}
`
}

// Development helpers
export const DevUtils = {
    // Log all registered components
    listComponents: () => {
        console.log('📝 Registered LiveAction Components:')
        // Implementation would list all registered components
    },

    // Validate component structure
    validateComponent: (ComponentClass: any) => {
        const issues: string[] = []
        
        if (!ComponentClass.prototype.getInitialState) {
            issues.push('Missing getInitialState method')
        }

        if (issues.length === 0) {
            console.log('✅ Component validation passed')
        } else {
            console.warn('⚠️ Component validation issues:', issues)
        }

        return { valid: issues.length === 0, issues }
    }
}