/**
 * Payments Module - Stripe Routes
 */
import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { getStripe, STRIPE_CONFIG } from './stripe.service.js'
import { isLockerAvailableForRange, isLockerAvailableForRangeExcluding, getLockerById } from '../lockers/index.js'
import { createReservation, updateReservationByStripeSessionId, updateReservation, getReservationByStripeSessionId, getReservationById, linkReservationToStudent } from '../rentals/index.js'
import { removeFromWaitlistByEmail, getWaitlistCount } from '../waitlist/index.js'
import { validateBody, paymentLimiter, stripeWebhookLimiter } from '../../shared/middleware/index.js'
import { sendPaymentLinkEmail, sendWelcomeEmail, sendAdminLockerAvailableEmail } from '../../shared/services/index.js'
import type { ApiResponse } from '../../shared/types.js'
import type Stripe from 'stripe'

const router = Router()

// Response type for sending payment link
interface PaymentLinkSentResponse {
  message: string
  email: string
  sessionId: string
}

interface PortalSessionResponse {
  url: string
}

const checkoutSchema = z.object({
  lockerId: z.string().min(1, 'Locker ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalMonths: z.number().min(1, 'Total months must be at least 1'),
  studentDbId: z.string().optional(),
  studentEmail: z.string().email('Valid email is required'),
  studentName: z.string().min(1, 'Student name is required'),
})

const portalSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
})

router.post(
  '/checkout',
  paymentLimiter,
  validateBody(checkoutSchema),
  async (req: Request, res: Response<ApiResponse<PaymentLinkSentResponse>>) => {
    try {
      const { lockerId, startDate, endDate, totalMonths, studentDbId, studentEmail, studentName } = req.body

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
      const pricePerMonth = 5000 // $50 in cents
      const keyDeposit = 5000 // $50 key deposit in cents
      const rentalAmount = pricePerMonth * totalMonths
      const totalAmount = rentalAmount + keyDeposit

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
                name: `Locker #${locker.number} Rental - ${totalMonths} month${totalMonths !== 1 ? 's' : ''}`,
                description: `Locker reservation from ${startDate} to ${endDate}`,
              },
              unit_amount: rentalAmount,
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Key Deposit',
                description: 'Refundable key deposit',
              },
              unit_amount: keyDeposit,
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
          totalMonths: String(totalMonths),
          rentalAmount: String(rentalAmount),
          keyDeposit: String(keyDeposit),
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
        totalMonths,
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
        console.warn('[Payments Module] Failed to send payment link email, but session created')
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
      console.error('[Payments Module] Checkout error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create checkout session',
      })
    }
  }
)

const extensionCheckoutSchema = z.object({
  rentalId: z.string().min(1, 'Rental ID is required'),
  newEndDate: z.string().min(1, 'New end date is required'),
  extensionMonths: z.number().min(1, 'Extension must be at least 1 month'),
})

