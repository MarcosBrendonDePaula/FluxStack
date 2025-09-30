// 🔥 Simple Hybrid Live Counter - Server-Driven with Zustand

import { useHybridLiveComponent } from 'fluxstack'

interface CounterState {
  count: number
  title: string
  step: number
}

interface HybridLiveCounterProps {
  initialCount?: number
  title?: string
  step?: number
  room?: string
  userId?: string
}

export function HybridLiveCounter({
  initialCount = 0,
  title = 'Simple Live Counter',
  step = 1,
  room,
  userId
}: HybridLiveCounterProps = {}) {
  // Frontend provides initial state - server takes control after mount
  const initialState: CounterState = {
    count: initialCount,
    title,
    step
  }

  const { 
    state, 
    loading, 
    error, 
    connected, 
    call,
    callAndWait
  } = useHybridLiveComponent<CounterState>('Counter', initialState, {
    debug: true,
    autoMount: true,
    room,
    userId
  })

  const handleIncrement = () => call('increment', state.step)
  const handleDecrement = () => call('decrement', state.step) 
  const handleReset = () => call('reset')
  
  const handleGetStats = async () => {
    try {
      const response = await callAndWait('getStats')
      const stats = response.stats
      alert(`📊 Current: ${stats.current} | Min: ${stats.min} | Max: ${stats.max} | Avg: ${stats.average.toFixed(1)}`)
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Failed to get stats'}`)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{state.title}</h1>
        <div className="flex justify-center gap-2 text-sm">
          <span className={`px-2 py-1 rounded text-xs ${
            connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
            🎯 Server-Driven
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
          ❌ {error}
        </div>
      )}

      {/* Counter Display */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-blue-600 mb-2">
          {state.count}
        </div>
        <div className="text-sm text-gray-500">
          Step: {state.step}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleDecrement}
          disabled={loading || !connected}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold rounded transition-colors"
        >
          - {state.step}
        </button>
        <button
          onClick={handleIncrement}
          disabled={loading || !connected}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold rounded transition-colors"
        >
          + {state.step}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleReset}
          disabled={loading || !connected}
          className="px-3 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white text-sm rounded transition-colors"
        >
          🔄 Reset
        </button>
        <button
          onClick={handleGetStats}
          disabled={loading || !connected}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm rounded transition-colors"
        >
          📊 Stats
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <span className="ml-2 text-sm text-gray-600">Loading...</span>
        </div>
      )}
    </div>
  )
}