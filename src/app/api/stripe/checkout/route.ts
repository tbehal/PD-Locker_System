import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getStripe } from '@/lib/stripe'
import { getBaseUrl } from '@/lib/utils'
import { isLockerAvailableForRange } from '@/lib/queries/lockers'
import { createReservation } from '@/lib/queries/subscriptions'
import type { ApiResponse, CheckoutSessionResponse } from '@/types'

const checkoutSchema = z.object({
  lockerId: z.string().min(1, 'Locker ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalWeeks: z.number().min(1, 'Total weeks must be at least 1'),
})

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<CheckoutSessionResponse>>> {
  try {
    const body = await request.json()
    const { lockerId, startDate, endDate, totalWeeks } = checkoutSchema.parse(body)

    // Verify locker is still available for this date range
    const isAvailable = isLockerAvailableForRange(lockerId, startDate, endDate)
    if (!isAvailable) {
      return NextResponse.json(
        { success: false, error: 'This locker is no longer available for the selected dates' },
        { status: 400 }
      )
    }

    const baseUrl = getBaseUrl()
    const pricePerWeek = 5000 // $50 in cents
    const totalAmount = pricePerWeek * totalWeeks

    const stripe = getStripe()

    // Create a one-time payment checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Locker Rental - ${totalWeeks} week${totalWeeks !== 1 ? 's' : ''}`,
              description: `Locker reservation from ${startDate} to ${endDate}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        lockerId,
        startDate,
        endDate,
        totalWeeks: String(totalWeeks),
        totalAmount: String(totalAmount),
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/lockers`,
    })

    if (!session.url) {
      return NextResponse.json(
        { success: false, error: 'Failed to create checkout URL' },
        { status: 500 }
      )
    }

    // Create a pending reservation
    createReservation({
      id: crypto.randomUUID(),
      stripeSessionId: session.id,
      customerEmail: null,
      lockerId,
      startDate,
      endDate,
      totalWeeks,
      totalAmount,
      status: 'pending',
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
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

    console.error('Checkout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
