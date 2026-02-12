# Locker Management System - Documentation

## Overview

An integrated locker rental management system for Prep Doctors. Admins can manage locker bookings, track rentals, and handle a waitlist for students waiting for locker availability.

---

## System Information

| Item | Details |
|------|---------|
| Total Lockers | 42 |
| Rental Price | $50.00/month (5000 cents) |
| Key Deposit | $50.00 (5000 cents, refundable) |
| Backend Port | 4001 |
| Frontend Port | 4173 |
| Database | SQLite (locker-system.db) |

### Pricing Structure

When booking a locker, the total payment includes:

| Item | Amount | Notes |
|------|--------|-------|
| Locker Rental | $50 × months | Based on rental duration |
| Key Deposit | $50 | One-time, refundable |
| **Total** | Rental + $50 | Charged via Stripe |

**Example:** 3-month rental = ($50 × 3) + $50 deposit = **$200 total**

---

## Quick Start

### Starting the System

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Access URLs

| URL | Description |
|-----|-------------|
| http://localhost:4173 | Admin Login (main entry) |
| http://localhost:4173/admin/dashboard | Admin Dashboard |
| http://localhost:4173/success | Payment Success Page |
| http://localhost:4001/api/health | Backend Health Check |

### Default Credentials

- **Admin Password**: `admin123` (configurable via `ADMIN_PASSWORD` env var)

---

## Features

### 1. Rentals Management

View and track all locker rentals.

**Capabilities:**
- View all rental records (active, pending, expired, cancelled)
- Filter by status (Active / All)
- See rental details: locker number, student info, dates, amount, status
- Extend active rentals (sends new payment link)
- Request key deposit refund for active rentals (sends email notification to admin)

**Key Deposit Refund:**
- Available on active rentals via "Refund Deposit" button
- Shows confirmation modal with student name and locker number before sending
- Sends email to `ADMIN_EMAIL` with student name, email, locker number, rental period, and $50 deposit amount
- Rental status remains unchanged (stays active)
- Requires `ADMIN_EMAIL` and SMTP to be configured

**Analytics Dashboard:**
- Total Revenue
- Unique Students
- Total Rentals
- Active Rentals
- Occupancy Rate (%)

### 2. Waitlist Management

Manage students waiting for locker availability.

**Fields:**
| Field | Description | Required |
|-------|-------------|----------|
| Full Name | Student's full name | Yes |
| Email | Student's email (unique) | Yes |
| Student ID | University student ID (unique) | Yes |
| Start Date | Potential rental start date | Yes |
| End Date | Potential rental end date | Yes |
| Status | None / Contacted / Link Sent / Not Needed / Paid | Yes |

**Status Options:**
| Status | Description |
|--------|-------------|
| `none` | Default status, no action taken yet |
| `contacted` | Admin has contacted the student |
| `link_sent` | Payment link has been sent |
| `not_needed` | Student no longer needs a locker |
| `paid` | Student has paid (auto-removes from waitlist) |

**Rules:**
- Email must be unique across all waitlist entries
- Student ID must be unique across all waitlist entries
- Entries are sorted by creation date (first come, first serve)
- Setting status to "paid" automatically removes the entry
- Auto-deleted when student completes Stripe payment

### 3. Book Locker (Admin Booking)

Book lockers directly for students.

**Workflow:**
1. Select rental date range (start and end dates)
2. View available lockers for that period
3. Select an available locker
4. Enter student information (name, email, student ID)
5. Send payment link to student's email
6. Student receives email and completes payment
7. On successful payment:
   - Reservation becomes active
   - Student linked to reservation record
   - Welcome email sent to student
   - Student auto-removed from waitlist (if present)

### 5. Rental Extension

Extend an active rental for additional months.

**Workflow:**
1. Admin clicks "Extend" on an active rental in the Rentals tab
2. Select new end date in the extension modal
3. Extension months and price calculated automatically (no key deposit)
4. Payment link sent to student's email
5. On successful payment:
   - Extension reservation activated
   - Original rental's end date updated to new end date
   - Original rental's total amount increased by extension amount
   - No welcome email sent (extension, not new booking)

### 4. Admin Notifications

Admins are notified when lockers become available so they can contact people on the waitlist.

**Dashboard Alert:**
- Yellow banner appears at the top of the dashboard when:
  - There are available lockers (occupancy < 100%)
  - There are people on the waitlist
- Shows count of available lockers and waitlist entries
- Quick link to view the waitlist

**Email Notification (Locker Available):**
- Sent when a rental expires or is cancelled
- Includes locker number, previous renter info
- Shows current waitlist count
- Requires `ADMIN_EMAIL` environment variable to be set

**Email Notification (Key Deposit Refund):**
- Sent when admin clicks "Refund Deposit" on an active rental
- Includes student name, email, locker number, rental period, and $50 deposit amount
- Requires `ADMIN_EMAIL` environment variable to be set

---

## Database Schema

### Tables

#### `lockers`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (locker_1, locker_2, etc.) |
| number | TEXT | Display number (01-42) |
| price_per_month | INTEGER | Price in cents (5000) |
| created_at | TEXT | Timestamp |

