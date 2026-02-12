import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { getStripe, STRIPE_CONFIG } from '../lib/stripe.js'
import { isLockerAvailableForRange, getLockerById } from '../queries/lockers.js'
import { createReservation, updateReservationByStripeSessionId, getReservationByStripeSessionId } from '../queries/subscriptions.js'
import { removeFromWaitlistByEmail } from '../queries/waitlist.js'
import { getStudentById } from '../queries/students.js'
import { validateBody } from '../middleware/validateRequest.js'
import { sendPaymentLinkEmail, sendWelcomeEmail } from '../services/emailService.js'
import type { ApiResponse, PortalSessionResponse } from '../types/index.js'
import type Stripe from 'stripe'

const router = Router()

// Response type for sending payment link
interface PaymentLinkSentResponse {
  message: string
  email: string
  sessionId: string
}

const checkoutSchema = z.object({
  lockerId: z.string().min(1, 'Locker ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalWeeks: z.number().min(1, 'Total weeks must be at least 1'),
  studentDbId: z.string().optional(),
  studentEmail: z.string().email('Valid email is required'),
  studentName: z.string().min(1, 'Student name is required'),
})

const portalSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
})

router.post(
  '/checkout',
  validateBody(checkoutSchema),
  async (req: Request, res: Response<ApiResponse<PaymentLinkSentResponse>>) => {
    try {
      const { lockerId, startDate, endDate, totalWeeks, studentDbId, studentEmail, studentName } = req.body

      // Verify locker is still available for this date range
      const isAvailable = isLockerAvailableForRange(lockerId, startDate, endDate)
      if (!isAvailable) {
        res.status(400).json({
          success: false,
          error: 'This locker is no longer available for the selected dates',
        })
        return
      }

      // Get locker details for email
      const locker = getLockerById(lockerId)
      if (!locker) {
        res.status(400).json({
          success: false,
          error: 'Locker not found',
        })
        return
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4173'
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
                name: `Locker #${locker.number} Rental - ${totalWeeks} week${totalWeeks !== 1 ? 's' : ''}`,
                description: `Locker reservation from ${startDate} to ${endDate}`,
              },
              unit_amount: totalAmount,
            },
            quantity: 1,
          },
        ],
        customer_email: studentEmail,
        metadata: {
          lockerId,
          lockerNumber: locker.number,
          startDate,
          endDate,
          totalWeeks: String(totalWeeks),
          totalAmount: String(totalAmount),
          studentDbId: studentDbId || '',
          studentEmail,
          studentName,
        },
        success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/lockers`,
        expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      })

      if (!session.url) {
        res.status(500).json({
          success: false,
          error: 'Failed to create checkout URL',
        })
        return
      }

      // Create a pending reservation
      createReservation({
        id: randomUUID(),
        stripeSessionId: session.id,
        customerEmail: studentEmail,
        lockerId,
        startDate,
        endDate,
        totalWeeks,
        totalAmount,
        status: 'pending',
      })

      // Send payment link email
      const emailSent = await sendPaymentLinkEmail({
        to: studentEmail,
        studentName,
        lockerNumber: locker.number,
        startDate,
        endDate,
        totalAmount,
        paymentUrl: session.url,
      })

      if (!emailSent) {
        console.warn('Failed to send payment link email, but session created')
      }

      res.json({
        success: true,
        data: {
          message: `Payment link sent to ${studentEmail}`,
          email: studentEmail,
          sessionId: session.id,
        },
      })
    } catch (error) {
      console.error('Checkout error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create checkout session',
      })
    }
  }
)

router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature']

  if (!signature || typeof signature !== 'string') {
    res.status(400).json({ error: 'Missing signature' })
    return
  }

  const webhookSecret = STRIPE_CONFIG.webhookSecret
  if (!webhookSecret) {
    res.status(500).json({ error: 'Webhook secret not configured' })
    return
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)
  } catch {
    res.status(400).json({ error: 'Invalid signature' })
    return
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Activate the reservation
        updateReservationByStripeSessionId(session.id, {
          status: 'active',
          stripePaymentIntentId: session.payment_intent as string | undefined,
          stripeCustomerId: session.customer as string | undefined,
        })

        // Send welcome email
        const metadata = session.metadata
        if (metadata?.studentEmail && metadata?.studentName) {
          const reservation = getReservationByStripeSessionId(session.id)
          if (reservation) {
            sendWelcomeEmail({
              to: metadata.studentEmail,
              studentName: metadata.studentName,
              lockerNumber: metadata.lockerNumber || 'N/A',
              startDate: reservation.startDate,
              endDate: reservation.endDate,
            }).catch(err => {
              console.error('Failed to send welcome email:', err)
            })
          }
        }

        // Auto-remove from waitlist on successful payment
        const customerEmail = session.customer_details?.email || metadata?.studentEmail
        if (customerEmail) {
          const removed = removeFromWaitlistByEmail(customerEmail)
          if (removed) {
            console.log(`Removed ${customerEmail} from waitlist after successful payment`)
          }
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session

        // Cancel the pending reservation
        updateReservationByStripeSessionId(session.id, {
          status: 'expired',
        })
        break
      }

      default:
        // Unhandled event type
        break
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Webhook handler failed:', error)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
})

router.post(
  '/portal',
  validateBody(portalSchema),
  async (req: Request, res: Response<ApiResponse<PortalSessionResponse>>) => {
    try {
      const { customerId } = req.body
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

      const stripe = getStripe()
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${frontendUrl}/lockers`,
      })

      res.json({
        success: true,
        data: {
          url: session.url,
        },
      })
    } catch (error) {
      console.error('Portal session error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create portal session',
      })
    }
  }
)

export default router
