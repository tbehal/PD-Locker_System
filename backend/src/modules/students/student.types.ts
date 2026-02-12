/**
 * Students Module - Types
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

export interface CreateStudentParams {
  id: string
  studentName: string
  studentId: string
  studentEmail: string
  hubspotContactId?: string | null
}
