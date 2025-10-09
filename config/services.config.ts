/**
 * External Services Configuration
 * Laravel-style declarative config for third-party services
 */

import { defineConfig, defineNestedConfig, config } from '@/core/utils/config-schema'

/**
 * Email service configuration
 */
const emailSchema = {
  // SMTP
  host: config.string('SMTP_HOST'),

  port: {
    type: 'number' as const,
    env: 'SMTP_PORT',
    default: 587,
    validate: (value: number) => value > 0 || 'SMTP port must be positive'
  },

  user: config.string('SMTP_USER'),
  password: config.string('SMTP_PASSWORD'),

  secure: config.boolean('SMTP_SECURE', false),

  from: {
    type: 'string' as const,
    env: 'SMTP_FROM',
    default: 'noreply@example.com',
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value) || 'From email must be valid'
    }
  },

  replyTo: config.string('SMTP_REPLY_TO')
}

/**
 * JWT authentication configuration
 */
const jwtSchema = {
  secret: {
    type: 'string' as const,
    env: 'JWT_SECRET',
    default: undefined,
    required: false,
    validate: (value: string) => {
      if (!value) return true // Optional
      if (value.length < 32) {
        return 'JWT secret must be at least 32 characters for security'
      }
      return true
    }
  },

  expiresIn: config.string('JWT_EXPIRES_IN', '24h'),

  algorithm: config.enum(
    'JWT_ALGORITHM',
    ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'] as const,
    'HS256'
  ),

  issuer: config.string('JWT_ISSUER', 'fluxstack'),

  audience: config.string('JWT_AUDIENCE')
}

/**
 * Storage configuration
 */
const storageSchema = {
  provider: config.enum(
    'STORAGE_PROVIDER',
    ['local', 's3', 'gcs', 'azure'] as const,
    'local'
  ),

  uploadPath: config.string('UPLOAD_PATH', './uploads'),

  maxFileSize: {
    type: 'number' as const,
    env: 'MAX_FILE_SIZE',
    default: 10485760, // 10MB
    validate: (value: number) => value > 0 || 'Max file size must be positive'
  },

  allowedTypes: config.array('ALLOWED_FILE_TYPES', ['image/*', 'application/pdf']),

  // S3 specific
  s3Bucket: config.string('S3_BUCKET'),
  s3Region: config.string('S3_REGION', 'us-east-1'),
  s3AccessKey: config.string('S3_ACCESS_KEY'),
  s3SecretKey: config.string('S3_SECRET_KEY')
}

/**
 * Redis configuration
 */
const redisSchema = {
  host: config.string('REDIS_HOST', 'localhost'),
  port: config.number('REDIS_PORT', 6379),
  password: config.string('REDIS_PASSWORD'),
  db: config.number('REDIS_DB', 0),

  keyPrefix: config.string('REDIS_KEY_PREFIX', 'fluxstack:'),

  enableTls: config.boolean('REDIS_TLS', false)
}

/**
 * Export all service configs as nested object
 */
export const servicesConfig = defineNestedConfig({
  email: emailSchema,
  jwt: jwtSchema,
  storage: storageSchema,
  redis: redisSchema
})

// Export types
export type EmailConfig = typeof servicesConfig.email
export type JWTConfig = typeof servicesConfig.jwt
export type StorageConfig = typeof servicesConfig.storage
export type RedisConfig = typeof servicesConfig.redis

// Export default
export default servicesConfig
