
# Smart Lab Availability Manager (NDECC Scheduler)

A scheduling system for booking lab stations across 12-week cycles. Supports multiple labs, shifts (AM/PM), and HubSpot CRM integration.

## Architecture

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + Vite + Tailwind CSS 3 | SPA at port 5173 |
| Backend | Express.js + Prisma ORM | REST API at port 5001 |
| Database | SQLite (dev) / PostgreSQL (prod) | Prisma manages migrations |
| CRM | HubSpot API | Optional — contact search & deal lookup |
| Validation | Joi | Schema-first request validation |
| Auth | JWT + HttpOnly cookies | Admin password login, 8h expiry |

## Data Model

- **Labs**: Lab A, B, C, E (Regular) and Lab B9, D (Pre-Exam)
- **Stations**: Each lab has numbered stations with LH/RH side designation
- **Cycles**: 12-week scheduling periods (e.g. "Cycle 1 - 2026"), lockable
- **Bookings**: Trainee name + optional HubSpot contact per station/shift/week

## Local Setup (Without Docker)

```sh
# 1. Backend
cd backend
npm install
npx prisma migrate dev --name init   # Creates SQLite DB + seeds data
npm run dev                           # Starts on http://localhost:5001
# Default login password: admin123

# 2. Frontend (new terminal)
cd frontend
npm install
npm start                             # Starts on http://localhost:5173
```

## Running with Docker

### Development (with hot-reloading)

```sh
docker compose -f docker-compose.dev.yml up --build
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5001
- **PostgreSQL:** localhost:5432 (user: ndecc, db: ndecc_sched)

### Production

```sh
docker compose -f docker-compose.prod.yml up --build -d
```

- App available at http://localhost (port 80)
- Backend at port 5001
- PostgreSQL with persistent volume

### Stopping

```sh
docker compose -f docker-compose.dev.yml down    # dev
docker compose -f docker-compose.prod.yml down   # prod
```

## API Endpoints

### Auth (no versioning)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with password `{ password }` |
| POST | `/api/auth/logout` | Logout (clears cookie) |
| GET | `/api/auth/check` | Check if session is valid |

### Cycles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cycles` | List all cycles (newest first) |
| POST | `/api/v1/cycles` | Create next cycle `{ year }` |
| PATCH | `/api/v1/cycles/:id/lock` | Lock a cycle (read-only) |
| PATCH | `/api/v1/cycles/:id/unlock` | Unlock a cycle |
| DELETE | `/api/v1/cycles/:id` | Delete cycle + bookings |
| PATCH | `/api/v1/cycles/:id/weeks` | Update week dates |
| PATCH | `/api/v1/cycles/:id/course-codes` | Update course codes |

### Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/availability/grid` | Get 12-week grid `{ cycleId, shift, labType, side }` |
| POST | `/api/v1/availability/book` | Book station `{ cycleId, stationId, shift, weeks[], traineeName }` |
| POST | `/api/v1/availability/unbook` | Remove booking `{ cycleId, stationId, shift, weeks[] }` |
| POST | `/api/v1/availability/find` | Find consecutive available blocks `{ cycleId, shift, labType, side, startWeek, endWeek, weeksNeeded }` |
| POST | `/api/v1/availability/reset` | Clear all bookings for cycle `{ cycleId }` |
| GET | `/api/v1/availability/export?cycleId=X` | Export cycle as CSV |

### HubSpot Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/availability/contacts/search?q=name` | Search contacts |
| GET | `/api/v1/availability/contacts/:id` | Get contact by ID |
| PATCH | `/api/v1/availability/contacts/:id/payment-status` | Update payment status |

