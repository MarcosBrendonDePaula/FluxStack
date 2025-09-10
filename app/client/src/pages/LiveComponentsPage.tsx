import { Counter } from '../components/live/Counter'
import { Clock } from '../components/live/Clock'
import { Calculator } from '../components/live/Calculator'
import { Toast } from '../components/live/Toast'
import { UserProfile } from '../components/live/UserProfile'
import { ExampleEnhanced } from '../components/live/ExampleEnhanced'
import { TestCounterFixed } from '../components/live/TestCounterFixed'
import { TestToggle } from '../components/live/TestToggle'

export function LiveComponentsPage() {
    return (
        <div className="live-components-page">
            {/* Header */}
            <div className="page-header">
                <h1>🔥 Live Components Playground</h1>
                <p className="page-subtitle">
                    Interactive components with real-time state synchronization via WebSocket
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="component-sections">
                {/* Counter Test Section */}
                <section className="component-section">
                    <h2>🧪 Counter Isolation Test</h2>
                    <p>Testing individual component state isolation with UUID temporary system</p>
                    
                    <div className="components-grid">
                        <Counter 
                            componentId="main-counter"
                            initialCount={0}
                            step={1}
                            label="Counter A"
                            maxCount={50}
                            onCountChanged={(data) => console.log('🔢 Counter A changed:', data)}
                            showDebug={true}
                        />
                        <Counter 
                            componentId="main-counter1"
                            initialCount={0}
                            step={2}
                            label="Counter B"
                            maxCount={100}
                            onCountChanged={(data) => console.log('🔢 Counter B changed:', data)}
                            showDebug={true}
                        />
                        <Counter 
                            componentId="main-counter2"
                            initialCount={0}
                            step={5}
                            label="Counter C"
                            maxCount={200}
                            onCountChanged={(data) => console.log('🔢 Counter C changed:', data)}
                            showDebug={true}
                        />
                    </div>

                    <div className="info-card">
                        <h3>🧪 Test Instructions:</h3>
                        <ol>
                            <li>🔍 <strong>Open DevTools Console</strong>: Press F12 to see detailed logs</li>
                            <li>🎯 <strong>Click Different Counters</strong>: Each should increment independently</li>
                            <li>📊 <strong>Check Debug Info</strong>: Click "Debug Info" on each counter to see component state</li>
                            <li>🆔 <strong>Verify Component IDs</strong>: Each counter should have unique backend-generated ID</li>
                            <li>⚡ <strong>Test Actions</strong>: Try +10, Reset, Random buttons on different counters</li>
                            <li>🔄 <strong>Observe Logs</strong>: Look for tempUUID → finalID mapping in console</li>
                        </ol>
                        
                        <div className="expected-logs">
                            <h4>📋 Expected Console Logs:</h4>
                            <pre><code>🔌 [FRONTEND] Setting up: CounterAction (user ID: main-counter) | Temp UUID: abc-123
🆔 [BACKEND] Generated ID: main-counter-xyz789 | For temp UUID: abc-123  
🆔 [FRONTEND] Backend generated ID: main-counter-xyz789 | Replacing temp: abc-123
🎯 [FRONTEND] Calling CounterAction.increment() on main-counter-xyz789</code></pre>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}