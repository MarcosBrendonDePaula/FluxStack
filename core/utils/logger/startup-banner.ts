/**
 * FluxStack Logger - Startup Banner
 * Clean and beautiful startup display
 */

import chalk from 'chalk'
import { LOG } from './index'

export interface StartupInfo {
  port: number
  apiPrefix?: string
  environment: string
  pluginCount?: number
  vitePort?: number
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
    swaggerPath
  } = info

  console.log('\n' + chalk.cyan.bold('⚡ FluxStack') + chalk.gray(` v1.1.0\n`))

  // Server info
  console.log(chalk.bold('🚀 Server'))
  console.log(`   ${chalk.gray('→')} http://localhost:${port}`)
  console.log(`   ${chalk.gray('→')} API: http://localhost:${port}${apiPrefix}`)
  console.log(`   ${chalk.gray('→')} Health: http://localhost:${port}${apiPrefix}/health`)

  // Frontend info (if Vite is running)
  if (vitePort) {
    console.log('')
    console.log(chalk.bold('⚛️  Frontend'))
    console.log(`   ${chalk.gray('→')} http://localhost:${vitePort}`)
  }

  // Swagger docs (if enabled)
  if (swaggerPath) {
    console.log('')
    console.log(chalk.bold('📋 Documentation'))
    console.log(`   ${chalk.gray('→')} http://localhost:${port}${swaggerPath}`)
  }

  // Environment and plugins
  console.log('')
  console.log(chalk.bold('ℹ️  Info'))
  console.log(`   ${chalk.gray('→')} Environment: ${chalk.green(environment)}`)
  console.log(`   ${chalk.gray('→')} Plugins: ${chalk.yellow(pluginCount)}`)

  console.log('\n' + chalk.green('✨ Ready!') + chalk.gray(' Press Ctrl+C to stop\n'))
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
