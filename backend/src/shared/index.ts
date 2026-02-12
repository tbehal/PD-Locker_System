/**
 * Shared Module Exports
 * Common utilities, services, and middleware used across all modules
 */

// Database
export { default as db } from './db.js'
export { initializeDatabase, seedLockers, runMigrations } from './schema.js'

// Types
export type { ApiResponse, PaginatedResponse } from './types.js'

// Middleware
export { AppError, errorHandler, notFoundHandler, validateBody, validateQuery } from './middleware/index.js'

// Services
export { sendPaymentLinkEmail, sendWelcomeEmail, sendExpiryReminderEmail, syncContactToHubSpot } from './services/index.js'
