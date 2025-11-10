/**
 * FluxStack Electron Controls Component
 * Example component showing how to use Electron IPC in React
 */

import { useState, useEffect } from 'react'

interface ElectronInfo {
  isElectron: boolean
  versions?: {
    node: string
    chrome: string
    electron: string
  }
  platform?: string
  appVersion?: string
}

export function ElectronControls() {
  const [info, setInfo] = useState<ElectronInfo>({
    isElectron: false
  })
  const [windowState, setWindowState] = useState({
    isMaximized: false,
    isMinimized: false,
    isFullScreen: false
  })

  useEffect(() => {
    // Check if running in Electron
    if (window.electron) {
      setInfo({
        isElectron: true,
        versions: window.electron.versions,
        platform: window.electron.platform
      })

      // Get app version
      window.electron.invoke('app:version').then(version => {
        setInfo(prev => ({ ...prev, appVersion: version }))
      })

      // Get initial window state
      updateWindowState()

      // Listen for updates (example)
      window.electron.on('app:update', (updateInfo: any) => {
        console.log('Update available:', updateInfo)
      })
    }
  }, [])

  const updateWindowState = async () => {
    if (window.electron) {
      const state = await window.electron.invoke('window:state')
      setWindowState(state)
    }
  }

  const handleMinimize = () => {
    window.electron?.send('window:minimize')
  }

  const handleMaximize = () => {
    window.electron?.send('window:maximize')
    setTimeout(updateWindowState, 100)
  }

  const handleClose = () => {
    window.electron?.send('window:close')
  }

  // If not running in Electron, show web version
  if (!info.isElectron) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          🌐 Running in Browser
        </h3>
        <p className="text-sm text-blue-700">
          To run as a desktop app, use: <code className="bg-blue-100 px-2 py-1 rounded">bun run cli dev:electron</code>
        </p>
      </div>
    )
  }

  // Running in Electron - show controls
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-3">
        🖥️ Desktop App Controls
      </h3>

      {/* Window Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleMinimize}
          className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
          title="Minimize Window"
        >
          🗕 Minimize
        </button>
        <button
          onClick={handleMaximize}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          title={windowState.isMaximized ? "Restore Window" : "Maximize Window"}
        >
          {windowState.isMaximized ? '🗗 Restore' : '🗖 Maximize'}
        </button>
        <button
          onClick={handleClose}
          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          title="Close Window"
        >
          🗙 Close
        </button>
      </div>

      {/* App Info */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">App Version:</span>
          <span className="font-mono text-gray-900">{info.appVersion || 'Loading...'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Platform:</span>
          <span className="font-mono text-gray-900">{info.platform}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Electron:</span>
          <span className="font-mono text-gray-900">{info.versions?.electron}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Chrome:</span>
          <span className="font-mono text-gray-900">{info.versions?.chrome}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Node:</span>
          <span className="font-mono text-gray-900">{info.versions?.node}</span>
        </div>
      </div>

      {/* Window State */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div>Maximized: {windowState.isMaximized ? '✅' : '❌'}</div>
          <div>Minimized: {windowState.isMinimized ? '✅' : '❌'}</div>
          <div>Full Screen: {windowState.isFullScreen ? '✅' : '❌'}</div>
        </div>
      </div>
    </div>
  )
}
