import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getStripe } from '@/lib/stripe'
import { getBaseUrl } from '@/lib/utils'
import type { ApiResponse, PortalSessionResponse } from '@/types'

const portalSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
})

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<PortalSessionResponse>>> {
  try {
    const body = await request.json()
    const { customerId } = portalSchema.parse(body)

    const baseUrl = getBaseUrl()

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/lockers`,
    })

    return NextResponse.json({
      success: true,
      data: {
        url: session.url,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return NextResponse.json(
        { success: false, error: firstError?.message || 'Validation error' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
