# Context AI - FluxStack

Esta pasta contém documentação especializada para IAs trabalharem eficientemente com o FluxStack framework.

## 📋 Arquivos Disponíveis

### 📖 `project-overview.md`
**Visão geral completa do projeto**
- O que é o FluxStack
- Estrutura de diretórios
- Comandos principais
- Modos de operação
- Path aliases
- Tecnologias utilizadas

**Use quando:** Primeira vez trabalhando com o projeto ou precisar de contexto geral.

### 🏗️ `architecture-guide.md`
**Guia detalhado da arquitetura**
- Arquitetura do core framework
- Sistema de plugins
- Fluxo de dados
- Configurações
- Deploy architecture

**Use quando:** Precisar entender como o framework funciona internamente ou implementar features avançadas.

### 🛠️ `development-patterns.md`
**Padrões e boas práticas de desenvolvimento**
- Regras fundamentais (NUNCA editar `core/`)
- Como criar novas APIs step-by-step
- Padrões de components React
- Estrutura de arquivos
- Validação e error handling
- Debugging tips

**Use quando:** Implementar novas funcionalidades ou seguir padrões estabelecidos.

### 📚 `api-reference.md`
**Referência completa das APIs**
- FluxStackFramework class
- Sistema de plugins
- Build system
- Standalone modes
- Elysia route patterns
- TypeBox validation
- CLI commands
- Response patterns

**Use quando:** Precisar de referência específica sobre APIs, métodos ou configurações.

## 🎯 Guia Rápido para IAs

### Cenário 1: "Adicionar nova funcionalidade"
1. Leia `development-patterns.md` → seção "Criando Novas Funcionalidades"
2. Siga o padrão: Types → Controller → Routes → Client
3. Consulte `api-reference.md` para validações e schemas

### Cenário 2: "Entender o projeto"
1. Comece com `project-overview.md` para contexto geral
2. Leia `architecture-guide.md` para detalhes técnicos
3. Use `api-reference.md` como consulta

### Cenário 3: "Debugar ou corrigir erro"
1. Consulte `development-patterns.md` → seção "Debugging e Troubleshooting"
2. Verifique `api-reference.md` para sintaxe correta
3. Confirme estrutura em `architecture-guide.md`

### Cenário 4: "Configurar ambiente"
1. `project-overview.md` → seção "Comandos Principais"
2. `api-reference.md` → seção "Environment Variables"
3. `development-patterns.md` → seção "Comandos de Desenvolvimento"

## 🚨 Regras Críticas

### ❌ NUNCA FAZER
- Editar arquivos em `core/` (são do framework)
- Ignorar path aliases
- Quebrar type safety
- Criar arquivos fora de `app/`

### ✅ SEMPRE FAZER
- Trabalhar em `app/` (código da aplicação)
- Usar path aliases (`@/shared/`, `@/components/`, etc.)
- Manter tipos compartilhados atualizados
- Seguir padrão MVC (Controller → Routes → API)
- Testar com `bun run dev`

## 📁 Estrutura de Trabalho

```
FluxStack/
├── core/                    # 🔒 FRAMEWORK - NÃO EDITAR
├── app/                     # 👨‍💻 SEU CÓDIGO AQUI
│   ├── server/              # Backend (controllers, routes)
│   ├── client/              # Frontend (components, hooks)
│   └── shared/              # Types compartilhados
├── config/                  # Configurações
└── context_ai/              # 📖 Esta documentação
```

## 🔧 Comandos Essenciais

```bash
# Desenvolvimento
bun run dev              # Full-stack (recomendado)
bun run dev:frontend     # Frontend apenas
bun run dev:backend      # Backend apenas

# Build e produção  
bun run build           # Build completo
bun run start           # Servidor de produção

# Health check
curl http://localhost:3000/api/health
```

## 💡 Dicas para IAs

1. **Sempre comece lendo** o arquivo mais relevante para sua tarefa
2. **Use os exemplos** fornecidos como templates
3. **Mantenha consistência** com os padrões estabelecidos
4. **Teste tudo** com `bun run dev` antes de finalizar
5. **Consulte múltiplos arquivos** quando necessário

## 🆘 Em caso de dúvidas

1. Procure na seção de "Troubleshooting" em `development-patterns.md`
2. Verifique a sintaxe correta em `api-reference.md`
3. Confirme a arquitetura em `architecture-guide.md`
4. Revise o contexto geral em `project-overview.md`

---

**Objetivo:** Capacitar IAs a trabalhar de forma eficiente e seguir os padrões do FluxStack framework, garantindo código consistente e de alta qualidade.