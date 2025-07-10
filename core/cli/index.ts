#!/usr/bin/env bun

import { FluxStackBuilder } from "../build"
import { config } from "@/config/fluxstack.config"

const command = process.argv[2]

switch (command) {
  case "dev":
    console.log("⚡ FluxStack Full-Stack Development")
    console.log("🌐 Frontend + Backend: http://localhost:3000")
    console.log("📦 Starting services...")
    console.log()
    await import("../../app/server")
    break

  case "frontend":
    await import("../../app/client/frontend-only")
    break

  case "backend":
    await import("../../app/server/backend-only")
    break

  case "build":
    const builder = new FluxStackBuilder(config)
    await builder.build()
    break

  case "build:frontend":
    const frontendBuilder = new FluxStackBuilder(config)
    await frontendBuilder.buildClient()
    break

  case "build:backend":
    const backendBuilder = new FluxStackBuilder(config)
    await backendBuilder.buildServer()
    break

  case "start":
    console.log("🚀 Starting FluxStack production server...")
    await import("../../dist/index.js")
    break

  case "create":
    const projectName = process.argv[3]
    if (!projectName) {
      console.error("❌ Please provide a project name: flux create my-app")
      process.exit(1)
    }
    console.log(`🎉 Creating new FluxStack project: ${projectName}`)
    // TODO: Implementar criação de projeto
    break

  default:
    console.log(`
⚡ FluxStack Framework CLI

Usage:
  flux dev             Start full-stack development server
  flux frontend        Start frontend only (Vite dev server)
  flux backend         Start backend only (API server)
  flux build           Build both frontend and backend
  flux build:frontend  Build frontend only
  flux build:backend   Build backend only
  flux start           Start production server
  flux create          Create new project

Examples:
  flux dev                    # Full-stack development
  flux frontend               # Frontend only (port 5173)
  flux backend                # Backend only (port 3001)
  flux create my-app          # Create new project

Alternative commands:
  fluxstack dev              # Same as flux dev
  bun run dev:frontend       # Direct frontend start
  bun run dev:backend        # Direct backend start

Environment Variables:
  FRONTEND_PORT=5173         # Frontend port
  BACKEND_PORT=3001          # Backend port  
  API_URL=http://localhost:3001  # API URL for frontend
    `)
}