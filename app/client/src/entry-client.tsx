/**
 * Client-side entry point for SSR hydration
 * This file hydrates the server-rendered HTML with React
 */

import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import App from './App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

hydrateRoot(
  rootElement,
  <StrictMode>
    <App />
  </StrictMode>
)
