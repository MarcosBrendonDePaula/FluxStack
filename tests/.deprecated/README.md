# 🗄️ Testes Deprecated - FluxStack

Este diretório contém **testes que foram temporariamente desabilitados** mas podem ser úteis no futuro.

## ⚠️ Status Atual

Estes testes foram **movidos para cá durante limpeza de código não utilizado** (Nov 2025). Eles estão desabilitados por um dos seguintes motivos:

1. **Complexidade/Flakiness** - Testes instáveis que falham intermitentemente
2. **Refatoração pendente** - Código testado foi refatorado, testes precisam atualização
3. **Dependências problemáticas** - Mocks ou dependências causando problemas
4. **Arquitetura mudou** - Sistema testado foi redesenhado

## 📁 Testes Neste Diretório

### **App.test.tsx.skip** (8K)
- **Componente:** App.tsx (Interface principal React)
- **Cobertura:** Header, navegação, tabs, CRUD demo
- **Motivo desabilitado:** Provavelmente complexidade de mocks ou mudanças na interface
- **Reabilitar quando:** App.tsx estabilizar ou refatorar testes

### **create-project.test.ts.skip** (2.7K)
- **Funcionalidade:** Sistema de criação de projetos (CLI)
- **Cobertura:** Scaffold de novos projetos FluxStack
- **Motivo desabilitado:** Sistema de criação pode ter sido refatorado
- **Reabilitar quando:** CLI estabilizar

### **logger.test.ts.skip** (7.3K)
- **Plugin:** Logger plugin
- **Cobertura:** Sistema de logging do framework
- **Motivo desabilitado:** Mudanças na implementação do logger
- **Reabilitar quando:** Logger API estabilizar

### **vite.test.ts.disabled** (5.8K)
- **Plugin:** Vite plugin
- **Cobertura:** Integração Vite + FluxStack
- **Motivo desabilitado:** Complexidade de testar integração Vite
- **Reabilitar quando:** Integração Vite estabilizar

### **built-in.test.ts.disabled** (11K)
- **Componente:** Plugins built-in do core
- **Cobertura:** Sistema de plugins internos
- **Motivo desabilitado:** Arquitetura de plugins pode ter mudado
- **Reabilitar quando:** Sistema de plugins estabilizar

## 🔄 Como Reabilitar um Teste

### 1. Mover de volta para local original
```bash
mv tests/.deprecated/App.test.tsx.skip tests/unit/app/client/App.test.tsx
```

### 2. Atualizar mocks e imports
```typescript
// Verificar se paths e mocks estão corretos
import App from '@/app/client/src/App'
```

### 3. Executar e debugar
```bash
bun run test tests/unit/app/client/App.test.tsx
```

### 4. Corrigir falhas
- Atualizar expects baseado em nova implementação
- Ajustar mocks para nova arquitetura
- Verificar timing/async issues

## 📊 Estatísticas

| Métrica | Valor |
|---------|-------|
| **Testes desabilitados** | 5 arquivos |
| **Linhas de código** | ~34.8K |
| **Cobertura perdida** | ~15-20% |
| **Prioridade reativação** | Média |

## 🎯 Plano de Reativação (Sugerido)

### Sprint 1 (Prioridade Alta)
- [ ] **App.test.tsx** - Teste crítico da interface principal

### Sprint 2 (Prioridade Média)
- [ ] **built-in.test.ts** - Cobertura de plugins core
- [ ] **logger.test.ts** - Sistema de logging

### Sprint 3 (Prioridade Baixa)
- [ ] **vite.test.ts** - Integração Vite (mais estável)
- [ ] **create-project.test.ts** - CLI (funcionalidade estável)

## 📝 Notas

- **Não delete estes testes** - eles representam esforço significativo de desenvolvimento
- **Investigue antes de reabilitar** - entenda o motivo da desabilitação
- **Considere refatorar** - pode ser mais fácil reescrever do que corrigir
- **Mantenha histórico** - use git blame para entender contexto

## 🔗 Referências

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [FluxStack Testing Guide](../../ai-context/reference/testing.md)

---

**Última atualização:** Nov 2025
**Status:** Aguardando revisão e reativação
