/**
 * Auth API Module
 * Endpoints for admin authentication
 */
import type { ApiResponse } from '@/types'
import { fetchApi } from './client'

export async function adminLogin(
  password: string
): Promise<ApiResponse<{ message: string }>> {
  return fetchApi<{ message: string }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export async function adminLogout(): Promise<ApiResponse<{ message: string }>> {
  return fetchApi<{ message: string }>('/api/admin/logout', {
    method: 'POST',
  })
}

export async function verifyAdmin(): Promise<ApiResponse<{ authenticated: boolean }>> {
  return fetchApi<{ authenticated: boolean }>('/api/admin/verify')
}
