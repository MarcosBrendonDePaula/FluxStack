// User application entry point
import { FluxStackFramework, loggerPlugin, vitePlugin, swaggerPlugin, staticPlugin } from "@/core/server"
import { isDevelopment } from "@/core/utils/helpers"
import { apiRoutes } from "./routes"

// Criar aplicação com framework
const app = new FluxStackFramework({
  server: {
    port: 3000,
    host: "localhost",
    apiPrefix: "/api",
    cors: {
      origins: ["*"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      headers: ["*"]
    },
    middleware: []
  },
  app: {
    name: "FluxStack",
    version: "1.0.0"
  },
  client: {
    port: 5173,
    proxy: {
      target: "http://localhost:3000"
    },
    build: {
      sourceMaps: true,
      minify: false,
      target: "es2020",
      outDir: "dist"
    }
  }
})


// Usar plugins de infraestrutura primeiro (mas NÃO o Swagger ainda)
app.use(loggerPlugin)

// Usar plugins condicionalmente baseado no ambiente
if (isDevelopment()) {
  app.use(vitePlugin)
} else {
  app.use(staticPlugin)
}
  

// Registrar rotas da aplicação PRIMEIRO
app.routes(apiRoutes)

// Swagger por último para descobrir todas as rotas
app.use(swaggerPlugin)



// Iniciar servidor
app.listen()

// Exportar tipo da aplicação para Eden Treaty (método correto)
export type App = typeof framework