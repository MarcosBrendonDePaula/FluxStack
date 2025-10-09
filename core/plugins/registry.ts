import type { FluxStack, PluginManifest, PluginLoadResult, PluginDiscoveryOptions } from "./types"

type FluxStackPlugin = FluxStack.Plugin
import type { FluxStackConfig } from "../config/schema"
import type { Logger } from "../utils/logger"
import { FluxStackError } from "../utils/errors"
import { PluginDependencyManager } from "./dependency-manager"
import { readdir, readFile } from "fs/promises"
import { join, resolve } from "path"
import { existsSync } from "fs"

export interface PluginRegistryConfig {
  logger?: Logger
  config?: FluxStackConfig
  discoveryOptions?: PluginDiscoveryOptions
}

export class PluginRegistry {
  private plugins: Map<string, FluxStackPlugin> = new Map()
  private manifests: Map<string, PluginManifest> = new Map()
  private loadOrder: string[] = []
  private dependencies: Map<string, string[]> = new Map()
  private conflicts: string[] = []
  private logger?: Logger
  private config?: FluxStackConfig
  private dependencyManager: PluginDependencyManager

  constructor(options: PluginRegistryConfig = {}) {
    this.logger = options.logger
    this.config = options.config
    this.dependencyManager = new PluginDependencyManager({
      logger: this.logger,
      autoInstall: true,
      packageManager: 'bun'
    })
  }

  /**
   * Register a plugin with the registry
   */
  async register(plugin: FluxStackPlugin, manifest?: PluginManifest): Promise<void> {
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
  get(name: string): FluxStackPlugin | undefined {
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
  getAll(): FluxStackPlugin[] {
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
      directories = ['plugins'],
      patterns: _patterns = ['**/plugin.{js,ts}', '**/index.{js,ts}'],
      includeBuiltIn: _includeBuiltIn = false,
      includeExternal: _includeExternal = true
    } = options

    // Descobrir plugins
    for (const directory of directories) {
      this.logger?.debug(`Scanning directory: ${directory}`)
      if (!existsSync(directory)) {
        this.logger?.warn(`Directory does not exist: ${directory}`)
        continue
      }

      try {
        const pluginResults = await this.discoverPluginsInDirectory(directory, _patterns)
        this.logger?.debug(`Found ${pluginResults.length} plugins in ${directory}`)
        results.push(...pluginResults)
      } catch (error) {
        this.logger?.warn(`Failed to discover plugins in directory '${directory}'`, { error })
        results.push({
          success: false,
          error: `Failed to scan directory: ${error instanceof Error ? error.message : String(error)}`
        })
      }
    }

    // Resolver e instalar dependências
    await this.resolveDependencies(results)

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
      const plugin: FluxStackPlugin = pluginModule.default || pluginModule

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
  private validatePlugin(plugin: FluxStackPlugin): void {
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
  private validatePluginConfig(plugin: FluxStackPlugin, config: any): void {
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
      const priorityA = typeof pluginA.priority === 'number' ? pluginA.priority : 0
      const priorityB = typeof pluginB.priority === 'number' ? pluginB.priority : 0
      return priorityB - priorityA
    })
  }

  /**
   * Resolver dependências de todos os plugins descobertos
   */
  private async resolveDependencies(results: PluginLoadResult[]): Promise<void> {
    const resolutions = []
    
    // Resolver dependências para cada plugin carregado com sucesso
    for (const result of results) {
      if (result.success && result.plugin) {
        try {
          // Tentar encontrar o diretório do plugin
          const pluginDir = this.findPluginDirectory(result.plugin.name)
          if (pluginDir) {
            const resolution = await this.dependencyManager.resolvePluginDependencies(pluginDir)
            resolutions.push(resolution)
            
            if (!resolution.resolved) {
              this.logger?.warn(`Plugin '${result.plugin.name}' tem conflitos de dependências`, {
                conflicts: resolution.conflicts.length
              })
            }
          }
        } catch (error) {
          this.logger?.warn(`Erro ao resolver dependências do plugin '${result.plugin.name}'`, { error })
        }
      }
    }

    // Instalar dependências se houver resoluções
    if (resolutions.length > 0) {
      try {
        await this.dependencyManager.installPluginDependencies(resolutions)
      } catch (error) {
        this.logger?.error('Erro ao instalar dependências de plugins', { error })
      }
    }
  }

  /**
   * Encontrar diretório de um plugin pelo nome
   */
  private findPluginDirectory(pluginName: string): string | null {
    const possiblePaths = [
      `plugins/${pluginName}`,
      `core/plugins/built-in/${pluginName}`
    ]

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path
      }
    }

    return null
  }

  /**
   * Discover plugins in a specific directory
   */
  private async discoverPluginsInDirectory(
    directory: string,
    _patterns: string[]
  ): Promise<PluginLoadResult[]> {
    const results: PluginLoadResult[] = []
    
    try {
      const entries = await readdir(directory, { withFileTypes: true })
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginDir = join(directory, entry.name)
          
          // Check if this looks like a plugin directory
          // Skip if it's just an index file in the root of built-in directory
          if (directory === 'core/plugins/built-in' && entry.name === 'index.ts') {
            continue
          }
          
          const hasPluginFile = existsSync(join(pluginDir, 'index.ts')) || 
                               existsSync(join(pluginDir, 'index.js')) ||
                               existsSync(join(pluginDir, 'plugin.ts')) ||
                               existsSync(join(pluginDir, 'plugin.js'))
          
          if (hasPluginFile) {
            this.logger?.debug(`Loading plugin from: ${pluginDir}`)
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