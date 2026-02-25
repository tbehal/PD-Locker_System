# NDECCSchedApp — Remediation Plan

**Generated:** 2026-02-23
**Audited Against:** Global CLAUDE.md Development Standards

---

## Overview

This document is a comprehensive, phase-wise remediation plan for NDECCSchedApp. Each phase is self-contained, ordered by priority, and can be tackled independently. Work through them sequentially — later phases build on foundations laid by earlier ones.

| Phase | Focus | Severity | Est. Effort | Status |
|-------|-------|----------|-------------|--------|
| [Phase 1](#phase-1-critical-security-fixes) | Security Fixes | Critical | 1-2 days | ✅ COMPLETE |
| [Phase 2](#phase-2-backend-architecture-fixes) | Backend Architecture | High | 3-4 days | ✅ COMPLETE |
| [Phase 3](#phase-3-database--devops-fixes) | Database & DevOps | High | 2-3 days | Pending |
| [Phase 4](#phase-4-frontend-modernization) | Frontend Modernization | High | 5-7 days | Pending |
| [Phase 5](#phase-5-frontend-design-system) | Design System | Medium | 2-3 days | Pending |
| [Phase 6](#phase-6-testing--polish) | Testing & Polish | Medium | 3-4 days | Pending |

**Total estimated effort:** ~16-23 developer-days

---

# Phase 1: Critical Security Fixes ✅ COMPLETE

**Overview:** Zero authentication, wildcard CORS, no security headers, no rate limiting, hardcoded prod secrets, XSS injection point, unsanitized input, and error message leaks. Every item here is a prerequisite before the app can be safely exposed to the internet.

**Execution order:** Tasks 1-4 all touch `backend/src/app.js` — do them in one sitting. Tasks 5-10 are independent.

---

## Task 1.1 — Add Authentication Middleware ✅ DONE

> **Implemented:** JWT + HttpOnly cookies (not Bearer tokens). Created `middleware/auth.js` with `requireAuth`, plus `/api/auth/login`, `/api/auth/logout`, `/api/auth/check` routes and a frontend login page.

**Complexity: Medium** | **Depends on: Nothing**

Every endpoint is publicly accessible — including `POST /api/availability/reset` which wipes all bookings.

**Files:** Create `backend/src/middleware/auth.js`, modify `backend/src/app.js`, `backend/.env.example`

```bash
cd backend && npm install jsonwebtoken
```

**`backend/src/middleware/auth.js`:**

```js
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Authentication required.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { requireAuth };
```

**In `app.js` — protect all routes:**

```js
const { requireAuth } = require('./middleware/auth');

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/cycles', requireAuth, cyclesRouter);
app.use('/api/cycles', requireAuth, registrationRouter);
app.use('/api/availability', requireAuth, gridRouter);
app.use('/api/availability', requireAuth, bookingsRouter);
app.use('/api/availability', requireAuth, contactsRouter);
```

---

## Task 1.2 — Lock Down CORS ✅ DONE

> **Implemented:** CORS locked down using `ALLOWED_ORIGINS` env var with `credentials: true`.

**Complexity: Small** | `backend/src/app.js:11`

```js
// BEFORE
app.use(cors());

// AFTER
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: origin ${origin} not permitted`));
  },
  credentials: true,
}));
```

---

## Task 1.3 — Add Helmet Security Headers ✅ DONE

> **Implemented:** `helmet` package installed and `app.use(helmet())` added before CORS and routes.

**Complexity: Small**

```bash
cd backend && npm install helmet
```

```js
const helmet = require('helmet');
app.use(helmet()); // add BEFORE cors() and routes
```

---

## Task 1.4 — Add Rate Limiting ✅ DONE

> **Implemented:** General limiter (300 req/15min) and HubSpot-specific limiter (30 req/min) via `express-rate-limit`.

**Complexity: Small**

```bash
cd backend && npm install express-rate-limit
```

```js
const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300,
  message: { error: 'Too many requests, please try again later.' } });

const hubspotLimiter = rateLimit({ windowMs: 60 * 1000, max: 30,
  message: { error: 'HubSpot search rate limit reached.' } });

