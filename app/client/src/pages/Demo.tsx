import React from 'react';
import {
  FaFire, FaRocket, FaCheckCircle, FaTimesCircle, FaSpinner, FaSync, FaUsers, FaPlus, FaTrash
} from 'react-icons/fa';

// This component will receive a lot of props from App.tsx initially.
// A good next step would be to move this state to a shared context.
export function DemoPage({ 
  users, 
  apiStatus, 
  loading, 
  submitting, 
  name, 
  email, 
  setName, 
  setEmail, 
  handleSubmit, 
  handleDelete, 
  loadUsers, 
  getInitials 
}) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <FaFire className="text-3xl text-orange-500" />
          <h2 className="text-3xl font-bold text-gray-900">Demo Interativo</h2>
        </div>
        <div className="flex items-center justify-center gap-2">
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Teste a API em tempo real com hot reload coordenado e Eden Treaty
          </p>
          <FaRocket className="text-lg text-blue-500" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">{users.length}</div>
          <div className="text-sm font-medium text-blue-700 uppercase tracking-wide">Usuários</div>
        </div>
        <div className={`bg-gradient-to-br ${apiStatus === 'online' ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'} border rounded-2xl p-6 text-center`}>
          <div className="text-4xl mb-2">
            {apiStatus === 'online' ? (
              <FaCheckCircle className="text-emerald-500 mx-auto" />
            ) : (
              <FaTimesCircle className="text-red-500 mx-auto" />
            )}
          </div>
          <div className={`text-sm font-medium uppercase tracking-wide ${apiStatus === 'online' ? 'text-emerald-700' : 'text-red-700'}`}>
            API {apiStatus === 'online' ? 'Online' : 'Offline'}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">
            <FaRocket className="text-purple-500 mx-auto" />
          </div>
          <div className="text-sm font-medium text-purple-700 uppercase tracking-wide">Eden Treaty</div>
        </div>
      </div>

      {/* Add User Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Adicionar Usuário</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div className="md:col-span-2">
              <button 
                type="submit" 
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={submitting || !name.trim() || !email.trim()}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    Adicionando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FaPlus className="w-4 h-4" />
                    Adicionar Usuário
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Usuários ({users.length})</h3>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200"
            onClick={loadUsers}
            disabled={loading}
          >
            {loading ? (
              <FaSpinner className="w-4 h-4 animate-spin" />
            ) : (
              <FaSync className="w-4 h-4" />
            )}
            Atualizar
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <FaSpinner className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Carregando usuários...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <FaUsers className="text-6xl text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h4>
              <p className="text-gray-600">Adicione o primeiro usuário usando o formulário acima</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => (
                <div key={user.id} className="group bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{user.name}</h4>
                      <p className="text-sm text-gray-600 truncate">{user.email}</p>
                      <button 
                        className="mt-3 w-full px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2"
                        onClick={() => handleDelete(user.id, user.name)}
                      >
                        <FaTrash className="w-3 h-3" />
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
