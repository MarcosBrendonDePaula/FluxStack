# ⚡ FluxStack - Quick Start para LLMs

> **🎯 Objetivo**: Entender e usar FluxStack em < 2 minutos

## 🚀 **Comandos Essenciais** (30 segundos)

```bash
# Desenvolvimento (escolha UM)
bun run dev              # ✅ Full-stack (recomendado)
bun run dev:clean        # ✅ Output limpo (sem logs HEAD do Elysia)

# Build e Deploy
bun run build           # Build completo
bun run start           # Produção

# URLs Importantes
http://localhost:3000   # Backend API
http://localhost:5173   # Frontend React
http://localhost:3000/swagger  # Documentação API
```

## 📁 **Estrutura Crítica** (30 segundos)

```
FluxStack/
├── core/                    # 🔒 FRAMEWORK - NUNCA EDITAR!
├── app/                     # 👨‍💻 SEU CÓDIGO AQUI
│   ├── server/              # Backend (controllers, routes)
│   ├── client/              # Frontend (components, pages)
│   └── shared/              # Types compartilhados
└── ai-context/              # 📖 Esta documentação
```

## ⚡ **Regras de Ouro** (30 segundos)

### ❌ NUNCA FAZER:
- Editar `core/` (framework read-only)
- Usar `apiCall()` wrapper (quebra type inference)
- Criar types manuais para Eden Treaty

### ✅ SEMPRE FAZER:
- Trabalhar em `app/`
- Usar Eden Treaty nativo: `const { data, error } = await api.users.get()`
- Manter types em `app/shared/`

## 🎯 **Navegação Rápida** (30 segundos)

### Cenário 1: "Criar nova funcionalidade"
→ [`development/patterns.md`](./development/patterns.md) + [`examples/crud-complete.md`](./examples/crud-complete.md)

### Cenário 2: "Entender Eden Treaty"
→ [`development/eden-treaty-guide.md`](./development/eden-treaty-guide.md) + [`recent-changes/eden-treaty-refactor.md`](./recent-changes/eden-treaty-refactor.md)

### Cenário 3: "Corrigir erro"
→ [`reference/troubleshooting.md`](./reference/troubleshooting.md)

### Cenário 4: "Entender arquitetura"
→ [`project/overview.md`](./project/overview.md) + [`project/architecture.md`](./project/architecture.md)

### Cenário 5: "Ver mudanças recentes"
→ [`recent-changes/`](./recent-changes/) (Eden Treaty, tipos, monorepo)

## 🔥 **Estado Atual** (15 segundos)

- **✅ Eden Treaty NATIVO**: Type inference automática funcionando
- **✅ Monorepo estável**: Uma instalação, hot reload independente
- **✅ Zero erros TypeScript**: Sistema 100% type-safe
- **✅ Response schemas**: API com documentação automática

## 📚 **Documentação Completa**

```
ai-context/
├── 00-QUICK-START.md      # ⚡ Você está aqui
├── project/               # 📊 Visão geral e arquitetura
├── development/           # 👨‍💻 Padrões e guias
├── reference/             # 📚 Referência técnica
├── examples/              # 💡 Código prático
└── recent-changes/        # 🔥 Mudanças importantes
```

---

**🎯 Em 2 minutos você já sabe**: comandos, estrutura, regras e onde encontrar cada informação!

**🚀 Próximo passo**: Escolha um dos cenários acima e vá direto ao arquivo relevante!