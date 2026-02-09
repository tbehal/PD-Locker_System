/**
 * Payments API Module
 * Endpoints for Stripe checkout and payment processing
 */
import type { ApiResponse } from '@/types'
import { fetchApi } from './client'

export interface PaymentLinkSentResponse {
  message: string
  email: string
  sessionId: string
}

export interface SendPaymentLinkData {
  lockerId: string
  startDate: string
  endDate: string
  totalMonths: number
  studentDbId?: string
  studentEmail: string
  studentName: string
}

export async function sendPaymentLink(
  data: SendPaymentLinkData
): Promise<ApiResponse<PaymentLinkSentResponse>> {
  return fetchApi<PaymentLinkSentResponse>('/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export interface SendExtensionPaymentLinkData {
  rentalId: string
  newEndDate: string
  extensionMonths: number
}

export async function sendExtensionPaymentLink(
  data: SendExtensionPaymentLinkData
): Promise<ApiResponse<PaymentLinkSentResponse>> {
  return fetchApi<PaymentLinkSentResponse>('/api/stripe/extension-checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
