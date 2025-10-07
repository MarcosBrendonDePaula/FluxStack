# Custom Startup Banner

FluxStack allows you to customize the startup banner displayed when your server starts.

## Options

### 1. Use Default Banner (Default)

```typescript
// app/server/index.ts
app.listen() // Shows default FluxStack banner
```

### 2. Disable Banner Completely

```typescript
// app/server/index.ts
const app = new FluxStackFramework({
  server: {
    port: 3000,
    host: 'localhost',
    apiPrefix: '/api',
    showBanner: false, // Disable default banner
    // ... other config
  }
})

app.listen()
```

### 3. Custom Banner with Callback

```typescript
// app/server/index.ts
import chalk from 'chalk'

const app = new FluxStackFramework({
  server: {
    port: 3000,
    host: 'localhost',
    apiPrefix: '/api',
    showBanner: false, // Disable default banner
    // ... other config
  }
})

app.listen(() => {
  // Your custom banner
  console.log(chalk.cyan.bold('🚀 My Awesome App'))
  console.log(chalk.gray('   → Server running on port 3000'))
  console.log(chalk.green('   ✓ Ready to rock!'))
})
```

### 4. Use Built-in Banner Helper

```typescript
// app/server/index.ts
import { displayStartupBanner, type StartupInfo } from '@/core/utils/logger'

const app = new FluxStackFramework({
  server: {
    port: 3000,
    host: 'localhost',
    apiPrefix: '/api',
    showBanner: false, // Disable default banner
    // ... other config
  }
})

app.listen(() => {
  // Use the built-in banner function with custom data
  const customInfo: StartupInfo = {
    port: 3000,
    apiPrefix: '/api',
    environment: 'production',
    pluginCount: 5,
    vitePort: undefined, // No Vite in production
    viteEmbedded: false,
    swaggerPath: undefined // No Swagger in production
  }

  displayStartupBanner(customInfo)

  // Add your own custom messages
  console.log(chalk.yellow('⚠️  Remember to check your API keys!'))
})
```

### 5. Hybrid Approach (Default Banner + Custom Messages)

```typescript
// app/server/index.ts
const app = new FluxStackFramework({
  server: {
    port: 3000,
    host: 'localhost',
    apiPrefix: '/api',
    showBanner: true, // Keep default banner
    // ... other config
  }
})

app.listen(() => {
  // Default banner is displayed automatically
  // Add your custom messages after
  console.log('\n📌 Custom Info:')
  console.log(`   → Database: ${process.env.DATABASE_URL}`)
  console.log(`   → Redis: ${process.env.REDIS_URL}`)
})
```

## Examples

### Minimal Banner

```typescript
app.listen(() => {
  console.log('Server ready on http://localhost:3000')
})
```

### Detailed Custom Banner

```typescript
import chalk from 'chalk'

app.listen(() => {
  console.log('\n' + chalk.bgCyan.black(' MY APP ') + '\n')
  console.log(chalk.bold('🌐 Endpoints:'))
  console.log(`   ${chalk.cyan('→')} API: http://localhost:3000/api`)
  console.log(`   ${chalk.cyan('→')} Docs: http://localhost:3000/docs`)
  console.log(`   ${chalk.cyan('→')} Admin: http://localhost:3000/admin`)

  console.log('\n' + chalk.bold('🔧 Services:'))
  console.log(`   ${chalk.green('✓')} Database connected`)
  console.log(`   ${chalk.green('✓')} Redis connected`)
  console.log(`   ${chalk.green('✓')} Mail service ready`)

  console.log('\n' + chalk.green.bold('✨ Ready!\n'))
})
```

## Best Practices

1. **Production**: Keep banners minimal in production to avoid cluttering logs
2. **Development**: Use detailed banners with all URLs and debug info
3. **Consistency**: Use the same color scheme throughout your banner
4. **Information**: Show only relevant information (don't overwhelm users)

## Available from Core

You can import these utilities:

```typescript
import {
  displayStartupBanner,  // Built-in banner function
  type StartupInfo       // Type for banner data
} from '@/core/utils/logger'

import chalk from 'chalk'  // For colored output
```
