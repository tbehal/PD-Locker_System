/**
 * API Module - Re-exports
 *
 * This file re-exports all API functions from the modular structure.
 * Import from '@/lib/api' or '@/lib/api/index' for cleaner imports.
 *
 * Module Structure:
 * - api/client.ts    : Base fetch utility
 * - api/lockers.api  : Locker availability
 * - api/payments.api : Stripe checkout
 * - api/students.api : Student management
 * - api/auth.api     : Admin authentication
 * - api/rentals.api  : Rental records & analytics
 * - api/waitlist.api : Waitlist management
 */

export * from './api/index'
