import { Router } from 'express'
import type { Response } from 'express'
import { z } from 'zod'
import { validateBody } from '../middleware/validateRequest.js'
import { adminAuth, generateAdminToken, type AuthenticatedRequest } from '../middleware/adminAuth.js'
import { getAllRentals, getActiveRentals, getAnalytics } from '../queries/analytics.js'
import type { ApiResponse, RentalRecord, AnalyticsData } from '../types/index.js'

const router = Router()

const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

router.post(
  '/login',
  validateBody(loginSchema),
  (req: AuthenticatedRequest, res: Response<ApiResponse<{ message: string }>>) => {
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

      if (password !== adminPassword) {
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
      console.error('Login error:', error)
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
      console.error('Failed to fetch rentals:', error)
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
      console.error('Failed to fetch analytics:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics',
      })
    }
  }
)

export default router
