import { spawn } from "bun"
import { join } from "path"
import { config } from "../config"

let viteProcess: any = null

export const startViteServer = () => {
  if (!config.isDevelopment) return

  console.log("🚀 Iniciando servidor Vite...")
  
  viteProcess = spawn({
    cmd: ["bun", "run", "dev"],
    cwd: join(process.cwd(), config.clientPath),
    stdout: "pipe",
    stderr: "pipe",
  })

  viteProcess.stdout.readable?.pipeTo(new WritableStream({
    write(chunk) {
      const output = new TextDecoder().decode(chunk)
      if (!output.includes("hmr update")) {
        console.log(output)
      }
    }
  }))

  return viteProcess
}

export const stopViteServer = () => {
  if (viteProcess) {
    viteProcess.kill()
    viteProcess = null
  }
}

export const proxyToVite = async (request: Request) => {
  const url = new URL(request.url)
  
  if (url.pathname.startsWith("/api")) {
    return new Response("Not Found", { status: 404 })
  }
  
  try {
    const viteUrl = `http://localhost:${config.vitePort}${url.pathname}${url.search}`
    const response = await fetch(viteUrl)
    return response
  } catch (error) {
    return new Response("Vite server not ready", { status: 503 })
  }
}