#### `subscriptions` (Reservations)
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| stripe_session_id | TEXT | Stripe checkout session ID |
| stripe_payment_intent_id | TEXT | Stripe payment intent ID |
| stripe_customer_id | TEXT | Stripe customer ID |
| customer_email | TEXT | Customer email |
| locker_id | TEXT | Foreign key to lockers |
| student_db_id | TEXT | Foreign key to students (linked on payment) |
| status | TEXT | pending/active/expired/cancelled |
| start_date | TEXT | Rental start date (YYYY-MM-DD) |
| end_date | TEXT | Rental end date (YYYY-MM-DD) |
| total_months | INTEGER | Number of months |
| total_amount | INTEGER | Total amount in cents |
| is_extension | INTEGER | 1 if this is an extension rental |
| original_subscription_id | TEXT | Original rental ID (for extensions) |
| created_at | TEXT | Timestamp |
| updated_at | TEXT | Timestamp |

#### `students`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| student_name | TEXT | Full name |
| student_id | TEXT | University ID (unique) |
| student_email | TEXT | Email address |
| hubspot_contact_id | TEXT | HubSpot CRM contact ID |
| created_at | TEXT | Timestamp |
| updated_at | TEXT | Timestamp |

#### `waitlist`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| full_name | TEXT | Student's full name |
| email | TEXT | Email (unique) |
| student_id | TEXT | University ID (unique) |
| potential_start_date | TEXT | Desired start date |
| potential_end_date | TEXT | Desired end date |
| status | TEXT | none/contacted/link_sent/not_needed/paid |
| hubspot_contact_id | TEXT | HubSpot CRM contact ID |
| created_at | TEXT | Timestamp |
| updated_at | TEXT | Timestamp |

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lockers` | Get all lockers with availability |
| GET | `/api/lockers?startDate=X&endDate=Y` | Get lockers with availability for date range |
| GET | `/api/health` | Health check |

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/students` | Create/update student record |
| POST | `/api/students/validate` | Validate student by ID |
| GET | `/api/students/search?q=query` | Search students via HubSpot (min 2 chars) |

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stripe/checkout` | Create checkout session & send payment link |
| POST | `/api/stripe/extension-checkout` | Create extension checkout session (no key deposit) |
| POST | `/api/stripe/webhook` | Stripe webhook handler |
| POST | `/api/stripe/portal` | Create Stripe billing portal session |

### Admin Endpoints (Require Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/logout` | Admin logout |
| GET | `/api/admin/verify` | Verify admin token |
| GET | `/api/admin/rentals` | Get all rentals |
| GET | `/api/admin/rentals?status=active` | Get active rentals |
| POST | `/api/admin/rentals/:id/refund-request` | Send key deposit refund request email |
| GET | `/api/admin/analytics` | Get analytics data |

### Waitlist Endpoints (Require Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/waitlist` | Get all waitlist entries |
| POST | `/api/admin/waitlist` | Add to waitlist |
| PUT | `/api/admin/waitlist/:id` | Update waitlist entry |
| DELETE | `/api/admin/waitlist/:id` | Delete waitlist entry |

---

## Environment Variables

### Backend (`backend/.env`)

```bash
# Database
DATABASE_PATH=../locker-system.db

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# HubSpot (optional)
HUBSPOT_ACCESS_TOKEN=

# Email (AWS SES SMTP - optional)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=no-reply@prepdoctors.com

# Admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your_jwt_secret_here
ADMIN_EMAIL=admin@prepdoctors.com

# Cron
CRON_SECRET=your_cron_secret

# App
FRONTEND_URL=http://localhost:4173
PORT=4001
```

### Frontend (`frontend/.env`)

```bash
VITE_API_URL=http://localhost:4001
```

---

## Module Structure

### Backend (`backend/src/`)

```
shared/
├── db.ts              # Database connection
├── schema.ts          # Schema & migrations
├── types.ts           # Common types
├── middleware/        # Error handler, validation
├── services/          # Email, HubSpot
└── index.ts

modules/
├── auth/              # Admin authentication
│   ├── admin.types.ts
│   ├── admin.middleware.ts
│   ├── admin.routes.ts
│   └── index.ts
│
├── lockers/           # Locker management
│   ├── locker.types.ts
│   ├── locker.queries.ts
│   ├── locker.routes.ts
│   └── index.ts
│
├── rentals/           # Reservations & analytics
│   ├── rental.types.ts
│   ├── rental.queries.ts
│   ├── analytics.queries.ts
│   ├── cron.routes.ts
│   └── index.ts
│
├── payments/          # Stripe integration
│   ├── stripe.service.ts
│   ├── stripe.routes.ts
│   └── index.ts
│
├── students/          # Student management
│   ├── student.types.ts
│   ├── student.queries.ts
│   ├── student.routes.ts
│   └── index.ts
│
└── waitlist/          # Waitlist management
    ├── waitlist.types.ts
    ├── waitlist.queries.ts
    ├── waitlist.routes.ts
    └── index.ts
```

