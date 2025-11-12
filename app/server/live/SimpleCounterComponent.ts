/**
 * Simple Counter Live Component
 * Demonstrates real-time state synchronization with minimal complexity
 */
import { LiveComponent } from '@/core/server/live/LiveComponent'

interface CounterState {
  count: number
}

export class SimpleCounterComponent extends LiveComponent<CounterState> {
  constructor() {
    super('SimpleCounter')
  }

  getInitialState(): CounterState {
    return {
      count: 0
    }
  }

  // Increment counter
  increment() {
    this.setState({
      count: this.state.count + 1
    })
  }

  // Decrement counter
  decrement() {
    this.setState({
      count: this.state.count - 1
    })
  }

  // Reset counter
  reset() {
    this.setState({
      count: 0
    })
  }

  // Auto-increment every 2 seconds
  onMount() {
    const interval = setInterval(() => {
      this.increment()
    }, 2000)

    // Cleanup on unmount
    this.onUnmount = () => {
      clearInterval(interval)
    }
  }
}
