import { Elysia } from "elysia"

export const loggerMiddleware = new Elysia()
  .onRequest(({ request, path }) => {
    const timestamp = new Date().toISOString()
    const method = request.method
    console.log(`[${timestamp}] ${method} ${path}`)
  })
  .onError(({ error, request, path }) => {
    const timestamp = new Date().toISOString()
    const method = request.method
    console.error(`[${timestamp}] ERROR ${method} ${path}:`, error.message)
  })