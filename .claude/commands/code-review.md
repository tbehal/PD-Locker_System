---
description: Comprehensive security and quality review of code changes. Check for vulnerabilities, code quality, and best practices.
---

# Code Review Command

Review uncommitted changes for security and quality issues.

## Review Checklist

### Security Issues (CRITICAL)

- [ ] No hardcoded secrets (API keys, Stripe keys, passwords)
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Input validation on all user inputs
- [ ] Stripe webhook signature verification
- [ ] No sensitive data in logs or responses

### Code Quality (HIGH)

- [ ] Functions under 50 lines
- [ ] Files under 800 lines
- [ ] Nesting depth under 4 levels
- [ ] Proper error handling
- [ ] No console.log in production code
- [ ] No TODO/FIXME comments left

### Best Practices (MEDIUM)

- [ ] Immutable patterns (no mutation)
- [ ] No emojis in code/comments
- [ ] Tests for new code
- [ ] TypeScript types complete
- [ ] Zod validation for API inputs

## Review Process

1. Get changed files: `git diff --name-only HEAD`
2. Review each file for issues above
3. Generate report with severity and location
4. Block commit if CRITICAL or HIGH issues found

## Report Format

```
CRITICAL: [file:line] - [issue description]
  Suggested fix: [how to fix]

HIGH: [file:line] - [issue description]
  Suggested fix: [how to fix]
```

## Stripe-Specific Checks

- Never log full card numbers or CVV
- Verify webhook signatures
- Use test keys in development only
- Price IDs from environment variables
