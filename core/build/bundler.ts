import { spawn } from "bun"
import { existsSync, mkdirSync } from "fs"
import { join } from "path"
import type { FluxStackConfig } from "../config"
import type { BundleResult, BundleOptions } from "../types/build"

export interface BundlerConfig {
  target: 'bun' | 'node' | 'docker'
  outDir: string
  sourceMaps: boolean
  external?: string[]
  minify?: boolean
}

export class Bundler {
  private config: BundlerConfig

  constructor(config: BundlerConfig) {
    this.config = config
  }

  async bundleClient(options: BundleOptions = {}): Promise<BundleResult> {
    console.log("⚡ Bundling client...")
    
    const startTime = Date.now()
    
    try {
      const buildProcess = spawn({
        cmd: ["bunx", "vite", "build", "--config", "vite.config.ts"],
        cwd: process.cwd(),
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          VITE_BUILD_OUTDIR: this.config.outDir,
          VITE_BUILD_MINIFY: (this.config.minify || false).toString(),
          VITE_BUILD_SOURCEMAPS: this.config.sourceMaps.toString(),
          ...options.env
        }
      })

      const exitCode = await buildProcess.exited
      const duration = Date.now() - startTime
      
      if (exitCode === 0) {
        console.log("✅ Client bundle completed")
        return {
          success: true,
          duration,
          outputPath: this.config.outDir,
          assets: await this.getClientAssets()
        }
      } else {
        const stderr = await new Response(buildProcess.stderr).text()
        console.error("❌ Client bundle failed")
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
    console.log("⚡ Bundling server...")
    
    const startTime = Date.now()
    
    try {
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

      if (this.config.minify) {
        buildArgs.push("--minify")
      }

      const buildProcess = spawn({
        cmd: buildArgs,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          ...options.env
        }
      })

      const exitCode = await buildProcess.exited
      const duration = Date.now() - startTime
      
      if (exitCode === 0) {
        console.log("✅ Server bundle completed")
        return {
          success: true,
          duration,
          outputPath: this.config.outDir,
          entryPoint: join(this.config.outDir, "index.js")
        }
      } else {
        const stderr = await new Response(buildProcess.stderr).text()
        console.error("❌ Server bundle failed")
        return {
          success: false,
          duration,
          error: stderr || "Server build failed"
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