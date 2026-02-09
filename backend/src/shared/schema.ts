/**
 * Shared Database Schema
 * Initializes database tables and runs migrations
 */
import db from './db.js'

export function initializeDatabase(): void {
  // Create lockers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lockers (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      price_per_month INTEGER NOT NULL DEFAULT 5000,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create subscriptions/reservations table (base schema without student_db_id)
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
      total_months INTEGER NOT NULL DEFAULT 1,
      total_amount INTEGER NOT NULL DEFAULT 5000,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create students table (Phase 2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      student_name TEXT NOT NULL,
      student_id TEXT NOT NULL UNIQUE,
      student_email TEXT NOT NULL,
      hubspot_contact_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create waitlist table
  db.exec(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      student_id TEXT NOT NULL UNIQUE,
      potential_start_date TEXT NOT NULL,
      potential_end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'contacted',
      hubspot_contact_id TEXT,
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

  // Create waitlist indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_waitlist_email
    ON waitlist(email)
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_waitlist_student_id
    ON waitlist(student_id)
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_waitlist_created_at
    ON waitlist(created_at)
  `)
}

export function seedLockers(): void {
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM lockers').get() as { count: number }

  if (existingCount.count > 0) {
    return // Already seeded
  }

  const insertLocker = db.prepare(`
    INSERT INTO lockers (id, number, price_per_month)
    VALUES (?, ?, ?)
  `)

  const insertMany = db.transaction((lockers: { id: string; number: string; pricePerMonth: number }[]) => {
    for (const locker of lockers) {
      insertLocker.run(locker.id, locker.number, locker.pricePerMonth)
    }
  })

  const lockers = Array.from({ length: 42 }, (_, i) => {
    const lockerNum = i + 1
    return {
      id: `locker_${lockerNum}`,
      number: String(lockerNum).padStart(2, '0'),
      pricePerMonth: 5000,
    }
  })

  insertMany(lockers)
}

export function runMigrations(): void {
  // Add student_db_id column if it doesn't exist
  try {
    const columns = db.prepare("PRAGMA table_info(subscriptions)").all() as { name: string }[]
    const hasStudentDbId = columns.some(col => col.name === 'student_db_id')

    if (!hasStudentDbId) {
      db.exec(`ALTER TABLE subscriptions ADD COLUMN student_db_id TEXT REFERENCES students(id)`)
    }

    // Create index on student_db_id (safe to run even if column was just added)
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_student
      ON subscriptions(student_db_id)
    `)
  } catch (err) {
    console.error('Migration error:', err)
  }

  // Add extension columns to subscriptions
  try {
    const columns = db.prepare("PRAGMA table_info(subscriptions)").all() as { name: string }[]

    const hasIsExtension = columns.some(col => col.name === 'is_extension')
    if (!hasIsExtension) {
      db.exec(`ALTER TABLE subscriptions ADD COLUMN is_extension INTEGER NOT NULL DEFAULT 0`)
    }

    const hasOriginalSubscriptionId = columns.some(col => col.name === 'original_subscription_id')
    if (!hasOriginalSubscriptionId) {
      db.exec(`ALTER TABLE subscriptions ADD COLUMN original_subscription_id TEXT`)
    }
  } catch (err) {
    console.error('Extension migration error:', err)
  }
}
