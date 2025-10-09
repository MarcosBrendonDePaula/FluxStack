/**
 * Database Configuration
 * Laravel-style declarative config with validation
 */

import { defineConfig, config } from '@/core/utils/config-schema'

/**
 * Database configuration schema
 */
export const databaseConfig = defineConfig({
  // Connection
  url: {
    type: 'string',
    env: 'DATABASE_URL',
    default: undefined,
    required: false,
    validate: (value) => {
      if (!value) return true // Optional
      if (!value.includes('://')) {
        return 'DATABASE_URL must be a valid connection string (e.g., postgres://...)'
      }
      return true
    },
    description: 'Full database connection URL (overrides individual settings)'
  },

  host: config.string('DB_HOST', 'localhost'),

  port: config.number('DB_PORT', 5432),

  database: {
    type: 'string',
    env: 'DB_NAME',
    default: undefined,
    required: false,
    description: 'Database name'
  },

  user: {
    type: 'string',
    env: 'DB_USER',
    default: undefined,
    required: false
  },

  password: {
    type: 'string',
    env: 'DB_PASSWORD',
    default: undefined,
    required: false
  },

  // Connection pool
  poolMin: {
    type: 'number',
    env: 'DB_POOL_MIN',
    default: 2,
    validate: (value) => value >= 0 || 'Pool min must be >= 0'
  },

  poolMax: {
    type: 'number',
    env: 'DB_POOL_MAX',
    default: 10,
    validate: (value) => value > 0 || 'Pool max must be > 0'
  },

  // SSL
  ssl: config.boolean('DB_SSL', false),

  // Timeouts
  connectionTimeout: {
    type: 'number',
    env: 'DB_CONNECTION_TIMEOUT',
    default: 30000,
    description: 'Connection timeout in milliseconds'
  },

  queryTimeout: {
    type: 'number',
    env: 'DB_QUERY_TIMEOUT',
    default: 60000,
    description: 'Query timeout in milliseconds'
  },

  // Features
  enableLogging: config.boolean('DB_ENABLE_LOGGING', false),

  enableMigrations: config.boolean('DB_ENABLE_MIGRATIONS', true),

  migrationsTable: config.string('DB_MIGRATIONS_TABLE', 'migrations')
})

// Export type
export type DatabaseConfig = typeof databaseConfig

// Export default
export default databaseConfig
