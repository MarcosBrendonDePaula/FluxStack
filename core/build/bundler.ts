import { spawn } from "bun"
import { existsSync, mkdirSync } from "fs"
import { join } from "path"
import type { FluxStackConfig } from "../config"
import type { BundleResult, BundleOptions } from "../types/build"
import { buildLogger } from "../utils/build-logger"

export interface BundlerConfig {
  target: 'bun' | 'node' | 'docker'
  outDir: string
  sourceMaps: boolean
  external?: string[]
}

export class Bundler {
  private config: BundlerConfig

  constructor(config: BundlerConfig) {
    this.config = config
  }

  async bundleClient(options: BundleOptions = {}): Promise<BundleResult> {
    buildLogger.section('Client Build', '⚡')
    buildLogger.step('Starting Vite build...')

    const startTime = Date.now()
    
    try {
      const buildProcess = spawn({
        cmd: ["bunx", "vite", "build", "--config", "vite.config.ts"],
        cwd: process.cwd(),
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          NODE_ENV: 'production',  // Force production environment for builds
          VITE_BUILD_OUTDIR: this.config.outDir,
          VITE_BUILD_MINIFY: (this.config.minify || false).toString(),
          VITE_BUILD_SOURCEMAPS: this.config.sourceMaps.toString(),
          ...options.env
        }
      })

      const exitCode = await buildProcess.exited
      const duration = Date.now() - startTime

      if (exitCode === 0) {
        buildLogger.success(`Client bundle completed in ${buildLogger.formatDuration(duration)}`)
        return {
          success: true,
          duration,
          outputPath: this.config.outDir,
          assets: await this.getClientAssets()
        }
      } else {
        const stderr = await new Response(buildProcess.stderr).text()
        buildLogger.error("Client bundle failed")
        return {
          success: false,
          duration,
          error: stderr || "Client build failed"
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        success: false,
        duration,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }

  async bundleServer(entryPoint: string, options: BundleOptions = {}): Promise<BundleResult> {
    buildLogger.section('Server Build', '⚡')

    const startTime = Date.now()
    let liveComponentsGenerator: any = null

    try {
      // 🚀 PRE-BUILD: Auto-generate Live Components registration
      const generatorModule = await import('./live-components-generator')
      liveComponentsGenerator = generatorModule.liveComponentsGenerator
      const discoveredComponents = await liveComponentsGenerator.preBuild()

      // 🔌 PRE-BUILD: Auto-generate FluxStack Plugins registration
      const pluginsGeneratorModule = await import('./flux-plugins-generator')
      const fluxPluginsGenerator = pluginsGeneratorModule.fluxPluginsGenerator
      const discoveredPlugins = await fluxPluginsGenerator.preBuild()
      
      // Ensure output directory exists
      if (!existsSync(this.config.outDir)) {
        mkdirSync(this.config.outDir, { recursive: true })
      }

      const external = [
        "@tailwindcss/vite",
        "tailwindcss", 
        "lightningcss",
        "vite",
        "@vitejs/plugin-react",
        ...(this.config.external || []),
        ...(options.external || [])
      ]

      const buildArgs = [
        "bun", "build", 
        entryPoint, 
        "--outdir", this.config.outDir,
        "--target", this.config.target,
        ...external.flatMap(ext => ["--external", ext])
      ]

      if (this.config.sourceMaps) {
        buildArgs.push("--sourcemap")
      }

      // Bun bundling only - no minification for better compatibility

      const buildProcess = spawn({
        cmd: buildArgs,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          NODE_ENV: 'production',  // Force production environment for builds
          ...options.env
        }
      })

      const exitCode = await buildProcess.exited
      const duration = Date.now() - startTime

      // 🧹 POST-BUILD: Handle auto-generated registration file
      // (liveComponentsGenerator already available from above)

      if (exitCode === 0) {
        buildLogger.success(`Server bundle completed in ${buildLogger.formatDuration(duration)}`)
        
        // Keep generated files for production (they're now baked into bundle)
        await liveComponentsGenerator.postBuild(false)
        
        // Cleanup plugins registry
        const pluginsGeneratorModule = await import('./flux-plugins-generator')
        const fluxPluginsGenerator = pluginsGeneratorModule.fluxPluginsGenerator
        await fluxPluginsGenerator.postBuild(false)
        
        return {
          success: true,
          duration,
          outputPath: this.config.outDir,
          entryPoint: join(this.config.outDir, "index.js")
        }
      } else {
        buildLogger.error("Server bundle failed")
        
        // Restore original files since build failed
        await liveComponentsGenerator.postBuild(false)
        
        // Restore plugins registry
        const pluginsGeneratorModule = await import('./flux-plugins-generator')
        const fluxPluginsGenerator = pluginsGeneratorModule.fluxPluginsGenerator
        await fluxPluginsGenerator.postBuild(false)
        
        const stderr = await new Response(buildProcess.stderr).text()
        return {
          success: false,
          duration,
          error: stderr || "Server build failed"
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      
      // 🧹 CLEANUP: Restore original files on error
      try {
        if (liveComponentsGenerator) {
          await liveComponentsGenerator.postBuild(false)
        }
        
        // Cleanup plugins registry
        const pluginsGeneratorModule = await import('./flux-plugins-generator')
        const fluxPluginsGenerator = pluginsGeneratorModule.fluxPluginsGenerator
        await fluxPluginsGenerator.postBuild(false)
      } catch (cleanupError) {
        buildLogger.warn(`Failed to cleanup generated files: ${cleanupError}`)
      }
      
      return {
        success: false,
        duration,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }

  private async getClientAssets(): Promise<string[]> {
    // This would analyze the build output to get asset information
    // For now, return empty array - can be enhanced later
    return []
  }

  async bundle(clientEntry?: string, serverEntry?: string, options: BundleOptions = {}): Promise<{
    client: BundleResult
    server: BundleResult
  }> {
    const [clientResult, serverResult] = await Promise.all([
      clientEntry ? this.bundleClient(options) : Promise.resolve({ success: true, duration: 0 } as BundleResult),
      serverEntry ? this.bundleServer(serverEntry, options) : Promise.resolve({ success: true, duration: 0 } as BundleResult)
    ])

    return {
      client: clientResult,
      server: serverResult
    }
  }
}