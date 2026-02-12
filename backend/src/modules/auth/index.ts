/**
 * Auth Module
 * Handles admin authentication and authorization
 */

// Types
export type { AdminLoginRequest, AdminTokenPayload } from './admin.types.js'

// Middleware
export { adminAuth, generateAdminToken, type AuthenticatedRequest } from './admin.middleware.js'

// Routes
export { default as adminRoutes } from './admin.routes.js'
