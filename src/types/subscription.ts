export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'trialing'

export interface Subscription {
  id: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: SubscriptionStatus
  lockerId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionWithLocker extends Subscription {
  locker: {
    id: string
    number: string
    floor: number
  }
}
