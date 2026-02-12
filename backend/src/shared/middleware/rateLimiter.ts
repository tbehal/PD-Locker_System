/**
 * Rate Limiting Middleware
 * Protects against brute force and DoS attacks
 */
import rateLimit from 'express-rate-limit'

/**
 * Strict rate limiter for login attempts
 * 5 attempts per 15 minutes per IP
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
})

/**
 * Standard rate limiter for API endpoints
 * 100 requests per minute per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter for Stripe webhook endpoints
 * 50 requests per hour per IP (webhooks are server-to-server)
 */
export const stripeWebhookLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests
  message: {
    success: false,
    error: 'Too many webhook requests.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter for payment creation endpoints
 * 10 requests per minute per IP
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests
  message: {
    success: false,
    error: 'Too many payment requests. Please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
