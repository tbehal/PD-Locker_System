# Security Rules - Locker System

## Mandatory Checks Before Commit

- [ ] No hardcoded secrets (API keys, Stripe keys, passwords)
- [ ] All user inputs validated with Zod
- [ ] Stripe webhook signatures verified
- [ ] No sensitive data in error messages
- [ ] Environment variables for all secrets

## Stripe Security

```typescript
// NEVER: Hardcoded keys
const stripe = new Stripe("sk_test_xxxx")

// ALWAYS: Environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```

## Webhook Verification

```typescript
// ALWAYS verify webhook signatures
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
)
```

## Input Validation

```typescript
// ALWAYS validate with Zod
const schema = z.object({
  lockerId: z.string().min(1),
  // ...
})

const validated = schema.parse(input)
```

## Secret Management

Required environment variables:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID

Never commit:
- .env.local
- Any file with real credentials
