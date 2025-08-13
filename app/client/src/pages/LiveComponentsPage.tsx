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
                {/* Core Components Section */}
                <section className="component-section">
                    <h2>📦 Core Components</h2>
                    <p>Essential LiveAction components with full functionality</p>
                    
                    <div className="components-grid">
                        <Counter 
                            componentId="main-counter"
                            initialCount={0}
                            onCountChanged={(data) => console.log('🔢 Counter changed:', data)}
                        />
                        
                        <Clock 
                            componentId="clock-brazil"
                            timezone="America/Sao_Paulo"
                            format={24}
                            onTimeUpdated={(data) => console.log('⏰ Time updated:', data)}
                            onClockToggled={(data) => console.log('🔄 Clock toggled:', data)}
                        />
                        
                        <Calculator 
                            componentId="main-calculator"
                            onCalculationPerformed={(data) => console.log('🧮 Calculation:', data)}
                            onCalculatorCleared={(data) => console.log('🧹 Calculator cleared:', data)}
                        />
                    </div>
                </section>

                {/* Generated Components Section */}
                <section className="component-section">
                    <h2>🚀 Generated Components</h2>
                    <p>Components created with Quick Generator CLI and Advanced Class Helpers</p>
                    
                    <div className="components-grid">
                        <TestCounterFixed />
                        <TestToggle />
                    </div>

                    <div className="info-card">
                        <h3>🔧 How These Were Generated:</h3>
                        <div className="code-examples">
                            <div className="code-example">
                                <h4>TestCounterFixed:</h4>
                                <pre><code>bun run quick:gen TestCounterFixed --type=counter</code></pre>
                                <p>Counter with increment/decrement using step property</p>
                            </div>
                            <div className="code-example">
                                <h4>TestToggle:</h4>
                                <pre><code>bun run quick:gen TestToggle --type=toggle</code></pre>
                                <p>Boolean toggle with enable/disable/toggle methods</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Advanced Components Section */}
                <section className="component-section">
                    <h2>🧪 Advanced Components</h2>
                    <p>Components demonstrating advanced features and patterns</p>
                    
                    <div className="components-grid">
                        <ExampleEnhanced 
                            componentId="example-enhanced"
                            title="Advanced Component"
                            maxItems={15}
                            isEnabled={true}
                            onItemAdded={(data) => console.log('➕ Item added:', data)}
                            onItemRemoved={(data) => console.log('➖ Item removed:', data)}
                            onAllItemsCleared={(data) => console.log('🧹 All items cleared:', data)}
                            onTitleUpdated={(data) => console.log('✏️ Title updated:', data)}
                            onStateToggled={(data) => console.log('🔄 State toggled:', data)}
                            onComponentChanged={(data) => console.log('🔄 Component changed:', data)}
                        />

                        <UserProfile 
                            componentId="test-user-profile"
                            onActionCompleted={(data) => console.log('👤 UserProfile action:', data)}
                        />
                    </div>
                </section>

                {/* Toast & State Management Section */}
                <section className="component-section">
                    <h2>🍞 Toast & State Management</h2>
                    <p>State persistence, hydration testing and notification system</p>
                    
                    <div className="toast-section">
                        <Toast 
                            componentId="main-toast-manager"
                            maxToasts={6}
                            defaultDuration={8000}
                            position="top-right"
                            onToastShown={(data) => console.log('🍞 Toast shown:', data)}
                            onToastDismissed={(data) => console.log('🗑️ Toast dismissed:', data)}
                            onToastsCleared={(data) => console.log('🧹 All toasts cleared:', data)}
                            onToastsAutoCleaned={(data) => console.log('🧹 Auto-cleaned toasts:', data)}
                            onStatsRequested={(data) => console.log('📊 Toast stats:', data)}
                        />
                    </div>

                    <div className="info-card">
                        <h3>🧪 How to Test State Persistence:</h3>
                        <ol>
                            <li>🍞 <strong>Create Toasts</strong>: Click buttons to create different types of toasts</li>
                            <li>🧪 <strong>Test Hydration</strong>: Click "Test Hydration" to create multiple toasts</li>
                            <li>🔄 <strong>Refresh Page</strong>: Press F5 - toasts should be restored from localStorage</li>
                            <li>🔌 <strong>Restart Server</strong>: Stop (Ctrl+C) and start server - state should recover</li>
                            <li>💾 <strong>Check Storage</strong>: DevTools → Application → LocalStorage → see snapshots</li>
                            <li>🔍 <strong>Monitor Logs</strong>: Console shows hydration process with fingerprints</li>
                        </ol>
                    </div>
                </section>

                {/* Development Tools Section */}
                <section className="component-section">
                    <h2>🛠️ Development Tools</h2>
                    <p>Tools and utilities for LiveAction development</p>
                    
                    <div className="tools-grid">
                        <div className="tool-card">
                            <h3>🚀 Quick Generator CLI</h3>
                            <p>Generate components instantly with various templates</p>
                            <pre><code>bun run quick:gen ComponentName --type=counter|toggle|input|crud|form|list</code></pre>
                        </div>

                        <div className="tool-card">
                            <h3>📊 Memory Monitoring</h3>
                            <p>Monitor memory usage and component instances</p>
                            <div className="tool-links">
                                <a href="http://localhost:3000/api/memory/stats" target="_blank" rel="noopener noreferrer">
                                    Memory Stats API
                                </a>
                                <a href="http://localhost:3000/api/memory/health" target="_blank" rel="noopener noreferrer">
                                    Health Check
                                </a>
                            </div>
                        </div>

                        <div className="tool-card">
                            <h3>📚 Documentation</h3>
                            <p>Complete API documentation and examples</p>
                            <div className="tool-links">
                                <a href="http://localhost:3000/swagger" target="_blank" rel="noopener noreferrer">
                                    Swagger API Docs
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Overview */}
                <section className="component-section">
                    <h2>💡 LiveAction Features</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <h3>🔄 Real-time Sync</h3>
                            <p>State automatically synchronized across all connected clients</p>
                        </div>
                        
                        <div className="feature-card">
                            <h3>💾 State Persistence</h3>
                            <p>Component state persists through page refreshes and server restarts</p>
                        </div>
                        
                        <div className="feature-card">
                            <h3>🎯 Type Safety</h3>
                            <p>End-to-end TypeScript type safety with Eden Treaty</p>
                        </div>
                        
                        <div className="feature-card">
                            <h3>🔌 WebSocket Events</h3>
                            <p>Real-time event emission with Livewire-style event handlers</p>
                        </div>
                        
                        <div className="feature-card">
                            <h3>🧹 Auto Cleanup</h3>
                            <p>Automatic memory management and component cleanup</p>
                        </div>
                        
                        <div className="feature-card">
                            <h3>🚀 Hot Reload</h3>
                            <p>Development-friendly with hot reload support</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}