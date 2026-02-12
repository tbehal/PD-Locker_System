import db from '../lib/db.js'
import type { RentalRecord, AnalyticsData } from '../types/index.js'

interface RentalRow {
  id: string
  locker_number: string
  student_name: string | null
  student_email: string | null
  start_date: string
  end_date: string
  status: string
  total_amount: number
}

export function getAllRentals(): RentalRecord[] {
  const rows = db.prepare(`
    SELECT
      s.id,
      l.number as locker_number,
      st.student_name,
      COALESCE(st.student_email, s.customer_email) as student_email,
      s.start_date,
      s.end_date,
      s.status,
      s.total_amount
    FROM subscriptions s
    JOIN lockers l ON s.locker_id = l.id
    LEFT JOIN students st ON s.student_db_id = st.id
    ORDER BY s.created_at DESC
  `).all() as RentalRow[]

  return rows.map((row) => ({
    id: row.id,
    lockerNumber: row.locker_number,
    studentName: row.student_name,
    studentEmail: row.student_email,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    totalAmount: row.total_amount,
  }))
}

export function getActiveRentals(): RentalRecord[] {
  const rows = db.prepare(`
    SELECT
      s.id,
      l.number as locker_number,
      st.student_name,
      COALESCE(st.student_email, s.customer_email) as student_email,
      s.start_date,
      s.end_date,
      s.status,
      s.total_amount
    FROM subscriptions s
    JOIN lockers l ON s.locker_id = l.id
    LEFT JOIN students st ON s.student_db_id = st.id
    WHERE s.status = 'active'
    ORDER BY s.start_date ASC
  `).all() as RentalRow[]

  return rows.map((row) => ({
    id: row.id,
    lockerNumber: row.locker_number,
    studentName: row.student_name,
    studentEmail: row.student_email,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    totalAmount: row.total_amount,
  }))
}

export function getAnalytics(): AnalyticsData {
  const revenueResult = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total
    FROM subscriptions
    WHERE status IN ('active', 'completed')
  `).get() as { total: number }

  const studentsResult = db.prepare(`
    SELECT COUNT(DISTINCT student_db_id) as count
    FROM subscriptions
    WHERE student_db_id IS NOT NULL
  `).get() as { count: number }

  const totalRentalsResult = db.prepare(`
    SELECT COUNT(*) as count
    FROM subscriptions
    WHERE status != 'expired'
  `).get() as { count: number }

  const activeRentalsResult = db.prepare(`
    SELECT COUNT(*) as count
    FROM subscriptions
    WHERE status = 'active'
  `).get() as { count: number }

  const totalLockersResult = db.prepare(`
    SELECT COUNT(*) as count
    FROM lockers
  `).get() as { count: number }

  const occupancyRate = totalLockersResult.count > 0
    ? (activeRentalsResult.count / totalLockersResult.count) * 100
    : 0

  return {
    totalRevenue: revenueResult.total,
    uniqueStudents: studentsResult.count,
    totalRentals: totalRentalsResult.count,
    activeRentals: activeRentalsResult.count,
    occupancyRate: Math.round(occupancyRate * 10) / 10,
  }
}

export function getRentalsExpiringTomorrow(): RentalRecord[] {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const rows = db.prepare(`
    SELECT
      s.id,
      l.number as locker_number,
      st.student_name,
      COALESCE(st.student_email, s.customer_email) as student_email,
      s.start_date,
      s.end_date,
      s.status,
      s.total_amount
    FROM subscriptions s
    JOIN lockers l ON s.locker_id = l.id
    LEFT JOIN students st ON s.student_db_id = st.id
    WHERE s.status = 'active'
      AND s.end_date = ?
  `).all(tomorrowStr) as RentalRow[]

  return rows.map((row) => ({
    id: row.id,
    lockerNumber: row.locker_number,
    studentName: row.student_name,
    studentEmail: row.student_email,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    totalAmount: row.total_amount,
  }))
}
