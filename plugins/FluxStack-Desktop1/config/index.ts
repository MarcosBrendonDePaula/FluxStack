/**
 * FluxStackDesktop1 Plugin Configuration
 * Declarative config using FluxStack config system
 */

import { defineConfig, config } from '@/core/utils/config-schema'

const FluxStackDesktop1ConfigSchema = {
  // Enable/disable plugin
  enabled: config.boolean('FLUX_STACK_DESKTOP1_ENABLED', true),

  // Add your configuration options here
  // Example:
  // apiKey: config.string('FLUX_STACK_DESKTOP1_API_KEY', ''),
  // timeout: config.number('FLUX_STACK_DESKTOP1_TIMEOUT', 5000),
  // debug: config.boolean('FLUX_STACK_DESKTOP1_DEBUG', false),
} as const

export const FluxStackDesktop1Config = defineConfig(FluxStackDesktop1ConfigSchema)

export type FluxStackDesktop1Config = typeof FluxStackDesktop1Config
export default FluxStackDesktop1Config
