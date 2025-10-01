/**
 * Ed25519 Session Validation Tool
 * Comprehensive testing of the cryptographic session system
 */

import { CryptoSessionManager } from './CryptoSessionManager'
import { RequestSigner } from './RequestSigner'
import { Logger } from '../shared/utils'
import type { ValidationResult, ValidationSummary } from '../shared/types'

export class SessionValidator {
  private results: ValidationResult[] = []
  private logger: Logger

  constructor() {
    this.logger = new Logger('SessionValidator')
  }

  /**
   * Run comprehensive session validation
   */
  async validateComplete(): Promise<ValidationSummary> {
    this.logger.info('Starting comprehensive Ed25519 session validation...')
    
    this.results = []
    const startTime = Date.now()

    // Core session tests
    await this.testSessionInitialization()
    await this.testSessionPersistence() 
    await this.testCryptographicOperations()
    await this.testRequestSigning()
    await this.testSessionRecovery()
    
    const duration = Date.now() - startTime
    const summary = this.generateSummary(duration)
    
    this.logger.info('Validation complete', summary)
    return summary
  }

  /**
   * Test 1: Session Initialization
   */
  private async testSessionInitialization(): Promise<void> {
    const startTime = Date.now()
    
    try {
      this.logger.debug('Testing session initialization...')
      
      const sessionManager = new CryptoSessionManager()
      const result = await sessionManager.initialize()
      const duration = Date.now() - startTime
      
      if (result.sessionId && result.sessionId.length === 64) {
        this.addResult({
          test: 'Session Initialization',
          status: 'PASS',
          message: 'Session created successfully with valid ID',
          details: {
            sessionId: `${result.sessionId.slice(0, 8)}...`,
            isNew: result.isNew,
            duration: `${duration}ms`
          },
          duration
        })
      } else {
        this.addResult({
          test: 'Session Initialization',
          status: 'FAIL',
          message: 'Invalid session ID format',
          details: result,
          duration
        })
      }
    } catch (error) {
      this.addResult({
        test: 'Session Initialization',
        status: 'FAIL',
        message: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      })
    }
  }

  /**
   * Test 2: Session Persistence
   */
  private async testSessionPersistence(): Promise<void> {
    const startTime = Date.now()
    
    try {
      this.logger.debug('Testing session persistence...')
      
      // Get current session
      const sessionManager1 = new CryptoSessionManager()
      const session1 = await sessionManager1.initialize()
      
      // Simulate page reload by creating new instance
      const sessionManager2 = new CryptoSessionManager()
      const session2 = await sessionManager2.initialize()
      
      const duration = Date.now() - startTime
      
      if (session1.sessionId === session2.sessionId && !session2.isNew) {
        this.addResult({
          test: 'Session Persistence',
          status: 'PASS',
          message: 'Session properly persisted across initializations',
          details: {
            sessionId: `${session1.sessionId?.slice(0, 8)}...`,
            persistent: true
          },
          duration
        })
      } else {
        this.addResult({
          test: 'Session Persistence',
          status: 'FAIL',
          message: 'Session not persisting correctly',
          details: { session1, session2 },
          duration
        })
      }
    } catch (error) {
      this.addResult({
        test: 'Session Persistence',
        status: 'FAIL',
        message: `Persistence test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      })
    }
  }

  /**
   * Test 3: Cryptographic Operations
   */
  private async testCryptographicOperations(): Promise<void> {
    const startTime = Date.now()
    
    try {
      this.logger.debug('Testing cryptographic operations...')
      
      const sessionManager = new CryptoSessionManager()
      await sessionManager.initialize()
      
      // Test message signing
      const testMessage = 'test-message-for-signing'
      const signature = await sessionManager.signMessage(testMessage)
      
      const duration = Date.now() - startTime
      
      if (signature && signature.length === 128) { // Ed25519 signature is 64 bytes = 128 hex chars
        this.addResult({
          test: 'Cryptographic Operations',
          status: 'PASS',
          message: 'Message signing successful',
          details: {
            message: testMessage,
            signatureLength: signature.length,
            signaturePrefix: signature.slice(0, 16) + '...'
          },
          duration
        })
      } else {
        this.addResult({
          test: 'Cryptographic Operations',
          status: 'FAIL',
          message: 'Invalid signature generated',
          details: { signature },
          duration
        })
      }
    } catch (error) {
      this.addResult({
        test: 'Cryptographic Operations',
        status: 'FAIL',
        message: `Crypto operations failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      })
    }
  }

