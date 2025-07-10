import type { FluxStackConfig } from "../core/types"

export const config: FluxStackConfig = {
  port: 3000,
  vitePort: 5173,
  clientPath: "app/client",
  apiPrefix: "/api",
  cors: {
    origins: ["*"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    headers: ["Content-Type", "Authorization"]
  },
  build: {
    outDir: "dist",
    target: "bun"
  }
}