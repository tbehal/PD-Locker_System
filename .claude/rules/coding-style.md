# Coding Style - Locker System

## Immutability

ALWAYS create new objects, NEVER mutate:

```typescript
// WRONG
function updateLocker(locker, status) {
  locker.status = status
  return locker
}

// CORRECT
function updateLocker(locker, status) {
  return { ...locker, status }
}
```

## File Organization

- 200-400 lines typical
- 800 lines maximum
- Organize by feature/domain
- High cohesion, low coupling

## Error Handling

```typescript
try {
  const result = await operation()
  return { success: true, data: result }
} catch (error) {
  // Log for debugging (remove in production)
  return { success: false, error: 'User-friendly message' }
}
```

## TypeScript

- Strict mode enabled
- No `any` types
- Use interfaces for objects
- Use type for unions/aliases

## Components

- Functional components only
- Custom hooks for shared logic
- Props interfaces defined
- Default exports for pages

## API Routes

- Use Zod for input validation
- Return consistent ApiResponse format
- Handle all error cases
- Set appropriate status codes
