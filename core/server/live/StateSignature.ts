// 🔐 FluxStack State Signature System - Cryptographic validation for client state

import { createHmac, randomBytes } from 'crypto'

export interface SignedState<T = any> {
  data: T
  signature: string
  timestamp: number
  componentId: string
  version: number
}

export interface StateValidationResult {
  valid: boolean
  error?: string
  tampered?: boolean
  expired?: boolean
}

export class StateSignature {
  private static instance: StateSignature
  private secretKey: string
  private readonly maxAge = 24 * 60 * 60 * 1000 // 24 hours default

  constructor(secretKey?: string) {
    this.secretKey = secretKey || this.generateSecretKey()
  }

  public static getInstance(secretKey?: string): StateSignature {
    if (!StateSignature.instance) {
      StateSignature.instance = new StateSignature(secretKey)
    }
    return StateSignature.instance
  }

  private generateSecretKey(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Sign component state with HMAC-SHA256
   */
  public signState<T>(componentId: string, data: T, version: number = 1): SignedState<T> {
    const timestamp = Date.now()
    
    // Create payload for signing
    const payload = {
      data,
      componentId,
      timestamp,
      version
    }
    
    // Generate signature
    const signature = this.createSignature(payload)
    
    console.log('🔐 State signed:', {
      componentId,
      timestamp,
      version,
      signature: signature.substring(0, 16) + '...'
    })

    return {
      data,
      signature,
      timestamp,
      componentId,
      version
    }
  }

  /**
   * Validate signed state integrity
   */
  public validateState<T>(signedState: SignedState<T>, maxAge?: number): StateValidationResult {
    const { data, signature, timestamp, componentId, version } = signedState
    
    try {
      // Check timestamp (prevent replay attacks)
      const age = Date.now() - timestamp
      const ageLimit = maxAge || this.maxAge
      
      if (age > ageLimit) {
        return {
          valid: false,
          error: 'State signature expired',
          expired: true
        }
      }

      // Recreate payload for verification
      const payload = {
        data,
        componentId,
        timestamp,
        version
      }

      // Verify signature
      const expectedSignature = this.createSignature(payload)
      
      if (!this.constantTimeEquals(signature, expectedSignature)) {
        console.warn('⚠️ State signature mismatch:', {
          componentId,
          expected: expectedSignature.substring(0, 16) + '...',
          received: signature.substring(0, 16) + '...'
        })
        
        return {
          valid: false,
          error: 'State signature invalid - possible tampering',
          tampered: true
        }
      }

      console.log('✅ State signature valid:', {
        componentId,
        age: `${Math.round(age / 1000)}s`,
        version
      })

      return { valid: true }

    } catch (error: any) {
      return {
        valid: false,
        error: `Validation error: ${error.message}`
      }
    }
  }

  /**
   * Create HMAC signature for payload
   */
  private createSignature(payload: any): string {
    // Stringify deterministically (sorted keys)
    const normalizedPayload = JSON.stringify(payload, Object.keys(payload).sort())
    
    return createHmac('sha256', this.secretKey)
      .update(normalizedPayload)
      .digest('hex')
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }

  /**
   * Extract unsigned data from signed state (after validation)
   */
  public extractData<T>(signedState: SignedState<T>): T {
    return signedState.data
  }

  /**
   * Update signature for new state version
   */
  public updateSignature<T>(signedState: SignedState<T>, newData: T): SignedState<T> {
    return this.signState(
      signedState.componentId,
      newData,
      signedState.version + 1
    )
  }

  /**
   * Get server's signature info for debugging
   */
  public getSignatureInfo() {
    return {
      algorithm: 'HMAC-SHA256',
      keyLength: this.secretKey.length,
      maxAge: this.maxAge,
      keyPreview: this.secretKey.substring(0, 8) + '...'
    }
  }
}

// Global instance
export const stateSignature = StateSignature.getInstance(
  process.env.FLUXSTACK_STATE_SECRET || undefined
)