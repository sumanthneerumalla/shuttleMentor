# Polar.sh Payment Integration - Implementation Checklist

A step-by-step checklist for implementing Polar.sh payments in ShuttleMentor.

---

## Phase 1: Setup & Configuration

### Polar.sh Account Setup
- [ ] Create account at [sandbox.polar.sh](https://sandbox.polar.sh) for testing
- [ ] Create organization in Polar dashboard
- [ ] Generate Organization Access Token (OAT) from Settings
- [ ] Note down the access token securely

### Local Development Setup
- [ ] Install dependencies:
  ```bash
  npm install @polar-sh/sdk @polar-sh/nextjs @polar-sh/checkout
  ```
- [ ] Add environment variables to `.env`:
  ```env
  POLAR_ACCESS_TOKEN=polar_oat_sandbox_xxxx
  POLAR_WEBHOOK_SECRET=whsec_xxxx
  POLAR_MODE=sandbox
  POLAR_SUCCESS_URL=http://localhost:3000/orders/success
  POLAR_RETURN_URL=http://localhost:3000/coaches
  ```
- [ ] Update `src/env.js` with Polar environment variable schemas

### Database Setup
- [ ] Add new models to `prisma/schema.prisma` (see `polar-database-schema.md`)
- [ ] Run migration: `npx prisma migrate dev --name add_payment_models`
- [ ] Verify migration applied correctly
- [ ] Generate Prisma client: `npx prisma generate`

---

## Phase 2: Backend Implementation

### Core Utilities
- [ ] Create `src/lib/polar.ts` with Polar client instance
- [ ] Add helper functions (formatPrice, dollarsToCents, etc.)

### Webhook Handler
- [ ] Create `src/app/api/webhooks/polar/route.ts`
- [ ] Implement `onOrderPaid` handler
- [ ] Implement `onOrderRefunded` handler
- [ ] Implement `onSubscriptionActive` handler
- [ ] Implement `onSubscriptionCanceled` handler
- [ ] Implement `onCustomerCreated` handler

### Webhook Testing (Local)
- [ ] Install ngrok: `brew install ngrok` (or download)
- [ ] Start ngrok tunnel: `ngrok http 3000`
- [ ] Add ngrok URL as webhook endpoint in Polar sandbox dashboard
- [ ] Configure webhook secret
- [ ] Test webhook delivery with Polar's test feature

### tRPC Router
- [ ] Create `src/server/api/routers/payments.ts`
- [ ] Implement `createProduct` mutation
- [ ] Implement `updateProduct` mutation
- [ ] Implement `getCoachProducts` query
- [ ] Implement `getMyProducts` query
- [ ] Implement `createCheckout` mutation
- [ ] Implement `getMyOrders` query
- [ ] Implement `getReceivedOrders` query
- [ ] Implement `getAvailableCredits` query
- [ ] Implement `useCredit` mutation
- [ ] Register router in `src/server/api/root.ts`

### Checkout Route
- [ ] Create `src/app/api/checkout/route.ts` (optional, if using simple checkout)

---

## Phase 3: Frontend Implementation

### Shared Components
- [ ] Create `src/app/_components/client/authed/CheckoutButton.tsx`
- [ ] Create `src/app/_components/client/authed/CoachProductCard.tsx`
- [ ] Create `src/app/_components/client/authed/OrderHistory.tsx`
- [ ] Create `src/app/_components/client/authed/CreditSelector.tsx`

### Coach Dashboard
- [ ] Create `src/app/coach/products/page.tsx` - Product management
- [ ] Create `src/app/_components/client/authed/ProductForm.tsx` - Create/edit products
- [ ] Create `src/app/_components/client/authed/CoachOrdersList.tsx` - Received orders
- [ ] Add products link to coach navigation

### Student/User Pages
- [ ] Create `src/app/orders/page.tsx` - Order history
- [ ] Create `src/app/orders/success/page.tsx` - Post-checkout success page
- [ ] Update coach profile page to show products
- [ ] Add "Book Session" button to coach cards

### Update Existing Components
- [ ] Update `CoachSelector.tsx`:
  - [ ] Check for available credits before allowing assignment
  - [ ] Show "Book Session" if no credits available
  - [ ] Allow credit selection when multiple orders exist
- [ ] Update `VideoCollectionDisplay.tsx`:
  - [ ] Show payment status if collection is linked to order
  - [ ] Indicate if review is paid vs. unpaid

---

## Phase 4: Testing

### Unit Tests
- [ ] Test payment router procedures with mocked Polar client
- [ ] Test order status transitions
- [ ] Test credit usage logic
- [ ] Test authorization checks

### Integration Tests
- [ ] Test full checkout flow in sandbox
- [ ] Test webhook handling with real events
- [ ] Test order creation from webhook
- [ ] Test refund handling

### Manual Testing Checklist
- [ ] Create a product as a coach
- [ ] Purchase product as a student (use test card `4242 4242 4242 4242`)
- [ ] Verify order appears in student's order history
- [ ] Verify order appears in coach's received orders
- [ ] Assign collection using credit
- [ ] Verify credit count decreases
- [ ] Test refund flow (via Polar dashboard)
- [ ] Verify collection unassignment on refund

---

## Phase 5: Production Deployment

### Polar Production Setup
- [ ] Create production organization at [polar.sh](https://polar.sh)
- [ ] Complete merchant verification (if required)
- [ ] Generate production access token
- [ ] Create products in production (or sync from sandbox)

### Environment Configuration
- [ ] Add production environment variables:
  ```env
  POLAR_ACCESS_TOKEN=polar_oat_xxxx
  POLAR_WEBHOOK_SECRET=whsec_xxxx
  POLAR_MODE=production
  POLAR_SUCCESS_URL=https://shuttlementor.com/orders/success
  POLAR_RETURN_URL=https://shuttlementor.com/coaches
  ```
- [ ] Configure webhook endpoint in Polar production dashboard
- [ ] Verify webhook secret is set correctly

### Database Migration
- [ ] Run migration on production: `npx prisma migrate deploy`
- [ ] Verify tables created correctly

### Deployment
- [ ] Deploy application with new environment variables
- [ ] Test webhook connectivity (check Polar dashboard for delivery status)
- [ ] Perform small real transaction to verify flow
- [ ] Monitor logs for any errors

---

## Phase 6: Monitoring & Maintenance

### Monitoring Setup
- [ ] Add logging for all payment-related actions
- [ ] Set up alerts for webhook failures
- [ ] Monitor order creation success rate
- [ ] Track checkout abandonment rate

### Documentation
- [ ] Document payment flow for team
- [ ] Create user-facing FAQ about payments
- [ ] Document refund policy and process

### Ongoing Tasks
- [ ] Regularly check Polar dashboard for failed webhooks
- [ ] Review and respond to refund requests
- [ ] Monitor coach earnings and payouts
- [ ] Update products/pricing as needed

---

## Quick Reference

### Test Card Numbers (Sandbox)
| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0000 0000 9995` | Insufficient funds |

### Key URLs
| Environment | Dashboard | API Base |
|-------------|-----------|----------|
| Sandbox | sandbox.polar.sh | sandbox-api.polar.sh/v1 |
| Production | polar.sh | api.polar.sh/v1 |

### Webhook Events to Handle
| Event | Action |
|-------|--------|
| `order.paid` | Create/update order, link customer |
| `order.refunded` | Cancel order, unlink collections |
| `subscription.active` | Activate subscription order |
| `subscription.canceled` | Expire subscription order |
| `customer.created` | Link Polar customer to user |

---

## Troubleshooting

### Webhooks Not Received
1. Check ngrok is running (local dev)
2. Verify webhook URL in Polar dashboard
3. Check webhook secret matches
4. Look at Polar dashboard delivery logs

### Checkout Not Working
1. Verify POLAR_ACCESS_TOKEN is valid
2. Check product exists in Polar
3. Verify success/return URLs are correct
4. Check browser console for errors

### Orders Not Created
1. Check webhook handler logs
2. Verify customer external_id is set
3. Check product mapping exists in database
4. Look for database constraint errors

---

## Files Created/Modified Summary

### New Files
```
src/lib/polar.ts
src/app/api/webhooks/polar/route.ts
src/app/api/checkout/route.ts
src/server/api/routers/payments.ts
src/app/_components/client/authed/CheckoutButton.tsx
src/app/_components/client/authed/CoachProductCard.tsx
src/app/_components/client/authed/OrderHistory.tsx
src/app/_components/client/authed/CreditSelector.tsx
src/app/_components/client/authed/ProductForm.tsx
src/app/_components/client/authed/CoachOrdersList.tsx
src/app/coach/products/page.tsx
src/app/orders/page.tsx
src/app/orders/success/page.tsx
```

### Modified Files
```
prisma/schema.prisma
src/env.js
src/server/api/root.ts
src/app/_components/client/authed/CoachSelector.tsx
src/app/_components/client/authed/VideoCollectionDisplay.tsx
package.json
.env / .env.production
```
