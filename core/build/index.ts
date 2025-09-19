import { spawn } from "bun"
import type { FluxStackConfig } from "../config"

export class FluxStackBuilder {
  private config: FluxStackConfig

  constructor(config: FluxStackConfig) {
    this.config = config
  }

  async buildClient() {
    console.log("⚡ Building client...")
    
    const buildProcess = spawn({
      cmd: ["bunx", "vite", "build", "--config", "vite.config.ts"],
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        VITE_BUILD_OUTDIR: this.config.client.build.outDir,
        VITE_BUILD_MINIFY: this.config.client.build.minify.toString(),
        VITE_BUILD_SOURCEMAPS: this.config.client.build.sourceMaps.toString()
      }
    })

    const exitCode = await buildProcess.exited
    
    if (exitCode === 0) {
      console.log("✅ Client build completed")
    } else {
      console.error("❌ Client build failed")
      process.exit(1)
    }
  }

  async buildServer() {
    console.log("⚡ Building server...")
    
    const buildProcess = spawn({
      cmd: [
        "bun", "build", 
        "app/server/index.ts", 
        "--outdir", this.config.build.outDir,
        "--target", this.config.build.target
      ],
      stdout: "pipe",
      stderr: "pipe"
    })

    const exitCode = await buildProcess.exited
    
    if (exitCode === 0) {
      console.log("✅ Server build completed")
    } else {
      console.error("❌ Server build failed")
      process.exit(1)
    }
  }

  async build() {
    console.log("⚡ FluxStack Framework - Building...")
    await this.buildClient()
    await this.buildServer()
    console.log("🎉 Build completed successfully!")
  }
}