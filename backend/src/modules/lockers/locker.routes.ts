/**
 * Lockers Module - API Routes
 */
import { Router } from 'express'
import type { Request, Response } from 'express'
import { getLockers, getLockersWithAvailabilityForRange } from './locker.queries.js'
import type { ApiResponse } from '../../shared/types.js'
import type { Locker } from './locker.types.js'

const router = Router()

router.get('/', (req: Request, res: Response<ApiResponse<Locker[]>>) => {
  try {
    const { startDate, endDate } = req.query

    let lockers: Locker[]

    if (typeof startDate === 'string' && typeof endDate === 'string') {
      lockers = getLockersWithAvailabilityForRange(startDate, endDate)
    } else if (typeof startDate === 'string') {
      // Fallback for single date (legacy)
      lockers = getLockersWithAvailabilityForRange(startDate, startDate)
    } else {
      lockers = getLockers()
    }

    res.json({
      success: true,
      data: lockers,
    })
  } catch (error) {
    console.error('[Lockers Module] Failed to fetch lockers:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lockers',
    })
  }
})

export default router
