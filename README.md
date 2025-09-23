# ⚡ FluxStack

<div align="center">

> **O Framework Full-Stack TypeScript que Você Estava Esperando**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Runtime-Bun%201.2.20-000000?style=flat-square&logo=bun)](https://bun.sh/)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Elysia](https://img.shields.io/badge/Elysia-1.4.6-8B5CF6?style=flat-square)](https://elysiajs.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

**🔥 Type Safety Automática • ⚡ Zero Configuração • 🚀 Performance Extrema • 🎯 Developer Experience**

[🚀 **Começar Agora**](#-quick-start) • [📖 **Docs**](./ai-context/) • [💡 **Exemplos**](#-exemplos) • [🎯 **Por Que Escolher?**](#-por-que-fluxstack)

---

![FluxStack Demo](https://img.shields.io/badge/🎬-Ver%20Demo%20ao%20Vivo-ff6b6b?style=for-the-badge)

</div>

## 🎯 **Por Que FluxStack?**

### **🔥 O Problema Real**

Quantas vezes você já perdeu horas configurando:
- ❌ Múltiplos `package.json` (frontend + backend)
- ❌ APIs sem type safety entre camadas  
- ❌ Hot reload que quebra quando você mais precisa
- ❌ Documentação desatualizada da API
- ❌ Builds complexos e lentos
- ❌ Erros TypeScript constantes

### **✅ A Solução FluxStack**

```typescript
// ✨ Type safety AUTOMÁTICA client ↔ server
const { data, error } = await api.users.post({
  name: "João",           // ✅ Autocomplete
  email: "joao@teste.com" // ✅ Validação em tempo real
})

if (!error) {
  console.log(data.user.id)   // ✅ Types inferidos automaticamente
  console.log(data.success)   // ✅ Zero configuração manual
}
```

## 🚀 **Quick Start** (< 2 minutos)

```bash
# 1. Clone
git clone https://github.com/MarcosBrendonDePaula/FluxStack.git
cd FluxStack

# 2. Uma instalação para TUDO ✨
bun install

# 3. Start & Magic ✨
bun run dev
```

**🎉 Pronto!** Abra http://localhost:5173 e veja a mágica acontecer.

## ⚡ **Stack Tecnológica**

<div align="center">

| Camada | Tecnologia | Versão | Por Que? |
|--------|------------|---------|----------|
| **Runtime** | Bun | 1.2.20 | 🚀 **3x mais rápido** que Node.js |
| **Backend** | Elysia.js | 1.4.6 | ⚡ **Ultra-performático**, validação automática |
| **Frontend** | React | 19.1.0 | ⚛️ **Concurrent Features**, hooks modernos |
| **Build** | Vite | 7.0.4 | 🔥 **HMR instantâneo**, build otimizado |
| **Language** | TypeScript | 5.9.2 | 🛡️ **100% type-safe** end-to-end |
| **API Client** | Eden Treaty | Native | 🎯 **Inferência automática** de tipos |

</div>

## 🎬 **Demonstração ao Vivo**

<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

### **🔧 Backend API (Elysia.js)**
```typescript
// app/server/routes/users.routes.ts
export const usersRoutes = new Elysia({ prefix: "/users" })
  .get("/", () => ({ users: getAllUsers() }))
  .post("/", ({ body }) => createUser(body), {
    body: t.Object({
      name: t.String(),
      email: t.String({ format: "email" })
    }),
    response: t.Object({
      success: t.Boolean(),
      user: t.Optional(t.Object({
        id: t.Number(),
        name: t.String(),
        email: t.String(),
        createdAt: t.Date()
      }))
    })
  })
```

### **⚛️ Frontend com Type Safety (Zero config)**
```typescript
// app/client/src/hooks/useUsers.ts
export function useUsers() {
  const [users, setUsers] = useState<User[]>([])

  const createUser = async (userData) => {
    // ✨ Eden Treaty nativo - Type safety automático
    const { data, error } = await api.users.post(userData)
    
    if (!error) {
      setUsers(prev => [...prev, data.user]) // ✨ Types inferidos automaticamente!
    }
  }

  return { users, createUser }
}
```

</div>

## 💡 **Exemplos Práticos**

<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

### **🌐 Testando a API (cURL)**
```bash
# Health check
curl http://localhost:3000/api/health

# Listar usuários
curl http://localhost:3000/api/users

# Criar usuário
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@teste.com"}'

# Swagger automático
open http://localhost:3000/swagger
```

### **⚛️ Component React**
```tsx
function UserList() {
  const { users, createUser, loading } = useUsers()

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />  {/* ✨ Types! */}
      ))}
      <UserForm onSubmit={createUser} />
    </div>
  )
}
```

</div>

## 🔧 **Comandos Principais**

```bash
# Desenvolvimento
bun run dev              # 🚀 Full-stack (Backend + Frontend)
bun run dev:clean        # 🧹 Output limpo (sem logs HEAD)
bun run dev:backend      # 🎯 Backend apenas (porta 3001)
bun run dev:frontend     # ⚛️ Frontend apenas (porta 5173)

# Build & Deploy
bun run build           # 📦 Build otimizado para produção
bun run start           # 🚀 Servidor de produção
docker-compose up       # 🐳 Docker completo

# Quality & Testing
bun run test            # 🧪 Suite de testes
bun run test:ui         # 👁️ Interface visual dos testes
bunx tsc --noEmit       # 🔍 Verificação TypeScript
```

## 🏆 **Diferenciais Únicos**

### **🎯 Type Safety Automática**
- **Zero config manual**: Eden Treaty infere tipos automaticamente
- **Sincronização em tempo real**: Mudança no server = tipos atualizados no client
- **Autocomplete perfeito**: IntelliSense funcionando 100%

### **⚡ Performance Extrema**
- **Bun runtime**: 3x mais rápido que Node.js
- **Hot reload independente**: Backend ≠ Frontend (zero conflitos)
- **Build otimizado**: Vite + esbuild = velocidade máxima

### **🔧 Developer Experience**
- **Uma instalação**: `bun install` para todo o projeto
- **Monorepo inteligente**: Compartilhamento natural de código
- **Documentação viva**: Swagger UI sempre atualizado

### **🚀 Production Ready**
- **Docker otimizado**: Multi-stage builds
- **Environment variables**: Sistema robusto com precedência
- **Error handling**: Tratamento consistente e elegante

## 📁 **Estrutura do Projeto**

```
FluxStack/
├── 🔒 core/                 # Framework (não editar)
│   ├── server/             # Elysia + plugins
│   ├── config/             # Configurações
│   └── build/              # Sistema de build
├── 👨‍💻 app/                  # SEU CÓDIGO
│   ├── server/             # Backend (controllers, routes)
│   ├── client/             # Frontend (React + Vite)
│   └── shared/             # Types compartilhados
├── 📖 ai-context/           # Documentação AI
└── 🐳 docker/              # Configurações Docker
```

## 🚀 **Deploy em Produção**

### **Docker (Recomendado)**
```bash
# Build e deploy
docker-compose up -d

# Ou build customizado
docker build -t fluxstack .
docker run -p 3000:3000 fluxstack
```

### **Cloud Providers**
```bash
# Vercel, Netlify, Railway, etc.
bun run build
# Deploy da pasta dist/
```

## 🤝 **Contribuindo**

```bash
# Fork o repositório
git clone https://github.com/SEU-USER/FluxStack.git

# Crie uma branch
git checkout -b minha-feature

# Implemente e teste
bun run dev
bun run test

# Commit e PR
git commit -m "feat: minha feature incrível"
git push origin minha-feature
```

## 📊 **Roadmap**

- [x] ✅ Eden Treaty nativo com type inference
- [x] ✅ Hot reload independente
- [x] ✅ Monorepo unificado
- [x] ✅ Docker otimizado
- [ ] 🔄 Database layer (Prisma/Drizzle)
- [ ] 🔄 Authentication built-in
- [ ] 🔄 Real-time (WebSockets)
- [ ] 🔄 CLI generator

## 📚 **Documentação Completa**

- **[🚀 Quick Start AI](./ai-context/00-QUICK-START.md)** - 2 minutos para dominar
- **[👨‍💻 Development Patterns](./ai-context/development/patterns.md)** - Melhores práticas
- **[🔧 Eden Treaty Guide](./ai-context/development/eden-treaty-guide.md)** - Type safety automática
- **[💡 CRUD Example](./ai-context/examples/crud-complete.md)** - Exemplo completo
- **[🚨 Troubleshooting](./ai-context/reference/troubleshooting.md)** - Resolução de problemas

## 🆘 **Suporte**

- **🐛 Issues**: [GitHub Issues](https://github.com/MarcosBrendonDePaula/FluxStack/issues)
- **💬 Discussões**: [GitHub Discussions](https://github.com/MarcosBrendonDePaula/FluxStack/discussions)
- **📧 Email**: marcos.brendon@exemplo.com

## 📄 **Licença**

MIT © [Marcos Brendon de Paula](https://github.com/MarcosBrendonDePaula)

---

<div align="center">

**⭐ Se FluxStack te salvou horas de configuração, deixe uma estrela!**

[![GitHub stars](https://img.shields.io/github/stars/MarcosBrendonDePaula/FluxStack?style=social)](https://github.com/MarcosBrendonDePaula/FluxStack/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/MarcosBrendonDePaula/FluxStack?style=social)](https://github.com/MarcosBrendonDePaula/FluxStack/network/members)

**🚀 Desenvolvido com ❤️ para a comunidade dev brasileira**

</div>