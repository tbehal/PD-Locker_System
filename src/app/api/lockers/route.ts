import { NextRequest, NextResponse } from 'next/server'
import { getLockers, getLockersWithAvailabilityForRange } from '@/lib/queries/lockers'
import type { ApiResponse, Locker } from '@/types'

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Locker[]>>> {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let lockers: Locker[]

    if (startDate && endDate) {
      lockers = getLockersWithAvailabilityForRange(startDate, endDate)
    } else if (startDate) {
      // Fallback for single date (legacy)
      lockers = getLockersWithAvailabilityForRange(startDate, startDate)
    } else {
      lockers = getLockers()
    }

    return NextResponse.json({
      success: true,
      data: lockers,
    })
  } catch (error) {
    console.error('Failed to fetch lockers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lockers' },
      { status: 500 }
    )
  }
}
