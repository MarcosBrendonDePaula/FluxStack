import type { Plugin } from "../types"

export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map()
  private loadOrder: string[] = []

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already registered`)
    }
    
    this.plugins.set(plugin.name, plugin)
    this.updateLoadOrder()
  }

  unregister(name: string): void {
    if (!this.plugins.has(name)) {
      throw new Error(`Plugin '${name}' is not registered`)
    }
    
    this.plugins.delete(name)
    this.loadOrder = this.loadOrder.filter(pluginName => pluginName !== name)
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name)
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  getLoadOrder(): string[] {
    return [...this.loadOrder]
  }

  validateDependencies(): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.dependencies) {
        for (const dependency of plugin.dependencies) {
          if (!this.plugins.has(dependency)) {
            throw new Error(
              `Plugin '${plugin.name}' depends on '${dependency}' which is not registered`
            )
          }
        }
      }
    }
  }

  private updateLoadOrder(): void {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const order: string[] = []

    const visit = (pluginName: string) => {
      if (visiting.has(pluginName)) {
        throw new Error(`Circular dependency detected involving plugin '${pluginName}'`)
      }
      
      if (visited.has(pluginName)) {
        return
      }

      visiting.add(pluginName)
      
      const plugin = this.plugins.get(pluginName)
      if (plugin?.dependencies) {
        for (const dependency of plugin.dependencies) {
          visit(dependency)
        }
      }

      visiting.delete(pluginName)
      visited.add(pluginName)
      order.push(pluginName)
    }

    for (const pluginName of this.plugins.keys()) {
      visit(pluginName)
    }

    // Sort by priority (higher priority first)
    this.loadOrder = order.sort((a, b) => {
      const pluginA = this.plugins.get(a)
      const pluginB = this.plugins.get(b)
      if (!pluginA || !pluginB) return 0
      return (pluginB.priority || 0) - (pluginA.priority || 0)
    })
  }
}