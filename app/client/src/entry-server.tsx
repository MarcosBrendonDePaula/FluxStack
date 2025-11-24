/**
 * Server-side entry point for SSR
 * This file is used to render React components on the server
 */

import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'

export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

export type { App }
