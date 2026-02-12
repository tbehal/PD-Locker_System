import { Router } from 'express'
import type { Request, Response } from 'express'
import { getRentalsExpiringTomorrow } from '../queries/analytics.js'
import { sendExpiryReminderEmail } from '../services/emailService.js'
import type { ApiResponse } from '../types/index.js'

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
            console.error(`Failed to send expiry reminder to ${rental.studentEmail}:`, err)
          }
        }
      }

      res.json({
        success: true,
        data: { sent: sentCount },
      })
    } catch (error) {
      console.error('Cron job failed:', error)
      res.status(500).json({
        success: false,
        error: 'Cron job failed',
      })
    }
  }
)

export default router
