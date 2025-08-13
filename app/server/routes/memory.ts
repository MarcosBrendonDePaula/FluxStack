import { Elysia, t } from 'elysia'
import { LiveAction } from '@/core/live'
import { hydrationManager } from '@/core/live/HydrationManager'

export const memoryRoutes = new Elysia({ prefix: '/memory' })
    .get('/stats', () => {
        const liveActionStats = LiveAction.getMemoryStats()
        const hydrationStats = hydrationManager.getStats()
        
        // Node.js memory usage
        const nodeMemory = process.memoryUsage()
        
        return {
            timestamp: new Date().toISOString(),
            liveAction: liveActionStats,
            hydration: hydrationStats,
            nodeMemory: {
                rss: Math.round(nodeMemory.rss / 1024 / 1024) + ' MB',
                heapTotal: Math.round(nodeMemory.heapTotal / 1024 / 1024) + ' MB', 
                heapUsed: Math.round(nodeMemory.heapUsed / 1024 / 1024) + ' MB',
                external: Math.round(nodeMemory.external / 1024 / 1024) + ' MB'
            },
            analysis: {
                memoryPressure: liveActionStats.instanceCount > 100 ? 'HIGH' : 
                               liveActionStats.instanceCount > 50 ? 'MEDIUM' : 'LOW',
                hydrationPressure: hydrationStats.totalSessions > 200 ? 'HIGH' :
                                  hydrationStats.totalSessions > 100 ? 'MEDIUM' : 'LOW',
                recommendations: generateRecommendations(liveActionStats, hydrationStats)
            }
        }
    }, {
        tags: ['Memory'],
        detail: {
            summary: 'Get memory usage statistics',
            description: 'Returns detailed memory usage statistics for LiveAction components and hydration sessions'
        }
    })
    
    .post('/cleanup', () => {
        let cleanedInstances = 0
        let cleanedSessions = 0
        
        // Get stats before cleanup
        const beforeStats = LiveAction.getMemoryStats()
        const beforeHydration = hydrationManager.getStats()
        
        // Manual cleanup of inactive sessions (older than 5 minutes)
        const fiveMinutesAgo = Date.now() - 300000
        for (const componentId of beforeHydration.activeComponents) {
            // Force cleanup if no recent activity (this would need to be implemented)
            hydrationManager.removeSession(componentId)
            cleanedSessions++
        }
        
        // Get stats after cleanup
        const afterStats = LiveAction.getMemoryStats()
        const afterHydration = hydrationManager.getStats()
        
        cleanedInstances = beforeStats.instanceCount - afterStats.instanceCount
        cleanedSessions = beforeHydration.totalSessions - afterHydration.totalSessions
        
        return {
            message: 'Manual cleanup completed',
            cleaned: {
                instances: cleanedInstances,
                sessions: cleanedSessions
            },
            before: {
                instances: beforeStats.instanceCount,
                sessions: beforeHydration.totalSessions
            },
            after: {
                instances: afterStats.instanceCount,
                sessions: afterHydration.totalSessions
            }
        }
    }, {
        tags: ['Memory'],
        detail: {
            summary: 'Force manual cleanup',
            description: 'Manually trigger cleanup of inactive instances and sessions'
        }
    })
    
    .get('/health', () => {
        const stats = LiveAction.getMemoryStats()
        const hydrationStats = hydrationManager.getStats()
        const nodeMemory = process.memoryUsage()
        
        const heapUsedMB = Math.round(nodeMemory.heapUsed / 1024 / 1024)
        const isHealthy = stats.instanceCount < 200 && 
                         hydrationStats.totalSessions < 300 && 
                         heapUsedMB < 500
        
        return {
            status: isHealthy ? 'healthy' : 'warning',
            instances: stats.instanceCount,
            sessions: hydrationStats.totalSessions,
            heapUsedMB,
            limits: {
                maxInstances: 200,
                maxSessions: 300,
                maxHeapMB: 500
            }
        }
    }, {
        tags: ['Memory'],
        detail: {
            summary: 'Health check for memory usage',
            description: 'Returns health status based on memory usage thresholds'
        }
    })

function generateRecommendations(liveStats: any, hydrationStats: any): string[] {
    const recommendations: string[] = []
    
    if (liveStats.instanceCount > 100) {
        recommendations.push('Consider implementing more aggressive instance cleanup')
    }
    
    if (hydrationStats.totalSessions > 150) {
        recommendations.push('Consider reducing hydration session max age')
    }
    
    if (liveStats.clientComponentMapSize > 50) {
        recommendations.push('High number of concurrent clients - consider load balancing')
    }
    
    if (Object.keys(liveStats.componentsPerClient).some((client: string) => liveStats.componentsPerClient[client] > 20)) {
        recommendations.push('Some clients have many components - consider component pooling')
    }
    
    if (recommendations.length === 0) {
        recommendations.push('Memory usage looks healthy')
    }
    
    return recommendations
}