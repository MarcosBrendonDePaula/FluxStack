import { existsSync } from 'fs'
import { join } from 'path'
import type { Plugin } from '../plugins/types'
import { cliRegistry } from './command-registry'
import { logger } from '../utils/logger'

export class CliPluginDiscovery {
  private loadedPlugins = new Set<string>()

  async discoverAndRegisterCommands(): Promise<void> {
    // 1. Load built-in plugins with CLI commands
    await this.loadBuiltInPlugins()
    
    // 2. Load external plugins from node_modules
    await this.loadExternalPlugins()
    
    // 3. Load local plugins from project
    await this.loadLocalPlugins()
  }

  private async loadBuiltInPlugins(): Promise<void> {
    const builtInPluginsDir = join(__dirname, '../plugins/built-in')
    
    if (!existsSync(builtInPluginsDir)) {
      return
    }

    try {
      const fs = await import('fs')
      const potentialPlugins = fs.readdirSync(builtInPluginsDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)

      for (const pluginName of potentialPlugins) {
        try {
          const pluginPath = join(builtInPluginsDir, pluginName, 'index.ts')
          if (existsSync(pluginPath)) {
            const pluginModule = await import(pluginPath)
            
            if (pluginModule.commands) {
              for (const command of pluginModule.commands) {
                cliRegistry.register(command)
              }
              this.loadedPlugins.add(pluginName)
              logger.debug(`Registered ${pluginModule.commands.length} CLI commands from built-in plugin: ${pluginName}`)
            }
          }
        } catch (error) {
          logger.debug(`Failed to load built-in plugin ${pluginName}:`, error)
        }
      }
    } catch (error) {
      logger.debug('Failed to scan built-in plugins:', error)
    }
  }

  private async loadExternalPlugins(): Promise<void> {
    const nodeModulesDir = join(process.cwd(), 'node_modules')
    
    if (!existsSync(nodeModulesDir)) {
      return
    }

    try {
      const fs = await import('fs')
      const entries = fs.readdirSync(nodeModulesDir, { withFileTypes: true })
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        
        // Check for FluxStack plugins (convention: fluxstack-plugin-*)
        if (entry.name.startsWith('fluxstack-plugin-')) {
          await this.loadExternalPlugin(entry.name)
        }
        
        // Check for scoped packages (@fluxstack/plugin-*)
        if (entry.name.startsWith('@fluxstack')) {
          const scopedDir = join(nodeModulesDir, entry.name)
          if (existsSync(scopedDir)) {
            const scopedEntries = fs.readdirSync(scopedDir, { withFileTypes: true })
            for (const scopedEntry of scopedEntries) {
              if (scopedEntry.isDirectory() && scopedEntry.name.startsWith('plugin-')) {
                await this.loadExternalPlugin(`${entry.name}/${scopedEntry.name}`)
              }
            }
          }
        }
      }
    } catch (error) {
      logger.debug('Failed to scan external plugins:', error)
    }
  }

  private async loadExternalPlugin(packageName: string): Promise<void> {
    try {
      const packagePath = join(process.cwd(), 'node_modules', packageName)
      const packageJsonPath = join(packagePath, 'package.json')
      
      if (!existsSync(packageJsonPath)) {
        return
      }

      const packageJson = JSON.parse(await import('fs').then(fs => 
        fs.readFileSync(packageJsonPath, 'utf-8')
      ))

      // Check if this is a FluxStack plugin
      if (packageJson.fluxstack?.plugin) {
        const entryPoint = packageJson.main || 'index.js'
        const pluginPath = join(packagePath, entryPoint)
        
        if (existsSync(pluginPath)) {
          const pluginModule = await import(pluginPath)
          const plugin = pluginModule.default || pluginModule[packageJson.fluxstack.plugin] as Plugin
          
          if (plugin && plugin.commands) {
            this.registerPluginCommands(plugin)
          }
        }
      }
    } catch (error) {
      logger.debug(`Failed to load external plugin ${packageName}:`, error)
    }
  }

  private async loadLocalPlugins(): Promise<void> {
    const localPluginsDir = join(process.cwd(), 'plugins')
    
    if (!existsSync(localPluginsDir)) {
      return
    }

    try {
      const fs = await import('fs')
      const entries = fs.readdirSync(localPluginsDir, { withFileTypes: true })
      
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
          const pluginPath = join(localPluginsDir, entry.name)
          
          try {
            const pluginModule = await import(pluginPath)
            const plugin = pluginModule.default || Object.values(pluginModule).find(
              (exp: any) => exp && typeof exp === 'object' && exp.name && exp.commands
            ) as Plugin
            
            if (plugin && plugin.commands) {
              this.registerPluginCommands(plugin)
            }
          } catch (error) {
            logger.debug(`Failed to load local plugin ${entry.name}:`, error)
          }
        }
      }
    } catch (error) {
      logger.debug('Failed to scan local plugins:', error)
    }
  }

  private registerPluginCommands(plugin: Plugin): void {
    if (!plugin.commands || this.loadedPlugins.has(plugin.name)) {
      return
    }

    try {
      for (const command of plugin.commands) {
        // Prefix command with plugin name to avoid conflicts
        const prefixedCommand = {
          ...command,
          name: `${plugin.name}:${command.name}`,
          category: command.category || `Plugin: ${plugin.name}`,
          aliases: command.aliases?.map(alias => `${plugin.name}:${alias}`)
        }
        
        cliRegistry.register(prefixedCommand)
        
        // Also register without prefix if no conflict exists
        if (!cliRegistry.has(command.name)) {
          cliRegistry.register({
            ...command,
            category: command.category || `Plugin: ${plugin.name}`
          })
        }
      }
      
      this.loadedPlugins.add(plugin.name)
      logger.debug(`Registered ${plugin.commands.length} CLI commands from plugin: ${plugin.name}`)
      
    } catch (error) {
      logger.error(`Failed to register CLI commands for plugin ${plugin.name}:`, error)
    }
  }

  getLoadedPlugins(): string[] {
    return Array.from(this.loadedPlugins)
  }
}

export const pluginDiscovery = new CliPluginDiscovery()