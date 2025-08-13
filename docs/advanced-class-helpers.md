# Advanced Class Definition Helpers

FluxStack provides powerful tools to facilitate LiveAction class creation with intelligent code generation, fluent APIs, and smart templates.

## 🎯 Quick Generator CLI

### Basic Usage
```bash
# Preview what will be generated
bun run quick:gen MyComponent --type=counter --preview

# Generate the component
bun run quick:gen MyComponent --type=counter

# Custom output path
bun run quick:gen MyWidget --type=toggle --output=./custom/path.ts
```

### Available Types

#### Counter Component
```bash
bun run quick:gen UserCounter --type=counter
```
Generates: Counter with increment/decrement/reset, step control, and event emissions.

#### Toggle Component  
```bash
bun run quick:gen StatusToggle --type=toggle
```
Generates: Boolean toggle with enable/disable actions and state management.

#### Input Component
```bash
bun run quick:gen SearchInput --type=input
```
Generates: Input field with validation, error handling, and value management.

#### CRUD Component
```bash
bun run quick:gen ProductCrud --type=crud
```
Generates: Full CRUD operations with create/update/delete/validate methods.

#### Form Component
```bash
bun run quick:gen ContactForm --type=form
```
Generates: Form management with validation, error handling, and submission logic.

#### List Component
```bash
bun run quick:gen TaskList --type=list
```
Generates: List management with add/remove/filter/sort functionality.

## 🏗️ Fluent Class Builder API

### Basic Builder Pattern
```typescript
import { LiveActionClassBuilder } from '@/core'

const myClass = new LiveActionClassBuilder('MyComponent')
    .withProperty('name', 'string', { required: true })
    .withProperty('count', 'number', { defaultValue: '0' })
    .withAction('updateName', {
        description: 'Update component name',
        validation: {
            validator: 'Validators.safeString(2, 50)',
            message: 'ValidationMessages.safeString(2, 50)'
        },
        emits: ['name-updated'],
        updatesProperties: ['name']
    })
    .withLifecycle('mount')
    .build()

console.log(myClass) // Complete TypeScript class code
```

### Property Types
- `'string'` - Text values
- `'number'` - Numeric values  
- `'boolean'` - True/false values
- `'array'` - Array collections
- `'object'` - Object/record types

### Property Options
```typescript
interface PropertyOptions {
    required?: boolean        // Field is required
    defaultValue?: string     // Custom default value
    validation?: ValidationConfig  // Validation rules
    description?: string      // Documentation comment
}
```

### Action Options
```typescript
interface ActionOptions {
    description?: string      // Method description
    validation?: ValidationConfig  // Input validation
    emits?: string[]         // Events to emit
    body?: string           // Custom method body
    updatesProperties?: string[]  // Properties this action updates
}
```

## 🚀 Smart Class Generators

### CRUD Generator
```typescript
import { SmartClassGenerator } from '@/core'

const userCrud = SmartClassGenerator.generateCrudClass('User', [
    { name: 'id', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'email', type: 'string', required: true, validation: {
        validator: 'Validators.email',
        message: 'ValidationMessages.email'
    }},
    { name: 'age', type: 'number', required: false }
]).build()
```

### Form Generator
```typescript
const contactForm = SmartClassGenerator.generateFormClass('Contact', [
    { name: 'firstName', type: 'string', required: true },
    { name: 'lastName', type: 'string', required: true },
    { name: 'email', type: 'string', required: true },
    { name: 'message', type: 'string', required: false }
]).build()
```

### List Generator
```typescript
const todoList = SmartClassGenerator.generateListClass('Todo', 'string').build()
```

## ⚡ Quick Templates

### Pre-built Patterns
```typescript
import { QuickGenerators } from '@/core'

// Counter component
const counter = QuickGenerators.counter('PageViews').build()

// Toggle switch
const toggle = QuickGenerators.toggle('DarkMode').build()

// Validated input
const input = QuickGenerators.input('UserName', {
    validator: 'Validators.safeString(2, 30)',
    message: 'ValidationMessages.safeString(2, 30)'
}).build()
```

