# LiveAction Class Definition Helpers

## Visão Geral

O FluxStack agora inclui um conjunto completo de ferramentas para facilitar a criação e definição de classes LiveAction. Essas ferramentas foram criadas especificamente para resolver a sua necessidade de "facilitar na definição da classe e coisas do tipo".

## 🎯 Ferramentas Disponíveis

### 1. Decorators TypeScript (`@/core/decorators/LiveActionDecorators`)

Decorators que simplificam a definição de LiveAction classes:

```typescript
import { LiveAction, Action, State, Lifecycle, LiveComponent } from '@/core'

@LiveComponent()
export class UserProfileAction extends LiveAction {
    @State({ required: true, type: 'string' })
    name: string = ''

    @State({ type: 'string' })
    email: string = ''

    @Action({ 
        description: 'Update user name', 
        emit: 'name-updated',
        broadcast: false 
    })
    updateName(newName: string) {
        this.name = newName
        return { success: true, name: this.name }
    }

    @Lifecycle('mount')
    mount() {
        console.log('Component mounted')
    }
}
```

#### Decorators Disponíveis:

- **`@Action(options)`**: Marca métodos como ações com metadados
- **`@State(options)`**: Adiciona validação automática para propriedades  
- **`@Lifecycle(phase)`**: Marca métodos de ciclo de vida
- **`@Emit(eventName)`**: Auto-emite eventos após execução do método
- **`@LiveComponent(name)`**: Auto-registra a classe no sistema

### 2. Helpers de Tipagem (`@/core/helpers/LiveActionHelpers`)

Utilities para desenvolvimento type-safe:

```typescript
import { createTypedAction, StateProperty, CommonEvents } from '@/core'

// Helper tipado
const typed = createTypedAction<UserProps, UserState>()

// Definição de estado tipado
const state = typed.defineState((props) => ({
    name: props.name || '',
    email: props.email || '',
    isActive: true
}))

// Propriedades com validação built-in
const nameProperty = StateProperty.string('Default Name')
const ageProperty = StateProperty.number(0)
const isActiveProperty = StateProperty.boolean(false)
```

### 3. Sistema de Validação (`@/core/validators/LiveActionValidators`)

Validação avançada para props, estado e métodos:

```typescript
import { ValidationRules, Validate, ValidateParams } from '@/core'

export class UserAction extends LiveAction {
    @Validate(
        ValidationRules.required(),
        ValidationRules.email(),
        ValidationRules.maxLength(100)
    )
    email: string = ''

    @ValidateParams(
        [ValidationRules.required(), ValidationRules.minLength(2)], // name param
        [ValidationRules.range(18, 120)]  // age param
    )
    updateUser(name: string, age: number) {
        // Parâmetros já validados automaticamente
        return { success: true }
    }
}
```

### 4. Fluent Builder API

Para criação dinâmica de classes:

```typescript
import { createLiveAction } from '@/core'

const MyAction = createLiveAction('MyAction')
    .withProps<{ title: string }>()
    .withInitialState((props) => ({
        title: props.title || 'Default',
        counter: 0
    }))
    .withAction('increment', function() {
        this.counter++
        return { counter: this.counter }
    })
    .withLifecycle('mount', function() {
        console.log('Component mounted')
    })
    .build()
```

## 🚀 Templates de Início Rápido

### Template Simples

```typescript
import { LiveAction, Action, State, LiveComponent } from '@/core'

@LiveComponent()
export class SimpleAction extends LiveAction {
    @State({ required: true, type: 'string' })
    message: string = 'Hello FluxStack!'

    getInitialState(props: any) {
        return { message: this.message }
    }

    @Action({ description: 'Update message', emit: 'message-updated' })
    updateMessage(newMessage: string) {
        this.message = newMessage
        return { success: true, message: this.message }
    }
}
```

### Template Avançado com Validação

```typescript
import { 
    LiveAction, 
    Action, 
    State, 
    Lifecycle, 
    LiveComponent, 
    Validate, 
    ValidationRules 
} from '@/core'

interface MyComponentProps {
    initialValue?: string
    maxLength?: number
}

@LiveComponent()
export class AdvancedAction extends LiveAction {
    @State({ required: true, type: 'string' })
    @Validate(
        ValidationRules.required(),
        ValidationRules.maxLength(100)
    )
    value: string = ''

    @State({ type: 'number' })
    @Validate(ValidationRules.positive())
    counter: number = 0

    getInitialState(props: MyComponentProps) {
        return {
            value: props.initialValue || '',
            counter: 0
        }
    }

    @Lifecycle('mount')
    mount() {
        console.log('Component mounted')
    }

    @Action({ 
        description: 'Update value with validation', 
        emit: ['value-updated', 'validation-passed'] 
    })
    @Validate(ValidationRules.required(), ValidationRules.maxLength(100))
    updateValue(newValue: string) {
        this.value = newValue
        this.counter++
        return { 
            success: true, 
            value: this.value, 
            counter: this.counter 
        }
    }

    @Action({ description: 'Reset all values' })
    reset() {
        this.value = ''
        this.counter = 0
        return { success: true }
    }
}
```

