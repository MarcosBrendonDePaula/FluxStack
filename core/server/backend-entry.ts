/**
 * Backend Entry Point - Core Framework
 *
 * This file contains the protected logic for running backend standalone mode.
 * DO NOT modify this file directly - it's part of the FluxStack framework core.
 *
 * For customization, use app/server/backend-only.ts
 */

import type { Elysia } from "elysia"
import { startBackendOnly } from "./standalone"

export interface BackendEntryConfig {
  port: number
  apiPrefix?: string
  host?: string
}

/**
 * Start backend in standalone mode
 *
 * @param apiRoutes - Elysia routes from app/server/routes
 * @param config - Backend configuration
 */
export function startBackend(
  apiRoutes: Elysia,
  config: BackendEntryConfig
) {
  const { port, apiPrefix = '/api', host = 'localhost' } = config

  console.log(`🚀 Backend standalone: ${host}:${port}`)
  console.log(`📡 API Prefix: ${apiPrefix}`)
  console.log()

  // Start backend using the standalone utility
  startBackendOnly(apiRoutes, { port, apiPrefix })
}

/**
 * Create backend entry config from declarative config
 * Helper to make it easy to use with the config system
 */
export function createBackendConfig(
  serverConfig: { server: { backendPort: number; apiPrefix: string; host: string } }
): BackendEntryConfig {
  return {
    port: serverConfig.server.backendPort,
    apiPrefix: serverConfig.server.apiPrefix,
    host: serverConfig.server.host
  }
}
