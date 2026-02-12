/**
 * Rentals Module - Types
 */

export type SubscriptionStatus =
  | 'active'
  | 'pending'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'expired'

export interface ReservationData {
  id: string
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
  stripeCustomerId: string | null
  customerEmail: string | null
  lockerId: string
  status: string
  startDate: string
  endDate: string
  totalMonths: number
  totalAmount: number
  isExtension?: boolean
  originalSubscriptionId?: string | null
}

export interface CreateReservationParams {
  id: string
  stripeSessionId: string | null
  stripePaymentIntentId?: string | null
  stripeCustomerId?: string | null
  customerEmail: string | null
  lockerId: string
  startDate: string
  endDate: string
  totalMonths: number
  totalAmount: number
  status?: string
  isExtension?: boolean
  originalSubscriptionId?: string | null
}

export interface UpdateReservationParams {
  status?: string
  stripePaymentIntentId?: string
  stripeCustomerId?: string
  endDate?: string
  totalAmount?: number
}

export interface RentalRecord {
  id: string
  lockerNumber: string
  studentName: string | null
  studentEmail: string | null
  startDate: string
  endDate: string
  status: string
  totalAmount: number
}

export interface AnalyticsData {
  totalRevenue: number
  uniqueStudents: number
  totalRentals: number
  activeRentals: number
  occupancyRate: number
}
