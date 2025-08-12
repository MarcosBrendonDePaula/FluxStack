/**
 * Simplified Decorators for LiveAction
 * Working decorators without complex type issues
 */

// Simple action decorator that just adds logging
export function SimpleAction(description?: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value

        descriptor.value = function (...args: any[]) {
            console.log(`🎯 ${this.constructor.name}.${propertyName}() called`)
            
            if (description) {
                console.log(`📝 ${description}`)
            }

            try {
                const result = originalMethod.apply(this, args)
                return result
            } catch (error) {
                console.error(`❌ Error in ${propertyName}:`, error)
                throw error
            }
        }

        return descriptor
    }
}

// Simple lifecycle decorator
export function SimpleLifecycle(phase: 'mount' | 'unmount') {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value

        descriptor.value = function (...args: any[]) {
            console.log(`🔄 ${this.constructor.name} lifecycle: ${phase} (${this.$ID || 'unknown'})`)
            
            try {
                return originalMethod.apply(this, args)
            } catch (error) {
                console.error(`❌ ${this.constructor.name} lifecycle error in ${phase}:`, error)
                throw error
            }
        }

        return descriptor
    }
}

// Simple validation decorator for basic checks
export function SimpleValidate(validator: (value: any) => any, message = 'Validation failed') {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value

        descriptor.value = function (...args: any[]) {
            // Validate first argument
            if (args.length > 0) {
                const isValid = Boolean(validator(args[0]))
                if (!isValid) {
                    throw new Error(`${message} for ${propertyName}`)
                }
            }

            return originalMethod.apply(this, args)
        }

        return descriptor
    }
}

// Simple auto-register decorator
export function AutoRegister() {
    return function <T extends { new (...args: any[]): any }>(constructor: T) {
        // Import and register after class definition
        setTimeout(() => {
            try {
                const { LiveAction } = require('@/core/live')
                LiveAction.add(constructor)
                console.log(`📝 Auto-registered: ${constructor.name}`)
            } catch (error) {
                console.warn(`⚠️ Could not auto-register ${constructor.name}:`, error)
            }
        }, 0)

        return constructor
    }
}