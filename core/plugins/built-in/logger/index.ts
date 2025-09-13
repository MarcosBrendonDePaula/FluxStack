import type { Plugin } from "../../../plugins/types"
import { log } from "../../../utils/logger"

export const loggerPlugin: Plugin = {
  name: "logger",
  version: "1.0.0",
  description: "Built-in logging plugin for FluxStack",
  setup: async (context) => {
    log.plugin("logger", "Logger plugin initialized", {
      environment: context.config.app?.name || 'fluxstack'
    })
  },
  onServerStart: async (context) => {
    log.plugin("logger", "Logger plugin server started")
  },
  onServerStop: async (context) => {
    log.plugin("logger", "Logger plugin server stopped")
  }
}