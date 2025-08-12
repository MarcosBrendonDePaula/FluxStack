import { createHash } from 'crypto'

/**
 * State Checksum Utilities
 * Similar to Laravel Livewire's state validation system
 */

export interface StateWithChecksum {
    data: Record<string, any>
    checksum: string
    timestamp: number
}

/**
 * Generate a SHA-256 checksum for component state
 * @param state - The component state object
 * @param secret - Optional secret for additional security
 * @returns SHA-256 hash string
 */
export function generateStateChecksum(state: Record<string, any>, secret?: string): string {
    // Remove system fields and functions for consistent hashing
    const cleanState = cleanStateForHashing(state)
    
    // Create deterministic JSON string
    const stateString = JSON.stringify(cleanState, Object.keys(cleanState).sort())
    
    // Add secret if provided (like Laravel Livewire's app key)
    const dataToHash = secret ? `${stateString}.${secret}` : stateString
    
    return createHash('sha256').update(dataToHash).digest('hex')
}

/**
 * Validate state checksum
 * @param state - The component state object
 * @param checksum - The checksum to validate against
 * @param secret - Optional secret used in generation
 * @returns true if checksum is valid
 */
export function validateStateChecksum(
    state: Record<string, any>, 
    checksum: string, 
    secret?: string
): boolean {
    const expectedChecksum = generateStateChecksum(state, secret)
    return expectedChecksum === checksum
}

/**
 * Create state snapshot with checksum and timestamp
 * @param state - Component state
 * @param secret - Optional secret for security
 * @returns State snapshot with checksum
 */
export function createStateSnapshot(
    state: Record<string, any>, 
    secret?: string
): StateWithChecksum {
    const cleanState = cleanStateForHashing(state)
    
    return {
        data: cleanState,
        checksum: generateStateChecksum(cleanState, secret),
        timestamp: Date.now()
    }
}

/**
 * Verify state snapshot validity
 * @param snapshot - State snapshot to verify
 * @param maxAge - Maximum age in milliseconds (default: 1 hour)
 * @param secret - Optional secret for checksum validation
 * @returns Validation result
 */
export function verifyStateSnapshot(
    snapshot: StateWithChecksum, 
    maxAge: number = 3600000, // 1 hour
    secret?: string
): { valid: boolean; reason?: string } {
    // Check timestamp age
    const age = Date.now() - snapshot.timestamp
    if (age > maxAge) {
        return { valid: false, reason: 'snapshot_expired' }
    }
    
    // Validate checksum
    if (!validateStateChecksum(snapshot.data, snapshot.checksum, secret)) {
        return { valid: false, reason: 'invalid_checksum' }
    }
    
    return { valid: true }
}

/**
 * Clean state object for consistent hashing
 * Removes system fields, functions, and WebSocket references
 * @param state - Raw state object
 * @returns Cleaned state for hashing
 */
function cleanStateForHashing(state: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(state)) {
        // Skip system fields
        if (key.startsWith('$') || key.startsWith('_')) continue
        
        // Skip functions
        if (typeof value === 'function') continue
        
        // Skip WebSocket references
        if (key === 'ws') continue
        
        // Skip undefined/null values for consistency
        if (value === undefined || value === null) continue
        
        // Handle nested objects recursively
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const cleanedNested = cleanStateForHashing(value)
            if (Object.keys(cleanedNested).length > 0) {
                cleaned[key] = cleanedNested
            }
        } else {
            cleaned[key] = value
        }
    }
    
    return cleaned
}

/**
 * Generate component fingerprint for identification
 * @param componentName - Name of the component
 * @param componentId - ID of the component instance
 * @param props - Component props
 * @returns Unique fingerprint string
 */
export function generateComponentFingerprint(
    componentName: string,
    componentId: string,
    props: Record<string, any>
): string {
    const fingerprintData = {
        component: componentName,
        id: componentId,
        props: cleanStateForHashing(props)
    }
    
    const fingerprintString = JSON.stringify(fingerprintData, Object.keys(fingerprintData).sort())
    return createHash('sha256').update(fingerprintString).digest('hex').substring(0, 16)
}