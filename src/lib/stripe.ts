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

  stripeInstance = new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  })

  return stripeInstance
}

// For backward compatibility
export const stripe = {
  get checkout() {
    return getStripe().checkout
  },
  get billingPortal() {
    return getStripe().billingPortal
  },
  get webhooks() {
    return getStripe().webhooks
  },
}

export const STRIPE_CONFIG = {
  get priceId() {
    return process.env.STRIPE_PRICE_ID
  },
  get webhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET
  },
  get publishableKey() {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  },
}

export function getStripePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured')
  }
  return key
}
