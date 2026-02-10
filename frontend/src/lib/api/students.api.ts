/**
 * Students API Module
 * Endpoints for student management
 */
import type { ApiResponse, Student } from '@/types'
import { fetchApi } from './client'

export interface CreateStudentData {
  studentName: string
  studentId: string
  studentEmail: string
}

export async function createStudent(
  data: CreateStudentData
): Promise<ApiResponse<Student>> {
  return fetchApi<Student>('/api/students', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function validateStudent(
  studentId: string
): Promise<ApiResponse<Student | null>> {
  return fetchApi<Student | null>('/api/students/validate', {
    method: 'POST',
    body: JSON.stringify({ studentId }),
  })
}

export interface StudentSearchResult {
  fullName: string
  email: string
  studentId: string
}

export async function searchStudents(
  query: string
): Promise<ApiResponse<StudentSearchResult[]>> {
  return fetchApi<StudentSearchResult[]>(`/api/students/search?q=${encodeURIComponent(query)}`)
}
