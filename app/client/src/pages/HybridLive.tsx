import React from 'react';
import {
  FaBolt, FaRocket, FaSync, FaCheckCircle,  FaCog, FaFire,
  FaEye,
  FaBullseye,
  FaTimesCircle
} from 'react-icons/fa';
import { HybridLiveCounter } from '../components/HybridLiveCounter';
import { UserProfile } from '../components/UserProfile';

export function HybridLivePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <FaBolt className="text-3xl text-yellow-500" />
          <h2 className="text-3xl font-bold text-gray-900">Hybrid Live Components</h2>
        </div>
        <div className="flex items-center justify-center gap-2">
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Sistema híbrido combinando <strong>Zustand (cliente)</strong> + <strong>Live Components (servidor)</strong> 
            para máxima performance com fallback offline e validação de estado!
          </p>
          <FaRocket className="text-lg text-blue-500" />
        </div>
      </div>

      {/* Architecture Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-2">
            <FaBolt className="text-blue-500 mx-auto" />
          </div>
          <div className="text-sm font-medium text-blue-700 uppercase tracking-wide">Zustand</div>
          <div className="text-xs text-blue-600 mt-1">Client State</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-2">
            <FaSync className="text-purple-500 mx-auto" />
          </div>
          <div className="text-sm font-medium text-purple-700 uppercase tracking-wide">Sync</div>
          <div className="text-xs text-purple-600 mt-1">Real-time</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-2">
            <FaCheckCircle className="text-orange-500 mx-auto" />
          </div>
          <div className="text-sm font-medium text-orange-700 uppercase tracking-wide">Validation</div>
          <div className="text-xs text-orange-600 mt-1">State Integrity</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-2">
            <FaEye className="text-green-500 mx-auto" />
          </div>
          <div className="text-sm font-medium text-green-700 uppercase tracking-wide">Offline</div>
          <div className="text-xs text-green-600 mt-1">Fallback Ready</div>
        </div>
      </div>

      {/* Hybrid Counter Demo */}
      <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-2xl p-8 border-2 border-purple-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Counter */}
          <HybridLiveCounter />
          
          {/* Customized Counter */}
          <HybridLiveCounter 
            initialCount={10}
            title="Custom Counter"
            step={5}
            room="demo-room"
            userId="user-123"
          />
          <UserProfile />
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FaBullseye className="text-blue-800" />
            <h4 className="font-semibold text-blue-800">Configurable via Props:</h4>
          </div>
          <code className="text-sm text-blue-700">
            {`<HybridLiveCounter 
  initialCount={10}
  title="Custom Counter" 
  step={5}
  room="demo-room"
  userId="user-123"
/>`}
          </code>
        </div>
      </div>

      {/* Features Comparison */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-blue-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FaEye className="text-gray-900" />
            <h3 className="text-lg font-semibold text-gray-900">Live vs Hybrid Comparison</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaFire className="text-orange-500" />
                    Live Components
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FaBolt className="text-yellow-500" />
                    Hybrid Live
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">State Location</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Server Only</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">Client + Server</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Offline Support</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                  <div className="flex items-center gap-2">
                    <FaTimesCircle />
                    None
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle />
                    Full Fallback
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Performance</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                  <div className="flex items-center gap-2">
                    <FaEye />
                    Network Dependent
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                  <div className="flex items-center gap-2">
                    <FaRocket />
                    Optimistic Updates
                  </div>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Conflict Resolution</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                  <div className="flex items-center gap-2">
                    <FaCog />
                    Manual
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                  <div className="flex items-center gap-2">
                    <FaSync />
                    Auto + Manual
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">State Validation</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                  <div className="flex items-center gap-2">
                    <FaCog />
                    Basic
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle />
                    Checksum + Version
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Architecture Explanation */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-purple-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FaCog className="text-gray-900" />
            <h3 className="text-lg font-semibold text-gray-900">Hybrid Architecture</h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FaCog className="text-gray-900" />
                <h4 className="text-base font-semibold text-gray-900">Frontend (useHybridLiveComponent):</h4>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
{`const { 
  state, status, conflicts,
  call, sync, resolveConflict 
} = useHybridLiveComponent('Counter', {
  count: 0,
  title: 'Hybrid Counter'
}, {
  enableValidation: true,
  conflictResolution: 'auto',
  syncStrategy: 'optimistic'
})`}
              </pre>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FaCog className="text-gray-900" />
                <h4 className="text-base font-semibold text-gray-900">Features:</h4>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  <strong>Estado inicial do frontend</strong> (component props)
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  <strong>Zustand store local</strong> (performance + cache)
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  <strong>Live Components sync</strong> (servidor autoritativo)
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  <strong>Conflict detection</strong> (checksum + versioning)
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  <strong>Auto reconnection</strong> (state sync on reconnect)
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  <strong>Optimistic updates</strong> (immediate UI feedback)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
