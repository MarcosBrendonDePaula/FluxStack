# 🎯 Como Usar Decorators sem Erros de Tipos

## ✅ Exemplo Correto (Sem Erros)

```typescript
import { LiveAction, SimpleAction, SimpleLifecycle, SimpleValidate, Validators, ValidationMessages } from '@/core'

export class UserAction extends LiveAction {
    name: string = ''
    email: string = ''
    age: number = 0

    getInitialState(props: any) {
        return { 
            name: props.name || '',
            email: props.email || '',
            age: props.age || 0
        }
    }

    @SimpleLifecycle('mount')
    mount() {
        // Logging automático: 🔄 UserAction lifecycle: mount
        console.log('Componente inicializado')
    }

    @SimpleLifecycle('unmount')
    unmount() {
        // Logging automático: 🔄 UserAction lifecycle: unmount
        console.log('Componente finalizado')
    }

    @SimpleAction('Atualizar nome do usuário')
    @SimpleValidate(
        Validators.safeString(2, 50),
        ValidationMessages.safeString(2, 50)
    )
    updateName(newName: string) {
        // Logging automático: 🎯 UserAction.updateName() called
        // Validação automática aplicada antes da execução
        this.name = newName
        this.emit('name-updated', { name: this.name })
        return { success: true, name: this.name }
    }

    @SimpleAction('Atualizar email do usuário')
    @SimpleValidate(
        Validators.email,
        ValidationMessages.email
    )
    updateEmail(newEmail: string) {
        this.email = newEmail
        this.emit('email-updated', { email: this.email })
        return { success: true, email: this.email }
    }

    @SimpleAction('Atualizar idade')
    @SimpleValidate(
        Validators.range(0, 120),
        ValidationMessages.range(0, 120)
    )
    updateAge(newAge: number) {
        this.age = newAge
        return { success: true, age: this.age }
    }

    @SimpleAction('Validar todos os dados')
    validateAll() {
        const errors: string[] = []
        
        if (!Validators.safeString(2, 50)(this.name)) {
            errors.push('Nome inválido')
        }
        
        if (!Validators.email(this.email)) {
            errors.push('Email inválido')
        }
        
        if (!Validators.range(0, 120)(this.age)) {
            errors.push('Idade inválida')
        }

        return { 
            success: errors.length === 0, 
            errors,
            message: errors.length === 0 ? 'Todos os dados válidos' : 'Dados inválidos'
        }
    }
}

// Registro manual
LiveAction.add(UserAction)
```

## 🚀 Validators Disponíveis

### Básicos
```typescript
// Campos obrigatórios
@SimpleValidate(Validators.required, ValidationMessages.required)

// Tamanho de string
@SimpleValidate(Validators.minLength(3), ValidationMessages.minLength(3))
@SimpleValidate(Validators.maxLength(100), ValidationMessages.maxLength(100))
@SimpleValidate(Validators.stringRange(3, 100), ValidationMessages.stringRange(3, 100))

// Email
@SimpleValidate(Validators.email, ValidationMessages.email)

// Números
@SimpleValidate(Validators.positive, ValidationMessages.positive)
@SimpleValidate(Validators.range(1, 100), ValidationMessages.range(1, 100))
```

### Avançados
```typescript
// String segura (alfanumérica, sem "teste")
@SimpleValidate(
    Validators.safeString(2, 50),
    ValidationMessages.safeString(2, 50)
)

// Combinações com AND
@SimpleValidate(
    Validators.and(
        Validators.required,
        Validators.minLength(3),
        Validators.alphanumeric
    ),
    'Obrigatório, mín 3 chars, alfanumérico'
)

// Combinações com OR
@SimpleValidate(
    Validators.or(
        Validators.email,
        (value) => typeof value === 'string' && value.startsWith('@')
    ),
    'Email válido ou username com @'
)
```

## 🎨 Padrões Comuns

### 1. Validação de Item de Lista
```typescript
@SimpleAction('Adicionar item')
@SimpleValidate(
    Validators.safeString(2, 100),
    'Item deve ter 2-100 chars, sem caracteres especiais'
)
addItem(item: string) {
    this.items.push(item)
    return { success: true, totalItems: this.items.length }
}
```

### 2. Validação de Index/ID
```typescript
@SimpleAction('Remover item')
@SimpleValidate(
    Validators.and(
        (v: any) => Number.isInteger(v),
        Validators.range(0, 999)
    ),
    'Índice deve ser número inteiro entre 0 e 999'
)
removeItem(index: number) {
    if (index >= this.items.length) {
        throw new Error('Índice fora do range')
    }
    this.items.splice(index, 1)
    return { success: true }
}
```

### 3. Validação Condicional
```typescript
@SimpleAction('Operação sensível')
@SimpleValidate(
    (value: string) => this.isEnabled && Validators.required(value),
    'Operação desabilitada ou valor inválido'
)
sensitiveOperation(data: string) {
    // Só executa se isEnabled=true E data for válido
    return { success: true }
}
```

## 🔧 Como Resolver Erros Comuns

### Erro: "Type 'string | boolean' is not assignable to type 'boolean'"

❌ **Errado:**
```typescript
@SimpleValidate(
    (value: string) => value && value.length > 3, // Retorna string | boolean
    'Mensagem'
)
```

✅ **Correto:**
```typescript
@SimpleValidate(
    (value: string) => Boolean(value && value.length > 3), // Sempre boolean
    'Mensagem'
)

// OU ainda melhor, use os validators pré-definidos:
@SimpleValidate(
    Validators.minLength(3),
    ValidationMessages.minLength(3)
)
```

### Erro: "Argument of type '...' is not assignable"

❌ **Errado:**
```typescript
@SimpleValidate(
    (value) => { // Tipo implícito 'any'
        if (!value) return 'erro' // Retorna string!
        return value.length > 3
    }
)
```

✅ **Correto:**
```typescript
@SimpleValidate(
    (value: string) => { // Tipo explícito
        if (!value) return false // Sempre boolean
        return value.length > 3
    },
    'Deve ter mais de 3 caracteres'
)
```

## 📝 VS Code IntelliSense

O VS Code deve fornecer:
- ✅ Auto-complete para `Validators.`
- ✅ Auto-complete para `ValidationMessages.`
- ✅ Sugestões de imports automáticos
- ✅ Detecção de erros de tipo em tempo real
- ✅ Documentação inline ao passar o mouse

Se não estiver funcionando, verifique:
1. `experimentalDecorators: true` no `tsconfig.json` ✅
2. `emitDecoratorMetadata: true` no `tsconfig.json` ✅
3. Reinicie o VS Code se necessário

## 🎯 Resultado Final

Com os decorators configurados corretamente, você tem:
- 🔥 **Logging automático** de todas as ações
- ⚡ **Validação automática** antes da execução
- 🎯 **Type safety** completa
- 📝 **IntelliSense** otimizado
- 🚀 **Código mais limpo** e fácil de manter

**Agora a "definição da classe e coisas do tipo" está muito mais fácil!** 🎉