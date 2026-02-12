export type LockerStatus = 'available' | 'occupied'

export interface Reservation {
  startDate: string
  endDate: string
}

export interface Locker {
  id: string
  number: string
  status: LockerStatus
  pricePerWeek: number
  reservations: Reservation[]
}

export const LOCKER_PRICE_CENTS = 5000 // $50.00

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

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data?: T[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  error?: string
}

export interface CheckoutSessionResponse {
  sessionId: string
  url: string
}

export interface PortalSessionResponse {
  url: string
}

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
  totalWeeks: number
  totalAmount: number
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
  totalWeeks: number
  totalAmount: number
  status?: string
}

export interface UpdateReservationParams {
  status?: string
  stripePaymentIntentId?: string
  stripeCustomerId?: string
}

// Student types (Phase 2)
export interface Student {
  id: string
  studentName: string
  studentId: string
  studentEmail: string
  hubspotContactId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateStudentParams {
  id: string
  studentName: string
  studentId: string
  studentEmail: string
  hubspotContactId?: string | null
}

// Admin types (Phase 2)
export interface AdminLoginRequest {
  password: string
}

export interface AdminTokenPayload {
  role: 'admin'
  iat: number
  exp: number
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

// Waitlist types
export type WaitlistStatus = 'contacted' | 'link_sent' | 'not_needed'

export interface WaitlistEntry {
  id: string
  fullName: string
  email: string
  studentId: string
  potentialStartDate: string
  potentialEndDate: string
  status: WaitlistStatus
  hubspotContactId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateWaitlistParams {
  id: string
  fullName: string
  email: string
  studentId: string
  potentialStartDate: string
  potentialEndDate: string
  status?: WaitlistStatus
}

export interface UpdateWaitlistParams {
  fullName?: string
  email?: string
  studentId?: string
  potentialStartDate?: string
  potentialEndDate?: string
  status?: WaitlistStatus
  hubspotContactId?: string
}
