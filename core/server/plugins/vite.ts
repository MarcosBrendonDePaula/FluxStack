import { join } from "path"
import type { Plugin } from "../../types"

export const vitePlugin: Plugin = {
  name: "vite",
  setup: async (context, app) => {
    if (!context.isDevelopment) return
    
    // Verificar se Vite já está rodando
    const vitePort = context.config.vitePort || 5173
    const isViteRunning = await checkViteRunning(vitePort)
    
    if (isViteRunning) {
      console.log(`   ✅ Vite já está rodando na porta ${vitePort}`)
      console.log("   🔄 Backend hot reload independente do frontend")
      return
    }
    
    try {
      console.log("   🎨 Iniciando Vite dev server integrado...")
      
      // Usar spawn para iniciar Vite como processo filho (agora no root)
      const { spawn } = await import("child_process")
      const viteProcess = spawn("vite", ["--config", "vite.config.ts"], {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
        detached: false
      })
      
      // Capturar output do Vite
      viteProcess.stdout?.on('data', (data) => {
        const output = data.toString()
        if (output.includes("ready in") || output.includes("Local:")) {
          console.log(`   ${output.trim()}`)
        }
      })
      
      viteProcess.stderr?.on('data', (data) => {
        const error = data.toString()
        // Filtrar saídas normais do Bun que não são erros reais
        if (!error.includes("SIGTERM") && 
            !error.includes("$ vite") && 
            !error.trim().startsWith("$") && 
            error.trim().length > 0) {
          console.error(`   [Vite Error] ${error.trim()}`)
        }
      })
      
      console.log(`   ✅ Vite iniciado na porta ${vitePort}`)
      console.log("   🔄 Hot reload independente entre frontend e backend")
      
      // Cleanup específico para este processo
      const cleanup = () => {
        if (viteProcess && !viteProcess.killed) {
          viteProcess.kill('SIGTERM')
        }
      }
      
      process.on("SIGINT", cleanup)
      process.on("SIGTERM", cleanup)
      
    } catch (error) {
      console.error("   ❌ Erro ao inicializar Vite:", error.message)
    }
  }
}

async function checkViteRunning(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}`, {
      signal: AbortSignal.timeout(1000)
    })
    return response.status >= 200 && response.status < 500
  } catch (error) {
    return false
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