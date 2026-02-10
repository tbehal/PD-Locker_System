/**
 * Students Module - API Routes
 */
import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { validateBody } from '../../shared/middleware/index.js'
import { syncContactToHubSpot, searchHubSpotContacts } from '../../shared/services/index.js'
import { upsertStudent, getStudentByStudentId, updateStudentHubspotId } from './student.queries.js'
import type { ApiResponse } from '../../shared/types.js'
import type { Student } from './student.types.js'

const router = Router()

const createStudentSchema = z.object({
  studentName: z.string().min(1, 'Student name is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  studentEmail: z.string().email('Valid email is required'),
})

const validateStudentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
})

router.get(
  '/search',
  async (req: Request, res: Response) => {
    try {
      const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''

      if (query.length < 2) {
        res.json({ success: true, data: [] })
        return
      }

      const results = await searchHubSpotContacts(query)

      res.json({ success: true, data: results })
    } catch (error) {
      console.error('[Students Module] HubSpot search failed:', error)
      res.status(500).json({ success: false, error: 'Search failed' })
    }
  }
)

router.post(
  '/',
  validateBody(createStudentSchema),
  async (req: Request, res: Response<ApiResponse<Student>>) => {
    try {
      const { studentName, studentId, studentEmail } = req.body

      // Create or update student in database
      const student = upsertStudent({
        id: randomUUID(),
        studentName,
        studentId,
        studentEmail,
      })

      // Sync to HubSpot (non-blocking)
      syncContactToHubSpot({
        email: studentEmail,
        firstName: studentName.split(' ')[0] || studentName,
        lastName: studentName.split(' ').slice(1).join(' ') || '',
        studentId,
      }).then(hubspotId => {
        if (hubspotId && student.id) {
          updateStudentHubspotId(student.id, hubspotId)
        }
      }).catch(err => {
        console.error('[Students Module] HubSpot sync failed:', err)
      })

      res.json({
        success: true,
        data: student,
      })
    } catch (error) {
      console.error('[Students Module] Failed to create student:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create student record',
      })
    }
  }
)

router.post(
  '/validate',
  validateBody(validateStudentSchema),
  (req: Request, res: Response<ApiResponse<Student | null>>) => {
    try {
      const { studentId } = req.body

      const student = getStudentByStudentId(studentId)

      res.json({
        success: true,
        data: student,
      })
    } catch (error) {
      console.error('[Students Module] Failed to validate student:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to validate student',
      })
    }
  }
)

export default router
