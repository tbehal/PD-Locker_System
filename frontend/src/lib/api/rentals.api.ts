/**
 * Rentals API Module
 * Endpoints for rental records and analytics
 */
import type { ApiResponse, RentalRecord, AnalyticsData } from '@/types'
import { fetchApi } from './client'

export async function fetchRentals(
  status?: 'active' | 'all'
): Promise<ApiResponse<RentalRecord[]>> {
  const params = status && status !== 'all' ? `?status=${status}` : ''
  return fetchApi<RentalRecord[]>(`/api/admin/rentals${params}`)
}

export async function fetchAnalytics(): Promise<ApiResponse<AnalyticsData>> {
  return fetchApi<AnalyticsData>('/api/admin/analytics')
}

export async function requestDepositRefund(rentalId: string): Promise<ApiResponse<{ message: string }>> {
  return fetchApi<{ message: string }>(`/api/admin/rentals/${rentalId}/refund-request`, { method: 'POST' })
}
