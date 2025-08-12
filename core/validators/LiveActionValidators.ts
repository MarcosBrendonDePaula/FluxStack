/**
 * LiveAction Validation System
 * Advanced validation decorators and validators for LiveAction components
 */

import { LiveAction } from '@/core/live'

// Validation result interface
export interface ValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

// Validation rule interface
export interface ValidationRule {
    name: string
    message: string
    validate: (value: any, context?: any) => boolean
}

// Built-in validation rules
export const ValidationRules = {
    required: (message = 'Field is required'): ValidationRule => ({
        name: 'required',
        message,
        validate: (value) => value !== null && value !== undefined && value !== ''
    }),

    minLength: (min: number, message?: string): ValidationRule => ({
        name: 'minLength',
        message: message || `Minimum length is ${min}`,
        validate: (value) => typeof value === 'string' && value.length >= min
    }),

    maxLength: (max: number, message?: string): ValidationRule => ({
        name: 'maxLength', 
        message: message || `Maximum length is ${max}`,
        validate: (value) => typeof value === 'string' && value.length <= max
    }),

    pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
        name: 'pattern',
        message,
        validate: (value) => typeof value === 'string' && regex.test(value)
    }),

    email: (message = 'Invalid email format'): ValidationRule => ({
        name: 'email',
        message,
        validate: (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    }),

    url: (message = 'Invalid URL format'): ValidationRule => ({
        name: 'url',
        message,
        validate: (value) => {
            try {
                new URL(value)
                return true
            } catch {
                return false
            }
        }
    }),

    range: (min: number, max: number, message?: string): ValidationRule => ({
        name: 'range',
        message: message || `Value must be between ${min} and ${max}`,
        validate: (value) => typeof value === 'number' && value >= min && value <= max
    }),

    positive: (message = 'Value must be positive'): ValidationRule => ({
        name: 'positive',
        message,
        validate: (value) => typeof value === 'number' && value > 0
    }),

    nonNegative: (message = 'Value must be non-negative'): ValidationRule => ({
        name: 'nonNegative',
        message,
        validate: (value) => typeof value === 'number' && value >= 0
    }),

    oneOf: <T>(options: T[], message?: string): ValidationRule => ({
        name: 'oneOf',
        message: message || `Value must be one of: ${options.join(', ')}`,
        validate: (value) => options.includes(value)
    }),

    custom: (validatorFn: (value: any) => boolean, message = 'Custom validation failed'): ValidationRule => ({
        name: 'custom',
        message,
        validate: validatorFn
    })
}

// Validation decorator
export function Validate(...rules: ValidationRule[]) {
    return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
        // Store validation rules on the target
        if (!target._validationRules) {
            target._validationRules = new Map()
        }
        target._validationRules.set(propertyKey, rules)

        // If it's a method (has descriptor), wrap it with validation
        if (descriptor && typeof descriptor.value === 'function') {
            const originalMethod = descriptor.value
            
            descriptor.value = function (...args: any[]) {
                // Validate method parameters if rules are provided
                const validation = validateValue(args[0], rules)
                
                if (!validation.isValid) {
                    const error = new ValidationError(
                        `Validation failed for ${propertyKey}: ${validation.errors.join(', ')}`,
                        validation.errors
                    )
                    
                    console.error(`❌ ${this.constructor.name}.${propertyKey}() validation failed:`, validation.errors)
                    throw error
                }

                return originalMethod.apply(this, args)
            }
        } else {
            // Property validation
            const privateKey = `_${propertyKey}`
            
            Object.defineProperty(target, propertyKey, {
                get() {
                    return this[privateKey]
                },
                set(value: any) {
                    const validation = validateValue(value, rules)
                    
                    if (!validation.isValid) {
                        const error = new ValidationError(
                            `Validation failed for ${propertyKey}: ${validation.errors.join(', ')}`,
                            validation.errors
                        )
                        
                        console.error(`❌ Property ${propertyKey} validation failed:`, validation.errors)
                        throw error
                    }

                    if (validation.warnings.length > 0) {
                        console.warn(`⚠️ Property ${propertyKey} warnings:`, validation.warnings)
                    }

                    this[privateKey] = value
                },
                enumerable: true,
                configurable: true
            })
        }

        return descriptor
    }
}

