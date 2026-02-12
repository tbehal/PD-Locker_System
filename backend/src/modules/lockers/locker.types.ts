/**
 * Lockers Module - Types
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
