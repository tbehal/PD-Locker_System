/**
 * Rental Types
 * Types for rental records and analytics
 */

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
