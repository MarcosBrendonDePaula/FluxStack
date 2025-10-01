/**
 * Express.js Example using @fluxstack/crypto-auth
 */

const express = require('express')
const { createExpressAuthMiddleware, SessionRoutes, AdminRoutes } = require('../dist/server')

const app = express()
app.use(express.json())

// Configure auth middleware
const authMiddleware = createExpressAuthMiddleware({
  adminKeys: ['admin_key_1', 'admin_key_2'], // Replace with real admin keys
  maxTimeDrift: 5 * 60 * 1000 // 5 minutes
})

// Session routes (no auth required)
const sessionRoutes = new SessionRoutes()
app.use('/api/session', sessionRoutes.createExpressRoutes())

// Protected routes (auth required)
app.use('/api/protected', authMiddleware, (req, res) => {
  res.json({
    message: 'This is a protected endpoint',
    user: req.auth.user,
    sessionId: req.auth.sessionId
  })
})

// Admin routes
const adminRoutes = new AdminRoutes()
app.get('/api/admin/stats', async (req, res) => {
  const result = await adminRoutes.handleGetStats(req.headers)
  res.json(result)
})

app.post('/api/admin/login', async (req, res) => {
  const result = await adminRoutes.handleLogin(req.body)
  res.json(result)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📋 Session endpoints: http://localhost:${PORT}/api/session/*`)
  console.log(`🔐 Protected endpoint: http://localhost:${PORT}/api/protected`)
  console.log(`👑 Admin endpoints: http://localhost:${PORT}/api/admin/*`)
})