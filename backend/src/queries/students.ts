import db from '../lib/db.js'
import type { Student, CreateStudentParams } from '../types/index.js'

interface StudentRow {
  id: string
  student_name: string
  student_id: string
  student_email: string
  hubspot_contact_id: string | null
  created_at: string
  updated_at: string
}

function rowToStudent(row: StudentRow): Student {
  return {
    id: row.id,
    studentName: row.student_name,
    studentId: row.student_id,
    studentEmail: row.student_email,
    hubspotContactId: row.hubspot_contact_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createStudent(params: CreateStudentParams): Student {
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO students (
      id,
      student_name,
      student_id,
      student_email,
      hubspot_contact_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    params.id,
    params.studentName,
    params.studentId,
    params.studentEmail,
    params.hubspotContactId ?? null,
    now,
    now
  )

  return {
    id: params.id,
    studentName: params.studentName,
    studentId: params.studentId,
    studentEmail: params.studentEmail,
    hubspotContactId: params.hubspotContactId ?? null,
    createdAt: now,
    updatedAt: now,
  }
}

export function getStudentByStudentId(studentId: string): Student | null {
  const row = db.prepare(`
    SELECT * FROM students
    WHERE student_id = ?
  `).get(studentId) as StudentRow | undefined

  if (!row) {
    return null
  }

  return rowToStudent(row)
}

export function getStudentById(id: string): Student | null {
  const row = db.prepare(`
    SELECT * FROM students
    WHERE id = ?
  `).get(id) as StudentRow | undefined

  if (!row) {
    return null
  }

  return rowToStudent(row)
}

export function getStudentByEmail(email: string): Student | null {
  const row = db.prepare(`
    SELECT * FROM students
    WHERE student_email = ?
  `).get(email) as StudentRow | undefined

  if (!row) {
    return null
  }

  return rowToStudent(row)
}

export function updateStudentHubspotId(id: string, hubspotContactId: string): Student | null {
  db.prepare(`
    UPDATE students
    SET hubspot_contact_id = ?, updated_at = ?
    WHERE id = ?
  `).run(hubspotContactId, new Date().toISOString(), id)

  return getStudentById(id)
}

export function upsertStudent(params: CreateStudentParams): Student {
  const existing = getStudentByStudentId(params.studentId)

  if (existing) {
    // Update existing student
    db.prepare(`
      UPDATE students
      SET student_name = ?, student_email = ?, hubspot_contact_id = COALESCE(?, hubspot_contact_id), updated_at = ?
      WHERE id = ?
    `).run(params.studentName, params.studentEmail, params.hubspotContactId ?? null, new Date().toISOString(), existing.id)

    return getStudentById(existing.id)!
  }

  return createStudent(params)
}

export function getAllStudents(): Student[] {
  const rows = db.prepare(`
    SELECT * FROM students
    ORDER BY created_at DESC
  `).all() as StudentRow[]

  return rows.map(rowToStudent)
}
