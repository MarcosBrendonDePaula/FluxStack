import { StateWithChecksum, createStateSnapshot, verifyStateSnapshot, generateComponentFingerprint } from '@/core/utils/checksum'

/**
 * Hydration Manager
 * Manages state persistence and recovery similar to Laravel Livewire
 */

export interface HydrationSession {
    componentId: string
    componentName: string
    fingerprint: string
    snapshot: StateWithChecksum
    lastActivity: number
    recoveryAttempts: number
}

export class HydrationManager {
    private static instance: HydrationManager | null = null
    private sessions = new Map<string, HydrationSession>()
    private secret: string
    private maxAge: number = 1800000 // 30 minutes (reduced from 1 hour)
    private maxRecoveryAttempts: number = 3

    private constructor() {
        // Generate or load secret (in production, this should come from environment)
        this.secret = process.env.FLUXSTACK_SECRET || 'default-secret-change-in-production'
        
        // Cleanup old sessions every 5 minutes (reduced from 10 minutes)
        setInterval(() => this.cleanupExpiredSessions(), 300000)
        
        // Additional aggressive cleanup every minute for sessions with too many attempts
        setInterval(() => this.cleanupFailedSessions(), 60000)
    }

    public static getInstance(): HydrationManager {
        if (!this.instance) {
            this.instance = new HydrationManager()
        }
        return this.instance
    }

    /**
     * Store component state snapshot for hydration
     * @param componentId - Component instance ID
     * @param componentName - Component class name
     * @param state - Current component state
     * @param props - Component props
     * @returns Snapshot fingerprint for client storage
     */
    public storeSnapshot(
        componentId: string,
        componentName: string,
        state: Record<string, any>,
        props: Record<string, any>
    ): string {
        const fingerprint = generateComponentFingerprint(componentName, componentId, props)
        const snapshot = createStateSnapshot(state, this.secret)
        
        const session: HydrationSession = {
            componentId,
            componentName,
            fingerprint,
            snapshot,
            lastActivity: Date.now(),
            recoveryAttempts: 0
        }
        
        this.sessions.set(componentId, session)
        
        console.log(`💾 State snapshot stored for ${componentId} (fingerprint: ${fingerprint.substring(0, 8)}...)`)
        return fingerprint
    }

    /**
     * Attempt to hydrate component from stored snapshot
     * @param componentId - Component instance ID
     * @param clientFingerprint - Fingerprint from client
     * @param clientState - Current client state
     * @returns Hydration result
     */
    public attemptHydration(
        componentId: string,
        clientFingerprint: string,
        clientState?: Record<string, any>
    ): {
        success: boolean
        state?: Record<string, any>
        reason?: string
        requiresRefresh?: boolean
    } {
        const session = this.sessions.get(componentId)
        
        if (!session) {
            return {
                success: false,
                reason: 'no_session_found',
                requiresRefresh: true
            }
        }

        // Update recovery attempts
        session.recoveryAttempts++
        session.lastActivity = Date.now()

        // Check max recovery attempts
        if (session.recoveryAttempts > this.maxRecoveryAttempts) {
            this.sessions.delete(componentId)
            return {
                success: false,
                reason: 'max_attempts_exceeded',
                requiresRefresh: true
            }
        }

        // Verify fingerprint match
        if (session.fingerprint !== clientFingerprint) {
            return {
                success: false,
                reason: 'fingerprint_mismatch',
                requiresRefresh: false
            }
        }

        // Verify snapshot validity
        const verification = verifyStateSnapshot(session.snapshot, this.maxAge, this.secret)
        if (!verification.valid) {
            this.sessions.delete(componentId)
            return {
                success: false,
                reason: verification.reason,
                requiresRefresh: true
            }
        }

        console.log(`🔄 Successfully hydrated ${componentId} from snapshot`)
        
        // Reset recovery attempts on successful hydration
        session.recoveryAttempts = 0
        
        return {
            success: true,
            state: session.snapshot.data
        }
    }

    /**
     * Update existing session after successful operation
     * @param componentId - Component instance ID
     * @param newState - Updated state
     */
    public updateSession(componentId: string, newState: Record<string, any>): void {
        const session = this.sessions.get(componentId)
        if (session) {
            session.snapshot = createStateSnapshot(newState, this.secret)
            session.lastActivity = Date.now()
            session.recoveryAttempts = 0 // Reset on successful update
        }
    }

    /**
     * Remove session (component unmounted)
     * @param componentId - Component instance ID
     */
    public removeSession(componentId: string): void {
        if (this.sessions.delete(componentId)) {
            console.log(`🗑️  Removed hydration session for ${componentId}`)
        }
    }

    /**
     * Check if component can be hydrated
     * @param componentId - Component instance ID
     * @param clientFingerprint - Client fingerprint
     * @returns Whether hydration is possible
     */
    public canHydrate(componentId: string, clientFingerprint?: string): boolean {
        const session = this.sessions.get(componentId)
        if (!session) return false
        
        if (clientFingerprint && session.fingerprint !== clientFingerprint) {
            return false
        }

        const verification = verifyStateSnapshot(session.snapshot, this.maxAge, this.secret)
        return verification.valid
    }

    /**
     * Get session statistics for debugging
     * @returns Session stats
     */
    public getStats(): {
        totalSessions: number
        activeComponents: string[]
        oldestSession: number | null
        newestSession: number | null
    } {
        const sessions = Array.from(this.sessions.values())
        const timestamps = sessions.map(s => s.lastActivity)
        
        return {
            totalSessions: sessions.length,
            activeComponents: sessions.map(s => s.componentId),
            oldestSession: timestamps.length > 0 ? Math.min(...timestamps) : null,
            newestSession: timestamps.length > 0 ? Math.max(...timestamps) : null
        }
    }

    /**
     * Clean up sessions with failed recovery attempts
     * @private
     */
    private cleanupFailedSessions(): void {
        let cleanedCount = 0
        
        for (const [componentId, session] of this.sessions.entries()) {
            if (session.recoveryAttempts >= this.maxRecoveryAttempts) {
                this.sessions.delete(componentId)
                cleanedCount++
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} failed hydration sessions (max attempts exceeded)`)
        }
    }
    
    /**
     * Clean up expired sessions
     * @private
     */
    private cleanupExpiredSessions(): void {
        const now = Date.now()
        let cleanedCount = 0
        
        for (const [componentId, session] of this.sessions.entries()) {
            const age = now - session.lastActivity
            
            if (age > this.maxAge || !verifyStateSnapshot(session.snapshot, this.maxAge, this.secret).valid) {
                this.sessions.delete(componentId)
                cleanedCount++
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} expired hydration sessions`)
        }
    }
}

// Export singleton instance
export const hydrationManager = HydrationManager.getInstance()