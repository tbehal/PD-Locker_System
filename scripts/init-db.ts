import { initializeDatabase, seedLockers } from '../src/lib/schema'

console.log('Initializing database...')

try {
  initializeDatabase()
  console.log('Tables created successfully')

  seedLockers()
  console.log('Seeded 20 lockers')

  console.log('Database initialization complete!')
} catch (error) {
  console.error('Failed to initialize database:', error)
  process.exit(1)
}
