# Zustand Setup for FluxStack

## Installation

Add Zustand to your project:

```bash
# Using npm
npm install zustand

# Using yarn
yarn add zustand

# Using pnpm
pnpm add zustand

# Using bun
bun add zustand
```

## Package.json Dependencies

Add to your `package.json`:

```json
{
  "dependencies": {
    "zustand": "^4.4.7"
  }
}
```

## TypeScript Support

Zustand has built-in TypeScript support, no additional packages needed.

## Optional: DevTools Integration

For Redux DevTools integration (already included in our stores):

```bash
# No additional packages needed - works out of the box
```

## Middleware

Our stores already use the `persist` middleware. Other useful middleware:

```bash
# For more advanced middleware (optional)
npm install immer  # For immutable updates
npm install zustand-middleware-yjs  # For collaborative editing
```

## Ready to Use

The FluxStack template already includes:
- ✅ User authentication store
- ✅ UI state store  
- ✅ Persistence middleware
- ✅ DevTools integration
- ✅ Utility hooks
- ✅ TypeScript support

Just start using the stores in your components!