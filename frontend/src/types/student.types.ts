/**
 * Student Types
 * Types for student management
 */

export interface Student {
  id: string
  studentName: string
  studentId: string
  studentEmail: string
  hubspotContactId: string | null
  createdAt: string
  updatedAt: string
}
