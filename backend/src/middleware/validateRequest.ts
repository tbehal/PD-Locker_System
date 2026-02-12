import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import type { ApiResponse } from '../types/index.js'

export function validateBody<T extends z.ZodSchema>(schema: T) {
  return (req: Request, res: Response<ApiResponse<null>>, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body) as z.infer<T>
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0]
        res.status(400).json({
          success: false,
          error: firstError?.message || 'Validation error',
        })
        return
      }
      next(error)
    }
  }
}

export function validateQuery<T extends z.ZodSchema>(schema: T) {
  return (req: Request, res: Response<ApiResponse<null>>, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query) as z.infer<T>
      // Store parsed result in a custom property to avoid type conflicts
      ;(req as Request & { validatedQuery: z.infer<T> }).validatedQuery = parsed
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0]
        res.status(400).json({
          success: false,
          error: firstError?.message || 'Validation error',
        })
        return
      }
      next(error)
    }
  }
}
