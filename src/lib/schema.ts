import db from './db'

export function initializeDatabase(): void {
  // Create lockers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lockers (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      price_per_week INTEGER NOT NULL DEFAULT 5000,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create subscriptions/reservations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      stripe_session_id TEXT UNIQUE,
      stripe_payment_intent_id TEXT,
      stripe_customer_id TEXT,
      customer_email TEXT,
      locker_id TEXT NOT NULL REFERENCES lockers(id),
      status TEXT NOT NULL DEFAULT 'active',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_weeks INTEGER NOT NULL DEFAULT 1,
      total_amount INTEGER NOT NULL DEFAULT 5000,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create indexes for fast lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_locker
    ON subscriptions(locker_id, status)
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_dates
    ON subscriptions(start_date, end_date)
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_session
    ON subscriptions(stripe_session_id)
  `)
}

export function seedLockers(): void {
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM lockers').get() as { count: number }

  if (existingCount.count > 0) {
    return // Already seeded
  }

  const insertLocker = db.prepare(`
    INSERT INTO lockers (id, number, price_per_week)
    VALUES (?, ?, ?)
  `)

  const insertMany = db.transaction((lockers: { id: string; number: string; pricePerWeek: number }[]) => {
    for (const locker of lockers) {
      insertLocker.run(locker.id, locker.number, locker.pricePerWeek)
    }
  })

  const lockers = Array.from({ length: 20 }, (_, i) => {
    const lockerNum = i + 1
    return {
      id: `locker_${lockerNum}`,
      number: String(lockerNum).padStart(2, '0'),
      pricePerWeek: 5000,
    }
  })

  insertMany(lockers)
}
