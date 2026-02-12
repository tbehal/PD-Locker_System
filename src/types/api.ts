export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data?: T[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  error?: string
}

export interface CheckoutSessionResponse {
  sessionId: string
  url: string
}

export interface PortalSessionResponse {
  url: string
}
