/**
 * FluxStack Logger - Startup Banner
 * Clean and beautiful startup display
 *
 * Developers can customize the banner by:
 * 1. Setting showBanner: false in server config
 * 2. Using displayStartupBanner() in app.listen() callback
 * 3. Creating completely custom banners with chalk
 */

import chalk from 'chalk'
import { LOG } from './index'
import { FLUXSTACK_VERSION } from '../version'

export interface StartupInfo {
  port: number
  apiPrefix?: string
  environment: string
  pluginCount?: number
  vitePort?: number
  viteEmbedded?: boolean // true when Vite runs programmatically with backend
  swaggerPath?: string
}

/**
 * Display clean startup banner
 */
export function displayStartupBanner(info: StartupInfo): void {
  const {
    port,
    apiPrefix = '/api',
    environment,
    pluginCount = 0,
    vitePort,
    viteEmbedded = false,
  } = info

  // Display plugins in compact format
  const plugins = (global as any).__fluxstackPlugins || []
  if (plugins.length > 0) {
    const pluginList = plugins.map((p: any) => `${p.name} (${p.details})`).join(', ')
    console.log(`Plugins (${plugins.length}): ${pluginList}\n`)
  }

  // Simple ready message
  console.log(chalk.green('Server ready!') + chalk.gray(` Environment: ${environment}${viteEmbedded ? ' | Vite: embedded' : ''}\n`))
}

/**
 * Display simple plugin loaded message
 */
export function logPluginLoaded(name: string, version?: string): void {
  const versionStr = version ? chalk.gray(`v${version}`) : ''
  LOG(`${chalk.green('✓')} Plugin loaded: ${chalk.cyan(name)} ${versionStr}`)
}

/**
 * Display plugin count summary
 */
export function logPluginsSummary(count: number): void {
  if (count === 0) {
    LOG(chalk.yellow('⚠  No plugins loaded'))
  } else {
    LOG(chalk.green(`✓ ${count} plugin${count > 1 ? 's' : ''} loaded successfully`))
  }
}
