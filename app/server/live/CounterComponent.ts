// 🔥 Example Live Component - Counter

import { LiveComponent } from "@/core/live-components"

interface CounterState {
  count: number
  title: string
  step: number
  history: number[]
  lastUpdated: Date
}

export class CounterComponent extends LiveComponent<CounterState> {
  
  constructor(initialState: CounterState, ws: any, options?: { room?: string; userId?: string }) {
    super(initialState, ws, options)
    
    // Ensure history is initialized
    if (!this.state.history) {
      this.state.history = []
    }

    // Log component creation
    console.log(`🔢 Counter component created: ${this.id}`, {
      initialState,
      room: options?.room,
      userId: options?.userId
    })
  }

  // Action: Increment counter
  async increment(amount: number = 1) {
    const newCount = this.state.count + amount
    const newHistory = [...this.state.history, newCount]
    
    this.setState({
      count: newCount,
      history: newHistory.slice(-10), // Keep last 10 values
      lastUpdated: new Date()
    })
    
    // Broadcast to room if in multi-user mode
    if (this.room) {
      this.broadcast('COUNTER_INCREMENTED', {
        count: newCount,
        amount,
        userId: this.userId
      })
    }
    
    console.log(`🔢 Counter incremented to ${newCount} (step: ${amount})`)
    return { success: true, count: newCount }
  }

  // Action: Decrement counter
  async decrement(amount: number = 1) {
    const newCount = Math.max(0, this.state.count - amount)
    const newHistory = [...this.state.history, newCount]
    
    this.setState({
      count: newCount,
      history: newHistory.slice(-10),
      lastUpdated: new Date()
    })
    
    if (this.room) {
      this.broadcast('COUNTER_DECREMENTED', {
        count: newCount,
        amount,
        userId: this.userId
      })
    }
    
    console.log(`🔢 Counter decremented to ${newCount} (step: ${amount})`)
    return { success: true, count: newCount }
  }

  // Action: Reset counter
  async reset() {
    this.setState({
      count: 0,
      history: [0],
      lastUpdated: new Date()
    })
    
    if (this.room) {
      this.broadcast('COUNTER_RESET', {
        userId: this.userId
      })
    }
    
    console.log(`🔢 Counter reset`)
    return { success: true, count: 0 }
  }

  // Action: Set step size
  async setStep(step: number) {
    this.setState({
      step: Math.max(1, step),
      lastUpdated: new Date()
    })
    
    console.log(`🔢 Counter step set to ${step}`)
    return { success: true, step }
  }

  // Action: Update title
  async updateTitle(data: { title: string }) {
    const newTitle = data.title.trim()
    
    // Validate title
    if (!newTitle || newTitle.length > 50) {
      throw new Error('Title must be 1-50 characters')
    }
    
    this.setState({
      title: newTitle,
      lastUpdated: new Date()
    })
    
    console.log(`📝 Title updated to: "${newTitle}"`)
    return { success: true, title: newTitle }
  }

  // Action: Set title
  async setTitle(title: string) {
    this.setState({
      title: title.substring(0, 50), // Max 50 chars
      lastUpdated: new Date()
    })
    
    console.log(`🔢 Counter title set to "${title}"`)
    return { success: true, title }
  }

  // Action: Bulk update
  async bulkUpdate(updates: { count?: number; title?: string; step?: number }) {
    const newState: Partial<CounterState> = {
      lastUpdated: new Date()
    }
    
    if (updates.count !== undefined) {
      newState.count = Math.max(0, updates.count)
      newState.history = [...this.state.history, updates.count].slice(-10)
    }
    
    if (updates.title !== undefined) {
      newState.title = updates.title.substring(0, 50)
    }
    
    if (updates.step !== undefined) {
      newState.step = Math.max(1, updates.step)
    }
    
    this.setState(newState)
    
    if (this.room) {
      this.broadcast('COUNTER_BULK_UPDATE', {
        updates: newState,
        userId: this.userId
      })
    }
    
    console.log(`🔢 Counter bulk updated`, updates)
    return { success: true, updates: newState }
  }

  // Get computed properties
  async getStats() {
    const { count, history, step } = this.state
    
    const stats = {
      current: count,
      min: Math.min(...history),
      max: Math.max(...history),
      average: history.reduce((a, b) => a + b, 0) / history.length,
      step,
      historyLength: history.length,
      canIncrement: true,
      canDecrement: count > 0
    }
    
    return { success: true, stats }
  }

  // Override destroy for cleanup
  public destroy() {
    console.log(`🗑️ Counter component ${this.id} destroyed`)
    super.destroy()
  }
}