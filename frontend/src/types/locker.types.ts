/**
 * Locker Types
 * Types for locker availability and reservations
 */

export type LockerStatus = 'available' | 'occupied'

export interface Reservation {
  startDate: string
  endDate: string
}

export interface Locker {
  id: string
  number: string
  status: LockerStatus
  pricePerMonth: number
  reservations: Reservation[]
}

export const LOCKER_PRICE_CENTS = 5000 // $50.00 per month

export type SubscriptionStatus =
  | 'active'
  | 'pending'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'expired'

export interface Subscription {
  id: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: SubscriptionStatus
  lockerId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CheckoutSessionResponse {
  sessionId: string
  url: string
}

export interface PortalSessionResponse {
  url: string
}
