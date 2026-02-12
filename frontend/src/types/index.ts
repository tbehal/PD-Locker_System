/**
 * Types Module - Re-exports
 *
 * Module Structure:
 * - common.types.ts  : Shared types (ApiResponse)
 * - locker.types.ts  : Locker & reservation types
 * - student.types.ts : Student types
 * - rental.types.ts  : Rental & analytics types
 * - waitlist.types.ts: Waitlist types
 */

// Common
export type { ApiResponse } from './common.types'

// Lockers
export type { LockerStatus, Reservation, Locker, SubscriptionStatus, Subscription, CheckoutSessionResponse, PortalSessionResponse } from './locker.types'
export { LOCKER_PRICE_CENTS } from './locker.types'

// Students
export type { Student } from './student.types'

// Rentals
export type { RentalRecord, AnalyticsData } from './rental.types'

// Waitlist
export type { WaitlistStatus, WaitlistEntry, CreateWaitlistData, UpdateWaitlistData } from './waitlist.types'
