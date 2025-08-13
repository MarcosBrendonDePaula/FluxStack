/**
 * Core utilities for FluxStack
 * Central export point for all utility functions
 */

// UUID utilities
export { 
    generateUUID, 
    generateShortUUID, 
    isValidUUID, 
    generatePrefixedUUID,
    uuid 
} from './uuid'

// Checksum utilities  
export { 
    generateStateChecksum,
    validateStateChecksum,
    createStateSnapshot,
    verifyStateSnapshot,
    generateComponentFingerprint
} from './checksum'

// Logger utilities
export { logger as Logger } from './logger'

// Re-export all utils as default object for convenience
import { generateUUID, generateShortUUID, isValidUUID, generatePrefixedUUID } from './uuid'
import { generateStateChecksum, validateStateChecksum, createStateSnapshot, verifyStateSnapshot, generateComponentFingerprint } from './checksum'
import { logger } from './logger'

export const Utils = {
    // UUID
    generateUUID,
    generateShortUUID, 
    isValidUUID,
    generatePrefixedUUID,
    uuid: generateUUID,
    
    // Checksum
    generateStateChecksum,
    validateStateChecksum,
    createStateSnapshot,
    verifyStateSnapshot,
    generateComponentFingerprint,
    
    // Logger
    Logger: logger
}