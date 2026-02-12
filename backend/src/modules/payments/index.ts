/**
 * Payments Module
 * Handles Stripe payment processing and webhooks
 */

// Services
export { getStripe, STRIPE_CONFIG } from './stripe.service.js'

// Routes
export { default as stripeRoutes } from './stripe.routes.js'
