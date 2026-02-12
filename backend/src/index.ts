/**
 * Locker System Backend - Main Entry Point
 *
 * Module Structure:
 * - shared/     : Database, middleware, services, types
 * - modules/
 *   - auth/     : Admin authentication
 *   - lockers/  : Locker management
 *   - rentals/  : Reservations and analytics
 *   - payments/ : Stripe integration
 *   - students/ : Student management
 *   - waitlist/ : Waitlist management
 */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

// Shared utilities
import { initializeDatabase, seedLockers, runMigrations } from './shared/schema.js'
import { errorHandler, notFoundHandler } from './shared/middleware/index.js'

// Module routes
import { lockerRoutes } from './modules/lockers/index.js'
import { stripeRoutes } from './modules/payments/index.js'
import { studentRoutes } from './modules/students/index.js'
import { adminRoutes } from './modules/auth/index.js'
import { waitlistRoutes } from './modules/waitlist/index.js'
import { cronRoutes } from './modules/rentals/index.js'

const app = express()
const port = process.env.PORT || 4001

// Initialize database
initializeDatabase()
runMigrations()
seedLockers()

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4173',
  credentials: true,
}))
app.use(cookieParser())

// Stripe webhook needs raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))

// JSON parsing for all other routes
app.use(express.json())

// Routes - organized by module
app.use('/api/lockers', lockerRoutes)           // Lockers Module
app.use('/api/stripe', stripeRoutes)            // Payments Module
app.use('/api/students', studentRoutes)         // Students Module
app.use('/api/admin', adminRoutes)              // Auth Module
app.use('/api/admin/waitlist', waitlistRoutes)  // Waitlist Module
app.use('/api/cron', cronRoutes)                // Rentals Module (cron jobs)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`)
  console.log('Modules loaded: auth, lockers, rentals, payments, students, waitlist')
})

export default app
