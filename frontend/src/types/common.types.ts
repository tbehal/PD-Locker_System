/**
 * Common Types
 * Shared across all modules
 */

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
