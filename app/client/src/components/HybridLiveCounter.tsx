// 🔥 Hybrid Live Counter - Zustand + Live Components

import { useState } from 'react'
import { useHybridLiveComponent } from '../hooks/useHybridLiveComponent'

interface CounterState {
  count: number
  title: string
  step: number
  history: number[]
  lastUpdated: Date
}

export function HybridLiveCounter() {
  const [showDebug, setShowDebug] = useState(false)

  // Initial state comes from frontend (component props)
  const initialState: CounterState = {
    count: 0,
    title: 'Hybrid Live Counter',
    step: 1,
    history: [0],
    lastUpdated: new Date()
  }

  const { 
    state, 
    loading, 
    error, 
    connected, 
    componentId,
    status,
    call,
    callAndWait,
    useControlledField
  } = useHybridLiveComponent<CounterState>('CounterComponent', initialState, {
    debug: true,
    autoMount: true,
    fallbackToLocal: true
  })

  // Example of controlled field (title editing)
  const titleField = useControlledField('title', 'updateTitle')

  const handleIncrement = async () => {
    try {
      await call('increment', state.step)
    } catch (err) {
      console.error('Failed to increment:', err)
    }
  }

  const handleDecrement = async () => {
    try {
      await call('decrement', state.step)
    } catch (err) {
      console.error('Failed to decrement:', err)
    }
  }

  const handleReset = async () => {
    try {
      await call('reset')
    } catch (err) {
      console.error('Failed to reset:', err)
    }
  }

  // Removed sync function - server automatically syncs state
  
  const handleGetStats = async () => {
    try {
      const response = await callAndWait('getStats')
      console.log('📊 Response from server:', response)
      
      // Backend returns { success: true, stats: {...} }
      const stats = response.stats
      console.log('📊 Stats:', stats)
      
      alert(`📊 Stats:\nCurrent: ${stats.current}\nMin: ${stats.min}\nMax: ${stats.max}\nAverage: ${stats.average.toFixed(1)}\nHistory Length: ${stats.historyLength}`)
    } catch (err) {
      console.error('Failed to get stats:', err)
      alert(`❌ Failed to get stats: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'synced': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'conflict': return 'text-red-600'
      case 'disconnected': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'synced': return '🟢'
      case 'pending': return '🟡'
      case 'conflict': return '🔴'
      case 'disconnected': return '⚫'
      default: return '⚫'
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg border-2 border-blue-200">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-2">{state.title}</h1>
        
        {/* Editable Title Example */}
        <div className="max-w-md mx-auto mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Edit Title:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={titleField.value}
              onChange={(e) => titleField.setValue(e.target.value)}
              onBlur={() => titleField.isDirty && titleField.commit()}
              onKeyPress={(e) => e.key === 'Enter' && titleField.commit()}
              className={`flex-1 px-3 py-2 border rounded-md text-sm ${
                titleField.isDirty 
                  ? 'border-yellow-300 bg-yellow-50' 
                  : 'border-gray-300'
              }`}
              maxLength={50}
              placeholder="Enter new title..."
            />
            {titleField.isDirty && (
              <button
                onClick={() => titleField.commit()}
                className="px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                title="Save changes"
              >
                💾
              </button>
            )}
          </div>
          {titleField.isDirty && (
            <p className="text-xs text-yellow-600 mt-1">
              Press Enter or click 💾 to save
            </p>
          )}
        </div>
        <div className="flex justify-center items-center gap-4 text-sm">
          <span className={`inline-flex items-center px-3 py-1 rounded ${
            connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          
          <span className={`inline-flex items-center px-3 py-1 rounded bg-gray-100 ${getStatusColor()}`}>
            {getStatusIcon()} {status.toUpperCase()}
          </span>
          
          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
            🎯 Server-Driven
          </span>
          
          {componentId && (
            <span className="text-xs text-gray-500">
              ID: {componentId.slice(-8)}
            </span>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          ❌ {error}
        </div>
      )}

      {/* Server-Driven Info */}
      {false && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
          <div className="flex items-center justify-between">
            <span className="font-medium text-yellow-800">
              🎯 All state changes come from the server
            </span>
            <button
              onClick={() => setShowConflicts(!showConflicts)}
              className="text-yellow-600 hover:text-yellow-800 text-sm underline"
            >
              {showConflicts ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          {showConflicts && (
            <div className="mt-2 space-y-2">
              {[].map((conflict, index) => (
                <div key={index} className="bg-white p-2 rounded border text-sm">
                  <div className="font-medium">Field: {String(conflict.field)}</div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span className="text-blue-600">Client:</span> {JSON.stringify(conflict.clientValue)}
                    </div>
                    <div>
                      <span className="text-green-600">Server:</span> {JSON.stringify(conflict.serverValue)}
                    </div>
                  </div>
                  <div className="mt-1 flex gap-2">
                    <button
                      onClick={() => resolveConflict(conflict.field, 'client')}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Use Client
                    </button>
                    <button
                      onClick={() => resolveConflict(conflict.field, 'server')}
                      className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      Use Server
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Counter Display */}
      <div className="text-center mb-8">
        <div className="text-6xl font-bold text-blue-600 mb-2">
          {state.count}
        </div>
        <div className="text-sm text-gray-500">
          Step size: {state.step} | Last updated: {new Date(state.lastUpdated).toLocaleTimeString()}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleDecrement}
          disabled={loading || !connected}
          className="px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold text-xl rounded transition-colors"
        >
          - {state.step}
        </button>
        <button
          onClick={handleIncrement}
          disabled={loading || !connected}
          className="px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold text-xl rounded transition-colors"
        >
          + {state.step}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <button
          onClick={handleReset}
          disabled={loading || !connected}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded transition-colors"
        >
          🔄 Reset
        </button>
        
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors"
        >
          {showDebug ? '🙈 Hide' : '👁️ Show'} Debug
        </button>
        
        <button
          onClick={handleGetStats}
          disabled={loading || !connected}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded transition-colors"
        >
          📊 Get Stats
        </button>
        
      </div>

      {/* History */}
      {state.history && state.history.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-3">History</h3>
          <div className="flex flex-wrap gap-2">
            {state.history.slice(-10).map((value, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded"
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs text-gray-600">
          <summary className="cursor-pointer">Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
            {JSON.stringify({
              status,
              // validation removed in server-only model
              // conflicts removed in server-only model
              connected,
              componentId: componentId?.slice(-8)
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}