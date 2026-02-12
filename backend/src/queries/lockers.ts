import db from '../lib/db.js'
import type { Locker, LockerStatus } from '../types/index.js'

interface LockerRow {
  id: string
  number: string
  price_per_week: number
  created_at: string
  status: 'available' | 'occupied'
}

export function getLockers(): Locker[] {
  const rows = db.prepare(`
    SELECT id, number, price_per_week, created_at
    FROM lockers
    ORDER BY CAST(number AS INTEGER)
  `).all() as Omit<LockerRow, 'status'>[]

  return rows.map((row) => ({
    id: row.id,
    number: row.number,
    status: 'available' as LockerStatus,
    pricePerWeek: row.price_per_week,
    reservations: [],
  }))
}

export function getLockerById(lockerId: string): Locker | null {
  const row = db.prepare(`
    SELECT id, number, price_per_week, created_at
    FROM lockers
    WHERE id = ?
  `).get(lockerId) as Omit<LockerRow, 'status'> | undefined

  if (!row) {
    return null
  }

  return {
    id: row.id,
    number: row.number,
    status: 'available' as LockerStatus,
    pricePerWeek: row.price_per_week,
    reservations: [],
  }
}

export function isLockerAvailableForRange(lockerId: string, startDate: string, endDate: string): boolean {
  // Check if there's any overlapping subscription
  // Overlap exists if: existing.start <= new.end AND existing.end >= new.start
  const row = db.prepare(`
    SELECT COUNT(*) as count
    FROM subscriptions
    WHERE locker_id = ?
      AND status = 'active'
      AND start_date <= ?
      AND end_date >= ?
  `).get(lockerId, endDate, startDate) as { count: number }

  return row.count === 0
}

export function getLockersWithAvailabilityForRange(startDate: string, endDate: string): Locker[] {
  // A locker is occupied if there's ANY overlapping subscription
  // Overlap: existing.start <= new.end AND existing.end >= new.start
  const rows = db.prepare(`
    SELECT
      l.id,
      l.number,
      l.price_per_week,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM subscriptions s
          WHERE s.locker_id = l.id
            AND s.status = 'active'
            AND s.start_date <= ?
            AND s.end_date >= ?
        ) THEN 'occupied'
        ELSE 'available'
      END as status
    FROM lockers l
    ORDER BY CAST(l.number AS INTEGER)
  `).all(endDate, startDate) as LockerRow[]

  return rows.map((row) => ({
    id: row.id,
    number: row.number,
    status: row.status as LockerStatus,
    pricePerWeek: row.price_per_week,
    reservations: [],
  }))
}
