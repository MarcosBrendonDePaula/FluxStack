import { useState, useEffect } from 'react'
import { api } from './lib/eden-api'
import { FaRocket, FaCheckCircle, FaBolt, FaShieldAlt, FaGithub, FaBook } from 'react-icons/fa'

interface HealthResponse {
  status: string
  timestamp: string
  message?: string
}

function App() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [healthData, setHealthData] = useState<HealthResponse | null>(null)

  useEffect(() => {
    checkApiStatus()
  }, [])

  const checkApiStatus = async () => {
    try {
      const { data, error } = await api.health.get()

      if (error) {
        setApiStatus('offline')
        return
      }

      setHealthData(data as HealthResponse)
      setApiStatus('online')
    } catch {
      setApiStatus('offline')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          {/* Logo + Version */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-6xl">⚡</div>
            <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              FluxStack
            </h1>
          </div>

          <p className="text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Revolutionary Full-Stack TypeScript Framework
          </p>

          <p className="text-lg text-gray-400 mb-12">
            Elysia + React + Bun with Type-Safe Eden Treaty
          </p>

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com/MarcosBrendonDePaula/FluxStack"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-2"
            >
              <FaGithub /> View on GitHub
            </a>
            <a
              href="http://localhost:3000/swagger"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-white/10 text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
            >
              <FaBook /> API Docs
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-300">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-2">Ultra Fast</h3>
            <p className="text-gray-400">Powered by Bun runtime - 3x faster than Node.js</p>
          </div>

          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-blue-500/50 transition-all duration-300">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-2">Type Safe</h3>
            <p className="text-gray-400">End-to-end type inference with Eden Treaty</p>
          </div>

          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-pink-500/50 transition-all duration-300">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2">Modern Stack</h3>
            <p className="text-gray-400">React 19 + Vite 7 + TypeScript 5.9</p>
          </div>
        </div>

        {/* Live Demo Card */}
        <div className="p-8 bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <FaBolt className="text-yellow-400" />
              Live API Status
            </h2>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              apiStatus === 'online'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : apiStatus === 'offline'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                apiStatus === 'online' ? 'bg-emerald-400' : apiStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'
              }`}></div>
              {apiStatus === 'checking' ? 'Checking...' : apiStatus === 'online' ? 'Online' : 'Offline'}
            </div>
          </div>

          {healthData && (
            <div className="bg-black/20 rounded-xl p-6 border border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Status Response</div>
                  <div className="flex items-center gap-2 mb-4">
                    <FaCheckCircle className="text-emerald-400" />
                    <span className="text-xl font-mono text-white">{healthData.status}</span>
                  </div>
                </div>
                <button
                  onClick={checkApiStatus}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  Refresh
                </button>
              </div>

              <div className="text-sm text-gray-400 mb-1">Timestamp</div>
              <div className="font-mono text-gray-300 mb-4">
                {new Date(healthData.timestamp).toLocaleString()}
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="text-xs text-gray-500 mb-2">Eden Treaty Example:</div>
                <pre className="text-xs text-purple-300 bg-black/30 p-3 rounded overflow-x-auto">
                  {`const { data, error } = await api.health.get()
// TypeScript knows: data is HealthResponse ✅`}
                </pre>
              </div>
            </div>
          )}

          {apiStatus === 'offline' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">⚠️</div>
                <h3 className="text-xl font-bold text-red-400">API Offline</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Backend server is not running. Start it with:
              </p>
              <pre className="bg-black/30 px-4 py-2 rounded text-sm text-purple-300 font-mono">
                bun run dev
              </pre>
            </div>
          )}
        </div>

        {/* Tech Stack */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-8">Powered By</h3>
          <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <FaRocket className="text-xl" />
              <span>Elysia 1.4.6</span>
            </div>
            <div className="flex items-center gap-2">
              <FaBolt className="text-xl text-yellow-400" />
              <span>React 19</span>
            </div>
            <div className="flex items-center gap-2">
              <FaShieldAlt className="text-xl text-blue-400" />
              <span>TypeScript 5.9</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🧅</span>
              <span>Bun 1.2.20</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
          <p>FluxStack v1.8.2 - MIT License</p>
          <p className="mt-2">Built with ❤️ by FluxStack Team</p>
        </div>
      </div>

      {/* Blob Animation Styles */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default App
