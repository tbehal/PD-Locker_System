/**
 * API Client - Base fetch utility
 * Shared by all API modules
 */
import type { ApiResponse } from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || ''

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    const data = await response.json()
    return data as ApiResponse<T>
  } catch (error) {
    console.error('[API Client] Error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.',
    }
  }
}
