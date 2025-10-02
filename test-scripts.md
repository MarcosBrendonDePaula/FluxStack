# Test Scripts for FluxStack

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:client": "vitest run app/client",
    "test:server": "vitest run app/server",
    "test:core": "vitest run core"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^14.5.1",
    "@types/node": "^20.8.0",
    "@vitejs/plugin-react": "^4.1.0",
    "jsdom": "^22.1.0",
    "vitest": "^0.34.6"
  }
}
```

## Installation

```bash
# Install test dependencies
npm install -D @testing-library/jest-dom @testing-library/react @testing-library/user-event jsdom vitest

# Or with other package managers
yarn add -D @testing-library/jest-dom @testing-library/react @testing-library/user-event jsdom vitest
pnpm add -D @testing-library/jest-dom @testing-library/react @testing-library/user-event jsdom vitest
bun add -D @testing-library/jest-dom @testing-library/react @testing-library/user-event jsdom vitest
```

## Running Tests

```bash
# Run all tests once
npm run test:run

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:client    # Only client tests
npm run test:server    # Only server tests
npm run test:core      # Only core tests
```