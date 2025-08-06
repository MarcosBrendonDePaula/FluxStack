#!/usr/bin/env bun

import { FluxStackBuilder } from "../build"
import { ProjectCreator } from "../templates/create-project"
import { config } from "@/config/fluxstack.config"

const command = process.argv[2]

switch (command) {
  case "dev":
    console.log("⚡ FluxStack Full-Stack Development")
    console.log("🌐 Frontend + Backend: http://localhost:3000")
    console.log("📦 Starting services...")
    console.log()
    
    // Start with Bun watch for hot reload (usando servidor principal com plugin inteligente)
    const { spawn } = await import("child_process")
    const devProcess = spawn("bun", ["--watch", "app/server/index.ts"], {
      stdio: "inherit",
      cwd: process.cwd()
    })
    
    // Handle process cleanup
    process.on('SIGINT', () => {
      devProcess.kill('SIGINT')
      process.exit(0)
    })
    break

  case "frontend":
    await import("@/app/client/frontend-only")
    break

  case "backend":
    console.log("⚡ FluxStack Backend Development")
    console.log("🚀 API Server: http://localhost:3001")
    console.log("📦 Starting backend with hot reload...")
    console.log()
    
    // Start backend with Bun watch for hot reload
    const { spawn: spawnBackend } = await import("child_process")
    const backendProcess = spawnBackend("bun", ["--watch", "app/server/backend-only.ts"], {
      stdio: "inherit",
      cwd: process.cwd()
    })
    
    // Handle process cleanup
    process.on('SIGINT', () => {
      backendProcess.kill('SIGINT')
      process.exit(0)
    })
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
    await import("@/dist/index.js")
    break

  case "create":
    const projectName = process.argv[3]
    const template = process.argv[4]
    
    if (!projectName) {
      console.error("❌ Please provide a project name: flux create my-app")
      console.error()
      console.error("Usage:")
      console.error("  flux create <project-name> [template]")
      console.error()
      console.error("Templates:")
      console.error("  basic    Basic FluxStack project (default)")
      console.error("  full     Full-featured project with examples")
      process.exit(1)
    }

    // Validate project name
    if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
      console.error("❌ Project name can only contain letters, numbers, hyphens, and underscores")
      process.exit(1)
    }

    try {
      const creator = new ProjectCreator({
        name: projectName,
        template: template as 'basic' | 'full' || 'basic'
      })
      
      await creator.create()
    } catch (error) {
      console.error("❌ Failed to create project:", error.message)
      process.exit(1)
    }
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