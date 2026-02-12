import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { ApiResponse, AdminTokenPayload } from '../types/index.js'

export interface AuthenticatedRequest extends Request {
  admin?: AdminTokenPayload
}

export function adminAuth(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<null>>,
  next: NextFunction
): void {
  const token = req.cookies?.admin_token

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    })
    return
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    res.status(500).json({
      success: false,
      error: 'JWT secret not configured',
    })
    return
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AdminTokenPayload
    req.admin = decoded
    next()
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    })
  }
}

export function generateAdminToken(): string {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured')
  }

  const payload: Omit<AdminTokenPayload, 'iat' | 'exp'> = {
    role: 'admin',
  }

  return jwt.sign(payload, jwtSecret, { expiresIn: '24h' })
}
