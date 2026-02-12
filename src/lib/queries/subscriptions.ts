import db from '../db'

export interface ReservationData {
  id: string
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
  stripeCustomerId: string | null
  customerEmail: string | null
  lockerId: string
  status: string
  startDate: string
  endDate: string
  totalWeeks: number
  totalAmount: number
}

interface ReservationRow {
  id: string
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  stripe_customer_id: string | null
  customer_email: string | null
  locker_id: string
  status: string
  start_date: string
  end_date: string
  total_weeks: number
  total_amount: number
  created_at: string
  updated_at: string
}

function rowToReservation(row: ReservationRow): ReservationData {
  return {
    id: row.id,
    stripeSessionId: row.stripe_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    stripeCustomerId: row.stripe_customer_id,
    customerEmail: row.customer_email,
    lockerId: row.locker_id,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    totalWeeks: row.total_weeks,
    totalAmount: row.total_amount,
  }
}

export interface CreateReservationParams {
  id: string
  stripeSessionId: string | null
  stripePaymentIntentId?: string | null
  stripeCustomerId?: string | null
  customerEmail: string | null
  lockerId: string
  startDate: string
  endDate: string
  totalWeeks: number
  totalAmount: number
  status?: string
}

export function createReservation(params: CreateReservationParams): ReservationData {
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO subscriptions (
      id,
      stripe_session_id,
      stripe_payment_intent_id,
      stripe_customer_id,
      customer_email,
      locker_id,
      status,
      start_date,
      end_date,
      total_weeks,
      total_amount,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    params.id,
    params.stripeSessionId,
    params.stripePaymentIntentId ?? null,
    params.stripeCustomerId ?? null,
    params.customerEmail,
    params.lockerId,
    params.status ?? 'active',
    params.startDate,
    params.endDate,
    params.totalWeeks,
    params.totalAmount,
    now,
    now
  )

  return {
    id: params.id,
    stripeSessionId: params.stripeSessionId,
    stripePaymentIntentId: params.stripePaymentIntentId ?? null,
    stripeCustomerId: params.stripeCustomerId ?? null,
    customerEmail: params.customerEmail,
    lockerId: params.lockerId,
    status: params.status ?? 'active',
    startDate: params.startDate,
    endDate: params.endDate,
    totalWeeks: params.totalWeeks,
    totalAmount: params.totalAmount,
  }
}

export function getReservationByStripeSessionId(stripeSessionId: string): ReservationData | null {
  const row = db.prepare(`
    SELECT * FROM subscriptions
    WHERE stripe_session_id = ?
  `).get(stripeSessionId) as ReservationRow | undefined

  if (!row) {
    return null
  }

  return rowToReservation(row)
}

export function getReservationsByLockerId(lockerId: string): ReservationData[] {
  const rows = db.prepare(`
    SELECT * FROM subscriptions
    WHERE locker_id = ?
    ORDER BY created_at DESC
  `).all(lockerId) as ReservationRow[]

  return rows.map(rowToReservation)
}

export function getActiveReservationsForLocker(lockerId: string): ReservationData[] {
  const rows = db.prepare(`
    SELECT * FROM subscriptions
    WHERE locker_id = ?
      AND status = 'active'
    ORDER BY start_date ASC
  `).all(lockerId) as ReservationRow[]

  return rows.map(rowToReservation)
}

export interface UpdateReservationParams {
  status?: string
  stripePaymentIntentId?: string
  stripeCustomerId?: string
}

export function updateReservation(
  reservationId: string,
  params: UpdateReservationParams
): ReservationData | null {
  const updates: string[] = []
  const values: (string | number)[] = []

  if (params.status !== undefined) {
    updates.push('status = ?')
    values.push(params.status)
  }

  if (params.stripePaymentIntentId !== undefined) {
    updates.push('stripe_payment_intent_id = ?')
    values.push(params.stripePaymentIntentId)
  }

  if (params.stripeCustomerId !== undefined) {
    updates.push('stripe_customer_id = ?')
    values.push(params.stripeCustomerId)
  }

  if (updates.length === 0) {
    return getReservationById(reservationId)
  }

  updates.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(reservationId)

  db.prepare(`
    UPDATE subscriptions
    SET ${updates.join(', ')}
    WHERE id = ?
  `).run(...values)

  return getReservationById(reservationId)
}

export function updateReservationByStripeSessionId(
  stripeSessionId: string,
  params: UpdateReservationParams
): ReservationData | null {
  const reservation = getReservationByStripeSessionId(stripeSessionId)
  if (!reservation) {
    return null
  }

  return updateReservation(reservation.id, params)
}

export function getReservationById(reservationId: string): ReservationData | null {
  const row = db.prepare(`
    SELECT * FROM subscriptions
    WHERE id = ?
  `).get(reservationId) as ReservationRow | undefined

  if (!row) {
    return null
  }

  return rowToReservation(row)
}

export function cancelReservation(reservationId: string): ReservationData | null {
  return updateReservation(reservationId, { status: 'canceled' })
}

// Legacy exports for backwards compatibility
export const createSubscription = createReservation
export const getSubscriptionByStripeId = getReservationByStripeSessionId
export const updateSubscriptionByStripeId = updateReservationByStripeSessionId
export const cancelSubscription = cancelReservation
