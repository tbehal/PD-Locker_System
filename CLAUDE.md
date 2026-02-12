# Locker Management System - CLAUDE.md

## Project Overview

An integrated locker rental management system for Prep Doctors. The system provides an admin-only interface for managing 42 lockers, tracking rentals, and handling a student waitlist.

## System Architecture

| Component | Technology | Port |
|-----------|------------|------|
| Backend | Express.js + TypeScript | 4001 |
| Frontend | React + Vite + TypeScript | 4173 |
| Database | SQLite (better-sqlite3) | - |
| Payments | Stripe | - |
| CRM | HubSpot (optional) | - |
| Email | AWS SES SMTP (optional) | - |

## Design System (Prep Doctors Brand)

| Element | Value |
|---------|-------|
| Primary Blue | `#0660B2` |
| Secondary Blue | `#0362B2` |
| Font (Body) | Karla |
| Font (Headings) | Source Sans Pro |
| Card Radius | 6px (rounded-md) |

## Pricing

| Item | Amount |
|------|--------|
| Locker Rental | $50/month |
| Key Deposit | $50 (refundable) |

**Total Payment** = (Rental × months) + Key Deposit

## Key Features

### 1. Rentals Tab
- View all rental records
- Filter by status (Active/All)
- Extend active rentals
- Request key deposit refund for active rentals (sends email to ADMIN_EMAIL)
- Analytics dashboard (revenue, occupancy rate, etc.)

### 2. Waitlist Tab
- Add/Edit/Delete waitlist entries
- Status tracking (None, Contacted, Link Sent, Not Needed, Paid)
- Auto-delete on successful payment
- Duplicate prevention (unique email + student ID)

### 3. Book Locker Tab
- Select date range
- View available lockers (42 total)
- Enter student info
- Send payment link via email
- Payment includes rental + $50 key deposit

### 4. Admin Notifications
- Dashboard alert when lockers available + waitlist pending
- Email notification when rental expires (requires ADMIN_EMAIL env var)
- Key deposit refund request email (requires ADMIN_EMAIL env var)

## Module Structure

### Backend Modules (`backend/src/modules/`)

| Module | Purpose |
|--------|---------|
| `auth/` | Admin authentication (JWT) |
| `lockers/` | Locker inventory & availability |
| `rentals/` | Reservations & analytics |
| `payments/` | Stripe integration |
| `students/` | Student management |
| `waitlist/` | Waitlist CRUD |

### Frontend Structure (`frontend/src/`)

| Folder | Purpose |
|--------|---------|
| `components/admin/` | Dashboard components |
| `components/ui/` | Shared UI components |
| `lib/api/` | API modules by feature |
| `types/` | TypeScript types by feature |
| `pages/admin/` | Admin pages |

## Critical Rules

### Code Organization
- Feature-based modules for easy debugging
- Each module has: types, queries, routes, index
- 200-400 lines per file, 800 max

### Security
- No hardcoded secrets
- Validate all inputs with Zod
- Verify Stripe webhook signatures
- JWT tokens in HTTP-only cookies

### Database
- Unique constraints on email and student_id
- Prepared statements for all queries
- Proper foreign key relationships

## Environment Variables

```bash
# Required
ADMIN_PASSWORD=admin123
JWT_SECRET=dev_jwt_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:4173
PORT=4001

# Optional
HUBSPOT_ACCESS_TOKEN=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
ADMIN_EMAIL=
```

## API Endpoints Summary

| Category | Base Path | Auth Required |
|----------|-----------|---------------|
| Lockers | `/api/lockers` | No |
| Students | `/api/students` | No |
| Payments | `/api/stripe/checkout` | No |
| Extension Payment | `/api/stripe/extension-checkout` | No |
| Stripe Webhook | `/api/stripe/webhook` | No |
| Admin Auth | `/api/admin` | Partial |
| Rentals | `/api/admin/rentals` | Yes |
| Refund Request | `/api/admin/rentals/:id/refund-request` | Yes |
| Analytics | `/api/admin/analytics` | Yes |
| Waitlist | `/api/admin/waitlist` | Yes |

## Commands

```bash
# Development
cd backend && npm run dev   # Start backend
cd frontend && npm run dev  # Start frontend

# Build
cd backend && npm run build
cd frontend && npm run build

# Database reset
rm locker-system.db         # Delete DB
npm run dev                 # Restart to reseed
```

## Waitlist Rules

1. **Unique Constraints**: Email and Student ID must be unique
2. **Status Options**: none, contacted, link_sent, not_needed, paid
3. **Paid Status**: Setting status to "paid" auto-removes from waitlist
3. **Auto-Delete**: Removed when student completes payment
4. **Sort Order**: First come, first serve (by created_at)

## Stripe Webhook Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate reservation, link student, send welcome email, remove from waitlist |
| `checkout.session.completed` (extension) | Activate extension, link student, update original rental end date & amount |
| `checkout.session.expired` | Mark reservation as expired, notify admin (locker available) |

### Extension Flow
- Extensions create a separate reservation record with `isExtension: true`
- On payment, the webhook updates the **original** rental's `endDate` and `totalAmount`
- No welcome email or waitlist removal for extensions
- No key deposit charged on extensions

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Never commit `.env` files
- Test before pushing

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | Kill node processes: `taskkill /F /IM node.exe` |
| DB locked | Stop backend, delete DB, restart |
| 42 lockers not showing | Delete DB and restart to reseed |
| Payment link not sent | Check SMTP config in .env |
