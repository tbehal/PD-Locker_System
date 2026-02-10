/**
 * API Module Exports
 *
 * Module Structure:
 * - client.ts    : Base fetch utility
 * - lockers.api  : Locker availability
 * - payments.api : Stripe checkout
 * - students.api : Student management
 * - auth.api     : Admin authentication
 * - rentals.api  : Rental records & analytics
 * - waitlist.api : Waitlist management
 */

// Base client (for advanced use cases)
export { fetchApi } from './client'

// Lockers Module
export { fetchLockers } from './lockers.api'

// Payments Module
export { sendPaymentLink, sendExtensionPaymentLink } from './payments.api'
export type { PaymentLinkSentResponse, SendPaymentLinkData, SendExtensionPaymentLinkData } from './payments.api'

// Students Module
export { createStudent, validateStudent, searchStudents } from './students.api'
export type { CreateStudentData, StudentSearchResult } from './students.api'

// Auth Module
export { adminLogin, adminLogout, verifyAdmin } from './auth.api'

// Rentals Module
export { fetchRentals, fetchAnalytics } from './rentals.api'

// Waitlist Module
export { fetchWaitlist, addToWaitlist, updateWaitlistEntry, deleteWaitlistEntry } from './waitlist.api'
