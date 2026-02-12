/**
 * Waitlist API Module
 * Endpoints for waitlist management
 */
import type { ApiResponse, WaitlistEntry, CreateWaitlistData, UpdateWaitlistData } from '@/types'
import { fetchApi } from './client'

export async function fetchWaitlist(): Promise<ApiResponse<WaitlistEntry[]>> {
  return fetchApi<WaitlistEntry[]>('/api/admin/waitlist')
}

export async function addToWaitlist(
  data: CreateWaitlistData
): Promise<ApiResponse<WaitlistEntry>> {
  return fetchApi<WaitlistEntry>('/api/admin/waitlist', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateWaitlistEntry(
  id: string,
  data: UpdateWaitlistData
): Promise<ApiResponse<WaitlistEntry>> {
  return fetchApi<WaitlistEntry>(`/api/admin/waitlist/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteWaitlistEntry(
  id: string
): Promise<ApiResponse<{ message: string }>> {
  return fetchApi<{ message: string }>(`/api/admin/waitlist/${id}`, {
    method: 'DELETE',
  })
}
