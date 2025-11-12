import { useState, useEffect, createContext, useContext } from 'react'
import { api } from './lib/eden-api'
import { FaFire, FaGithub, FaBook, FaRocket, FaClock } from 'react-icons/fa'
import { LiveComponentsProvider, useHybridLiveComponent } from '@/core/client'

interface LiveClockState {
  currentTime: string
  timeZone: string
  format: '12h' | '24h'
  showSeconds: boolean
  showDate: boolean
  lastSync: Date
  serverUptime: number
}

const initialClockState: LiveClockState = {
  currentTime: "--:--:--",
  timeZone: "America/Sao_Paulo",
  format: "24h",
  showSeconds: true,
  showDate: false,
  lastSync: new Date(),
  serverUptime: 0,
}

// Debug Context
const DebugContext = createContext<{
  debugMode: boolean
  addLog: (type: string, message: string) => void
}>({
  debugMode: false,
  addLog: () => {}
})

function LiveClockCompact() {
  const { debugMode, addLog } = useContext(DebugContext)
  const { state, connected, status } = useHybridLiveComponent<LiveClockState>('LiveClock', initialClockState, {
    debug: false
  })

  useEffect(() => {
    if (debugMode && connected) {
      addLog('clock', `Status: ${status}`)
    }
  }, [connected, status, debugMode])

  useEffect(() => {
    if (debugMode && state.currentTime !== "--:--:--") {
      addLog('clock', `Time updated: ${state.currentTime}`)
    }
  }, [state.currentTime, debugMode])

  if (!connected || status !== 'synced') {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
        <div className="flex items-center gap-3 mb-3">
          <FaClock className="text-2xl text-blue-400 animate-pulse" />
          <div>
            <h3 className="text-lg font-semibold text-white">Relógio em Tempo Real</h3>
            <p className="text-gray-400 text-sm">Conectando ao servidor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <FaClock className="text-2xl text-emerald-400" />
        <div>
          <h3 className="text-lg font-semibold text-white">Relógio em Tempo Real</h3>
          <p className="text-gray-400 text-sm">Sincronizado com o servidor</p>
        </div>
      </div>
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-400/20">
        <div className="text-4xl font-mono font-bold text-white text-center tracking-wider">
          {state.currentTime}
        </div>
        <div className="text-center mt-2">
          <span className="text-xs text-gray-400">{state.timeZone}</span>
        </div>
      </div>
    </div>
  )
}

function AppContent() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [debugMode, setDebugMode] = useState(() => {
    return localStorage.getItem('fluxstack-debug') === 'true'
  })
  const [logs, setLogs] = useState<Array<{ time: string; type: string; message: string }>>([])

  useEffect(() => {
    checkApiStatus()

    // Verificar tecla de atalho para ativar debug (Ctrl + Shift + D)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        toggleDebugMode()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  useEffect(() => {
    if (debugMode) {
      addLog('system', 'Debug mode enabled')
    }
  }, [debugMode])

  const checkApiStatus = async () => {
    try {
      const { error } = await api.health.get()
      const status = error ? 'offline' : 'online'
      setApiStatus(status)
      if (debugMode) {
        addLog('api', `Health check: ${status}`)
      }
    } catch {
      setApiStatus('offline')
      if (debugMode) {
        addLog('error', 'Health check failed')
      }
    }
  }

  const toggleDebugMode = () => {
    const newMode = !debugMode
    setDebugMode(newMode)
    localStorage.setItem('fluxstack-debug', String(newMode))
    if (newMode) {
      addLog('system', 'Debug mode enabled')
    } else {
      setLogs([])
    }
  }

  const addLog = (type: string, message: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => [...prev.slice(-9), { time, type, message }])
  }

  return (
    <DebugContext.Provider value={{ debugMode, addLog }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          {/* Logo animado */}
          <div className="mb-8 animate-pulse-slow">
            <FaFire className="text-8xl text-orange-500 drop-shadow-2xl" />
          </div>

        {/* Título */}
        <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          FluxStack
        </h1>

        {/* Subtítulo */}
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl">
          Full-stack TypeScript framework with{' '}
          <span className="text-purple-400 font-semibold">Bun</span>,{' '}
          <span className="text-blue-400 font-semibold">Elysia</span>, and{' '}
          <span className="text-cyan-400 font-semibold">React</span>
        </p>

        {/* Status badge */}
        <div className="mb-12">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            apiStatus === 'online'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : apiStatus === 'offline'
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 animate-pulse'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === 'online' ? 'bg-emerald-400' : apiStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'
            }`}></div>
            <span>
              {apiStatus === 'checking' && 'Verificando API...'}
              {apiStatus === 'online' && 'API Online'}
              {apiStatus === 'offline' && 'API Offline'}
            </span>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-6xl">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-2">Ultra Rápido</h3>
            <p className="text-gray-400 text-sm">Bun runtime 3x mais rápido que Node.js</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-white mb-2">Type Safe</h3>
            <p className="text-gray-400 text-sm">Eden Treaty com inferência automática</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold text-white mb-2">Moderno</h3>
            <p className="text-gray-400 text-sm">React 19 + Vite + Tailwind CSS</p>
          </div>

          {/* Live Clock Card */}
          <LiveClockCompact />
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="http://localhost:3000/swagger"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            <FaBook />
            API Docs
          </a>

          <a
            href="https://github.com/MarcosBrendonDePaula/FluxStack"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-all"
          >
            <FaGithub />
            GitHub
          </a>

          <a
            href="http://localhost:3000/api/users"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-all"
          >
            <FaRocket />
            API Demo
          </a>
        </div>

        {/* Footer */}
        <div className="mt-16 text-gray-500 text-sm">
          <p>Desenvolvido com ❤️ usando TypeScript</p>
          <p className="text-xs mt-2 opacity-50">Press Ctrl+Shift+D for debug mode</p>
        </div>
      </div>

      {/* Debug Toggle Button */}
      <button
        onClick={toggleDebugMode}
        className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full shadow-lg transition-all duration-300 ${
          debugMode
            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
            : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20'
        }`}
        title="Toggle debug mode (Ctrl+Shift+D)"
      >
        <span className="flex items-center gap-2">
          {debugMode ? '🐛 Debug ON' : '🔍 Debug OFF'}
        </span>
      </button>

      {/* Debug Panel */}
      {debugMode && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-h-80 bg-black/90 backdrop-blur-sm border border-emerald-500/30 rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between">
            <span className="text-emerald-300 font-semibold flex items-center gap-2">
              <span className="animate-pulse">🐛</span>
              Debug Console
            </span>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-emerald-300 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="p-3 space-y-1 overflow-y-auto max-h-60 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No logs yet...</div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${
                    log.type === 'error'
                      ? 'text-red-400'
                      : log.type === 'system'
                      ? 'text-emerald-400'
                      : log.type === 'api'
                      ? 'text-blue-400'
                      : log.type === 'clock'
                      ? 'text-purple-400'
                      : 'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500">[{log.time}]</span>
                  <span className="font-semibold uppercase text-xs">{log.type}:</span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Estilo para animação */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      </div>
    </DebugContext.Provider>
  )
}

// Main App component - Wrapped with LiveComponentsProvider for WebSocket connection
function App() {
  return (
    <LiveComponentsProvider
      autoConnect={true}
      reconnectInterval={1000}
      maxReconnectAttempts={5}
      heartbeatInterval={30000}
      debug={false}
    >
      <AppContent />
    </LiveComponentsProvider>
  )
}

export default App