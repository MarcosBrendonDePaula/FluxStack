# Context AI - FluxStack v1.4.1

Esta pasta contém documentação especializada para IAs trabalharem eficientemente com o FluxStack framework v1.4.1.

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

### 🔧 `plugin-development-guide.md`
**Guia completo para desenvolvimento de plugins**
- Plugin architecture e tipos
- Criação de plugins personalizados
- Sistema de configuração
- Testes de plugins
- Built-in plugins examples
- Best practices e debugging

**Use quando:** Desenvolver plugins personalizados ou extender funcionalidades do framework.

### 🚨 `troubleshooting-guide.md`
**Guia de resolução de problemas**
- Issues comuns de desenvolvimento
- Problemas de build e produção
- Debugging de API e backend
- Issues de frontend e React
- Problemas de testing
- Ferramentas de diagnóstico

**Use quando:** Encontrar erros, problemas de performance ou comportamentos inesperados.

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
1. Consulte `troubleshooting-guide.md` → busque o erro específico
2. Use `development-patterns.md` → seção "Debugging e Troubleshooting"
3. Verifique `api-reference.md` para sintaxe correta
4. Confirme estrutura em `architecture-guide.md`

### Cenário 4: "Configurar ambiente"
1. `project-overview.md` → seção "Comandos Principais"
2. `api-reference.md` → seção "Environment Variables"
3. `development-patterns.md` → seção "Comandos de Desenvolvimento"

### Cenário 5: "Desenvolver plugin personalizado"
1. Leia `plugin-development-guide.md` → guia completo de plugins
2. Consulte `architecture-guide.md` → sistema de plugins
3. Use `api-reference.md` → built-in plugins examples

### Cenário 6: "Problema de performance ou erro específico"
1. Consulte `troubleshooting-guide.md` → busque o problema específico
2. Use ferramentas de diagnóstico descritas no guia
3. Verifique `development-patterns.md` → debugging patterns

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

1. **Primeiro:** Procure em `troubleshooting-guide.md` → problemas específicos e soluções
2. **Segundo:** Verifique em `development-patterns.md` → debugging e patterns
3. **Terceiro:** Consulte `api-reference.md` → sintaxe e configurações corretas  
4. **Quarto:** Confirme em `architecture-guide.md` → funcionamento interno
5. **Último:** Revise `project-overview.md` → contexto geral do projeto

---

**Objetivo:** Capacitar IAs a trabalhar de forma eficiente e seguir os padrões do FluxStack framework, garantindo código consistente e de alta qualidade.