### Registration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cycles/:id/registration?shift=AM` | Fetch registration list |
| GET | `/api/v1/cycles/:id/registration/export?shift=AM` | Export registration CSV |

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=file:./dev.db              # SQLite for dev (auto-configured)
PORT=5001
HUBSPOT_API_KEY=                        # Optional: HubSpot Private App token
JWT_SECRET=change-me-in-production      # Required in production
ADMIN_PASSWORD=admin123                 # Admin login password
ALLOWED_ORIGINS=http://localhost:5173   # Comma-separated CORS origins
NODE_ENV=development                    # "production" for strict validation
```

### Frontend

```env
VITE_API_BASE=http://localhost:5001     # Set in docker-compose or .env
```

## Project Structure

```
backend/
  prisma/
    schema.prisma       # Database schema (Lab, Station, Cycle, Booking)
    seed.js             # Seeds labs, stations, initial cycle
    dev.db              # SQLite database (gitignored)
  src/
    index.js            # Express app entry point
    app.js              # Express app config, middleware, routes
    config.js           # Environment config + production validation
    db.js               # Prisma client singleton
    hubspot.js          # HubSpot CRM service
    lib/
      AppError.js       # Custom error class for typed errors
    middleware/
      auth.js           # JWT authentication (HttpOnly cookies)
      validate.js       # Joi schema validation middleware
      errorHandler.js   # Global error handler
      respond.js        # Response envelope helpers
    schemas/            # Joi validation schemas (one per route group)
    services/           # Business logic layer (cycles, bookings, grid, registration)
    routes/
      auth.js           # Login/logout/check
      cycles.js         # Cycle CRUD
      grid.js           # Grid + export
      bookings.js       # Book/unbook/find/reset
      contacts.js       # HubSpot contacts
      registration.js   # Registration list
  __tests__/            # 18 backend tests (Jest + Supertest)

frontend/
  src/
    App.jsx             # Main orchestrator with auth state
    api.js              # API client (envelope unwrap, auth interceptor)
    config.js           # API base URL
    components/
      LoginPage.jsx         # Admin login form
      CycleTabs.jsx         # Cycle tab bar
      FilterBar.jsx         # Shift / Lab Type / Side filters
      SearchCriteriaForm.jsx # Week search form
      BookingSection.jsx     # Contact + booking form
      SearchResults.jsx      # Availability results
      AvailabilityGrid.jsx   # Interactive grid
      StudentInfoDialog.jsx  # Student info popup
      CellBookingDialog.jsx  # Grid cell booking modal
      ContactSearch.jsx      # HubSpot contact search
      RegistrationList.jsx   # Registration list table
  __tests__/            # 6 frontend tests (Vitest)
```

## Seed Data

| Lab | Type | Stations | LH Stations |
|-----|------|----------|-------------|
| Lab A | Regular | 38 | 1, 38 |
| Lab B | Regular | 31 | 25 |
| Lab C | Regular | 14 | 7 |
| Lab E | Regular | 15 | 14 |
| Lab B9 | Pre-Exam | 20 | 10, 11 |
| Lab D | Pre-Exam | 15 | 1 |

## Security

- All endpoints require authentication (JWT in HttpOnly cookie)
- CORS restricted to allowed origins
- Helmet security headers on all responses
- Rate limiting: 300 req/15min general, 30 req/min on HubSpot search
- Input validation via Joi on all request bodies and query params
- Global error handler — no stack traces or internal errors leak to client

## Key Features

- **Authentication** with JWT + HttpOnly cookies
- **Input validation** with Joi schemas on all endpoints
- **API versioning** under `/api/v1/`
- **Registration list** from HubSpot with CSV export
- **12-week cycles** with create/lock/unlock
- **Chrome-style tabs** for cycle navigation
- **Filter by**: Shift (AM/PM), Lab Type (Regular/Pre-Exam), Side (All/LH/RH)
- **Full-width grid** with lab grouping headers
- **Drag-select** to book or unbook multiple weeks
- **Locked cycles** are read-only (403 on mutations)
- **HubSpot integration** for contact lookup, deals, payment status
- **CSV export** per cycle
