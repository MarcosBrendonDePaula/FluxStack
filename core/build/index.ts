import { spawn } from "bun"
import { join } from "path"

export class FluxStackBuilder {
  private config: any

  constructor(config: any) {
    this.config = config
  }

  async buildClient() {
    console.log("⚡ Building client...")
    
    const clientPath = join(process.cwd(), this.config.clientPath)
    
    const buildProcess = spawn({
      cmd: ["bun", "run", "build"],
      cwd: clientPath,
      stdout: "pipe",
      stderr: "pipe"
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