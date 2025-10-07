/**
 * Gerenciador de Dependências de Plugins
 * Resolve e instala dependências de plugins automaticamente
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { execSync } from 'child_process'
import type { Logger } from '../utils/logger'

export interface PluginDependency {
  name: string
  version: string
  type: 'dependency' | 'devDependency' | 'peerDependency'
  optional?: boolean
}

export interface DependencyResolution {
  plugin: string
  dependencies: PluginDependency[]
  conflicts: DependencyConflict[]
  resolved: boolean
}

export interface DependencyConflict {
  package: string
  versions: Array<{
    plugin: string
    version: string
  }>
  resolution?: string
}

export interface DependencyManagerConfig {
  logger?: Logger
  autoInstall?: boolean
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
  workspaceRoot?: string
}

export class PluginDependencyManager {
  private logger?: Logger
  private config: DependencyManagerConfig
  private installedDependencies: Map<string, string> = new Map()
  private pluginDependencies: Map<string, PluginDependency[]> = new Map()

  constructor(config: DependencyManagerConfig = {}) {
    this.config = {
      autoInstall: true,
      packageManager: 'bun',
      workspaceRoot: process.cwd(),
      ...config
    }
    this.logger = config.logger
    
    this.loadInstalledDependencies()
  }

  /**
   * Registrar dependências de um plugin
   */
  registerPluginDependencies(pluginName: string, dependencies: PluginDependency[]): void {
    this.pluginDependencies.set(pluginName, dependencies)
    this.logger?.debug(`Dependências registradas para plugin '${pluginName}'`, {
      plugin: pluginName,
      dependencies: dependencies.length
    })
  }

  /**
   * Resolver dependências de um plugin a partir do package.json
   */
  async resolvePluginDependencies(pluginPath: string): Promise<DependencyResolution> {
    const pluginName = this.getPluginNameFromPath(pluginPath)
    const packageJsonPath = join(pluginPath, 'package.json')
    
    if (!existsSync(packageJsonPath)) {
      return {
        plugin: pluginName,
        dependencies: [],
        conflicts: [],
        resolved: true
      }
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      const dependencies: PluginDependency[] = []

      // Processar dependencies
      if (packageJson.dependencies) {
        for (const [name, version] of Object.entries(packageJson.dependencies)) {
          dependencies.push({
            name,
            version: version as string,
            type: 'dependency'
          })
        }
      }

      // Processar peerDependencies
      if (packageJson.peerDependencies) {
        for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
          const isOptional = packageJson.peerDependenciesMeta?.[name]?.optional || false
          dependencies.push({
            name,
            version: version as string,
            type: 'peerDependency',
            optional: isOptional
          })
        }
      }

      // Registrar dependências
      this.registerPluginDependencies(pluginName, dependencies)

      // Detectar conflitos
      const conflicts = this.detectConflicts(pluginName, dependencies)

      return {
        plugin: pluginName,
        dependencies,
        conflicts,
        resolved: conflicts.length === 0
      }
    } catch (error) {
      this.logger?.error(`Erro ao resolver dependências do plugin '${pluginName}'`, { error })
      return {
        plugin: pluginName,
        dependencies: [],
        conflicts: [],
        resolved: false
      }
    }
  }

  /**
   * Instalar dependências de plugins
   */
  async installPluginDependencies(resolutions: DependencyResolution[]): Promise<void> {
    if (!this.config.autoInstall) {
      this.logger?.debug('Auto-instalação desabilitada, pulando instalação de dependências')
      return
    }

    const toInstall: PluginDependency[] = []
    const conflicts: DependencyConflict[] = []

    // Coletar todas as dependências e conflitos
    for (const resolution of resolutions) {
      toInstall.push(...resolution.dependencies)
      conflicts.push(...resolution.conflicts)
    }

    // Resolver conflitos primeiro
    if (conflicts.length > 0) {
      await this.resolveConflicts(conflicts)
    }

    // Filtrar dependências que já estão instaladas
    const needsInstallation = toInstall.filter(dep => {
      const installed = this.installedDependencies.get(dep.name)
      return !installed || !this.isVersionCompatible(installed, dep.version)
    })

    if (needsInstallation.length === 0) {
      this.logger?.debug('Todas as dependências de plugins já estão instaladas')
      return
    }

    this.logger?.debug(`Instalando ${needsInstallation.length} dependências de plugins`, {
      dependencies: needsInstallation.map(d => `${d.name}@${d.version}`)
    })

    try {
      await this.installDependencies(needsInstallation)
      this.logger?.debug('Dependências de plugins instaladas com sucesso')
    } catch (error) {
      this.logger?.error('Erro ao instalar dependências de plugins', { error })
      throw error
    }
  }

  /**
   * Detectar conflitos de versão
   */
  private detectConflicts(pluginName: string, dependencies: PluginDependency[]): DependencyConflict[] {
    const conflicts: DependencyConflict[] = []

    for (const dep of dependencies) {
      const existingVersions: Array<{ plugin: string; version: string }> = []

      // Verificar se outros plugins já declararam esta dependência
      for (const [otherPlugin, otherDeps] of this.pluginDependencies.entries()) {
        if (otherPlugin === pluginName) continue

        const conflictingDep = otherDeps.find(d => d.name === dep.name)
        if (conflictingDep && !this.isVersionCompatible(conflictingDep.version, dep.version)) {
          existingVersions.push({
            plugin: otherPlugin,
            version: conflictingDep.version
          })
        }
      }

      if (existingVersions.length > 0) {
        existingVersions.push({
          plugin: pluginName,
          version: dep.version
        })

        conflicts.push({
          package: dep.name,
          versions: existingVersions
        })
      }
    }

    return conflicts
  }

  /**
   * Resolver conflitos de dependências
   */
  private async resolveConflicts(conflicts: DependencyConflict[]): Promise<void> {
    this.logger?.warn(`Detectados ${conflicts.length} conflitos de dependências`, {
      conflicts: conflicts.map(c => ({
        package: c.package,
        versions: c.versions.length
      }))
    })

    for (const conflict of conflicts) {
      // Estratégia simples: usar a versão mais alta
      const sortedVersions = conflict.versions.sort((a, b) => {
        return this.compareVersions(b.version, a.version)
      })

      const resolution = sortedVersions[0].version
      conflict.resolution = resolution

      this.logger?.debug(`Conflito resolvido para '${conflict.package}': usando versão ${resolution}`, {
        package: conflict.package,
        resolution,
        conflictingVersions: conflict.versions
      })
    }
  }

  /**
   * Instalar dependências usando o package manager configurado
   */
  private async installDependencies(dependencies: PluginDependency[]): Promise<void> {
    const regularDeps = dependencies.filter(d => d.type === 'dependency')
    const peerDeps = dependencies.filter(d => d.type === 'peerDependency' && !d.optional)

    if (regularDeps.length > 0) {
      const packages = regularDeps.map(d => `${d.name}@${d.version}`).join(' ')
      const command = this.getInstallCommand(packages, false)
      
      this.logger?.debug(`Executando: ${command}`)
      execSync(command, { 
        cwd: this.config.workspaceRoot,
        stdio: 'inherit'
      })
    }

    if (peerDeps.length > 0) {
      const packages = peerDeps.map(d => `${d.name}@${d.version}`).join(' ')
      const command = this.getInstallCommand(packages, false) // Peer deps como regulares
      
      this.logger?.debug(`Executando: ${command}`)
      execSync(command, { 
        cwd: this.config.workspaceRoot,
        stdio: 'inherit'
      })
    }

    // Recarregar dependências instaladas
    this.loadInstalledDependencies()
  }

  /**
   * Obter comando de instalação baseado no package manager
   */
  private getInstallCommand(packages: string, dev: boolean): string {
    const devFlag = dev ? '--save-dev' : ''
    
    switch (this.config.packageManager) {
      case 'npm':
        return `npm install ${devFlag} ${packages}`
      case 'yarn':
        return `yarn add ${dev ? '--dev' : ''} ${packages}`
      case 'pnpm':
        return `pnpm add ${devFlag} ${packages}`
      case 'bun':
        return `bun add ${devFlag} ${packages}`
      default:
        return `npm install ${devFlag} ${packages}`
    }
  }

  /**
   * Carregar dependências já instaladas
   */
  private loadInstalledDependencies(): void {
    const packageJsonPath = join(this.config.workspaceRoot!, 'package.json')
    
    if (!existsSync(packageJsonPath)) {
      return
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      
      // Carregar dependencies
      if (packageJson.dependencies) {
        for (const [name, version] of Object.entries(packageJson.dependencies)) {
          this.installedDependencies.set(name, version as string)
        }
      }

      // Carregar devDependencies
      if (packageJson.devDependencies) {
        for (const [name, version] of Object.entries(packageJson.devDependencies)) {
          this.installedDependencies.set(name, version as string)
        }
      }
    } catch (error) {
      this.logger?.warn('Erro ao carregar package.json principal', { error })
    }
  }

  /**
   * Verificar se versões são compatíveis
   */
  private isVersionCompatible(installed: string, required: string): boolean {
    // Implementação simples - em produção usaria semver
    if (required.startsWith('^') || required.startsWith('~')) {
      const requiredVersion = required.slice(1)
      return this.compareVersions(installed, requiredVersion) >= 0
    }
    
    return installed === required
  }

  /**
   * Comparar versões (implementação simples)
   */
  private compareVersions(a: string, b: string): number {
    const aParts = a.replace(/[^\d.]/g, '').split('.').map(Number)
    const bParts = b.replace(/[^\d.]/g, '').split('.').map(Number)
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0
      const bPart = bParts[i] || 0
      
      if (aPart > bPart) return 1
      if (aPart < bPart) return -1
    }
    
    return 0
  }

  /**
   * Extrair nome do plugin do caminho
   */
  private getPluginNameFromPath(pluginPath: string): string {
    return pluginPath.split('/').pop() || 'unknown'
  }

  /**
   * Obter estatísticas de dependências
   */
  getStats() {
    return {
      totalPlugins: this.pluginDependencies.size,
      totalDependencies: Array.from(this.pluginDependencies.values())
        .reduce((sum, deps) => sum + deps.length, 0),
      installedDependencies: this.installedDependencies.size,
      packageManager: this.config.packageManager
    }
  }
}