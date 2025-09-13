import type { Plugin, PluginManifest, PluginLoadResult, PluginDiscoveryOptions } from "../types"
import type { FluxStackConfig } from "../config/schema"
import type { Logger } from "../utils/logger"
import { FluxStackError } from "../utils/errors"
import { readdir, stat, readFile } from "fs/promises"
import { join, resolve } from "path"
import { existsSync } from "fs"

export interface PluginRegistryConfig {
  logger?: Logger
  config?: FluxStackConfig
  discoveryOptions?: PluginDiscoveryOptions
}

export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map()
  private manifests: Map<string, PluginManifest> = new Map()
  private loadOrder: string[] = []
  private dependencies: Map<string, string[]> = new Map()
  private conflicts: string[] = []
  private logger?: Logger
  private config?: FluxStackConfig

  constructor(options: PluginRegistryConfig = {}) {
    this.logger = options.logger
    this.config = options.config
  }

  /**
   * Register a plugin with the registry
   */
  async register(plugin: Plugin, manifest?: PluginManifest): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new FluxStackError(
        `Plugin '${plugin.name}' is already registered`,
        'PLUGIN_ALREADY_REGISTERED',
        400
      )
    }

    // Validate plugin structure
    this.validatePlugin(plugin)

    // Validate plugin configuration if schema is provided
    if (plugin.configSchema && this.config?.plugins.config[plugin.name]) {
      this.validatePluginConfig(plugin, this.config.plugins.config[plugin.name])
    }

    this.plugins.set(plugin.name, plugin)
    
    if (manifest) {
      this.manifests.set(plugin.name, manifest)
    }

    // Update dependency tracking
    if (plugin.dependencies) {
      this.dependencies.set(plugin.name, plugin.dependencies)
    }

    // Update load order
    this.updateLoadOrder()

    this.logger?.debug(`Plugin '${plugin.name}' registered successfully`, {
      plugin: plugin.name,
      version: plugin.version,
      dependencies: plugin.dependencies
    })
  }

  /**
   * Unregister a plugin from the registry
   */
  unregister(name: string): void {
    if (!this.plugins.has(name)) {
      throw new FluxStackError(
        `Plugin '${name}' is not registered`,
        'PLUGIN_NOT_FOUND',
        404
      )
    }

    // Check if other plugins depend on this one
    const dependents = this.getDependents(name)
    if (dependents.length > 0) {
      throw new FluxStackError(
        `Cannot unregister plugin '${name}' because it is required by: ${dependents.join(', ')}`,
        'PLUGIN_HAS_DEPENDENTS',
        400
      )
    }

    this.plugins.delete(name)
    this.manifests.delete(name)
    this.dependencies.delete(name)
    this.loadOrder = this.loadOrder.filter(pluginName => pluginName !== name)

    this.logger?.debug(`Plugin '${name}' unregistered successfully`)
  }

  /**
   * Get a plugin by name
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name)
  }

  /**
   * Get plugin manifest by name
   */
  getManifest(name: string): PluginManifest | undefined {
    return this.manifests.get(name)
  }

  /**
   * Get all registered plugins
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get all plugin manifests
   */
  getAllManifests(): PluginManifest[] {
    return Array.from(this.manifests.values())
  }

  /**
   * Get plugins in load order
   */
  getLoadOrder(): string[] {
    return [...this.loadOrder]
  }

  /**
   * Get plugins that depend on the specified plugin
   */
  getDependents(pluginName: string): string[] {
    const dependents: string[] = []
    
    for (const [name, deps] of this.dependencies.entries()) {
      if (deps.includes(pluginName)) {
        dependents.push(name)
      }
    }
    
    return dependents
  }

  /**
   * Get plugin dependencies
   */
  getDependencies(pluginName: string): string[] {
    return this.dependencies.get(pluginName) || []
  }

  /**
   * Check if a plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name)
  }

  /**
   * Get registry statistics
   */
  getStats() {
    return {
      totalPlugins: this.plugins.size,
      enabledPlugins: this.config?.plugins.enabled.length || 0,
      disabledPlugins: this.config?.plugins.disabled.length || 0,
      conflicts: this.conflicts.length,
      loadOrder: this.loadOrder.length
    }
  }

  /**
   * Validate all plugin dependencies
   */
  validateDependencies(): void {
    this.conflicts = []

    for (const plugin of this.plugins.values()) {
      if (plugin.dependencies) {
        for (const dependency of plugin.dependencies) {
          if (!this.plugins.has(dependency)) {
            const error = `Plugin '${plugin.name}' depends on '${dependency}' which is not registered`
            this.conflicts.push(error)
            this.logger?.error(error, { plugin: plugin.name, dependency })
          }
        }
      }
    }

    if (this.conflicts.length > 0) {
      throw new FluxStackError(
        `Plugin dependency validation failed: ${this.conflicts.join('; ')}`,
        'PLUGIN_DEPENDENCY_ERROR',
        400,
        { conflicts: this.conflicts }
      )
    }
  }

  /**
   * Discover plugins from filesystem
   */
  async discoverPlugins(options: PluginDiscoveryOptions = {}): Promise<PluginLoadResult[]> {
    const results: PluginLoadResult[] = []
    const {
      directories = ['core/plugins/built-in', 'plugins', 'node_modules'],
      patterns = ['**/plugin.{js,ts}', '**/index.{js,ts}'],
      includeBuiltIn = true,
      includeExternal = true
    } = options

    for (const directory of directories) {
      if (!existsSync(directory)) {
        continue
      }

      try {
        const pluginResults = await this.discoverPluginsInDirectory(directory, patterns)
        results.push(...pluginResults)
      } catch (error) {
        this.logger?.warn(`Failed to discover plugins in directory '${directory}'`, { error })
        results.push({
          success: false,
          error: `Failed to scan directory: ${error instanceof Error ? error.message : String(error)}`
        })
      }
    }

    return results
  }

  /**
   * Load a plugin from file path
   */
  async loadPlugin(pluginPath: string): Promise<PluginLoadResult> {
    try {
      // Check if manifest exists
      const manifestPath = join(pluginPath, 'plugin.json')
      let manifest: PluginManifest | undefined

      if (existsSync(manifestPath)) {
        const manifestContent = await readFile(manifestPath, 'utf-8')
        manifest = JSON.parse(manifestContent)
      }

      // Try to import the plugin
      const pluginModule = await import(resolve(pluginPath))
      const plugin: Plugin = pluginModule.default || pluginModule

      if (!plugin || typeof plugin !== 'object' || !plugin.name) {
        return {
          success: false,
          error: 'Invalid plugin: must export a plugin object with a name property'
        }
      }

      // Register the plugin
      await this.register(plugin, manifest)

      return {
        success: true,
        plugin,
        warnings: manifest ? [] : ['No plugin manifest found']
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: Plugin): void {
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new FluxStackError(
        'Plugin must have a valid name property',
        'INVALID_PLUGIN_STRUCTURE',
        400
      )
    }

    if (plugin.version && typeof plugin.version !== 'string') {
      throw new FluxStackError(
        'Plugin version must be a string',
        'INVALID_PLUGIN_STRUCTURE',
        400
      )
    }

    if (plugin.dependencies && !Array.isArray(plugin.dependencies)) {
      throw new FluxStackError(
        'Plugin dependencies must be an array',
        'INVALID_PLUGIN_STRUCTURE',
        400
      )
    }

    if (plugin.priority && typeof plugin.priority !== 'number') {
      throw new FluxStackError(
        'Plugin priority must be a number',
        'INVALID_PLUGIN_STRUCTURE',
        400
      )
    }
  }

  /**
   * Validate plugin configuration against schema
   */
  private validatePluginConfig(plugin: Plugin, config: any): void {
    if (!plugin.configSchema) {
      return
    }

    // Basic validation - in a real implementation, you'd use a proper JSON schema validator
    if (plugin.configSchema.required) {
      for (const requiredField of plugin.configSchema.required) {
        if (!(requiredField in config)) {
          throw new FluxStackError(
            `Plugin '${plugin.name}' configuration missing required field: ${requiredField}`,
            'INVALID_PLUGIN_CONFIG',
            400
          )
        }
      }
    }
  }

  /**
   * Update the load order based on dependencies and priorities
   */
  private updateLoadOrder(): void {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const order: string[] = []

    const visit = (pluginName: string) => {
      if (visiting.has(pluginName)) {
        throw new FluxStackError(
          `Circular dependency detected involving plugin '${pluginName}'`,
          'CIRCULAR_DEPENDENCY',
          400
        )
      }

      if (visited.has(pluginName)) {
        return
      }

      visiting.add(pluginName)

      const plugin = this.plugins.get(pluginName)
      if (plugin?.dependencies) {
        for (const dependency of plugin.dependencies) {
          if (this.plugins.has(dependency)) {
            visit(dependency)
          }
        }
      }

      visiting.delete(pluginName)
      visited.add(pluginName)
      order.push(pluginName)
    }

    // Visit all plugins to build dependency order
    for (const pluginName of this.plugins.keys()) {
      visit(pluginName)
    }

    // Sort by priority within dependency groups
    this.loadOrder = order.sort((a, b) => {
      const pluginA = this.plugins.get(a)
      const pluginB = this.plugins.get(b)
      if (!pluginA || !pluginB) return 0
      return (pluginB.priority || 0) - (pluginA.priority || 0)
    })
  }

  /**
   * Discover plugins in a specific directory
   */
  private async discoverPluginsInDirectory(
    directory: string,
    patterns: string[]
  ): Promise<PluginLoadResult[]> {
    const results: PluginLoadResult[] = []
    
    try {
      const entries = await readdir(directory, { withFileTypes: true })
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginDir = join(directory, entry.name)
          
          // Check if this looks like a plugin directory
          const hasPluginFile = existsSync(join(pluginDir, 'index.ts')) || 
                               existsSync(join(pluginDir, 'index.js')) ||
                               existsSync(join(pluginDir, 'plugin.ts')) ||
                               existsSync(join(pluginDir, 'plugin.js'))
          
          if (hasPluginFile) {
            const result = await this.loadPlugin(pluginDir)
            results.push(result)
          }
        }
      }
    } catch (error) {
      this.logger?.error(`Failed to read directory '${directory}'`, { error })
    }
    
    return results
  }
}