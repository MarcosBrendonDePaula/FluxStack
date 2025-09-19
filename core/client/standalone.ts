// Standalone frontend development
import { spawn } from "bun"
import { join } from "path"

export const startFrontendOnly = (config: any = {}) => {
  const clientPath = config.clientPath || "app/client"
  const port = config.vitePort || process.env.FRONTEND_PORT || 5173
  const apiUrl = config.apiUrl || process.env.API_URL || 'http://localhost:3000/api'
  
  console.log(`⚛️  FluxStack Frontend`)
  console.log(`🌐 http://${process.env.HOST || 'localhost'}:${port}`)
  console.log(`🔗 API: ${apiUrl}`)
  console.log()
  
  const viteProcess = spawn({
    cmd: ["bun", "run", "dev"],
    cwd: join(process.cwd(), clientPath),
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      VITE_API_URL: apiUrl,
      PORT: port.toString(),
      HOST: process.env.HOST || 'localhost'
    }
  })

  if (viteProcess.stdout) {
    viteProcess.stdout.pipeTo(new WritableStream({
      write(chunk) {
        const output = new TextDecoder().decode(chunk)
        // Filtrar mensagens desnecessárias do Vite
        if (!output.includes("hmr update") && !output.includes("Local:")) {
          console.log(output)
        }
      }
    })).catch(() => {}) // Ignore pipe errors
  }

  if (viteProcess.stderr) {
    viteProcess.stderr.pipeTo(new WritableStream({
      write(chunk) {
        const error = new TextDecoder().decode(chunk)
        console.error(error)
      }
    })).catch(() => {}) // Ignore pipe errors
  }

  // Cleanup ao sair
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping frontend...")
    viteProcess.kill()
    process.exit(0)
  })
  
  return viteProcess
}