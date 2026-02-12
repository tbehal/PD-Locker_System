/**
 * Students Module
 * Handles student information and HubSpot integration
 */

// Types
export type { Student, CreateStudentParams } from './student.types.js'

// Queries
export {
  createStudent,
  getStudentByStudentId,
  getStudentById,
  getStudentByEmail,
  updateStudentHubspotId,
  upsertStudent,
  getAllStudents,
} from './student.queries.js'

// Routes
export { default as studentRoutes } from './student.routes.js'
