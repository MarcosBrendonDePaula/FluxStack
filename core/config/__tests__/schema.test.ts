/**
 * Tests for FluxStack Configuration Schema
 */

import { describe, it, expect } from 'bun:test'
import {
    defaultFluxStackConfig,
    environmentDefaults,
    fluxStackConfigSchema,
    type FluxStackConfig
} from '../schema'

describe('Configuration Schema', () => {
    describe('defaultFluxStackConfig', () => {
        it('should have all required properties', () => {
            expect(defaultFluxStackConfig).toHaveProperty('app')
            expect(defaultFluxStackConfig).toHaveProperty('server')
            expect(defaultFluxStackConfig).toHaveProperty('client')
            expect(defaultFluxStackConfig).toHaveProperty('build')
            expect(defaultFluxStackConfig).toHaveProperty('plugins')
            expect(defaultFluxStackConfig).toHaveProperty('logging')
            expect(defaultFluxStackConfig).toHaveProperty('monitoring')
        })

        it('should have valid app configuration', () => {
            expect(defaultFluxStackConfig.app.name).toBe('fluxstack-app')
            expect(defaultFluxStackConfig.app.version).toBe('1.0.0')
            expect(defaultFluxStackConfig.app.description).toBe('A FluxStack application')
        })

        it('should have valid server configuration', () => {
            expect(defaultFluxStackConfig.server.port).toBe(3000)
            expect(defaultFluxStackConfig.server.host).toBe('localhost')
            expect(defaultFluxStackConfig.server.apiPrefix).toBe('/api')
            expect(defaultFluxStackConfig.server.cors.origins).toContain('http://localhost:3000')
            expect(defaultFluxStackConfig.server.cors.methods).toContain('GET')
        })

        it('should have valid client configuration', () => {
            expect(defaultFluxStackConfig.client.port).toBe(5173)
            expect(defaultFluxStackConfig.client.proxy.target).toBe('http://localhost:3000')
            expect(defaultFluxStackConfig.client.build.sourceMaps).toBe(true)
        })

        it('should have valid build configuration', () => {
            expect(defaultFluxStackConfig.build.target).toBe('bun')
            expect(defaultFluxStackConfig.build.outDir).toBe('dist')
            expect(defaultFluxStackConfig.build.optimization.minify).toBe(true)
        })
    })

    describe('environmentDefaults', () => {
        it('should have development overrides', () => {
            expect(environmentDefaults.development.logging?.level).toBe('debug')
            expect(environmentDefaults.development.logging?.format).toBe('pretty')
            expect(environmentDefaults.development.build?.optimization.minify).toBe(false)
        })

        it('should have production overrides', () => {
            expect(environmentDefaults.production.logging?.level).toBe('warn')
            expect(environmentDefaults.production.logging?.format).toBe('json')
            expect(environmentDefaults.production.monitoring?.enabled).toBe(true)
        })

        it('should have test overrides', () => {
            expect(environmentDefaults.test.logging?.level).toBe('error')
            expect(environmentDefaults.test.server?.port).toBe(0)
            expect(environmentDefaults.test.client?.port).toBe(0)
        })
    })

    describe('fluxStackConfigSchema', () => {
        it('should be a valid JSON schema', () => {
            expect(fluxStackConfigSchema).toHaveProperty('type', 'object')
            expect(fluxStackConfigSchema).toHaveProperty('properties')
            expect(fluxStackConfigSchema).toHaveProperty('required')
        })

        it('should require essential properties', () => {
            const required = fluxStackConfigSchema.required
            expect(required).toContain('app')
            expect(required).toContain('server')
            expect(required).toContain('client')
            expect(required).toContain('build')
            expect(required).toContain('plugins')
            expect(required).toContain('logging')
            expect(required).toContain('monitoring')
        })

        it('should have proper app schema', () => {
            const appSchema = fluxStackConfigSchema.properties.app
            expect(appSchema.required).toContain('name')
            expect(appSchema.required).toContain('version')
            expect(appSchema.properties.version.pattern).toBe('^\\d+\\.\\d+\\.\\d+')
        })

        it('should have proper server schema', () => {
            const serverSchema = fluxStackConfigSchema.properties.server
            expect(serverSchema.properties.port.minimum).toBe(1)
            expect(serverSchema.properties.port.maximum).toBe(65535)
            expect(serverSchema.required).toContain('cors')
        })
    })

    describe('Type Safety', () => {
        it('should accept valid configuration', () => {
            const validConfig: FluxStackConfig = {
                ...defaultFluxStackConfig,
                app: {
                    name: 'test-app',
                    version: '2.0.0'
                }
            }

            expect(validConfig.app.name).toBe('test-app')
            expect(validConfig.server.port).toBe(3000)
        })

        it('should enforce type constraints', () => {
            // TypeScript should catch these at compile time
            // This test ensures our types are properly defined
            const config: FluxStackConfig = defaultFluxStackConfig

            expect(typeof config.server.port).toBe('number')
            expect(Array.isArray(config.server.cors.origins)).toBe(true)
            expect(typeof config.build.optimization.minify).toBe('boolean')
        })
    })
})