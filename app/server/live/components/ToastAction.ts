import { LiveAction } from '@/core/live'

interface Toast {
    id: string
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    duration: number
    timestamp: number
    persistent: boolean
}

export class ToastAction extends LiveAction {
    public toasts: Toast[] = []
    public maxToasts = 5
    public defaultDuration = 5000 // 5 seconds
    
    // Estado inicial baseado em props
    getInitialState(props: any) {
        return {
            toasts: [],
            maxToasts: props.maxToasts || 5,
            defaultDuration: props.defaultDuration || 5000,
            totalCount: 0,
            lastToast: null
        }
    }
    
    // Lifecycle: Start auto cleanup when component mounts
    mount() {
        console.log(`🍞 Toast component ${this.$ID} mounted`)
        // Auto cleanup expired toasts every 5 seconds
        setInterval(() => {
            this.cleanupExpiredToasts()
        }, 5000)
    }
    
    // Action: Show toast notification
    showToast(
        title: string, 
        message: string, 
        type: 'success' | 'error' | 'warning' | 'info' = 'info',
        duration?: number,
        persistent = false
    ) {
        const toast: Toast = {
            id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title,
            message,
            type,
            duration: duration || this.defaultDuration,
            timestamp: Date.now(),
            persistent
        }
        
        // Add to toasts array
        this.toasts.unshift(toast)
        
        // Keep only max toasts
        if (this.toasts.length > this.maxToasts) {
            this.toasts = this.toasts.slice(0, this.maxToasts)
        }
        
        console.log(`🍞 Toast shown: ${title} (${type})`)
        
        // Emit event for listeners
        this.emit('toast-shown', {
            componentId: this.$ID,
            toast: toast
        })
        
        setTimeout(()=>{
            this.dismissToast(toast.id);
        }, toast.duration)

        return { success: true, toastId: toast.id, totalToasts: this.toasts.length }
    }
    
    // Action: Dismiss specific toast
    dismissToast(toastId: string) {
        const initialLength = this.toasts.length
        this.toasts = this.toasts.filter(toast => toast.id !== toastId)
        
        const dismissed = initialLength > this.toasts.length
        
        if (dismissed) {
            console.log(`🗑️  Toast dismissed: ${toastId}`)
            this.emit('toast-dismissed', {
                componentId: this.$ID,
                toastId,
                remaining: this.toasts.length
            })
        }
        
        return { success: dismissed, remaining: this.toasts.length }
    }
    
    // Action: Clear all toasts
    clearAllToasts() {
        const clearedCount = this.toasts.length
        this.toasts = []
        
        console.log(`🧹 Cleared ${clearedCount} toasts`)
        
        this.emit('toasts-cleared', {
            componentId: this.$ID,
            clearedCount
        })
        
        return { success: true, clearedCount }
    }
    
    // Action: Show quick success toast
    showSuccess(title: string, message: string, duration?: number) {
        return this.showToast(title, message, 'success', duration)
    }
    
    // Action: Show quick error toast
    showError(title: string, message: string, persistent = true) {
        return this.showToast(title, message, 'error', undefined, persistent)
    }
    
    // Action: Show quick warning toast
    showWarning(title: string, message: string, duration?: number) {
        return this.showToast(title, message, 'warning', duration)
    }
    
    // Action: Show quick info toast
    showInfo(title: string, message: string, duration?: number) {
        return this.showToast(title, message, 'info', duration)
    }
    
    // Action: Test hydration resilience
    async testHydration() {
        const testResults = []
        
        // Add multiple toasts with different types
        const testData = [
            { title: 'Test 1', message: 'Success toast for hydration test', type: 'success' as const },
            { title: 'Test 2', message: 'Warning toast for hydration test', type: 'warning' as const },
            { title: 'Test 3', message: 'Error toast (persistent)', type: 'error' as const, persistent: true },
            { title: 'Test 4', message: 'Info toast for hydration test', type: 'info' as const }
        ]
        
        for (const test of testData) {
            const result = this.showToast(
                test.title, 
                test.message, 
                test.type, 
                undefined, 
                test.persistent || false
            )
            testResults.push(result)
            
            // Small delay between toasts
            await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        console.log(`🧪 Hydration test completed: ${testResults.length} toasts created`)
        
        return { 
            success: true, 
            testsRun: testResults.length,
            totalToasts: this.toasts.length,
            message: 'Hydration test completed! Try refreshing page or restarting server.'
        }
    }
    
    // Private: Cleanup expired toasts
    private cleanupExpiredToasts() {
        const now = Date.now()
        const initialCount = this.toasts.length
        
        this.toasts = this.toasts.filter(toast => {
            if (toast.persistent) return true
            return (now - toast.timestamp) < toast.duration
        })
        
        const cleaned = initialCount - this.toasts.length
        if (cleaned > 0) {
            console.log(`🧹 Auto-cleaned ${cleaned} expired toasts`)
            this.emit('toasts-auto-cleaned', {
                componentId: this.$ID,
                cleanedCount: cleaned,
                remaining: this.toasts.length
            })
        }
    }
    
    // Action: Get toast statistics
    getStats() {
        const stats = {
            total: this.toasts.length,
            byType: {
                success: this.toasts.filter(t => t.type === 'success').length,
                error: this.toasts.filter(t => t.type === 'error').length,
                warning: this.toasts.filter(t => t.type === 'warning').length,
                info: this.toasts.filter(t => t.type === 'info').length
            },
            persistent: this.toasts.filter(t => t.persistent).length,
            oldest: this.toasts.length > 0 ? Math.min(...this.toasts.map(t => t.timestamp)) : null,
            newest: this.toasts.length > 0 ? Math.max(...this.toasts.map(t => t.timestamp)) : null
        }
        
        this.emit('stats-requested', {
            componentId: this.$ID,
            stats
        })
        
        return { success: true, stats }
    }
}

// Auto-register no sistema
LiveAction.add(ToastAction)