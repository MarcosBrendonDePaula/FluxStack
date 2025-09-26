// 🔥 Live Counter Component Example

import { useState } from 'react'
import { useLiveComponent } from '../hooks/useLiveComponent'

interface CounterState {
  count: number
  title: string
  step: number
  history: number[]
  lastUpdated: Date
}

export function LiveCounter() {
  const [customStep, setCustomStep] = useState(1)
  const [newTitle, setNewTitle] = useState('')

  const { 
    state, 
    loading, 
    error, 
    connected, 
    componentId,
    call 
  } = useLiveComponent<CounterState>('CounterComponent', {
    count: 0,
    title: 'Live Counter Demo',
    step: 1,
    history: [0],
    lastUpdated: new Date()
  }, {
    debug: true,
    autoMount: true
  })

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

  const handleSetStep = async () => {
    try {
      await call('setStep', customStep)
    } catch (err) {
      console.error('Failed to set step:', err)
    }
  }

  const handleSetTitle = async () => {
    if (newTitle.trim()) {
      try {
        await call('setTitle', newTitle.trim())
        setNewTitle('')
      } catch (err) {
        console.error('Failed to set title:', err)
      }
    }
  }

  const handleBulkUpdate = async () => {
    try {
      await call('bulkUpdate', {
        count: Math.floor(Math.random() * 100),
        title: 'Bulk Updated!',
        step: Math.floor(Math.random() * 5) + 1
      })
    } catch (err) {
      console.error('Failed to bulk update:', err)
    }
  }

  const handleGetStats = async () => {
    try {
      const stats = await call('getStats')
      console.log('Counter stats:', stats)
      alert(`Stats: Current: ${stats.stats.current}, Min: ${stats.stats.min}, Max: ${stats.stats.max}, Average: ${stats.stats.average.toFixed(2)}`)
    } catch (err) {
      console.error('Failed to get stats:', err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-2">{state.title}</h1>
        <div className="text-center">
          <span className={`inline-block px-3 py-1 rounded text-sm ${
            connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          {componentId && (
            <span className="ml-2 text-xs text-gray-500">
              ID: {componentId.slice(-8)}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          ❌ {error}
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

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleReset}
          disabled={loading || !connected}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded transition-colors"
        >
          🔄 Reset
        </button>
        <button
          onClick={handleGetStats}
          disabled={loading || !connected}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded transition-colors"
        >
          📊 Stats
        </button>
      </div>

      {/* Settings */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Settings</h3>
        
        {/* Step Size */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Step Size
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="10"
              value={customStep}
              onChange={(e) => setCustomStep(parseInt(e.target.value) || 1)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSetStep}
              disabled={loading || !connected}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded transition-colors"
            >
              Set
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New title..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSetTitle}
              disabled={loading || !connected || !newTitle.trim()}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white rounded transition-colors"
            >
              Set
            </button>
          </div>
        </div>

        {/* Bulk Update */}
        <button
          onClick={handleBulkUpdate}
          disabled={loading || !connected}
          className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded transition-colors"
        >
          🎲 Random Bulk Update
        </button>
      </div>

      {/* History */}
      {state.history && state.history.length > 0 && (
        <div className="border-t pt-6 mt-6">
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
    </div>
  )
}