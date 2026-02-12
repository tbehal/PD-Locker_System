import db from '../src/lib/db'

console.log('Migrating database...')

try {
  // Check if end_date column exists
  const tableInfo = db.prepare("PRAGMA table_info(subscriptions)").all() as { name: string }[]
  const hasEndDate = tableInfo.some(col => col.name === 'end_date')

  if (!hasEndDate) {
    console.log('Adding new columns to subscriptions table...')

    // Add new columns
    db.exec(`ALTER TABLE subscriptions ADD COLUMN end_date TEXT`)
    db.exec(`ALTER TABLE subscriptions ADD COLUMN total_weeks INTEGER DEFAULT 1`)
    db.exec(`ALTER TABLE subscriptions ADD COLUMN total_amount INTEGER DEFAULT 5000`)

    // Rename stripe_subscription_id to stripe_session_id if needed
    const hasStripeSessionId = tableInfo.some(col => col.name === 'stripe_session_id')
    if (!hasStripeSessionId) {
      db.exec(`ALTER TABLE subscriptions ADD COLUMN stripe_session_id TEXT`)
      db.exec(`ALTER TABLE subscriptions ADD COLUMN stripe_payment_intent_id TEXT`)
    }

    // Update existing rows to have end_date = start_date + 7 days (default 1 week)
    db.exec(`UPDATE subscriptions SET end_date = date(start_date, '+7 days') WHERE end_date IS NULL`)

    console.log('Migration complete!')
  } else {
    console.log('Database already migrated.')
  }
} catch (error) {
  console.error('Migration failed:', error)
  process.exit(1)
}
