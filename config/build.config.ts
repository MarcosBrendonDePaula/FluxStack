/**
 * Build & Client Configuration
 * Declarative build and client config for FluxStack framework
 */

import { defineConfig, config } from '@/core/utils/config-schema'

export const buildConfig = defineConfig({
  // Client build settings
  clientBuildDir: config.string('CLIENT_BUILD_DIR', 'dist/client'),
  clientSourceMaps: config.boolean('CLIENT_SOURCEMAPS', false),
  clientMinify: config.boolean('CLIENT_MINIFY', true),
  clientTarget: config.string('CLIENT_TARGET', 'es2020'),

  // API proxy settings
  apiUrl: config.string('API_URL', 'http://localhost:3000'),
  proxyChangeOrigin: config.boolean('PROXY_CHANGE_ORIGIN', true),

  // Monitoring
  monitoringEnabled: config.boolean('MONITORING_ENABLED', false)
})

export type BuildConfig = typeof buildConfig
export default buildConfig