## 📋 JSON Configuration

### Generate from Config
```typescript
import { generateClassFromConfig } from '@/core'

const config = {
    className: 'ShoppingCart',
    properties: [
        { name: 'items', type: 'array', options: { defaultValue: '[]' }},
        { name: 'total', type: 'number', options: { defaultValue: '0' }},
        { name: 'isCheckout', type: 'boolean', options: { defaultValue: 'false' }}
    ],
    methods: [
        { name: 'addItem', options: { 
            description: 'Add item to cart',
            emits: ['item-added', 'cart-updated']
        }},
        { name: 'removeItem', options: {
            description: 'Remove item from cart', 
            emits: ['item-removed', 'cart-updated']
        }},
        { name: 'checkout', options: {
            description: 'Process checkout',
            emits: ['checkout-started', 'payment-required']
        }}
    ],
    lifecycles: [
        { hook: 'mount' },
        { hook: 'unmount' }
    ]
}

const shoppingCartClass = generateClassFromConfig(config)
```

## 🎨 Advanced Customization

### Custom Method Bodies
```typescript
const builder = new LiveActionClassBuilder('PaymentProcessor')
    .withProperty('amount', 'number', { required: true })
    .withProperty('status', 'string', { defaultValue: "'pending'" })
    .withAction('processPayment', {
        description: 'Process credit card payment',
        validation: {
            validator: 'Validators.and(Validators.positive, Validators.range(0.01, 10000))',
            message: 'Amount must be between $0.01 and $10,000'
        },
        body: `        console.log(\`🎯 \${this.constructor.name}.processPayment() called\`)
        
        // Validate payment amount
        if (this.amount <= 0) {
            throw new Error('Invalid payment amount')
        }
        
        // Set processing status
        this.status = 'processing'
        
        // Simulate payment processing
        setTimeout(() => {
            this.status = 'completed'
            this.emit('payment-completed', {
                amount: this.amount,
                componentId: this.$ID,
                timestamp: Date.now()
            })
        }, 2000)
        
        return { success: true, message: "Payment processing started", amount: this.amount }`
    })
```

### Custom Initial State
```typescript
const builder = new LiveActionClassBuilder('UserProfile')
    .withInitialState(`        return {
            name: props.user?.name || 'Anonymous',
            email: props.user?.email || '',
            avatar: props.user?.avatar || '/default-avatar.png',
            isOnline: true,
            lastSeen: Date.now()
        }`)
```

## 📁 Output and Registration

### Auto-Registration
All generated components are automatically:
1. Saved to `app/server/live/components/`
2. Registered in `app/server/live/index.ts`
3. Available for use immediately with hot reload

### Manual Output Path
```bash
bun run quick:gen MyComponent --output=./custom/MyComponent.ts
```

## 🔧 Integration with Existing Tools

### Works with Simple Decorators
Generated classes use the proven Simple Decorators system:
- `@SimpleAction` for automatic logging
- `@SimpleLifecycle` for lifecycle management  
- `@SimpleValidate` for input validation

### Compatible with CLI Generator
You can mix the fluent API with the existing CLI:
```bash
# Start with CLI
bun run make:component BaseWidget --props --lifecycle

# Then enhance with fluent API
const enhanced = new LiveActionClassBuilder('BaseWidget')
    .withAction('advancedFeature')
    .build()
```

## 📊 Examples by Use Case

### E-commerce Product Card
```typescript
const productCard = QuickGenerators.toggle('ProductFavorite')
    .withProperty('productId', 'string', { required: true })
    .withProperty('userId', 'string', { required: true })
    .withAction('addToWishlist', {
        description: 'Add product to wishlist',
        emits: ['wishlist-updated', 'user-action'],
        validation: {
            validator: 'Validators.required',
            message: 'Product ID is required'
        }
    })
    .build()
