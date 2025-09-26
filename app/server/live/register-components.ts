// 🔥 Register all live components

import { componentRegistry } from "@/core/server"
import { CounterComponent } from "./CounterComponent"

// Register Counter component
componentRegistry.registerComponent({
  name: 'CounterComponent',
  component: CounterComponent,
  initialState: {
    count: 0,
    title: 'Live Counter',
    step: 1,
    history: [0],
    lastUpdated: new Date()
  }
})

console.log('📝 Live components registered successfully!')

export { CounterComponent }