router.post(
  '/extension-checkout',
  paymentLimiter,
  validateBody(extensionCheckoutSchema),
  async (req: Request, res: Response<ApiResponse<PaymentLinkSentResponse>>) => {
    try {
      const { rentalId, newEndDate, extensionMonths } = req.body

      // Look up existing rental
      const rental = getReservationById(rentalId)
      if (!rental) {
        res.status(404).json({ success: false, error: 'Rental not found' })
        return
      }

      if (rental.status !== 'active') {
        res.status(400).json({ success: false, error: 'Only active rentals can be extended' })
        return
      }

      // Extension starts the day after current end date
      const currentEnd = new Date(rental.endDate)
      const extensionStart = new Date(currentEnd)
      extensionStart.setDate(extensionStart.getDate() + 1)
      const extensionStartDate = extensionStart.toISOString().split('T')[0] as string

      // Check locker availability for extension period (excluding current rental)
      const isAvailable = isLockerAvailableForRangeExcluding(
        rental.lockerId,
        extensionStartDate,
        newEndDate,
        rental.id
      )
      if (!isAvailable) {
        res.status(400).json({
          success: false,
          error: 'Locker is not available for the selected extension period',
        })
        return
      }

      const locker = getLockerById(rental.lockerId)
      if (!locker) {
        res.status(400).json({ success: false, error: 'Locker not found' })
        return
      }

      const customerEmail = rental.customerEmail
      if (!customerEmail) {
        res.status(400).json({ success: false, error: 'No email on file for this rental' })
        return
      }

      const pricePerMonth = 5000
      const rentalAmount = pricePerMonth * extensionMonths
      const totalAmount = rentalAmount // No key deposit on extensions

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4173'
      const stripe = getStripe()

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Locker #${locker.number} Extension - ${extensionMonths} month${extensionMonths !== 1 ? 's' : ''}`,
                description: `Extension from ${extensionStartDate} to ${newEndDate}`,
              },
              unit_amount: rentalAmount,
            },
            quantity: 1,
          },
        ],
        customer_email: customerEmail,
        metadata: {
          lockerId: rental.lockerId,
          lockerNumber: locker.number,
          startDate: extensionStartDate,
          endDate: newEndDate,
          totalMonths: String(extensionMonths),
          rentalAmount: String(rentalAmount),
          keyDeposit: '0',
          totalAmount: String(totalAmount),
          studentEmail: customerEmail,
          studentName: customerEmail,
          isExtension: 'true',
          originalSubscriptionId: rental.id,
        },
        success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/lockers`,
        expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      })

      if (!session.url) {
        res.status(500).json({ success: false, error: 'Failed to create checkout URL' })
        return
      }

      // Create pending extension reservation
      createReservation({
        id: randomUUID(),
        stripeSessionId: session.id,
        customerEmail,
        lockerId: rental.lockerId,
        startDate: extensionStartDate,
        endDate: newEndDate,
        totalMonths: extensionMonths,
        totalAmount,
        status: 'pending',
        isExtension: true,
        originalSubscriptionId: rental.id,
      })

      // Send payment link email
      const emailSent = await sendPaymentLinkEmail({
        to: customerEmail,
        studentName: customerEmail,
        lockerNumber: locker.number,
        startDate: extensionStartDate,
        endDate: newEndDate,
        totalAmount,
        paymentUrl: session.url,
      })

      if (!emailSent) {
        console.warn('[Payments Module] Failed to send extension payment link email, but session created')
      }

      res.json({
        success: true,
        data: {
          message: `Extension payment link sent to ${customerEmail}`,
          email: customerEmail,
          sessionId: session.id,
        },
      })
    } catch (error) {
      console.error('[Payments Module] Extension checkout error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create extension checkout session',
      })
    }
  }
)

router.post('/webhook', stripeWebhookLimiter, async (req: Request, res: Response) => {
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
        const metadata = session.metadata

        // Activate the extension/reservation
        updateReservationByStripeSessionId(session.id, {
          status: 'active',
          stripePaymentIntentId: session.payment_intent as string | undefined,
          stripeCustomerId: session.customer as string | undefined,
        })

        // Link student to reservation
        if (metadata?.studentDbId) {
          const reservation = getReservationByStripeSessionId(session.id)
          if (reservation) {
            linkReservationToStudent(reservation.id, metadata.studentDbId)
          }
        }

        // Handle extension: update the original rental's end date and total amount
        if (metadata?.isExtension === 'true' && metadata?.originalSubscriptionId) {
          const originalRental = getReservationById(metadata.originalSubscriptionId)
          const extensionReservation = getReservationByStripeSessionId(session.id)

          if (originalRental && extensionReservation) {
            updateReservation(originalRental.id, {
              endDate: extensionReservation.endDate,
              totalAmount: originalRental.totalAmount + extensionReservation.totalAmount,
            })
            console.log(`[Payments Module] Extended rental ${originalRental.id} end date to ${extensionReservation.endDate}`)
          }
        } else {
          // Send welcome email only for initial rentals (not extensions)
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
                console.error('[Payments Module] Failed to send welcome email:', err)
              })
            }
          }

          // Auto-remove from waitlist only for initial rentals
          const customerEmail = session.customer_details?.email || metadata?.studentEmail
          if (customerEmail) {
            const removed = removeFromWaitlistByEmail(customerEmail)
            if (removed) {
              console.log(`[Payments Module] Removed ${customerEmail} from waitlist after successful payment`)
            }
          }
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata

        // Cancel the pending reservation
        updateReservationByStripeSessionId(session.id, {
          status: 'expired',
        })

        // Notify admin that a locker is now available
        if (metadata?.lockerNumber) {
          const waitlistCount = getWaitlistCount()
          sendAdminLockerAvailableEmail({
            lockerNumber: metadata.lockerNumber,
            previousRenterName: metadata.studentName || null,
            previousRenterEmail: metadata.studentEmail || null,
            waitlistCount,
          }).catch(err => {
            console.error('[Payments Module] Failed to send admin notification:', err)
          })
        }
        break
      }

      default:
        // Unhandled event type
        break
    }

    res.json({ received: true })
  } catch (error) {
    console.error('[Payments Module] Webhook handler failed:', error)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
})

router.post(
  '/portal',
  validateBody(portalSchema),
  async (req: Request, res: Response<ApiResponse<PortalSessionResponse>>) => {
    try {
      const { customerId } = req.body
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4173'

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
      console.error('[Payments Module] Portal session error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create portal session',
      })
    }
  }
)

export default router
