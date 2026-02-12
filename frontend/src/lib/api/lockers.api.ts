/**
 * Lockers API Module
 * Endpoints for locker availability and management
 */
import type { ApiResponse, Locker } from '@/types'
import { fetchApi } from './client'

export async function fetchLockers(
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<Locker[]>> {
  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)

  const query = params.toString()
  return fetchApi<Locker[]>(`/api/lockers${query ? `?${query}` : ''}`)
}
