// Standalone frontend development
import { spawn } from "bun"
import { join } from "path"

export const startFrontendOnly = (config: any = {}) => {
  const clientPath = config.clientPath || "app/client"
  const port = config.vitePort || 5173
  const apiUrl = config.apiUrl || "http://localhost:3001"
  
  console.log(`⚛️  FluxStack Frontend`)
  console.log(`🌐 http://localhost:${port}`)
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
      PORT: port.toString()
    }
  })

  viteProcess.stdout.readable?.pipeTo(new WritableStream({
    write(chunk) {
      const output = new TextDecoder().decode(chunk)
      // Filtrar mensagens desnecessárias do Vite
      if (!output.includes("hmr update") && !output.includes("Local:")) {
        console.log(output)
      }
    }
  }))

  viteProcess.stderr.readable?.pipeTo(new WritableStream({
    write(chunk) {
      const error = new TextDecoder().decode(chunk)
      console.error(error)
    }
  }))

  // Cleanup ao sair
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping frontend...")
    viteProcess.kill()
    process.exit(0)
  })
  
  return viteProcess
}