app.use('/api/', generalLimiter);
app.use('/api/availability/contacts', hubspotLimiter);
```

---

## Task 1.5 — Fix Hardcoded Prod DB Password ✅ DONE

> **Implemented:** `config.js` validates all required env vars in production and calls `process.exit(1)` on missing values.

**Complexity: Small** | `docker-compose.prod.yml:8,23`

```yaml
# BEFORE — silent fallback to known password
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-ndecc_prod}

# AFTER — fail-fast if env var missing
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD env var is required}
```

Also add startup validation in `backend/src/config.js`:

```js
const REQUIRED_IN_PROD = ['DATABASE_URL', 'JWT_SECRET'];
if (process.env.NODE_ENV === 'production') {
  const missing = REQUIRED_IN_PROD.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`FATAL: Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}
```

---

## Task 1.6 — Remove `window.__API_BASE__` XSS Vector ✅ DONE

> **Implemented:** Removed `window.__API_BASE__` from `frontend/src/config.js`; API base now derived solely from `import.meta.env.VITE_API_BASE`.

**Complexity: Small** | `frontend/src/config.js:1`

```js
// BEFORE
export const API_BASE = (import.meta.env.VITE_API_BASE || window.__API_BASE__) || ...

// AFTER — remove window global entirely
export const API_BASE = import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? '' : 'http://localhost:5001');
```

---

## Task 1.7 — Sanitize `traineeName` Input ✅ DONE

> **Implemented:** `traineeName` sanitized with regex + length check (1-150 chars); superseded by Joi validation in Phase 2.

**Complexity: Small** | `backend/src/routes/bookings.js:9`

Add after existing presence check:

```js
const sanitizedName = String(traineeName).trim();
if (sanitizedName.length === 0 || sanitizedName.length > 150) {
  return res.status(400).json({ error: 'traineeName must be 1-150 characters.' });
}
if (!/^[\p{L}\p{M}'\-\. ]+$/u.test(sanitizedName)) {
  return res.status(400).json({ error: 'traineeName contains invalid characters.' });
}
```

---

## Task 1.8 — Protect HubSpot Contact Endpoints ✅ DONE

> **Implemented:** Contact ID validated with `/^\d+$/` regex and search query capped at 200 chars; superseded by Joi validation in Phase 2.

**Complexity: Small** | `backend/src/routes/contacts.js` | **Depends on: Task 1.1**

Add ID validation on `GET /contacts/:id`:

```js
if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Invalid contact ID.' });
```

Add query length validation on search:

```js
if (q.length > 200) return res.status(400).json({ error: 'Query must be <= 200 chars.' });
```

---

## Task 1.9 — Stop Leaking Error Messages ✅ DONE

> **Implemented:** All `err.message` leaks replaced with generic messages; centralized in Phase 2 global error handler.

**Complexity: Small** | `contacts.js:12,25,37` + `registration.js:54,123`

Replace all `res.status(500).json({ error: err.message })` with generic messages:

```js
res.status(500).json({ error: 'Failed to search contacts.' });
res.status(500).json({ error: 'Failed to retrieve contact.' });
res.status(500).json({ error: 'Failed to build registration list.' });
```

---

## Task 1.10 — Add `*.db` to `.gitignore` ✅ DONE

> **Implemented:** Added `*.db`, `*.db-shm`, `*.db-wal` to `.gitignore` and untracked any existing `.db` files.

**Complexity: Small**

```gitignore
# SQLite databases
*.db
*.db-shm
*.db-wal
```

```bash
git ls-files "*.db"  # check if tracked
git rm --cached path/to/file.db  # untrack if needed
```

---

## Phase 1 Checklist

| # | Task | Files | Complexity | Status |
|---|------|-------|------------|--------|
| 1.1 | Auth middleware | `middleware/auth.js`, `app.js` | Medium | ✅ |
| 1.2 | CORS lockdown | `app.js` | Small | ✅ |
| 1.3 | Helmet headers | `app.js` | Small | ✅ |
| 1.4 | Rate limiting | `app.js` | Small | ✅ |
| 1.5 | DB password fallback | `docker-compose.prod.yml`, `config.js` | Small | ✅ |
| 1.6 | Remove XSS vector | `frontend/src/config.js` | Small | ✅ |
| 1.7 | Sanitize traineeName | `routes/bookings.js` | Small | ✅ |
| 1.8 | Protect HubSpot endpoints | `routes/contacts.js` | Small | ✅ |
| 1.9 | Stop leaking errors | `contacts.js`, `registration.js` | Small | ✅ |
| 1.10 | `.gitignore` update | `.gitignore` | Small | ✅ |

---

# Phase 2: Backend Architecture Fixes ✅ COMPLETE

**Overview:** All business logic lives in route handlers, no validation library, no consistent API shape, no centralized error handling, multi-step DB ops without transactions.

**Implementation order:** Task 7,8 (config) → Task 4,2 (middleware) → Task 1 (Joi) → Task 5,6 (DB safety) → Task 3 (service layer)

---

## Task 2.1 — Add Input Validation with Joi ✅ DONE

> **Implemented:** Joi schemas created in `schemas/` (cycles.js, bookings.js, grid.js, contacts.js, registration.js) + `middleware/validate.js` wired into all routes.

**Complexity: Medium**

```bash
cd backend && npm install joi
```

Create `backend/src/schemas/` with schemas for every route, plus `backend/src/middleware/validate.js`:

```js
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false, stripUnknown: true, convert: true,
  });
  if (error) {
    const details = {};
    for (const item of error.details) {
      details[item.path.join('.')] = item.message.replace(/['"]/g, '');
    }
    return res.status(400).json({ error: 'Validation failed.', details });
  }
  req[source] = value;
  next();
};
```

**Example schemas:**
- `bookSchema`: cycleId (int+), stationId (int+), shift (AM/PM), weeks (int[1-12]), traineeName (string 1-200)
- `createCycleSchema`: year (int 2020-2100), courseCodes (string[] optional)
- `gridQuerySchema`: cycleId (int+), shift (AM/PM), labType (string), side (string)

Wire into routes: `router.post('/book', validate(bookSchema), async (req, res) => { ... })`

---

## Task 2.2 — Standard API Response Envelope ✅ DONE

> **Implemented:** `middleware/respond.js` helper with `ok`, `list`, `created`, `notFound`, `conflict`, `serverError` — used across all routes.

**Complexity: Small**

Create `backend/src/middleware/respond.js`:

```js
const respond = {
  ok(res, data, message = 'Success') { return res.json({ data, message }); },
  list(res, items, message = 'Fetched') { return res.json({ data: items, count: items.length, message }); },
  created(res, data, message = 'Created') { return res.status(201).json({ data, message }); },
  notFound(res, message = 'Not found.') { return res.status(404).json({ error: message }); },
  conflict(res, message, details = {}) { return res.status(409).json({ error: message, details }); },
  serverError(res, message = 'An unexpected error occurred.') { return res.status(500).json({ error: message }); },
};
```

Replace all `res.json(rawArray)` / `res.json({ success: true })` with `respond.list()` / `respond.ok()`.

---

## Task 2.3 — Extract Service Layer ✅ DONE

> **Implemented:** `services/` directory with `cycleService.js`, `bookingService.js`, `gridService.js`, `registrationService.js`; routes are now thin adapter handlers.

**Complexity: Large**

Create `backend/src/services/`:
- **`cycleService.js`** — `listCycles()`, `createCycle()`, `updateWeeks()`, `updateCourseCodes()`, `setLocked()`, `deleteCycle()`
- **`bookingService.js`** — `bookSlots()`, `unbookSlots()`, `resetCycle()`
- **`gridService.js`** — `buildGrid()`, `findAvailableBlocks()`

Routes become thin adapters:

```js
router.post('/book', validate(bookSchema), async (req, res, next) => {
  try {
    await bookingService.bookSlots(req.body);
    return respond.ok(res, null, 'Slot(s) booked.');
  } catch (err) { next(err); }
});
```

---

## Task 2.4 — Global Error Handler ✅ DONE

> **Implemented:** `middleware/errorHandler.js` catches `AppError` (custom statusCode), Prisma P2025/P2002/P2003 error codes, and falls back to 500 with a generic message.

**Complexity: Small**

Create `backend/src/middleware/errorHandler.js`:

```js
function errorHandler(err, req, res, _next) {
  console.error(`[${req.method} ${req.path}]`, err.message);
  if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
  if (err.code === 'P2025') return res.status(404).json({ error: 'Record not found.' });
  if (err.code === 'P2002') return res.status(409).json({ error: 'Duplicate record.' });
  return res.status(500).json({ error: 'An unexpected error occurred.' });
}
```

Register AFTER all routes in `app.js`: `app.use(errorHandler);`

---

## Task 2.5 — Wrap Multi-Step DB Ops in Transactions ✅ DONE

> **Implemented:** `deleteCycle` and `updateWeeks` wrapped in `prisma.$transaction()` for atomic execution.

**Complexity: Small** | `cycles.js:194-196`, `cycles.js:99-113`

```js
// BEFORE — 3 separate deletes, crash = corrupt state
await prisma.booking.deleteMany({ where: { cycleId } });
await prisma.cycleWeek.deleteMany({ where: { cycleId } });
await prisma.cycle.delete({ where: { id: cycleId } });

// AFTER — atomic
return prisma.$transaction(async (tx) => {
  await tx.booking.deleteMany({ where: { cycleId } });
  await tx.cycleWeek.deleteMany({ where: { cycleId } });
  return tx.cycle.delete({ where: { id: cycleId } });
});
```

---

## Task 2.6 — Fix 404 on Lock/Unlock ✅ DONE

> **Implemented:** `setLocked` in `cycleService.js` checks cycle existence via `findUnique` before update, throwing a 404 `AppError` if missing.

**Complexity: Small** | `cycles.js:159-183`

In service layer, check existence before update:

```js
async function setLocked(cycleId, locked) {
  const exists = await prisma.cycle.findUnique({ where: { id: cycleId } });
  if (!exists) { const err = new Error('Cycle not found.'); err.statusCode = 404; throw err; }
  return prisma.cycle.update({ where: { id: cycleId }, data: { locked } });
}
```

---

## Task 2.7 — Centralize Config in hubspot.js ✅ DONE

> **Implemented:** Removed redundant `require('dotenv').config()` from `hubspot.js`; now reads `config.hubspotApiKey` instead of `process.env` directly.

**Complexity: Small** | `hubspot.js:3-7`

Remove `require('dotenv').config()` (redundant), use `config.hubspotApiKey` instead of `process.env.HUBSPOT_API_KEY`.

---

## Task 2.8 — Add API Versioning ✅ DONE

> **Implemented:** All protected routes mounted under `/api/v1/` via a dedicated `v1` Router; auth routes remain at `/api/auth/`. Frontend `api.js` base URL updated to `/api/v1`.

**Complexity: Small** | `app.js:14-18`

```js
const v1 = express.Router();
v1.use('/cycles', cyclesRouter);
v1.use('/availability', gridRouter);
// ...
app.use('/api/v1', v1);
```

Update frontend `api.js` base URL from `/api` to `/api/v1`.

---

# Phase 3: Database & DevOps Fixes

**Overview:** SQLite/PostgreSQL mismatch, no cascades, no indexes, bloated Docker images, empty CI/CD, committed build artifacts.

---

## Task 3.1 — Migrate Prisma from SQLite to PostgreSQL

**Complexity: Medium** | `prisma/schema.prisma:6`

```prisma
// BEFORE
provider = "sqlite"
courseCodes String?   // manual JSON.parse everywhere

// AFTER
provider = "postgresql"
courseCodes Json?     // native JSONB, no serialize/deserialize
```

Remove all `JSON.parse(cycle.courseCodes)` / `JSON.stringify(courseCodes)` from `cycles.js:20,66,144` and `registration.js:23`. Replace with `cycle.courseCodes ?? []`.

---

## Task 3.2 — Add Database Cascades

**Complexity: Small** | `prisma/schema.prisma`

```prisma
cycle Cycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
```

Add to CycleWeek→Cycle and Booking→Cycle, Booking→Station relations. Delete in `cycles.js` simplifies to `await prisma.cycle.delete({ where: { id } })`.

---

## Task 3.3 — Add Database Indexes

**Complexity: Small** | `prisma/schema.prisma`

```prisma
model Booking {
  @@index([cycleId, shift, week])   // grid queries
  @@index([contactId])              // student info lookups
}
```

---

## Task 3.4 — Configure PrismaClient Connection Pool

**Complexity: Small** | `backend/src/db.js`

Add `?connection_limit=10&pool_timeout=20` to `DATABASE_URL` in `.env`.

---

## Task 3.5 — Fix Prod Dockerfile (Multi-Stage)

**Complexity: Medium** | `backend/Dockerfile.prod`

- Stage 1 (builder): install all deps + `prisma generate`
- Stage 2 (runner): `npm ci --omit=dev`, copy generated Prisma client from builder, copy `src/` and `prisma/`

---

## Task 3.6 — Fix Dev Dockerfile

**Complexity: Small** | `backend/Dockerfile.dev`

Don't COPY src (volume mounted). Use `npx nodemon --legacy-watch src/index.js`.

---

## Task 3.7 — Remove Built Assets from Git

**Complexity: Small**

```bash
git rm --cached -r frontend/assets/ frontend/dist/
```

Add `frontend/dist/`, `frontend/assets/`, `*.js.map`, `*.css.map` to `.gitignore`.

---

## Task 3.8 — Fix `.env.example`

**Complexity: Small** | `backend/.env.example`

Replace real credentials (`ndecc_dev`) with placeholders (`YOUR_DB_PASSWORD`).

---

## Task 3.9 — Add Docker Health Checks

**Complexity: Small** | `docker-compose.dev.yml`, `docker-compose.prod.yml`

PostgreSQL: `pg_isready -U ndecc_user -d ndecc_dev`
Backend: `wget -qO- http://localhost:3001/api/health || exit 1`
Use `depends_on: postgres: condition: service_healthy`.

---

## Task 3.10 — Set Up CI/CD Pipeline

**Complexity: Medium** | `.github/workflows/`

Create `ci.yml`: backend tests (with PostgreSQL service container) + frontend lint/typecheck/build/test.
Replace empty `deploy-frontend.yml`: deploy to Vercel on green CI + main push.

---

# Phase 4: Frontend Modernization

**Overview:** Plain JS (no TypeScript), manual `useEffect+fetch`, no validation library, no React Hook Form, 437-line God component, error-swallowing API client.

---

## Task 4.1 — Migrate to TypeScript

**Complexity: Large**

```bash
cd frontend && npm install -D typescript @types/react @types/react-dom
```

- Create `tsconfig.json` with `strict: true`
- Rename all 17 `.jsx`/`.js` → `.tsx`/`.ts`
- Create `frontend/src/types.ts` with all domain types: `Cycle`, `GridData`, `Combination`, `HubSpotContact`, `RegistrationData`, `Filters`, etc.

---

## Task 4.2 — Add TanStack Query

**Complexity: Medium**

```bash
cd frontend && npm install @tanstack/react-query
```

- Wrap app in `QueryClientProvider` in `main.tsx`
- Create `frontend/src/hooks/useQueries.ts`: `useCycles()`, `useGrid()`, `useRegistrationList()`
- Delete manual `useEffect + fetch + setLoading + setError + setData` from `App.jsx` and `RegistrationList.jsx`

---

## Task 4.3 — Add Zod Schemas

**Complexity: Small**

```bash
cd frontend && npm install zod
```

Create `frontend/src/schemas.ts`: `bookingSchema`, `searchCriteriaSchema`, `cycleCreateSchema`.

---

## Task 4.4 — Add React Hook Form

**Complexity: Small**

```bash
cd frontend && npm install react-hook-form @hookform/resolvers
```

Refactor `CellBookingDialog` and `SearchCriteriaForm` to use `useForm` + Zod resolver.

---

## Task 4.5 — Break Up App.jsx God Component

**Complexity: Large**

Split 437-line `App.jsx` into:
- `App.tsx` (~50 lines) — layout shell, view toggle
- `CycleManager.tsx` — cycle CRUD, selection
- `ScheduleView.tsx` — grid, filters, booking dialogs
- `SearchPanel.tsx` — search criteria, results, booking section

---

## Task 4.6 — Fix API Client

**Complexity: Medium**

Rewrite `api.js` → `api.ts`:
- Centralized axios instance with base URL
- Error interceptor (normalize to clean `Error`)
- Envelope unwrapper (`response.data.data`)
- **Stop swallowing errors** — `fetchCycles`, `fetchGrid`, `findCombinations` must THROW, not return `[]`/`null`

---

## Task 4.7 — Delete `config.js` (XSS vector removed)

After Task 4.6, `config.js` is unused. Delete it.

---

## Task 4.8 — Fix `index.html`

Add `lang="en"`, `<meta name="viewport">`, `<link rel="icon" href="/logo.svg">`.

---

## Task 4.9 — Remove `console.log` Artifacts

Delete debug logs from `ContactSearch.jsx:46,51,55`.

---

# Phase 5: Frontend Design System

**Overview:** Hardcoded colors everywhere, no CSS variables, no dark mode, inline styles, accessibility issues.

**Implementation order:** Task 5.1 (tokens) → 5.3,5.6 (quick fixes) → 5.8 (Sonner) → 5.2 (replace colors) → 5.4 (dark mode) → 5.5,5.7 (dialogs, skeletons)

---

## Task 5.1 — Set Up Semantic CSS Variables

**Complexity: Small** | `style.css`, `tailwind.config.js`

Define in `:root`: `--color-background`, `--color-foreground`, `--color-primary`, `--color-success`, `--color-destructive`, `--color-warning`, `--color-muted`, `--color-border`, `--color-card`.
Define `.dark` overrides. Extend Tailwind config to use `rgb(var(--color-xxx) / <alpha-value>)`.

---

## Task 5.2 — Replace ALL Hardcoded Colors

**Complexity: Large** | Every component

Full replacement map:

| Pattern | Before | After |
|---------|--------|-------|
| Booked cell | `bg-green-100 text-green-800` | `bg-success/10 text-success` |
| Error/danger | `bg-red-600 text-white` | `bg-destructive text-destructive-foreground` |
| Warning | `bg-yellow-50 text-yellow-900` | `bg-warning/10 text-warning` |
| Info/accent | `bg-blue-50 text-blue-900` | `bg-primary/10 text-primary` |
| Neutral | `bg-gray-100 text-gray-700` | `bg-muted text-muted-foreground` |
| Page bg | `bg-gray-50` | `bg-background` |
| Card bg | `bg-white` | `bg-card` |
| Text | `text-gray-900` | `text-foreground` |
| Borders | `border-gray-200` | `border-border` |

Files affected: `AvailabilityGrid`, `StudentInfoDialog`, `RegistrationList`, `ContactSearch`, `BookingSection`, `CycleTabs`, `SearchCriteriaForm`, `SearchResults`, `FilterBar`, `CellBookingDialog`, `App.jsx`.

---

## Task 5.3 — Replace Inline Styles

**Complexity: Small** | `AvailabilityGrid.jsx`

- `style={{ tableLayout: 'fixed' }}` → `table-fixed`
- `style={{ width: '160px' }}` → `w-40`
- `style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}` → `max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap`

---

## Task 5.4 — Enable Dark Mode

**Complexity: Small**

Add `darkMode: 'class'` to `tailwind.config.js`. Create `DarkModeToggle` component. Add anti-FOUC script in `index.html`.

---

## Task 5.5 — Replace `confirm()` with Custom Dialog

**Complexity: Medium** | `AvailabilityGrid.jsx:178`

Create reusable `ConfirmDialog` component. Replace `confirm('Clear ALL bookings?')` with state-driven dialog.

---

## Task 5.6 — Fix `<span>` Accessibility

**Complexity: Small** | `CycleTabs.jsx:73`

Change `<span onClick>` to `<button type="button" aria-label="Delete cycle">`.

---

## Task 5.7 — Add Loading Skeletons

**Complexity: Medium**

Create `Skeleton`, `SkeletonCard`, `SkeletonTableRow` components. Replace "Loading..." text in `SearchResults`, `AvailabilityGrid`, `RegistrationList` with skeleton UI.

---

## Task 5.8 — Add Toast Notifications (Sonner)

**Complexity: Small**

```bash
cd frontend && npm install sonner
```

Add `<Toaster>` to App root. Replace inline `<p className="text-red-600">` errors in `BookingSection` with `toast.error()`. Replace `console.error` in `CycleTabs` with `toast.error()`.

---

# Phase 6: Testing & Polish

**Overview:** Test coverage near-zero, empty CI/CD, dead code tracked, README outdated.

**Priority order:** Test isolation → Backend tests → Frontend tests → CI/CD → ESLint → Dead code → E2E → Docs

---

## Task 6.1 — Backend Test Coverage

**Complexity: Large**

**Missing tests for:**
- `cycles.js`: course-codes, lock, unlock, delete
- `availability.js`: book, unbook, find, reset
- `contacts.js`: all 3 endpoints (zero tests)
- `registration.js`: all endpoints (zero tests)
- `hubspot.js`: HubSpotService class (mock axios)

Target: 70% line coverage, 70% function coverage.

---

## Task 6.2 — Fix Test Isolation

**Complexity: Medium**

- Create `globalSetup.js`: apply migrations to `test.db`
- Create `globalTeardown.js`: delete `test.db`
- `setup.js`: wipe all tables `beforeEach`
- Set `maxWorkers: 1` in `jest.config.js`
- Create `.env.test` with `DATABASE_URL=file:./test.db`

---

## Task 6.3 — Frontend Test Coverage

**Complexity: Large**

Create tests for: `api.js`, `ContactSearch`, `RegistrationList`, `BookingSection`, `CycleTabs`.

```bash
cd frontend && npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/coverage-v8 jsdom
```

Target: 60% line coverage, 60% function coverage.

---

## Task 6.4 — Playwright E2E Tests

**Complexity: Medium**

```bash
cd frontend && npm install -D @playwright/test && npx playwright install chromium
```

Cover 3 critical flows:
1. Create cycle → select → view grid
2. Book slot → verify → unbook
3. Search contact → select → book with contact info

---

## Task 6.5 — Set Up CI/CD Pipeline

**Complexity: Medium**

Create `.github/workflows/ci.yml`:
- Backend: install → generate Prisma → migrate test DB → run tests
- Frontend: install → lint → typecheck → build → run tests

Replace empty `.github/workflows/deploy-frontend.yml` with Vercel deploy on green CI + main push.

---

## Task 6.6 — Add ESLint Configuration

**Complexity: Small**

```bash
cd frontend && npm install -D eslint @eslint/js eslint-plugin-react eslint-plugin-react-hooks globals
```

Create `eslint.config.js` with React hooks rules, no-unused-vars, no-console (warn), eqeqeq.

---

## Task 6.7 — Clean Up Dead Code

**Complexity: Small**

Stage deleted files properly:

```bash
git rm -r api/
git rm backend/auth.js backend/excel.js backend/auth/msalAuth.js
git rm backend/src/cache.js backend/src/excel-loader.js backend/src/msgraph.js
git rm backend/src/routes/availability.js backend/src/watch.js backend/test-download-url.js
git rm backend/routes/graphRoutes.js
git rm frontend/src/components/AvailabiltyFinder.jsx
```

---

## Task 6.8 — Update Documentation

**Complexity: Small**

Rewrite `README.md` with current architecture, setup instructions (Docker + local), environment variables table, API reference with envelope format, test/lint commands.

---

# Quick Reference — All New Dependencies

## Backend

```bash
cd backend && npm install jsonwebtoken helmet express-rate-limit joi
```

## Frontend

```bash
cd frontend && npm install -D typescript @types/react @types/react-dom
cd frontend && npm install @tanstack/react-query zod react-hook-form @hookform/resolvers sonner
cd frontend && npm install -D eslint @eslint/js eslint-plugin-react eslint-plugin-react-hooks globals
cd frontend && npm install -D @playwright/test @vitest/coverage-v8
```
