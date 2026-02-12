---
description: Enforce test-driven development workflow. Write tests FIRST, then implement minimal code to pass. Ensure 80%+ coverage.
---

# TDD Command

Enforce test-driven development methodology for the Locker System.

## TDD Cycle

```
RED -> GREEN -> REFACTOR -> REPEAT

RED:      Write a failing test
GREEN:    Write minimal code to pass
REFACTOR: Improve code, keep tests passing
REPEAT:   Next feature/scenario
```

## Steps

1. **Define Interface** - Create types/interfaces first
2. **Write Failing Test** - Test must fail initially (RED)
3. **Run Tests** - Verify failure is expected
4. **Implement Minimal Code** - Just enough to pass (GREEN)
5. **Run Tests** - Verify passing
6. **Refactor** - Improve while keeping tests green
7. **Check Coverage** - Ensure 80%+ coverage

## Coverage Requirements

- **80% minimum** for all code
- **100% required** for:
  - Stripe payment logic
  - Locker assignment logic
  - Subscription management
  - API endpoints

## Testing Commands

```bash
npm test                     # Run all tests
npm test -- --watch          # Watch mode
npm test -- --coverage       # With coverage report
```

## Best Practices

DO:
- Write test FIRST, before implementation
- Run tests after each change
- Test behavior, not implementation
- Include edge cases

DON'T:
- Write code before tests
- Skip running tests
- Mock everything
- Test implementation details
