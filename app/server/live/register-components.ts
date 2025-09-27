// 🔥 Register all live components
// NOTE: Components are now auto-discovered from this directory!
// Manual registration is optional for custom initial states

import { CounterComponent } from "./CounterComponent"

// Manual registration is now optional - components are auto-discovered
// Uncomment below for custom initial states:

/* 
import { componentRegistry } from "@/core/server/live/ComponentRegistry"

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
*/

console.log('📝 Live components registered successfully!')

export { CounterComponent }