import { spawn } from "bun"
import { join } from "path"
import type { Plugin } from "../../types"

let viteProcess: any = null

export const vitePlugin: Plugin = {
  name: "vite",
  setup: (context, app) => {
    if (!context.isDevelopment) return
    
    // Iniciar Vite dev server
    startViteServer(context)
    
    // Cleanup ao sair
    process.on("SIGINT", () => {
      stopViteServer()
      process.exit(0)
    })
  }
}

function startViteServer(context: any) {
  viteProcess = spawn({
    cmd: ["bun", "run", "dev"],
    cwd: join(process.cwd(), context.config.clientPath),
    stdout: "pipe",
    stderr: "pipe",
  })

  viteProcess.stdout.readable?.pipeTo(new WritableStream({
    write(chunk) {
      const output = new TextDecoder().decode(chunk)
      // Filtrar apenas mensagens importantes do Vite
      if (output.includes("ready in") || output.includes("Local:") || output.includes("Network:")) {
        console.log(`   ${output.trim()}`)
      }
    }
  }))
}

function stopViteServer() {
  if (viteProcess) {
    viteProcess.kill()
    viteProcess = null
  }
}

export const proxyToVite = async (request: Request, vitePort: number) => {
  const url = new URL(request.url)
  
  if (url.pathname.startsWith("/api")) {
    return new Response("Not Found", { status: 404 })
  }
  
  try {
    const viteUrl = `http://localhost:${vitePort}${url.pathname}${url.search}`
    const response = await fetch(viteUrl)
    return response
  } catch (error) {
    return new Response("Vite server not ready", { status: 503 })
  }
}