/**
 * Waitlist Types
 * Types for waitlist management
 */

export type WaitlistStatus = 'none' | 'contacted' | 'link_sent' | 'not_needed' | 'paid'

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

export interface CreateWaitlistData {
  fullName: string
  email: string
  studentId: string
  potentialStartDate: string
  potentialEndDate: string
  status?: WaitlistStatus
}

export interface UpdateWaitlistData {
  fullName?: string
  email?: string
  studentId?: string
  potentialStartDate?: string
  potentialEndDate?: string
  status?: WaitlistStatus
}
