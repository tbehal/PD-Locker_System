import type { Request, Response, NextFunction } from 'express'
import type { ApiResponse } from '../types/index.js'

export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse<null>>,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    })
    return
  }

  console.error('Unhandled error:', err)

  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred',
  })
}

export function notFoundHandler(
  _req: Request,
  res: Response<ApiResponse<null>>
): void {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  })
}
