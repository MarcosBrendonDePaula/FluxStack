/**
 * Simple Validation Helpers
 * Pre-built validation functions for common use cases
 */

// Basic validation functions that return boolean
export const Validators = {
    // String validators
    required: (value: any) => value != null && value !== '' && value !== undefined,
    
    minLength: (min: number) => (value: string) => 
        typeof value === 'string' && value.length >= min,
    
    maxLength: (max: number) => (value: string) => 
        typeof value === 'string' && value.length <= max,
    
    email: (value: string) => 
        typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    
    alphanumeric: (value: string) => 
        typeof value === 'string' && /^[A-Za-z0-9\s]+$/.test(value),
    
    noTest: (value: string) => 
        typeof value === 'string' && !value.toLowerCase().includes('teste'),
    
    // Number validators
    positive: (value: number) => 
        typeof value === 'number' && value > 0,
    
    range: (min: number, max: number) => (value: number) => 
        typeof value === 'number' && value >= min && value <= max,
    
    // Combined validators
    stringRange: (min: number, max: number) => (value: string) =>
        typeof value === 'string' && value.length >= min && value.length <= max,
    
    safeString: (min: number = 2, max: number = 100) => (value: string) =>
        typeof value === 'string' && 
        value.length >= min && 
        value.length <= max &&
        /^[A-Za-z0-9\s]+$/.test(value) &&
        !value.toLowerCase().includes('teste'),
    
    // Array validators
    nonEmpty: (value: any[]) => Array.isArray(value) && value.length > 0,
    
    maxItems: (max: number) => (value: any[]) => 
        Array.isArray(value) && value.length <= max,
    
    // Object validators
    hasProperty: (prop: string) => (value: any) => 
        value && typeof value === 'object' && prop in value,
    
    // Custom combiners
    and: (...validators: ((value: any) => boolean)[]) => (value: any) =>
        validators.every(validator => validator(value)),
    
    or: (...validators: ((value: any) => boolean)[]) => (value: any) =>
        validators.some(validator => validator(value))
}

// Error messages
export const ValidationMessages = {
    required: 'Campo obrigatório',
    minLength: (min: number) => `Mínimo ${min} caracteres`,
    maxLength: (max: number) => `Máximo ${max} caracteres`,
    email: 'Email inválido',
    alphanumeric: 'Apenas letras, números e espaços',
    noTest: 'Não pode conter "teste"',
    positive: 'Deve ser positivo',
    range: (min: number, max: number) => `Deve estar entre ${min} e ${max}`,
    stringRange: (min: number, max: number) => `Deve ter entre ${min} e ${max} caracteres`,
    safeString: (min: number = 2, max: number = 100) => 
        `Deve ter ${min}-${max} chars, alfanumérico, sem "teste"`,
    nonEmpty: 'Não pode estar vazio',
    maxItems: (max: number) => `Máximo ${max} itens`,
    hasProperty: (prop: string) => `Deve ter propriedade "${prop}"`
}

// Convenience functions for common patterns
export const CommonValidations = {
    // For names, titles, etc
    safeName: (min = 2, max = 50) => ({
        validator: Validators.safeString(min, max),
        message: ValidationMessages.safeString(min, max)
    }),
    
    // For item descriptions
    itemText: (min = 2, max = 100) => ({
        validator: Validators.and(
            Validators.required,
            Validators.stringRange(min, max),
            Validators.alphanumeric,
            Validators.noTest
        ),
        message: `Texto de ${min}-${max} chars, alfanumérico, sem "teste"`
    }),
    
    // For email fields
    emailField: () => ({
        validator: Validators.and(Validators.required, Validators.email),
        message: 'Email válido obrigatório'
    }),
    
    // For positive numbers
    positiveNumber: () => ({
        validator: Validators.and(
            (v: any) => typeof v === 'number',
            Validators.positive
        ),
        message: 'Número positivo obrigatório'
    }),
    
    // For IDs and indices
    validIndex: (maxIndex: number) => ({
        validator: Validators.and(
            (v: any) => typeof v === 'number' && Number.isInteger(v),
            Validators.range(0, maxIndex)
        ),
        message: `Índice deve ser entre 0 e ${maxIndex}`
    })
}