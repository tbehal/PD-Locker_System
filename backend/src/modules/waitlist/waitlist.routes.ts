/**
 * Waitlist Module - API Routes
 */
import { Router } from 'express'
import type { Response } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { validateBody } from '../../shared/middleware/index.js'
import { syncContactToHubSpot } from '../../shared/services/index.js'
import { adminAuth, type AuthenticatedRequest } from '../auth/admin.middleware.js'
import {
  getAllWaitlist,
  getWaitlistById,
  checkDuplicate,
  addToWaitlist,
  updateWaitlist,
  deleteFromWaitlist,
} from './waitlist.queries.js'
import type { ApiResponse } from '../../shared/types.js'
import type { WaitlistEntry } from './waitlist.types.js'

const router = Router()

const createWaitlistSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').trim(),
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  studentId: z.string().min(1, 'Student ID is required').trim(),
  potentialStartDate: z.string().min(1, 'Start date is required'),
  potentialEndDate: z.string().min(1, 'End date is required'),
  status: z.enum(['none', 'contacted', 'link_sent', 'not_needed', 'paid']).default('none'),
})

const updateWaitlistSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').trim().optional(),
  email: z.string().email('Valid email is required').toLowerCase().trim().optional(),
  studentId: z.string().min(1, 'Student ID is required').trim().optional(),
  potentialStartDate: z.string().min(1).optional(),
  potentialEndDate: z.string().min(1).optional(),
  status: z.enum(['none', 'contacted', 'link_sent', 'not_needed', 'paid']).optional(),
})

// GET /api/admin/waitlist - Get all waitlist entries
router.get(
  '/',
  adminAuth,
  (_req: AuthenticatedRequest, res: Response<ApiResponse<WaitlistEntry[]>>) => {
    try {
      const entries = getAllWaitlist()

      res.json({
        success: true,
        data: entries,
      })
    } catch (error) {
      console.error('[Waitlist Module] Failed to fetch waitlist:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch waitlist',
      })
    }
  }
)

// POST /api/admin/waitlist - Add new entry
router.post(
  '/',
  adminAuth,
  validateBody(createWaitlistSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse<WaitlistEntry>>) => {
    try {
      const { fullName, email, studentId, potentialStartDate, potentialEndDate, status } = req.body

      // Check for duplicates
      const duplicate = checkDuplicate(email, studentId)
      if (duplicate) {
        const fieldName = duplicate.field === 'email' ? 'email' : 'student ID'
        res.status(400).json({
          success: false,
          error: `A waitlist entry with this ${fieldName} already exists`,
        })
        return
      }

      const id = randomUUID()

      // Add to waitlist
      const entry = addToWaitlist({
        id,
        fullName,
        email,
        studentId,
        potentialStartDate,
        potentialEndDate,
        status,
      })

      // Sync to HubSpot
      const nameParts = fullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const hubspotId = await syncContactToHubSpot({
        email,
        firstName,
        lastName,
        studentId,
      })

      // Update with HubSpot ID if sync was successful
      const entryWithHubspot = hubspotId
        ? { ...entry, hubspotContactId: hubspotId }
        : entry

      if (hubspotId) {
        updateWaitlist(id, { hubspotContactId: hubspotId })
      }

      res.status(201).json({
        success: true,
        data: entryWithHubspot,
      })
    } catch (error) {
      console.error('[Waitlist Module] Failed to add to waitlist:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to add to waitlist',
      })
    }
  }
)

// PUT /api/admin/waitlist/:id - Update entry
router.put(
  '/:id',
  adminAuth,
  validateBody(updateWaitlistSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse<WaitlistEntry>>) => {
    try {
      const id = req.params.id as string
      const updates = req.body

      // Check if entry exists
      const existing = getWaitlistById(id)
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Waitlist entry not found',
        })
        return
      }

      // If status is being set to 'paid', delete the entry instead
      if (updates.status === 'paid') {
        deleteFromWaitlist(id)
        res.json({
          success: true,
          data: { ...existing, status: 'paid' } as WaitlistEntry,
        })
        return
      }

      // Check for duplicates if email or student ID is being updated
      if (updates.email || updates.studentId) {
        const emailToCheck = updates.email || existing.email
        const studentIdToCheck = updates.studentId || existing.studentId

        const duplicate = checkDuplicate(emailToCheck, studentIdToCheck, id)
        if (duplicate) {
          const fieldName = duplicate.field === 'email' ? 'email' : 'student ID'
          res.status(400).json({
            success: false,
            error: `A waitlist entry with this ${fieldName} already exists`,
          })
          return
        }
      }

      const updated = updateWaitlist(id, updates)

      if (!updated) {
        res.status(500).json({
          success: false,
          error: 'Failed to update waitlist entry',
        })
        return
      }

      // Sync to HubSpot if name or email changed
      if (updates.fullName || updates.email) {
        const fullName = updates.fullName || existing.fullName
        const email = updates.email || existing.email
        const studentId = updates.studentId || existing.studentId

        const nameParts = fullName.trim().split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        const hubspotId = await syncContactToHubSpot({
          email,
          firstName,
          lastName,
          studentId,
        })

        if (hubspotId && hubspotId !== updated.hubspotContactId) {
          updateWaitlist(id, { hubspotContactId: hubspotId })
        }
      }

      // Get the final state from the database to ensure we return accurate data
      const finalEntry = getWaitlistById(id) || updated

      res.json({
        success: true,
        data: finalEntry,
      })
    } catch (error) {
      console.error('[Waitlist Module] Failed to update waitlist entry:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update waitlist entry',
      })
    }
  }
)

// DELETE /api/admin/waitlist/:id - Delete entry
router.delete(
  '/:id',
  adminAuth,
  (req: AuthenticatedRequest, res: Response<ApiResponse<{ message: string }>>) => {
    try {
      const id = req.params.id as string

      const deleted = deleteFromWaitlist(id)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Waitlist entry not found',
        })
        return
      }

      res.json({
        success: true,
        data: { message: 'Waitlist entry deleted successfully' },
      })
    } catch (error) {
      console.error('[Waitlist Module] Failed to delete waitlist entry:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete waitlist entry',
      })
    }
  }
)

export default router