## 📝 VS Code Snippets

Inclui snippets para produtividade máxima:

- **`liveaction`**: Classe completa com decorators
- **`liveaction-simple`**: Classe simples sem decorators
- **`livemethod`**: Método de ação com decorators
- **`livestate`**: Propriedade de estado validada
- **`livevalidate`**: Decorators de validação
- **`livelifecycle`**: Método de ciclo de vida
- **`livebuilder`**: Padrão Builder
- **`livecomponent`**: Componente React correspondente

## 🛠️ Como Usar

### 1. Importação Unificada

Tudo disponível via import central:

```typescript
import { 
    LiveAction,
    Action, 
    State, 
    Lifecycle,
    ValidationRules,
    Validate,
    createLiveAction
} from '@/core'
```

### 2. IntelliSense Otimizado

Os helpers foram projetados para máxima integração com TypeScript IntelliSense:

- **Auto-complete** para todas as opções de decorators
- **Validação de tipos** em tempo de compilação
- **Documentação inline** para todos os métodos
- **Sugestões contextuais** baseadas no uso

### 3. Desenvolvimento Guiado

Use os helpers em ordem de complexidade:

1. **Iniciante**: Use o CLI generator (`bun run make:component`)
2. **Intermediário**: Use snippets do VS Code
3. **Avançado**: Use decorators e validação
4. **Expert**: Use Builder API para cases complexos

## 📊 Benefícios

### Antes (Código Manual)
```typescript
export class UserAction extends LiveAction {
    public name: string = ""
    public email: string = ""
    
    getInitialState(props: any) {
        // Validação manual
        if (!props.name) throw new Error("Name required")
        return { name: props.name, email: props.email }
    }
    
    updateName(newName: string) {
        // Validação manual
        if (!newName || newName.length < 2) {
            throw new Error("Invalid name")
        }
        console.log(`🎯 ${this.constructor.name}.updateName() called`)
        this.name = newName
        this.emit('name-updated', { name: this.name })
        return { success: true }
    }
}

LiveAction.add(UserAction)  // Registro manual
```

### Depois (Com Helpers)
```typescript
@LiveComponent()
export class UserAction extends LiveAction {
    @State({ required: true, type: 'string' })
    @Validate(ValidationRules.minLength(2))
    name: string = ""

    @State({ type: 'string' })
    @Validate(ValidationRules.email())
    email: string = ""

    getInitialState(props: UserProps) {
        return { name: props.name, email: props.email }
    }

    @Action({ description: 'Update user name', emit: 'name-updated' })
    updateName(newName: string) {
        this.name = newName
        return { success: true }
    }
}
// Auto-registro via @LiveComponent()
```

## 🎯 Casos de Uso Comuns

### 1. Validação Complexa
```typescript
@State({ required: true })
@Validate(
    ValidationRules.required('Email é obrigatório'),
    ValidationRules.email('Formato de email inválido'),
    ValidationRules.custom(
        (value) => !value.includes('+'),
        'Email não pode conter +'
    )
)
email: string = ''
```

### 2. Ações Condicionais
```typescript
@ConditionalValidate(
    (instance) => instance.isEditMode,
    [ValidationRules.required(), ValidationRules.minLength(3)]
)
@Action({ emit: 'field-updated' })
updateField(value: string) {
    // Validação condicional aplicada automaticamente
}
```

### 3. Validação Assíncrona
```typescript
@AsyncValidate(async (email) => {
    const exists = await checkEmailExists(email)
    return exists 
        ? { isValid: false, errors: ['Email já existe'] }
        : { isValid: true, errors: [] }
})
@Action()
async registerUser(email: string) {
    // Email já validado assincronamente
}
```

## 🔧 Integração com CLI Generator

O CLI generator agora suporta geração de componentes usando os helpers:

```bash
# Gerar componente com decorators
bun run make:component UserProfile --decorators

# Gerar com validação avançada
bun run make:component UserProfile --validation --async

# Gerar com builder pattern
bun run make:component UserProfile --builder
```

## 📈 Próximos Passos

1. **Use os snippets** do VS Code para máxima produtividade
2. **Experimente os decorators** em componentes existentes
3. **Implemente validação** usando ValidationRules
4. **Explore o Builder API** para casos avançados
5. **Contribua** com novos validators e helpers

Esta é a solução completa para "facilitar na definição da classe e coisas do tipo" que você solicitou! 🚀