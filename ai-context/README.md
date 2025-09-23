# 🤖 AI Context - FluxStack Documentation

> **Documentação especializada para LLMs trabalharem eficientemente com FluxStack**

## 🎯 **Início Rápido**

👉 **[00-QUICK-START.md](./00-QUICK-START.md)** - Entenda tudo em 2 minutos!

## 📚 **Estrutura da Documentação**

### ⚡ **[00-QUICK-START.md](./00-QUICK-START.md)**
**Ponto de entrada ultra-rápido** - Comandos, estrutura, regras e navegação em 2 minutos

### 📊 **[project/](./project/)**
**Visão geral e arquitetura do projeto**
- [`overview.md`](./project/overview.md) - Estado atual, stack, funcionalidades
- [`architecture.md`](./project/architecture.md) - Como o framework funciona
- [`changelog.md`](./project/changelog.md) - Mudanças importantes v1.4→v1.5

### 👨‍💻 **[development/](./development/)**
**Padrões e guias de desenvolvimento**
- [`patterns.md`](./development/patterns.md) - Padrões fundamentais e boas práticas
- [`api-creation.md`](./development/api-creation.md) - Como criar APIs step-by-step
- [`frontend-patterns.md`](./development/frontend-patterns.md) - Padrões React específicos
- [`eden-treaty-guide.md`](./development/eden-treaty-guide.md) - 🔥 Guia Eden Treaty completo

### 📚 **[reference/](./reference/)**
**Referência técnica completa**
- [`api-reference.md`](./reference/api-reference.md) - APIs do framework
- [`cli-commands.md`](./reference/cli-commands.md) - Todos os comandos disponíveis
- [`environment-vars.md`](./reference/environment-vars.md) - Variáveis de ambiente
- [`troubleshooting.md`](./reference/troubleshooting.md) - Solução de problemas

### 💡 **[examples/](./examples/)**
**Exemplos práticos e código real**
- [`crud-complete.md`](./examples/crud-complete.md) - CRUD completo com Eden Treaty
- [`plugin-creation.md`](./examples/plugin-creation.md) - Como criar plugins
- [`testing-patterns.md`](./examples/testing-patterns.md) - Padrões de teste

### 🔥 **[recent-changes/](./recent-changes/)**
**Mudanças importantes e contexto recente**
- [`eden-treaty-refactor.md`](./recent-changes/eden-treaty-refactor.md) - Refatoração completa
- [`type-inference-fix.md`](./recent-changes/type-inference-fix.md) - Fix de inferência
- [`monorepo-updates.md`](./recent-changes/monorepo-updates.md) - Atualizações estruturais

## 🎯 **Cenários de Uso Comum**

| Cenário | Documentos Recomendados |
|---------|------------------------|
| **🆕 Primeira vez** | [`00-QUICK-START.md`](./00-QUICK-START.md) → [`project/overview.md`](./project/overview.md) |
| **🛠️ Criar funcionalidade** | [`development/patterns.md`](./development/patterns.md) + [`examples/crud-complete.md`](./examples/crud-complete.md) |
| **🔧 Eden Treaty** | [`development/eden-treaty-guide.md`](./development/eden-treaty-guide.md) + [`recent-changes/eden-treaty-refactor.md`](./recent-changes/eden-treaty-refactor.md) |
| **🐛 Debugar erro** | [`reference/troubleshooting.md`](./reference/troubleshooting.md) |
| **🏗️ Arquitetura** | [`project/architecture.md`](./project/architecture.md) |
| **📖 Referência** | [`reference/api-reference.md`](./reference/api-reference.md) |

## 🚨 **Regras Críticas**

### ❌ **NUNCA FAZER**
- Editar arquivos em `core/` (framework read-only)
- Usar `apiCall()` wrapper (quebra type inference)
- Criar types manuais para Eden Treaty
- Ignorar response schemas nas rotas

### ✅ **SEMPRE FAZER**
- Trabalhar em `app/` (código da aplicação)
- Usar Eden Treaty nativo: `const { data, error } = await api.users.get()`
- Manter types compartilhados em `app/shared/`
- Testar com `bun run dev`

## 📊 **Estado Atual (v1.5+)**

- **✅ Eden Treaty Nativo**: Type inference automática
- **✅ Zero Tipos Unknown**: Inferência funcionando perfeitamente
- **✅ Monorepo Estável**: Hot reload independente
- **✅ Response Schemas**: API documentada automaticamente
- **✅ Type Safety**: End-to-end sem declarações manuais

## 🆘 **Suporte Rápido**

1. **Erro específico?** → [`reference/troubleshooting.md`](./reference/troubleshooting.md)
2. **Como fazer X?** → [`development/patterns.md`](./development/patterns.md)
3. **Eden Treaty?** → [`development/eden-treaty-guide.md`](./development/eden-treaty-guide.md)
4. **Não entendo nada?** → [`00-QUICK-START.md`](./00-QUICK-START.md)

---

**🎯 Objetivo**: Capacitar LLMs a trabalhar eficientemente com FluxStack, seguindo padrões estabelecidos e garantindo código de alta qualidade.