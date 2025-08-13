/**
 * UUID utility functions for FluxStack
 * Provides cross-platform UUID generation compatible with all environments
 */

/**
 * Generates a UUID v4 compatible with all browsers and Node.js environments
 * Uses crypto.randomUUID() when available, falls back to secure alternative
 * 
 * @returns {string} A valid UUID v4 string
 */
export function generateUUID(): string {
    // Try crypto.randomUUID first (modern browsers and Node.js 16.7+)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
    }
    
    // Try crypto.getRandomValues if available (most modern environments)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint8Array(16)
        crypto.getRandomValues(array)
        
        // Set version (4) and variant bits according to RFC 4122
        array[6] = (array[6] & 0x0f) | 0x40 // Version 4
        array[8] = (array[8] & 0x3f) | 0x80 // Variant 10
        
        // Convert to hex string with hyphens
        const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
    }
    
    // Fallback for older environments (uses Math.random - less secure but functional)
    console.warn('⚠️  Using Math.random() for UUID generation. Consider upgrading to a modern environment.')
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

/**
 * Generates a short UUID for component IDs (8 characters)
 * Useful for readable component identifiers
 * 
 * @returns {string} A short UUID string
 */
export function generateShortUUID(): string {
    const full = generateUUID()
    return full.replace(/-/g, '').substring(0, 8)
}

/**
 * Validates if a string is a valid UUID format
 * 
 * @param {string} uuid - The string to validate
 * @returns {boolean} True if valid UUID format
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
}

/**
 * Generates a UUID with custom prefix for better identification
 * 
 * @param {string} prefix - Prefix to add before the UUID
 * @returns {string} Prefixed UUID string
 */
export function generatePrefixedUUID(prefix: string): string {
    const uuid = generateShortUUID()
    return `${prefix}-${uuid}`
}

// Re-export for backward compatibility and convenience
export { generateUUID as uuid }
export default generateUUID