/**
 * Waitlist Module - Database Queries
 */
import { db } from '../../shared/index.js'
import type { WaitlistEntry, CreateWaitlistParams, UpdateWaitlistParams } from './waitlist.types.js'

interface WaitlistRow {
  id: string
  full_name: string
  email: string
  student_id: string
  potential_start_date: string
  potential_end_date: string
  status: string
  hubspot_contact_id: string | null
  created_at: string
  updated_at: string
}

function rowToWaitlistEntry(row: WaitlistRow): WaitlistEntry {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    studentId: row.student_id,
    potentialStartDate: row.potential_start_date,
    potentialEndDate: row.potential_end_date,
    status: row.status as WaitlistEntry['status'],
    hubspotContactId: row.hubspot_contact_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function getAllWaitlist(): WaitlistEntry[] {
  const rows = db.prepare(`
    SELECT * FROM waitlist
    ORDER BY created_at ASC
  `).all() as WaitlistRow[]

  return rows.map(rowToWaitlistEntry)
}

export function getWaitlistById(id: string): WaitlistEntry | null {
  const row = db.prepare(`
    SELECT * FROM waitlist
    WHERE id = ?
  `).get(id) as WaitlistRow | undefined

  if (!row) {
    return null
  }

  return rowToWaitlistEntry(row)
}

export function getWaitlistByEmail(email: string): WaitlistEntry | null {
  const row = db.prepare(`
    SELECT * FROM waitlist
    WHERE email = ?
  `).get(email.toLowerCase()) as WaitlistRow | undefined

  if (!row) {
    return null
  }

  return rowToWaitlistEntry(row)
}

export function getWaitlistByStudentId(studentId: string): WaitlistEntry | null {
  const row = db.prepare(`
    SELECT * FROM waitlist
    WHERE student_id = ?
  `).get(studentId.trim()) as WaitlistRow | undefined

  if (!row) {
    return null
  }

  return rowToWaitlistEntry(row)
}

export function checkDuplicate(
  email: string,
  studentId: string,
  excludeId?: string
): { field: 'email' | 'studentId'; existing: WaitlistEntry } | null {
  const normalizedEmail = email.toLowerCase().trim()
  const normalizedStudentId = studentId.trim()

  // Check for duplicate email
  const emailQuery = excludeId
    ? db.prepare('SELECT * FROM waitlist WHERE email = ? AND id != ?')
    : db.prepare('SELECT * FROM waitlist WHERE email = ?')

  const emailRow = excludeId
    ? emailQuery.get(normalizedEmail, excludeId)
    : emailQuery.get(normalizedEmail)

  if (emailRow) {
    return { field: 'email', existing: rowToWaitlistEntry(emailRow as WaitlistRow) }
  }

  // Check for duplicate student ID
  const studentIdQuery = excludeId
    ? db.prepare('SELECT * FROM waitlist WHERE student_id = ? AND id != ?')
    : db.prepare('SELECT * FROM waitlist WHERE student_id = ?')

  const studentIdRow = excludeId
    ? studentIdQuery.get(normalizedStudentId, excludeId)
    : studentIdQuery.get(normalizedStudentId)

  if (studentIdRow) {
    return { field: 'studentId', existing: rowToWaitlistEntry(studentIdRow as WaitlistRow) }
  }

  return null
}

export function addToWaitlist(params: CreateWaitlistParams): WaitlistEntry {
  const now = new Date().toISOString()
  const normalizedEmail = params.email.toLowerCase().trim()
  const normalizedStudentId = params.studentId.trim()

  db.prepare(`
    INSERT INTO waitlist (
      id,
      full_name,
      email,
      student_id,
      potential_start_date,
      potential_end_date,
      status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    params.id,
    params.fullName.trim(),
    normalizedEmail,
    normalizedStudentId,
    params.potentialStartDate,
    params.potentialEndDate,
    params.status || 'none',
    now,
    now
  )

  return {
    id: params.id,
    fullName: params.fullName.trim(),
    email: normalizedEmail,
    studentId: normalizedStudentId,
    potentialStartDate: params.potentialStartDate,
    potentialEndDate: params.potentialEndDate,
    status: params.status || 'none',
    hubspotContactId: null,
    createdAt: now,
    updatedAt: now,
  }
}

export function updateWaitlist(id: string, params: UpdateWaitlistParams): WaitlistEntry | null {
  const existing = getWaitlistById(id)
  if (!existing) {
    return null
  }

  const now = new Date().toISOString()
  const updates: string[] = ['updated_at = ?']
  const values: (string | null)[] = [now]

  if (params.fullName !== undefined) {
    updates.push('full_name = ?')
    values.push(params.fullName.trim())
  }

  if (params.email !== undefined) {
    updates.push('email = ?')
    values.push(params.email.toLowerCase().trim())
  }

  if (params.studentId !== undefined) {
    updates.push('student_id = ?')
    values.push(params.studentId.trim())
  }

  if (params.potentialStartDate !== undefined) {
    updates.push('potential_start_date = ?')
    values.push(params.potentialStartDate)
  }

  if (params.potentialEndDate !== undefined) {
    updates.push('potential_end_date = ?')
    values.push(params.potentialEndDate)
  }

  if (params.status !== undefined) {
    updates.push('status = ?')
    values.push(params.status)
  }

  if (params.hubspotContactId !== undefined) {
    updates.push('hubspot_contact_id = ?')
    values.push(params.hubspotContactId)
  }

  values.push(id)

  db.prepare(`
    UPDATE waitlist
    SET ${updates.join(', ')}
    WHERE id = ?
  `).run(...values)

  return getWaitlistById(id)
}

export function deleteFromWaitlist(id: string): boolean {
  const result = db.prepare(`
    DELETE FROM waitlist
    WHERE id = ?
  `).run(id)

  return result.changes > 0
}

export function removeFromWaitlistByEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim()

  const result = db.prepare(`
    DELETE FROM waitlist
    WHERE email = ?
  `).run(normalizedEmail)

  return result.changes > 0
}

export function getWaitlistCount(): number {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM waitlist
  `).get() as { count: number }

  return result.count
}
