---
description: Create implementation plan before writing code. Restate requirements, identify risks, break into phases. WAIT for user confirmation.
---

# Plan Command

Create a comprehensive implementation plan before writing any code.

## What This Does

1. **Restate Requirements** - Clarify what needs to be built
2. **Identify Risks** - Surface potential issues
3. **Create Step Plan** - Break down into phases
4. **Wait for Confirmation** - Get user approval before proceeding

## When to Use

- Starting a new feature
- Making architectural changes
- Complex refactoring
- Multiple files affected
- Requirements unclear

## Plan Format

```markdown
# Implementation Plan: [Feature Name]

## Requirements
- [Clear restatement of what needs to be built]

## Phases

### Phase 1: [Name]
- Step 1
- Step 2

### Phase 2: [Name]
- Step 1
- Step 2

## Dependencies
- [External services, packages, etc.]

## Risks
- HIGH: [Critical risks]
- MEDIUM: [Moderate risks]
- LOW: [Minor risks]

## Files to Modify
- [List of files that will be changed]

**WAITING FOR CONFIRMATION**: Proceed? (yes/no/modify)
```

## Important

NEVER write code until user explicitly confirms with "yes" or "proceed".

## Locker System Specific

Consider these areas when planning:
- Stripe integration (checkout, webhooks, portal)
- Locker state management
- User authentication (if applicable)
- Database schema changes
- API endpoint design