```

### Real-time Chat Message
```typescript
const chatMessage = new LiveActionClassBuilder('ChatMessage')
    .withProperty('content', 'string', { required: true })
    .withProperty('authorId', 'string', { required: true })
    .withProperty('timestamp', 'number', { defaultValue: 'Date.now()' })
    .withProperty('isRead', 'boolean', { defaultValue: 'false' })
    .withAction('markAsRead', {
        description: 'Mark message as read',
        emits: ['message-read', 'chat-updated'],
        updatesProperties: ['isRead']
    })
    .withAction('reply', {
        description: 'Reply to message',
        emits: ['message-replied', 'chat-activity']
    })
    .withLifecycle('mount')
    .build()
```

### Dashboard Widget
```typescript
const analyticsWidget = SmartClassGenerator.generateCrudClass('Analytics', [
    { name: 'pageViews', type: 'number', required: false },
    { name: 'uniqueUsers', type: 'number', required: false },
    { name: 'bounceRate', type: 'number', required: false },
    { name: 'lastUpdated', type: 'string', required: false }
])
.withAction('refreshData', {
    description: 'Refresh analytics data',
    emits: ['data-refreshed', 'loading-complete'],
    body: `        console.log(\`🎯 \${this.constructor.name}.refreshData() called\`)
        
        // Set loading state
        this.emit('loading-started', { componentId: this.$ID })
        
        // Simulate API call
        setTimeout(() => {
            this.pageViews = Math.floor(Math.random() * 10000)
            this.uniqueUsers = Math.floor(Math.random() * 1000)
            this.bounceRate = Math.random() * 100
            this.lastUpdated = new Date().toISOString()
            
            this.emit('data-refreshed', {
                componentId: this.$ID,
                data: {
                    pageViews: this.pageViews,
                    uniqueUsers: this.uniqueUsers,
                    bounceRate: this.bounceRate
                }
            })
        }, 1000)
        
        return { success: true, message: "Data refresh started" }`
})
.build()
```

## 🚀 Best Practices

### 1. Use Semantic Naming
```typescript
// Good
const userAuthenticator = QuickGenerators.toggle('UserAuthentication')

// Avoid
const thing = QuickGenerators.toggle('Thing')
```

### 2. Add Validation to User Inputs
```typescript
const userInput = QuickGenerators.input('UserEmail', {
    validator: 'Validators.email',
    message: 'ValidationMessages.email'
})
```

### 3. Use Descriptive Event Names
```typescript
.withAction('submitOrder', {
    emits: ['order-submitted', 'payment-required', 'inventory-check']
})
```

### 4. Group Related Properties
```typescript
const userProfile = new LiveActionClassBuilder('UserProfile')
    // Personal info
    .withProperty('firstName', 'string')
    .withProperty('lastName', 'string')
    .withProperty('email', 'string')
    // Settings
    .withProperty('notifications', 'boolean')
    .withProperty('theme', 'string')
    // Status
    .withProperty('isOnline', 'boolean')
    .withProperty('lastSeen', 'number')
```

### 5. Use Preview Mode for Experimentation
```bash
# Always preview first
bun run quick:gen MyIdea --type=form --preview

# Then generate when satisfied
bun run quick:gen MyIdea --type=form
```

## 🔗 Related Documentation

- [Simple Decorators Guide](./decorators-example.md)
- [Component Generator CLI](./component-generator.md)
- [Validation System](./validation-system.md)
- [LiveAction Basics](./live-actions.md)

## 💡 Pro Tips

1. **Combine Generators**: Start with quick generator, enhance with fluent API
2. **Preview Everything**: Use `--preview` to see generated code before creating
3. **Custom Templates**: Create your own generator patterns for recurring needs
4. **Auto-Registration**: Generated components are immediately available
5. **Hot Reload**: Changes are reflected instantly in development

The Advanced Class Helpers make LiveAction development significantly faster while maintaining code quality and consistency.