# Waitlist Rules - Locker System

## Duplication Policy (CRITICAL)

Duplicate entries in the waitlist are **strictly prohibited**. Every waitlist entry must be unique.

## What Constitutes a Duplicate?

An entry is considered duplicate if ANY of these match an existing entry:

| Field | Uniqueness |
|-------|------------|
| Email | Must be unique across all waitlist entries |
| Student ID | Must be unique across all waitlist entries |

## Database Level Enforcement

```sql
-- ALWAYS: Unique constraints on waitlist table
CREATE TABLE waitlist (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  student_id TEXT NOT NULL UNIQUE,
  -- other fields...
);

-- NEVER: Allow duplicate emails or student IDs
```

## API Level Enforcement

```typescript
// ALWAYS: Check for duplicates before insert
async function addToWaitlist(data: WaitlistEntry) {
  const existingByEmail = await db.prepare(
    'SELECT id FROM waitlist WHERE email = ?'
  ).get(data.email)

  if (existingByEmail) {
    throw new Error('Email already exists in waitlist')
  }

  const existingByStudentId = await db.prepare(
    'SELECT id FROM waitlist WHERE student_id = ?'
  ).get(data.studentId)

  if (existingByStudentId) {
    throw new Error('Student ID already exists in waitlist')
  }

  // Proceed with insert
}

// NEVER: Insert without checking
async function addToWaitlist(data: WaitlistEntry) {
  await db.prepare('INSERT INTO waitlist ...').run(data) // WRONG
}
```

## Status Field (Dropdown)

The status field must be a dropdown with exactly these options:

| Status | Description |
|--------|-------------|
| `none` | Default status, no action taken yet |
| `contacted` | Admin has contacted the student |
| `link_sent` | Payment link has been sent to student |
| `not_needed` | Student no longer needs a locker |
| `paid` | Student has paid (auto-removes from waitlist) |

**Default status:** `none` (first option)

**Special behavior:** Setting status to `paid` automatically deletes the entry from the waitlist.

## Zod Validation Schema

```typescript
// ALWAYS: Validate and sanitize before duplicate check
const waitlistSchema = z.object({
  fullName: z.string().min(1).trim(),
  email: z.string().email().toLowerCase().trim(),
  studentId: z.string().min(1).trim(),
  potentialStartDate: z.string().datetime(),
  potentialEndDate: z.string().datetime(),
  status: z.enum(['none', 'contacted', 'link_sent', 'not_needed', 'paid']).default('none'),
})
```

## Auto-Delete on Payment (CRITICAL)

When a student completes payment for a locker, they must be **automatically removed** from the waitlist.

### Implementation in Stripe Webhook

```typescript
// In stripe.ts webhook handler - checkout.session.completed event
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_details?.email?.toLowerCase()

  // ... existing locker assignment logic ...

  // ALWAYS: Remove from waitlist after successful payment
  if (customerEmail) {
    await db.prepare(
      'DELETE FROM waitlist WHERE email = ?'
    ).run(customerEmail)
  }
}
```

### Why Auto-Delete?

- Student got a locker, no longer needs to be on waitlist
- Prevents stale data
- Keeps waitlist accurate and actionable
- No manual cleanup required by admin

### Edge Cases

```typescript
// ALWAYS: Handle case where student wasn't on waitlist (no error)
const result = db.prepare('DELETE FROM waitlist WHERE email = ?').run(email)
// result.changes will be 0 if not found - this is OK, not an error

// NEVER: Throw error if student wasn't on waitlist
if (!found) throw new Error('Not on waitlist') // WRONG
```

## Error Handling for Duplicates

```typescript
// ALWAYS: Return clear error messages
if (duplicateFound) {
  return {
    success: false,
    error: 'A waitlist entry with this email or student ID already exists'
  }
}

// NEVER: Generic error messages
if (duplicateFound) {
  return { success: false, error: 'Error' } // WRONG - not helpful
}
```

## Frontend Validation

```typescript
// ALWAYS: Show specific error to admin
if (error.includes('already exists')) {
  toast.error('This student is already on the waitlist')
}

// NEVER: Allow form resubmission without clearing duplicate
```

## Edit Operations

When editing an existing waitlist entry:

```typescript
// ALWAYS: Exclude current entry from duplicate check
const existingByEmail = await db.prepare(
  'SELECT id FROM waitlist WHERE email = ? AND id != ?'
).get(newEmail, currentEntryId)

// NEVER: Check without excluding current entry (will always find "duplicate")
```

## Audit Trail

- Log all duplicate rejection attempts
- Track who attempted to add duplicate and when
- Helps identify data entry issues

## Summary Checklist

### Duplication Prevention
- [ ] UNIQUE constraints on email and student_id columns
- [ ] API checks for duplicates before insert
- [ ] API checks for duplicates on update (excluding self)
- [ ] Clear error messages returned to frontend
- [ ] Email normalized to lowercase before comparison
- [ ] Student ID trimmed before comparison
- [ ] Frontend displays specific duplicate error

### Status Field
- [ ] Dropdown with exactly 3 options: Contacted, Link Sent, Not needed
- [ ] Default status is "contacted"
- [ ] Status stored as lowercase with underscore (link_sent, not_needed)

### Auto-Delete on Payment
- [ ] Stripe webhook deletes waitlist entry on successful payment
- [ ] Match by email (lowercase)
- [ ] No error if student wasn't on waitlist
- [ ] Delete happens AFTER locker assignment succeeds
