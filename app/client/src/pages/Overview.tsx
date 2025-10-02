import React from 'react';
import {
  FaRocket, FaReact, FaLink, FaDocker, FaFlask, FaPalette, FaFire, FaEye,
  FaBolt
} from 'react-icons/fa';

export function OverviewPage() {
  return (
    <div className="relative">
      {/* Hero Section with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
        <div className="relative px-8 py-16 text-center">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-center gap-4 mb-6">
              <FaFire className="text-5xl text-orange-400" />
              <h1 className="text-5xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                FluxStack v1.4.0
              </h1>
              <FaBolt className="text-5xl text-yellow-400" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-8">
              <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Framework full-stack TypeScript moderno com hot reload coordenado e Tailwind CSS 4!
              </p>
              <FaRocket className="text-xl text-blue-400" />
            </div>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
                TypeScript
              </span>
              <span className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30">
                Elysia.js
              </span>
              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium border border-emerald-500/30">
                React 19
              </span>
              <span className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded-full text-sm font-medium border border-orange-500/30">
                Tailwind CSS 4
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
        {[
          {
            icon: <FaRocket className="text-blue-500" />,
            title: "Elysia.js",
            description: "Backend rápido e type-safe com Bun runtime",
            color: "from-blue-500 to-cyan-500"
          },
          {
            icon: <FaReact className="text-purple-500" />,
            title: "React + Vite",
            description: "Frontend moderno com hot-reload ultrarrápido",
            color: "from-purple-500 to-pink-500"
          },
          {
            icon: <FaLink className="text-emerald-500" />,
            title: "Eden Treaty",
            description: "API type-safe com inferência automática de tipos",
            color: "from-emerald-500 to-teal-500"
          },
          {
            icon: <FaDocker className="text-indigo-500" />,
            title: "Docker Ready",
            description: "Deploy fácil com configurações otimizadas",
            color: "from-indigo-500 to-purple-500"
          },
          {
            icon: <FaFlask className="text-orange-500" />,
            title: "Testing",
            description: "Vitest + Testing Library configurados",
            color: "from-orange-500 to-red-500"
          },
          {
            icon: <FaPalette className="text-teal-500" />,
            title: "Tailwind CSS 4",
            description: "Styling moderno e responsivo",
            color: "from-teal-500 to-green-500"
          }
        ].map((feature, index) => (
          <div
            key={index}
            className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
            <div className="relative">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tech Stack Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Stack Tecnológica</h2>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Backend",
                color: "blue",
                items: [
                  "Elysia.js - Web framework",
                  "Bun - Runtime & package manager",
                  "TypeScript - Type safety"
                ]
              },
              {
                title: "Frontend",
                color: "purple",
                items: [
                  "React 19 - UI library",
                  "Vite - Build tool",
                  "Tailwind CSS 4 - Styling"
                ]
              },
              {
                title: "Comunicação",
                color: "emerald",
                items: [
                  "Eden Treaty - Type-safe API",
                  "End-to-end TypeScript",
                  "Automatic type inference"
                ]
              }
            ].map((category, index) => (
              <div key={index} className="space-y-4">
                <h3 className={`text-lg font-semibold text-${category.color}-600 pb-2 border-b-2 border-${category.color}-100`}>
                  {category.title}
                </h3>
                <ul className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3 text-gray-600">
                      <div className={`w-2 h-2 rounded-full bg-${category.color}-400 flex-shrink-0 mt-2`}></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