  /**
   * Test 4: Request Signing
   */
  private async testRequestSigning(): Promise<void> {
    const startTime = Date.now()
    
    try {
      this.logger.debug('Testing request signing...')
      
      const sessionManager = new CryptoSessionManager()
      await sessionManager.initialize()
      
      const privateKey = sessionManager.getPrivateKey()
      const sessionId = sessionManager.getSessionId()
      
      if (!privateKey || !sessionId) {
        throw new Error('Session not properly initialized')
      }
      
      const requestSigner = new RequestSigner(privateKey, sessionId)
      
      // Test signing a request
      const headers = await requestSigner.signRequest('POST', '/api/test', '{"test": true}')
      
      const duration = Date.now() - startTime
      
      const requiredHeaders = ['x-session-id', 'x-timestamp', 'x-nonce', 'x-signature']
      const hasAllHeaders = requiredHeaders.every(header => headers[header])
      
      if (hasAllHeaders && headers['x-signature'].length === 128) {
        this.addResult({
          test: 'Request Signing',
          status: 'PASS',
          message: 'Request signing successful',
          details: {
            sessionId: headers['x-session-id'].slice(0, 8) + '...',
            timestamp: headers['x-timestamp'],
            nonceLength: headers['x-nonce'].length,
            signatureLength: headers['x-signature'].length
          },
          duration
        })
      } else {
        this.addResult({
          test: 'Request Signing',
          status: 'FAIL',
          message: 'Invalid request signature',
          details: { headers, hasAllHeaders },
          duration
        })
      }
    } catch (error) {
      this.addResult({
        test: 'Request Signing',
        status: 'FAIL',
        message: `Request signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      })
    }
  }

  /**
   * Test 5: Session Recovery
   */
  private async testSessionRecovery(): Promise<void> {
    const startTime = Date.now()
    
    try {
      this.logger.debug('Testing session recovery...')
      
      // Create session and export private key
      const sessionManager1 = new CryptoSessionManager()
      await sessionManager1.initialize()
      const originalSessionId = sessionManager1.getSessionId()
      const privateKey = sessionManager1.exportPrivateKey()
      
      if (!privateKey || !originalSessionId) {
        throw new Error('Failed to export session data')
      }
      
      // Clear session
      sessionManager1.clearSession()
      
      // Recover session from private key
      const sessionManager2 = new CryptoSessionManager()
      const recovered = await sessionManager2.importFromPrivateKey(privateKey)
      
      const duration = Date.now() - startTime
      
      if (recovered.sessionId === originalSessionId) {
        this.addResult({
          test: 'Session Recovery',
          status: 'PASS',
          message: 'Session recovery successful',
          details: {
            originalSessionId: originalSessionId.slice(0, 8) + '...',
            recoveredSessionId: recovered.sessionId.slice(0, 8) + '...',
            match: true
          },
          duration
        })
      } else {
        this.addResult({
          test: 'Session Recovery',
          status: 'FAIL',
          message: 'Session recovery failed - IDs do not match',
          details: { originalSessionId, recovered },
          duration
        })
      }
    } catch (error) {
      this.addResult({
        test: 'Session Recovery',
        status: 'FAIL',
        message: `Session recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      })
    }
  }

  /**
   * Add validation result
   */
  private addResult(result: ValidationResult): void {
    this.results.push(result)
    
    const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
    this.logger.debug(`${emoji} ${result.test}: ${result.message}`)
  }

  /**
   * Generate validation summary
   */
  private generateSummary(duration: number): ValidationSummary {
    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const warnings = this.results.filter(r => r.status === 'WARN').length
    
    return {
      totalTests: this.results.length,
      passed,
      failed,
      warnings,
      duration,
      results: this.results
    }
  }

  /**
   * Get validation results
   */
  getResults(): ValidationResult[] {
    return [...this.results]
  }

  /**
   * Clear results
   */
  clearResults(): void {
    this.results = []
  }
}