import { Elysia } from "elysia"

export const corsMiddleware = new Elysia()
  .onRequest(({ set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*"
    set.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    set.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
  })
  .options("*", ({ set }) => {
    set.status = 200
    return ""
  })