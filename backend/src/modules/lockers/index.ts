/**
 * Lockers Module
 * Handles locker inventory and availability
 */

// Types
export type { Locker, LockerStatus, Reservation } from './locker.types.js'
export { LOCKER_PRICE_CENTS } from './locker.types.js'

// Queries
export {
  getLockers,
  getLockerById,
  isLockerAvailableForRange,
  isLockerAvailableForRangeExcluding,
  getLockersWithAvailabilityForRange,
} from './locker.queries.js'

// Routes
export { default as lockerRoutes } from './locker.routes.js'
