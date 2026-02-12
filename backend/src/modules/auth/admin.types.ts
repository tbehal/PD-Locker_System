/**
 * Auth Module - Types
 */

export interface AdminLoginRequest {
  password: string
}

export interface AdminTokenPayload {
  role: 'admin'
  iat: number
  exp: number
}