### Frontend (`frontend/src/`)

```
components/
├── admin/             # Admin dashboard components
│   ├── AnalyticsCard.tsx
│   ├── BookLockerTab.tsx
│   ├── RentalTable.tsx
│   ├── WaitlistForm.tsx
│   ├── WaitlistTable.tsx
│   └── index.ts
│
├── locker/            # Locker display components
│   ├── LockerCard.tsx
│   ├── LockerGrid.tsx
│   └── LockerStatus.tsx
│
├── ui/                # Shared UI components
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── DatePicker.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   └── index.ts
│
└── student/           # Student form
    └── StudentInfoForm.tsx

lib/api/               # API modules
├── client.ts          # Base fetch client
├── auth.api.ts        # Admin auth
├── lockers.api.ts     # Locker endpoints
├── payments.api.ts    # Stripe endpoints
├── rentals.api.ts     # Rentals & analytics
├── students.api.ts    # Student endpoints
├── waitlist.api.ts    # Waitlist endpoints
└── index.ts

types/                 # TypeScript types
├── common.types.ts
├── locker.types.ts
├── rental.types.ts
├── student.types.ts
├── waitlist.types.ts
└── index.ts

pages/
├── admin/
│   ├── LoginPage.tsx
│   └── DashboardPage.tsx
└── SuccessPage.tsx
```

---

## Integrations

### Stripe

Handles payment processing.

**Webhook Events:**
| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate reservation, link student, send welcome email, remove from waitlist |
| `checkout.session.completed` (extension) | Activate extension, link student, update original rental end date & amount |
| `checkout.session.expired` | Mark reservation as expired, notify admin (locker available) |

**Setup:**
1. Create Stripe account
2. Get API keys from Stripe Dashboard
3. Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
4. Add webhook secret to environment variables

**Local Webhook Testing:**
```bash
# Install Stripe CLI, then run:
stripe listen --forward-to http://localhost:4001/api/stripe/webhook
# Copy the displayed webhook signing secret (whsec_...) to STRIPE_WEBHOOK_SECRET in backend/.env
```

### HubSpot (Optional)

Syncs student contacts to HubSpot CRM.

**Triggers:**
- When a student is created/updated
- When a waitlist entry is created

**Setup:**
1. Create HubSpot account
2. Generate private app access token
3. Add token to `HUBSPOT_ACCESS_TOKEN` env var

### Email (Optional)

Sends payment links and welcome emails via AWS SES SMTP.

**Email Types:**
| Email | Trigger | Recipient |
|-------|---------|-----------|
| Payment Link | When admin books a locker for student | Student |
| Welcome Email | When payment is completed | Student |
| Expiry Reminder | Day before rental ends (via cron) | Student |
| Locker Available | When a locker becomes available | Admin |
| Key Deposit Refund | When admin requests refund for returned key | Admin |

**Setup:**
1. Set up AWS SES
2. Verify sender email/domain
3. Get SMTP credentials
4. Add credentials to environment variables
5. Set `ADMIN_EMAIL` for admin notifications

### Cron Jobs

Scheduled tasks for automated maintenance.

**Endpoints:**
| Endpoint | Description |
|----------|-------------|
| `POST /api/cron/expiry-reminders` | Send reminder emails to students whose rentals expire tomorrow |
| `POST /api/cron/expire-rentals` | Mark ended rentals as completed, notify admin of available lockers |

**Setup:**
1. Set up a cron scheduler (e.g., AWS CloudWatch, cron-job.org)
2. Call endpoints daily with `Authorization: Bearer <CRON_SECRET>` header
3. Recommended schedule: Run both jobs daily at midnight

---

## Security

### Authentication

- Admin authentication via JWT tokens
- Tokens stored in HTTP-only cookies
- 24-hour token expiration

### Data Validation

- All inputs validated with Zod schemas
- Unique constraints on email and student ID
- SQL injection prevention via prepared statements

### Stripe Security

- Webhook signatures verified
- Secret key stored in environment variables
- Never exposed to frontend

---

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill existing processes
taskkill /F /IM node.exe  # Windows
pkill node                 # Mac/Linux
```

**Database locked:**
- Stop all running node processes
- Delete the database file to reset
- Restart the backend

**Lockers not showing:**
- Check backend is running on port 4001
- Verify database exists and is seeded
- Check browser console for errors

**Payment link not sending:**
- Verify SMTP credentials are correct
- Check email service is configured
- Review backend logs for errors

---

## Production Deployment

### Checklist

- [ ] Change `ADMIN_PASSWORD` to a strong password
- [ ] Change `JWT_SECRET` to a random string
- [ ] Set up production Stripe keys
- [ ] Configure production SMTP
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Enable HTTPS
- [ ] Set up database backups

### Environment Variables (Production)

```bash
NODE_ENV=production
ADMIN_PASSWORD=<strong-password>
JWT_SECRET=<random-64-char-string>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://yourdomain.com
```

---

## Support

For issues or questions, contact the development team or create an issue in the repository.
