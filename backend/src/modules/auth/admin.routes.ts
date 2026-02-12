/**
 * Auth Module - Admin Routes
 */
import { Router } from 'express'
import type { Response } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { validateBody, loginLimiter } from '../../shared/middleware/index.js'
import { adminAuth, generateAdminToken, type AuthenticatedRequest } from './admin.middleware.js'
import { getAllRentals, getActiveRentals, getAnalytics } from '../rentals/index.js'
import { sendKeyDepositRefundEmail } from '../../shared/services/index.js'
import type { ApiResponse } from '../../shared/types.js'
import type { RentalRecord, AnalyticsData } from '../rentals/rental.types.js'

const router = Router()

const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

/**
 * Compares password against stored hash or plain text (for backwards compatibility)
 * Plain text passwords should be migrated to hashed passwords
 */
async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  // Check if stored password is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (storedPassword.startsWith('$2')) {
    return bcrypt.compare(password, storedPassword)
  }
  // Fall back to plain text comparison for backwards compatibility
  // Log a warning to encourage migration to hashed passwords
  console.warn('[Auth Module] WARNING: Using plain text password. Please hash your ADMIN_PASSWORD using bcrypt.')
  return password === storedPassword
}

router.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse<{ message: string }>>) => {
    try {
      const { password } = req.body
      const adminPassword = process.env.ADMIN_PASSWORD

      if (!adminPassword) {
        res.status(500).json({
          success: false,
          error: 'Admin authentication not configured',
        })
        return
      }

      const isValid = await verifyPassword(password, adminPassword)
      if (!isValid) {
        res.status(401).json({
          success: false,
          error: 'Invalid password',
        })
        return
      }

      const token = generateAdminToken()

      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      })

      res.json({
        success: true,
        data: { message: 'Login successful' },
      })
    } catch (error) {
      console.error('[Auth Module] Login error:', error)
      res.status(500).json({
        success: false,
        error: 'Login failed',
      })
    }
  }
)

router.post(
  '/logout',
  (_req: AuthenticatedRequest, res: Response<ApiResponse<{ message: string }>>) => {
    res.clearCookie('admin_token')
    res.json({
      success: true,
      data: { message: 'Logout successful' },
    })
  }
)

router.get(
  '/verify',
  adminAuth,
  (_req: AuthenticatedRequest, res: Response<ApiResponse<{ authenticated: boolean }>>) => {
    res.json({
      success: true,
      data: { authenticated: true },
    })
  }
)

router.get(
  '/rentals',
  adminAuth,
  (req: AuthenticatedRequest, res: Response<ApiResponse<RentalRecord[]>>) => {
    try {
      const { status } = req.query

      let rentals: RentalRecord[]
      if (status === 'active') {
        rentals = getActiveRentals()
      } else {
        rentals = getAllRentals()
      }

      res.json({
        success: true,
        data: rentals,
      })
    } catch (error) {
      console.error('[Auth Module] Failed to fetch rentals:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch rentals',
      })
    }
  }
)

router.get(
  '/analytics',
  adminAuth,
  (_req: AuthenticatedRequest, res: Response<ApiResponse<AnalyticsData>>) => {
    try {
      const analytics = getAnalytics()

      res.json({
        success: true,
        data: analytics,
      })
    } catch (error) {
      console.error('[Auth Module] Failed to fetch analytics:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics',
      })
    }
  }
)

router.post(
  '/rentals/:id/refund-request',
  adminAuth,
  async (req: AuthenticatedRequest, res: Response<ApiResponse<{ message: string }>>) => {
    try {
      const rental = getAllRentals().find((r) => r.id === req.params.id)

      if (!rental) {
        res.status(404).json({
          success: false,
          error: 'Rental not found',
        })
        return
      }

      if (rental.status !== 'active') {
        res.status(400).json({
          success: false,
          error: 'Refund requests can only be made for active rentals',
        })
        return
      }

      const sent = await sendKeyDepositRefundEmail({
        studentName: rental.studentName || 'Unknown',
        studentEmail: rental.studentEmail || 'Unknown',
        lockerNumber: rental.lockerNumber,
        startDate: rental.startDate,
        endDate: rental.endDate,
        depositAmount: 50,
      })

      if (!sent) {
        res.status(500).json({
          success: false,
          error: 'Failed to send refund request email. Check ADMIN_EMAIL and SMTP configuration.',
        })
        return
      }

      res.json({
        success: true,
        data: { message: 'Refund request sent' },
      })
    } catch (error) {
      console.error('[Auth Module] Failed to send refund request:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to send refund request',
      })
    }
  }
)

export default router
