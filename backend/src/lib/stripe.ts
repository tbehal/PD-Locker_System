import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeInstance) {
    return stripeInstance
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  stripeInstance = new Stripe(secretKey)

  return stripeInstance
}

export const STRIPE_CONFIG = {
  get webhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET
  },
}