// Validate entire component state
export function ValidateState(rules: Record<string, ValidationRule[]>) {
    return function <T extends { new (...args: any[]): LiveAction }>(constructor: T) {
        const originalGetInitialState = constructor.prototype.getInitialState
        
        constructor.prototype.getInitialState = function (props: any) {
            const state = originalGetInitialState?.call(this, props) || {}
            
            const validation = validateObject(state, rules)
            
            if (!validation.isValid) {
                throw new ValidationError(
                    `Initial state validation failed: ${validation.errors.join(', ')}`,
                    validation.errors
                )
            }

            return state
        }

        return constructor
    }
}

// Validate action parameters  
export function ValidateParams(...paramRules: ValidationRule[][]) {
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
            for (let i = 0; i < paramRules.length && i < args.length; i++) {
                const rules = paramRules[i]
                const validation = validateValue(args[i], rules)
                
                if (!validation.isValid) {
                    throw new ValidationError(
                        `Parameter ${i + 1} validation failed for ${propertyKey}: ${validation.errors.join(', ')}`,
                        validation.errors
                    )
                }
            }

            return originalMethod.apply(this, args)
        }

        return descriptor
    }
}

// Custom validation error class
export class ValidationError extends Error {
    constructor(message: string, public errors: string[]) {
        super(message)
        this.name = 'ValidationError'
    }
}

// Helper functions
export function validateValue(value: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    for (const rule of rules) {
        try {
            if (!rule.validate(value)) {
                errors.push(rule.message)
            }
        } catch (error) {
            warnings.push(`Validation rule '${rule.name}' threw an error: ${error}`)
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    }
}

export function validateObject(obj: Record<string, any>, rules: Record<string, ValidationRule[]>): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    for (const [key, propertyRules] of Object.entries(rules)) {
        const value = obj[key]
        const validation = validateValue(value, propertyRules)
        
        if (!validation.isValid) {
            errors.push(...validation.errors.map(err => `${key}: ${err}`))
        }
        
        warnings.push(...validation.warnings.map(warn => `${key}: ${warn}`))
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    }
}

// Conditional validation
export function ConditionalValidate(
    condition: (instance: any) => boolean,
    rules: ValidationRule[]
) {
    return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
        const conditionalRules = rules.map(rule => ({
            ...rule,
            validate: (value: any, context: any) => {
                if (!condition(context)) return true
                return rule.validate(value, context)
            }
        }))

        return Validate(...conditionalRules)(target, propertyKey, descriptor)
    }
}

// Async validation decorator
export function AsyncValidate(asyncValidator: (value: any) => Promise<ValidationResult>) {
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
        
        descriptor.value = async function (...args: any[]) {
            const validation = await asyncValidator(args[0])
            
            if (!validation.isValid) {
                throw new ValidationError(
                    `Async validation failed for ${propertyKey}: ${validation.errors.join(', ')}`,
                    validation.errors
                )
            }

            return originalMethod.apply(this, args)
        }

        return descriptor
    }
}

// Schema validation
export interface ValidationSchema {
    [key: string]: ValidationRule[] | ValidationSchema
}

export function validateSchema(data: any, schema: ValidationSchema): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    function validateRecursive(obj: any, currentSchema: ValidationSchema, path = '') {
        for (const [key, rules] of Object.entries(currentSchema)) {
            const fullPath = path ? `${path}.${key}` : key
            const value = obj?.[key]

            if (Array.isArray(rules)) {
                // It's a validation rule array
                const validation = validateValue(value, rules)
                if (!validation.isValid) {
                    errors.push(...validation.errors.map(err => `${fullPath}: ${err}`))
                }
                warnings.push(...validation.warnings.map(warn => `${fullPath}: ${warn}`))
            } else {
                // It's a nested schema
                if (typeof value === 'object' && value !== null) {
                    validateRecursive(value, rules, fullPath)
                }
            }
        }
    }

    validateRecursive(data, schema)

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    }
}

// Validation utilities
export const ValidationUtils = {
    // Create a validation chain
    chain: (...rules: ValidationRule[]) => rules,
    
    // Validate multiple values
    validateAll: (values: any[], rulesList: ValidationRule[][]): ValidationResult => {
        const errors: string[] = []
        const warnings: string[] = []

        values.forEach((value, index) => {
            const rules = rulesList[index] || []
            const validation = validateValue(value, rules)
            
            if (!validation.isValid) {
                errors.push(...validation.errors.map(err => `Value ${index + 1}: ${err}`))
            }
            warnings.push(...validation.warnings.map(warn => `Value ${index + 1}: ${warn}`))
        })

        return { isValid: errors.length === 0, errors, warnings }
    },

    // Create a typed validator
    createValidator: <T>(rules: ValidationRule[]) => {
        return (value: T): ValidationResult => validateValue(value, rules)
    }
}