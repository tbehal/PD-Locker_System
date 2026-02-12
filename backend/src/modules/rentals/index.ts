/**
 * Rentals Module
 * Handles locker reservations, subscriptions, and analytics
 */

// Types
export type {
  SubscriptionStatus,
  ReservationData,
  CreateReservationParams,
  UpdateReservationParams,
  RentalRecord,
  AnalyticsData,
} from './rental.types.js'

// Rental/Reservation Queries
export {
  createReservation,
  getReservationByStripeSessionId,
  getReservationsByLockerId,
  getActiveReservationsForLocker,
  getReservationById,
  updateReservation,
  updateReservationByStripeSessionId,
  cancelReservation,
  linkReservationToStudent,
} from './rental.queries.js'

// Analytics Queries
export {
  getAllRentals,
  getActiveRentals,
  getAnalytics,
  getRentalsExpiringTomorrow,
  expireEndedRentals,
} from './analytics.queries.js'

// Routes
export { default as cronRoutes } from './cron.routes.js'
