/**
 * Authentication Middleware
 * Handles user authentication and authorization
 */

import type { Context } from 'elysia'

export interface AuthUser {
  id: number
  email: string
  name: string
  role: 'admin' | 'user'
}

export interface AuthContext extends Context {
  user?: AuthUser
}

/**
 * Authentication middleware
 * Validates JWT tokens and sets user context
 */
export const authMiddleware = {
  name: 'auth',
  
  beforeHandle: async (context: AuthContext) => {
    const authHeader = context.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    try {
      // In a real application, you would validate the JWT token here
      // For demo purposes, we'll simulate token validation
      const user = await validateToken(token)
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Set user in context
      context.user = user
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Token validation failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

/**
 * Optional authentication middleware
 * Sets user context if token is present, but doesn't require it
 */
export const optionalAuthMiddleware = {
  name: 'optional-auth',
  
  beforeHandle: async (context: AuthContext) => {
    const authHeader = context.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      try {
        const user = await validateToken(token)
        if (user) {
          context.user = user
        }
      } catch (error) {
        // Ignore errors for optional auth
      }
    }
  }
}

/**
 * Role-based authorization middleware
 */
export const requireRole = (requiredRole: 'admin' | 'user') => ({
  name: `require-${requiredRole}`,
  
  beforeHandle: async (context: AuthContext) => {
    if (!context.user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (requiredRole === 'admin' && context.user.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
})

/**
 * Validate JWT token (mock implementation)
 * In a real application, this would use a proper JWT library
 */
async function validateToken(token: string): Promise<AuthUser | null> {
  // Mock token validation
  // In reality, you would decode and verify the JWT
  
  if (token === 'valid-admin-token') {
    return {
      id: 1,
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin'
    }
  }
  
  if (token === 'valid-user-token') {
    return {
      id: 2,
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user'
    }
  }
  
  return null
}