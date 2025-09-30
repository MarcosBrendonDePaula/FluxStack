// 🔥 LiveClock - Real-time Clock Client Component
import React, { useState } from 'react';
import { useHybridLiveComponent } from 'fluxstack';
import { 
  FaClock, 
  FaCog, 
  FaSync, 
  FaServer, 
  FaCalendarAlt,
  FaStopwatch,
  FaGlobe,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

interface LiveClockState {
  currentTime: string;
  timeZone: string;
  format: '12h' | '24h';
  showSeconds: boolean;
  showDate: boolean;
  lastSync: Date;
  serverUptime: number;
}

const initialState: LiveClockState = {
  currentTime: "Loading...",
  timeZone: "America/Sao_Paulo",
  format: "24h",
  showSeconds: true,
  showDate: true,
  lastSync: new Date(),
  serverUptime: 0,
};

export function LiveClock() {
  const { state, call, connected, loading, status } = useHybridLiveComponent<LiveClockState>('LiveClock', initialState, {
    debug: true
  });
  
  const [showSettings, setShowSettings] = useState(false);

  if (!connected || status !== 'synced') {
    const getStatusMessage = () => {
      switch (status) {
        case 'connecting':
          return '🔄 Conectando ao relógio do servidor...';
        case 'reconnecting':
          return '🔄 Reconectando relógio...';
        case 'mounting':
          return '🚀 Sincronizando horário...';
        case 'loading':
          return '⏳ Carregando relógio...';
        case 'error':
          return '❌ Erro na sincronização';
        default:
          return '🔄 Preparando relógio...';
      }
    };

    return (
      <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <FaClock size={48} className="mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-gray-700 font-medium">{getStatusMessage()}</p>
        </div>
      </div>
    );
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleFormatToggle = async () => {
    const newFormat = state.format === '24h' ? '12h' : '24h';
    try {
      await call('setTimeFormat', { format: newFormat });
    } catch (error) {
      console.error('Error changing format:', error);
    }
  };

  const handleToggleSeconds = async () => {
    try {
      await call('toggleSeconds');
    } catch (error) {
      console.error('Error toggling seconds:', error);
    }
  };

  const handleToggleDate = async () => {
    try {
      await call('toggleDate');
    } catch (error) {
      console.error('Error toggling date:', error);
    }
  };

  const handleSyncTime = async () => {
    try {
      await call('syncTime');
    } catch (error) {
      console.error('Error syncing time:', error);
    }
  };

  const handleGetServerInfo = async () => {
    try {
      const result = await call('getServerInfo');
      console.log('Server info:', result);
      
      if (result && result.info) {
        alert(`Server Info:\nTime: ${result.info.localTime}\nUptime: ${result.info.uptimeFormatted}\nTimezone: ${result.info.timezone}`);
      } else {
        console.error('Invalid server info response:', result);
        alert('Erro: Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Error getting server info:', error);
      alert(`Erro ao obter info do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-gray-200 rounded-xl shadow-lg p-6 m-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full opacity-20 -translate-y-16 translate-x-16"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <FaClock size={28} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Live Clock</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
            connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {connected ? '🟢 Sincronizado' : '🔴 Desconectado'}
          </span>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <FaCog className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Clock Display */}
      <div className="text-center mb-6 relative z-10">
        <div className="bg-white rounded-2xl p-8 shadow-inner border-2 border-gray-100">
          <div className="text-6xl font-mono font-bold text-gray-800 mb-2 tracking-wider">
            {state.currentTime}
          </div>
          
          {state.showDate && (
            <div className="text-lg text-gray-600 mb-2 flex items-center justify-center gap-2">
              <FaCalendarAlt className="text-blue-500" />
              {getCurrentDate()}
            </div>
          )}
          
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <FaGlobe />
              <span>{state.timeZone}</span>
            </div>
            <div className="flex items-center gap-1">
              <FaStopwatch />
              <span>Uptime: {formatUptime(state.serverUptime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-xl p-4 mb-4 border shadow-sm relative z-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FaCog />
            Configurações
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={handleFormatToggle}
              disabled={loading}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1"
            >
              <FaClock />
              {state.format === '24h' ? '12h' : '24h'}
            </button>
            
            <button
              onClick={handleToggleSeconds}
              disabled={loading}
              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1"
            >
              {state.showSeconds ? <FaEyeSlash /> : <FaEye />}
              Segundos
            </button>
            
            <button
              onClick={handleToggleDate}
              disabled={loading}
              className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1"
            >
              <FaCalendarAlt />
              Data
            </button>
            
            <button
              onClick={handleSyncTime}
              disabled={loading}
              className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1"
            >
              <FaSync />
              Sync
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap relative z-10">
        <button
          onClick={handleGetServerInfo}
          disabled={loading}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
        >
          <FaServer />
          Info do Servidor
        </button>
        
        <button
          onClick={handleSyncTime}
          disabled={loading}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
        >
          <FaSync />
          Sincronizar Agora
        </button>
      </div>
      
      {/* Status Footer */}
      <div className="mt-4 text-xs text-gray-500 text-center relative z-10">
        Última sincronização: {new Date(state.lastSync).toLocaleTimeString()} • 
        Formato: {state.format} • 
        Servidor rodando há {formatUptime(state.serverUptime)}
      </div>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl z-20">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-700 font-medium">Sincronizando...</span>
          </div>
        </div>
      )}
    </div>
  );
}