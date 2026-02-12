/**
 * Rentals Module - Cron Routes
 * Scheduled tasks for rental management
 */
import { Router } from 'express'
import type { Request, Response } from 'express'
import { getRentalsExpiringTomorrow, expireEndedRentals } from './analytics.queries.js'
import { sendExpiryReminderEmail, sendAdminLockerAvailableEmail } from '../../shared/services/index.js'
import { getWaitlistCount } from '../waitlist/index.js'
import type { ApiResponse } from '../../shared/types.js'

const router = Router()

router.post(
  '/expiry-reminders',
  async (req: Request, res: Response<ApiResponse<{ sent: number }>>) => {
    try {
      // Verify cron secret
      const cronSecret = process.env.CRON_SECRET
      const authHeader = req.headers.authorization

      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        })
        return
      }

      const expiringRentals = getRentalsExpiringTomorrow()
      let sentCount = 0

      for (const rental of expiringRentals) {
        if (rental.studentEmail) {
          try {
            await sendExpiryReminderEmail({
              to: rental.studentEmail,
              studentName: rental.studentName || 'Student',
              lockerNumber: rental.lockerNumber,
              endDate: rental.endDate,
            })
            sentCount++
          } catch (err) {
            console.error(`[Rentals Module] Failed to send expiry reminder to ${rental.studentEmail}:`, err)
          }
        }
      }

      res.json({
        success: true,
        data: { sent: sentCount },
      })
    } catch (error) {
      console.error('[Rentals Module] Cron job failed:', error)
      res.status(500).json({
        success: false,
        error: 'Cron job failed',
      })
    }
  }
)

// Process expired rentals and notify admin
router.post(
  '/expire-rentals',
  async (req: Request, res: Response<ApiResponse<{ expired: number; notified: number }>>) => {
    try {
      // Verify cron secret
      const cronSecret = process.env.CRON_SECRET
      const authHeader = req.headers.authorization

      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        })
        return
      }

      // Expire ended rentals
      const expiredRentals = expireEndedRentals()

      if (expiredRentals.length === 0) {
        res.json({
          success: true,
          data: { expired: 0, notified: 0 },
        })
        return
      }

      console.log(`[Rentals Module] Expired ${expiredRentals.length} rental(s)`)

      // Notify admin for each expired rental (locker now available)
      let notifiedCount = 0
      const waitlistCount = getWaitlistCount()

      for (const rental of expiredRentals) {
        try {
          const sent = await sendAdminLockerAvailableEmail({
            lockerNumber: rental.lockerNumber,
            previousRenterName: rental.studentName || null,
            previousRenterEmail: rental.studentEmail || null,
            waitlistCount,
          })
          if (sent) notifiedCount++
        } catch (err) {
          console.error(`[Rentals Module] Failed to send admin notification for locker #${rental.lockerNumber}:`, err)
        }
      }

      res.json({
        success: true,
        data: { expired: expiredRentals.length, notified: notifiedCount },
      })
    } catch (error) {
      console.error('[Rentals Module] Expire rentals cron job failed:', error)
      res.status(500).json({
        success: false,
        error: 'Cron job failed',
      })
    }
  }
)

export default router
