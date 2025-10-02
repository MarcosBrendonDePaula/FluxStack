import {
  FaBook, FaClipboardList, FaRocket, FaFileAlt, FaCog, FaLock, FaSync, FaCode, FaEye,
  FaBolt
} from 'react-icons/fa';


export function ApiDocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <FaBook className="text-3xl text-blue-500" />
          <h2 className="text-3xl font-bold text-gray-900">Documentação da API</h2>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Documentação interativa gerada automaticamente com Swagger UI
        </p>
      </div>
      
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
          <div className="text-center">
            <div className="text-4xl mb-4">
              <FaClipboardList className="text-blue-500 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Swagger UI Interativo</h3>
            <p className="text-gray-600 mb-6">Interface completa para testar todos os endpoints da API</p>
            <a 
              href="/swagger" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FaRocket className="w-4 h-4" />
              Abrir em Nova Aba
            </a>
          </div>
        </div>
        
        <div className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
          <div className="text-center">
            <div className="text-4xl mb-4">
              <FaFileAlt className="text-purple-500 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">OpenAPI Spec (JSON)</h3>
            <p className="text-gray-600 mb-6">Especificação OpenAPI em formato JSON para integração</p>
            <a 
              href="/swagger/json" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-xl hover:from-purple-700 hover:to-purple-800 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FaClipboardList className="w-4 h-4" />
              Ver JSON
            </a>
          </div>
        </div>
      </div>

      {/* Embedded Swagger */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FaCog className="text-gray-900" />
            <h3 className="text-lg font-semibold text-gray-900">Documentação Integrada</h3>
          </div>
        </div>
        <iframe 
          src="/swagger"
          className="w-full h-[600px] border-0"
          title="Swagger UI"
        />
      </div>

      {/* Eden Treaty Guide */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FaCog className="text-gray-900" />
            <h3 className="text-lg font-semibold text-gray-900">Como usar Eden Treaty</h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">Configuração do Cliente:</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm border border-gray-700">
{`import { treaty } from '@elysiajs/eden'
import type { App } from './server'

const client = treaty<App>('http://localhost:3000')
export const api = client.api`}
            </pre>
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">Exemplos de Uso:</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm border border-gray-700">
{`// Listar usuários
const users = await api.users.get()

// Criar usuário
const newUser = await api.users.post({
  name: "João Silva",
  email: "joao@example.com"
})

// Deletar usuário
await api.users["1"].delete()

// Health check
const health = await api.health.get()`}
            </pre>
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">Com tratamento de erros:</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm border border-gray-700">
{`try {
  const result = await apiCall(api.users.post({
    name: "Maria Silva",
    email: "maria@example.com"
  }))
  
  if (result.success) {
    console.log('Usuário criado:', result.user)
  }
} catch (error) {
  console.error('Erro:', getErrorMessage(error))
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-center gap-2">
            <FaBolt className="text-gray-900" />
            <h3 className="text-lg font-semibold text-gray-900">Funcionalidades</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <FaLock className="text-blue-500" />,
                title: "Type Safety",
                description: "Tipos TypeScript inferidos automaticamente"
              },
              {
                icon: <FaBolt className="text-yellow-500" />,
                title: "Auto-complete",
                description: "IntelliSense completo no editor"
              },
              {
                icon: <FaSync className="text-green-500" />,
                title: "Sincronização",
                description: "Mudanças no backend refletem automaticamente no frontend"
              },
              {
                icon: <FaCode className="text-purple-500" />,
                title: "Debugging",
                description: "Erros de tipo detectados em tempo de compilação"
              }
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                <div className="text-2xl">{feature.icon}</div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
