/**
 * Waitlist Module
 * Handles waitlist management for students waiting for lockers
 */

// Types
export type { WaitlistStatus, WaitlistEntry, CreateWaitlistParams, UpdateWaitlistParams } from './waitlist.types.js'

// Queries
export {
  getAllWaitlist,
  getWaitlistById,
  getWaitlistByEmail,
  getWaitlistByStudentId,
  checkDuplicate,
  addToWaitlist,
  updateWaitlist,
  deleteFromWaitlist,
  removeFromWaitlistByEmail,
  getWaitlistCount,
} from './waitlist.queries.js'

// Routes
export { default as waitlistRoutes } from './waitlist.routes.js'
