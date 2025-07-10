import type { Plugin } from "../../types"

export const loggerPlugin: Plugin = {
  name: "logger",
  setup: (context) => {
    // Plugin será aplicado ao Elysia pelo framework
    return {
      onRequest: ({ request, path }) => {
        const timestamp = new Date().toLocaleTimeString()
        const method = request.method
        console.log(`[${timestamp}] ${method} ${path}`)
      },
      onError: ({ error, request, path }) => {
        const timestamp = new Date().toLocaleTimeString()
        const method = request.method
        console.error(`[${timestamp}] ERROR ${method} ${path}:`, error.message)
      }
    }
  }
}