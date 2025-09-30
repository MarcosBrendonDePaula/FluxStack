/**
 * Notification Service
 * Handles application notifications and messaging
 */

import { BaseService } from '../../../core/server/services/index.js'

export interface Notification {
    id: string
    userId?: number
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    data?: Record<string, any>
    read: boolean
    createdAt: string
    expiresAt?: string
}

export interface CreateNotificationData {
    userId?: number
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    data?: Record<string, any>
    expiresIn?: number // seconds
}

export class NotificationService extends BaseService {
    private notifications: Notification[] = []

    async initialize(): Promise<void> {
        await super.initialize()

        // Start cleanup interval for expired notifications
        setInterval(() => {
            this.cleanupExpiredNotifications()
        }, 60000) // Check every minute

        this.logger.info('NotificationService initialized')
    }

    /**
     * Create a new notification
     */
    async createNotification(data: CreateNotificationData): Promise<Notification> {
        return this.executeWithLogging('createNotification', async () => {
            this.validateRequired(data, ['type', 'title', 'message'])

            const notification: Notification = {
                id: this.generateId(),
                userId: data.userId,
                type: data.type,
                title: data.title.trim(),
                message: data.message.trim(),
                data: data.data,
                read: false,
                createdAt: new Date().toISOString(),
                expiresAt: data.expiresIn
                    ? new Date(Date.now() + data.expiresIn * 1000).toISOString()
                    : undefined
            }

            this.notifications.push(notification)

            this.logger.info('Notification created', {
                notificationId: notification.id,
                userId: notification.userId,
                type: notification.type
            })

            return notification
        }, { userId: data.userId, type: data.type })
    }

    /**
     * Get notifications for a user
     */
    async getUserNotifications(
        userId: number,
        options: {
            unreadOnly?: boolean
            limit?: number
            offset?: number
        } = {}
    ): Promise<{
        notifications: Notification[]
        total: number
        unreadCount: number
    }> {
        return this.executeWithLogging('getUserNotifications', async () => {
            let userNotifications = this.notifications.filter(n => n.userId === userId)

            if (options.unreadOnly) {
                userNotifications = userNotifications.filter(n => !n.read)
            }

            // Sort by creation date (newest first)
            userNotifications.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )

            const total = userNotifications.length
            const unreadCount = this.notifications.filter(n =>
                n.userId === userId && !n.read
            ).length

            // Apply pagination
            const offset = options.offset || 0
            const limit = options.limit || 50
            const paginatedNotifications = userNotifications.slice(offset, offset + limit)

            return {
                notifications: paginatedNotifications,
                total,
                unreadCount
            }
        }, { userId, ...options })
    }

    /**
     * Get global notifications (not user-specific)
     */
    async getGlobalNotifications(options: {
        limit?: number
        offset?: number
    } = {}): Promise<{
        notifications: Notification[]
        total: number
    }> {
        return this.executeWithLogging('getGlobalNotifications', async () => {
            let globalNotifications = this.notifications.filter(n => !n.userId)

            // Sort by creation date (newest first)
            globalNotifications.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )

            const total = globalNotifications.length

            // Apply pagination
            const offset = options.offset || 0
            const limit = options.limit || 50
            const paginatedNotifications = globalNotifications.slice(offset, offset + limit)

            return {
                notifications: paginatedNotifications,
                total
            }
        }, options)
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string, userId?: number): Promise<boolean> {
        return this.executeWithLogging('markAsRead', async () => {
            const notification = this.notifications.find(n => n.id === notificationId)

            if (!notification) {
                return false
            }

            // Check if user has permission to mark this notification as read
            if (notification.userId && notification.userId !== userId) {
                throw new Error('Permission denied')
            }

            notification.read = true

            this.logger.info('Notification marked as read', {
                notificationId,
                userId: notification.userId
            })

            return true
        }, { notificationId, userId })
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: number): Promise<number> {
        return this.executeWithLogging('markAllAsRead', async () => {
            const userNotifications = this.notifications.filter(n =>
                n.userId === userId && !n.read
            )

            userNotifications.forEach(notification => {
                notification.read = true
            })

            const count = userNotifications.length

            this.logger.info('All notifications marked as read', { userId, count })

            return count
        }, { userId })
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId: string, userId?: number): Promise<boolean> {
        return this.executeWithLogging('deleteNotification', async () => {
            const index = this.notifications.findIndex(n => n.id === notificationId)

            if (index === -1) {
                return false
            }

            const notification = this.notifications[index]

            // Check if user has permission to delete this notification
            if (notification.userId && notification.userId !== userId) {
                throw new Error('Permission denied')
            }

            this.notifications.splice(index, 1)

            this.logger.info('Notification deleted', {
                notificationId,
                userId: notification.userId
            })

            return true
        }, { notificationId, userId })
    }

    /**
     * Broadcast notification to all users
     */
    async broadcastNotification(data: Omit<CreateNotificationData, 'userId'>): Promise<Notification> {
        return this.executeWithLogging('broadcastNotification', async () => {
            return this.createNotification(data)
        }, { type: data.type })
    }

    /**
     * Get notification statistics
     */
    async getNotificationStats(): Promise<{
        total: number
        unread: number
        byType: Record<string, number>
        recentCount: number
    }> {
        return this.executeWithLogging('getNotificationStats', async () => {
            const total = this.notifications.length
            const unread = this.notifications.filter(n => !n.read).length

            // Count by type
            const byType: Record<string, number> = {}
            this.notifications.forEach(n => {
                byType[n.type] = (byType[n.type] || 0) + 1
            })

            // Recent notifications (last 24 hours)
            const dayAgo = new Date()
            dayAgo.setDate(dayAgo.getDate() - 1)
            const recentCount = this.notifications.filter(n =>
                new Date(n.createdAt) > dayAgo
            ).length

            return {
                total,
                unread,
                byType,
                recentCount
            }
        })
    }

    /**
     * Cleanup expired notifications
     */
    private async cleanupExpiredNotifications(): Promise<void> {
        const now = new Date()
        const initialCount = this.notifications.length

        this.notifications = this.notifications.filter(notification => {
            if (!notification.expiresAt) {
                return true
            }

            return new Date(notification.expiresAt) > now
        })

        const removedCount = initialCount - this.notifications.length

        if (removedCount > 0) {
            this.logger.info(`Cleaned up ${removedCount} expired notifications`)
        }
    }

    /**
     * Generate unique notification ID
     */
    private generateId(): string {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
}