/**
 * LiveAction Decorators
 * TypeScript decorators to facilitate LiveAction class definition
 */

import { LiveAction } from '@/core/live'

// Action method decorator
export function Action(options?: {
    description?: string
    validate?: boolean
    emit?: string | string[]
    broadcast?: boolean
}) {
    return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
        // Handle case where descriptor might be undefined (property decorator)
        if (!descriptor) {
            // If no descriptor, we're decorating a property, not a method
            descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) || {
                value: target[propertyKey],
                writable: true,
                enumerable: true,
                configurable: true
            }
        }
        const originalMethod = descriptor.value

        descriptor.value = function (...args: any[]) {
            const methodName = propertyKey
            const className = this.constructor.name

            // Add metadata for documentation
            if (!this._actionMetadata) {
                this._actionMetadata = new Map()
            }
            
            this._actionMetadata.set(methodName, {
                description: options?.description || `Action method: ${methodName}`,
                validate: options?.validate ?? false,
                emit: options?.emit,
                broadcast: options?.broadcast ?? false
            })

            console.log(`🎯 ${className}.${methodName}() called`)

            try {
                // Execute the original method
                const result = originalMethod.apply(this, args)

                // Auto-emit events if configured
                if (options?.emit) {
                    const events = Array.isArray(options.emit) ? options.emit : [options.emit]
                    events.forEach(eventName => {
                        if (options.broadcast) {
                            this.broadcast(eventName, { 
                                action: methodName, 
                                result, 
                                timestamp: Date.now() 
                            })
                        } else {
                            this.emit(eventName, { 
                                action: methodName, 
                                result, 
                                timestamp: Date.now() 
                            })
                        }
                    })
                }

                return result
            } catch (error) {
                console.error(`❌ ${className}.${methodName}() error:`, error)
                throw error
            }
        }

        return descriptor
    }
}

// Property validation decorator
export function State(options?: {
    required?: boolean
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array'
    default?: any
    validate?: (value: any) => boolean
}) {
    return function (target: any, propertyKey: string) {
        const privateKey = `_${propertyKey}`
        
        Object.defineProperty(target, propertyKey, {
            get() {
                return this[privateKey] ?? options?.default
            },
            set(value: any) {
                // Type validation
                if (options?.type && value !== undefined && value !== null) {
                    const actualType = Array.isArray(value) ? 'array' : typeof value
                    if (actualType !== options.type) {
                        throw new Error(`Property ${propertyKey} must be of type ${options.type}, got ${actualType}`)
                    }
                }

                // Custom validation
                if (options?.validate && !options.validate(value)) {
                    throw new Error(`Property ${propertyKey} failed custom validation`)
                }

                // Required validation
                if (options?.required && (value === undefined || value === null || value === '')) {
                    throw new Error(`Property ${propertyKey} is required`)
                }

                this[privateKey] = value
            },
            enumerable: true,
            configurable: true
        })
    }
}

// Lifecycle decorator
export function Lifecycle(phase: 'mount' | 'unmount' | 'update') {
    return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
        if (!descriptor) {
            descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) || {
                value: target[propertyKey],
                writable: true,
                enumerable: true,
                configurable: true
            }
        }
        const originalMethod = descriptor.value

        descriptor.value = function (...args: any[]) {
            const className = this.constructor.name
            const componentId = this.$ID || 'unknown'
            
            console.log(`🔄 ${className} lifecycle: ${phase} (${componentId})`)
            
            try {
                return originalMethod.apply(this, args)
            } catch (error) {
                console.error(`❌ ${className} lifecycle error in ${phase}:`, error)
                throw error
            }
        }

        return descriptor
    }
}

// Event emitter decorator
export function Emit(eventName: string, options?: {
    broadcast?: boolean
    data?: any
}) {
    return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
        if (!descriptor) {
            descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) || {
                value: target[propertyKey],
                writable: true,
                enumerable: true,
                configurable: true
            }
        }
        const originalMethod = descriptor.value

        descriptor.value = function (...args: any[]) {
            const result = originalMethod.apply(this, args)
            
            const eventData = {
                action: propertyKey,
                result,
                timestamp: Date.now(),
                componentId: this.$ID,
                ...options?.data
            }

            if (options?.broadcast) {
                this.broadcast(eventName, eventData)
            } else {
                this.emit(eventName, eventData)
            }

            return result
        }

        return descriptor
    }
}

// Auto-register decorator
export function LiveComponent(name?: string) {
    return function <T extends { new (...args: any[]): LiveAction }>(constructor: T) {
        // Auto-register the component
        LiveAction.add(constructor)
        
        // Add component metadata
        const componentName = name || constructor.name
        if (!constructor.prototype._componentMetadata) {
            constructor.prototype._componentMetadata = {
                name: componentName,
                registeredAt: Date.now(),
                actions: []
            }
        }

        console.log(`📝 LiveComponent registered: ${componentName}`)
        
        return constructor
    }
}

// Validation helpers
export const Validators = {
    email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    url: (value: string) => {
        try {
            new URL(value)
            return true
        } catch {
            return false
        }
    },
    minLength: (min: number) => (value: string) => value.length >= min,
    maxLength: (max: number) => (value: string) => value.length <= max,
    range: (min: number, max: number) => (value: number) => value >= min && value <= max,
    positive: (value: number) => value > 0,
    nonNegative: (value: number) => value >= 0
}

// Helper for creating typed state properties
export function createStateProperty<T>(
    defaultValue: T, 
    validator?: (value: T) => boolean,
    onChange?: (newValue: T, oldValue: T) => void
) {
    return {
        default: defaultValue,
        validate: validator,
        onChange
    }
}

// Export types for intellisense
export interface ActionMetadata {
    description: string
    validate: boolean
    emit?: string | string[]
    broadcast: boolean
}

export interface ComponentMetadata {
    name: string
    registeredAt: number
    actions: string[]
}