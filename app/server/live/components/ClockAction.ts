import { LiveAction } from '@/core/live'

export class ClockAction extends LiveAction {
    public currentTime = ""
    public timezone = "America/Sao_Paulo"
    public format = "24h"
    public isRunning = false
    
    private timer?: any
    
    // Estado inicial baseado em props
    getInitialState(props: any) {
        return {
            currentTime: this.formatTime(new Date()),
            timezone: props.timezone || "America/Sao_Paulo", 
            format: props.format || "24h",
            isRunning: false
        }
    }
    
    // Lifecycle: Start timer when component mounts
    mount() {
        console.log(`⏰ Clock component ${this.$ID} mounted - starting timer`)
        this.startClock()
    }
    
    // Lifecycle: Cleanup when component unmounts
    unmount() {
        console.log(`⏰ Clock component ${this.$ID} unmounted - stopping timer`)
        this.stopClock()
    }
    
    // Action: Start the clock
    startClock() {
        if (this.isRunning) return
        
        this.isRunning = true
        this.updateTime() // Update immediately
        
        // Update every 30 seconds (reduced for debugging)
        this.timer = setInterval(() => {
            this.updateTime()
        }, 1000)
        
        console.log(`⏰ Clock ${this.$ID} started (${this.timezone}, ${this.format})`)
        this.emit('clock-started', { 
            componentId: this.$ID,
            timezone: this.timezone,
            format: this.format
        })
    }
    
    // Action: Stop the clock
    stopClock() {
        if (!this.isRunning) return
        
        this.isRunning = false
        
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = undefined
        }
        
        console.log(`⏰ Clock ${this.$ID} stopped`)
        
        this.emit('clock-stopped', { 
            componentId: this.$ID 
        })
        
        // ✨ Return value to indicate state change (trigger will send state_update automatically)
        return { success: true, action: 'stopped' }
    }
    
    // Action: Change timezone
    setTimezone(newTimezone: string) {
        this.timezone = newTimezone
        this.updateTime() // Update immediately with new timezone
        
        this.emit('timezone-changed', {
            componentId: this.$ID,
            timezone: this.timezone
        })
        
        // ✨ Return value to indicate state change (trigger will send state_update automatically)
        return { success: true, action: 'timezone_changed', timezone: this.timezone }
    }
    
    // Action: Change format (12h/24h)
    setFormat(newFormat: "12h" | "24h") {
        this.format = newFormat
        this.updateTime() // Update immediately with new format
        
        this.emit('format-changed', {
            componentId: this.$ID,
            format: this.format
        })
        
        // ✨ Return value to indicate state change (trigger will send state_update automatically)
        return { success: true, action: 'format_changed', format: this.format }
    }
    
    // Private: Update time and send to client
    private updateTime() {
        const now = new Date()
        this.currentTime = this.formatTime(now)
        
        // ✨ Push update to client automatically
        if (this.ws && this.ws.raw.readyState === 1) { // 1 = OPEN state
            this.ws.send(JSON.stringify({
                updates: [{
                    type: 'state_update',
                    id: this.$ID,
                    state: this.serializeCurrentState()
                }]
            }))
            
            // Also emit tick event
            this.emit('tick', {
                componentId: this.$ID,
                time: this.currentTime,
                timestamp: now.getTime()
            })
        }
    }
    
    // Private: Format time based on timezone and format
    private formatTime(date: Date): string {
        const options: Intl.DateTimeFormatOptions = {
            timeZone: this.timezone,
            hour: '2-digit',
            minute: '2-digit', 
            second: '2-digit',
            hour12: this.format === '12h'
        }
        
        try {
            return date.toLocaleTimeString('pt-BR', options)
        } catch (error) {
            // Fallback if timezone is invalid
            console.warn(`⚠️  Invalid timezone: ${this.timezone}`)
            return date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: this.format === '12h'
            })
        }
    }
    
    // Private: Get current state for serialization
    private serializeCurrentState() {
        return {
            $props: this.$props,
            $ID: this.$ID,
            currentTime: this.currentTime,
            timezone: this.timezone,
            format: this.format,
            isRunning: this.isRunning
        }
    }
    
    // Action: Get server info
    getServerInfo() {
        const serverTime = new Date()
        
        this.emit('server-info', {
            componentId: this.$ID,
            serverTime: serverTime.toISOString(),
            serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            uptime: process.uptime()
        })
    }
    
    // Computed properties
    get formattedDate() {
        const now = new Date()
        return now.toLocaleDateString('pt-BR', {
            timeZone: this.timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        })
    }
}

// Auto-register no sistema
LiveAction.add(ClockAction)