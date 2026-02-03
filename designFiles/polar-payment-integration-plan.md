# ShuttleMentor Payment Integration Plan with Polar.sh

## Executive Summary

This document outlines the plan to integrate Polar.sh as the payment provider for ShuttleMentor, enabling coaches to offer paid async coaching sessions (video collection reviews) and allowing students to purchase/book these services.

---

## Current State Analysis

### Existing Architecture

**User Types:**
- `STUDENT` - Can upload video collections, assign coaches
- `COACH` - Can review assigned video collections, add coaching notes
- `ADMIN` - Full access, can manage all resources
- `FACILITY` - Staff members who can manage content for their club

**Current Coaching Flow:**
1. Student/Facility uploads a `VideoCollection` with videos
2. Owner assigns a coach via `CoachSelector` component
3. Coach reviews videos and adds `MediaCoachNote` entries
4. No payment is currently involved

**Key Models:**
- `User` - Core user with `userType`, linked to `Club`
- `CoachProfile` - Coach-specific data including `rate` (currently unused)
- `VideoCollection` - Contains videos, has `assignedCoachId`
- `Media` - Individual videos in a collection
- `MediaCoachNote` - Coach feedback on videos

**Tech Stack:**
- Next.js 15 (App Router)
- tRPC for API
- Prisma + PostgreSQL
- Clerk for authentication
- React 19

---

## Polar.sh Integration Overview

### Why Polar.sh?

1. **Merchant of Record** - Handles tax compliance globally
2. **Next.js Native Support** - Official `@polar-sh/nextjs` adapter
3. **Flexible Pricing** - One-time, subscriptions, pay-what-you-want
4. **Webhook System** - Standard Webhooks for event handling
5. **Customer Management** - External ID support for linking to our users
6. **Sandbox Environment** - Full testing capability

### Key Polar.sh Concepts

| Concept | Description | ShuttleMentor Mapping |
|---------|-------------|----------------------|
| **Product** | A purchasable item | Coaching session/package |
| **Checkout** | Payment flow | Booking a coach |
| **Order** | Completed purchase | Paid coaching session |
| **Customer** | Buyer in Polar | Student user |
| **Subscription** | Recurring payment | Monthly coaching packages |
| **Webhook** | Event notification | Order completion, refunds |

---

## Proposed Architecture

### Phase 1: Core Payment Infrastructure

#### 1.1 Database Schema Changes

```prisma
// New models for payment integration

model CoachingProduct {
  productId         String   @id @default(cuid())
  polarProductId    String   @unique // Polar's product ID
  coachId           String
  coach             User     @relation("CoachProducts", fields: [coachId], references: [userId], onDelete: Cascade)
  name              String
  description       String?  @db.Text
  priceAmount       Int      // Price in cents
  priceCurrency     String   @default("usd")
  productType       ProductType @default(ONE_TIME)
  maxCollections    Int      @default(1) // How many collections can be reviewed
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  orders            CoachingOrder[]

  @@index([coachId])
  @@index([polarProductId])
}

enum ProductType {
  ONE_TIME        // Single video collection review
  PACKAGE         // Multiple reviews (e.g., 3 sessions)
  SUBSCRIPTION    // Monthly coaching
}

model CoachingOrder {
  orderId           String   @id @default(cuid())
  polarOrderId      String   @unique // Polar's order ID
  polarCheckoutId   String?  // Polar's checkout ID
  productId         String
  product           CoachingProduct @relation(fields: [productId], references: [productId])
  studentId         String
  student           User     @relation("StudentOrders", fields: [studentId], references: [userId])
  coachId           String
  coach             User     @relation("CoachOrders", fields: [coachId], references: [userId])
  status            OrderStatus @default(PENDING)
  amountPaid        Int      // Amount in cents
  currency          String   @default("usd")
  collectionsUsed   Int      @default(0)
  collectionsTotal  Int      // From product.maxCollections at time of purchase
  expiresAt         DateTime? // For subscriptions
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  assignedCollections VideoCollection[] @relation("PaidCollections")

  @@index([studentId])
  @@index([coachId])
  @@index([polarOrderId])
  @@index([status])
}

enum OrderStatus {
  PENDING         // Checkout created but not paid
  PAID            // Payment successful
  ACTIVE          // Subscription active
  COMPLETED       // All sessions used
  CANCELLED       // Cancelled/refunded
  EXPIRED         // Subscription expired
}

model PolarCustomer {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [userId], onDelete: Cascade)
  polarCustomerId   String   @unique // Polar's customer ID
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([polarCustomerId])
}

// Update VideoCollection to track paid assignments
model VideoCollection {
  // ... existing fields ...
  orderId           String?  // Link to paid order
  order             CoachingOrder? @relation("PaidCollections", fields: [orderId], references: [orderId])
}

// Update User model with new relations
model User {
  // ... existing fields ...
  coachProducts     CoachingProduct[] @relation("CoachProducts")
  studentOrders     CoachingOrder[]   @relation("StudentOrders")
  coachOrders       CoachingOrder[]   @relation("CoachOrders")
  polarCustomer     PolarCustomer?
}
```

#### 1.2 Environment Variables

```env
# Polar.sh Configuration
POLAR_ACCESS_TOKEN=           # Organization Access Token from Polar dashboard
POLAR_WEBHOOK_SECRET=         # Webhook secret for signature validation
POLAR_MODE=sandbox            # 'sandbox' or 'production'
POLAR_SUCCESS_URL=            # URL after successful checkout
POLAR_RETURN_URL=             # URL for back button in checkout
```

#### 1.3 Package Dependencies

```bash
npm install @polar-sh/sdk @polar-sh/nextjs @polar-sh/checkout
```

---

### Phase 2: Backend Implementation

#### 2.1 Polar Client Setup

Create `src/lib/polar.ts`:

```typescript
import { Polar } from "@polar-sh/sdk";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: (process.env.POLAR_MODE as "sandbox" | "production") || "sandbox",
});
```

#### 2.2 Webhook Handler

Create `src/app/api/webhooks/polar/route.ts`:

```typescript
import { Webhooks } from "@polar-sh/nextjs";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  
  onOrderPaid: async (payload) => {
    // Update order status to PAID
    // Link customer to user if not exists
  },
  
  onOrderRefunded: async (payload) => {
    // Update order status to CANCELLED
    // Handle any cleanup
  },
  
  onSubscriptionActive: async (payload) => {
    // Update order status to ACTIVE
  },
  
  onSubscriptionCanceled: async (payload) => {
    // Update order status to EXPIRED
  },
  
  onCustomerCreated: async (payload) => {
    // Create PolarCustomer record
  },
});
```

#### 2.3 Checkout API Route

Create `src/app/api/checkout/route.ts`:

```typescript
import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: process.env.POLAR_SUCCESS_URL!,
  returnUrl: process.env.POLAR_RETURN_URL,
  server: (process.env.POLAR_MODE as "sandbox" | "production") || "sandbox",
});
```

#### 2.4 tRPC Router for Payments

Create `src/server/api/routers/payments.ts`:

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { polar } from "~/lib/polar";

export const paymentsRouter = createTRPCRouter({
  // Create a coaching product (coach only)
  createProduct: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      priceAmount: z.number().int().min(100), // Min $1.00
      productType: z.enum(["ONE_TIME", "PACKAGE", "SUBSCRIPTION"]),
      maxCollections: z.number().int().min(1).max(10),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is a coach
      // Create product in Polar
      // Save to database
    }),

  // Get coach's products
  getCoachProducts: protectedProcedure
    .input(z.object({ coachId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Return products for a coach
    }),

  // Create checkout session for a product
  createCheckout: protectedProcedure
    .input(z.object({
      productId: z.string(),
      collectionId: z.string().optional(), // Pre-assign to collection
    }))
    .mutation(async ({ ctx, input }) => {
      // Create Polar checkout session
      // Return checkout URL
    }),

  // Get student's orders
  getMyOrders: protectedProcedure
    .query(async ({ ctx }) => {
      // Return orders for current user
    }),

  // Get coach's received orders
  getCoachOrders: protectedProcedure
    .query(async ({ ctx }) => {
      // Return orders where user is the coach
    }),

  // Use an order credit to assign a collection
  useOrderCredit: protectedProcedure
    .input(z.object({
      orderId: z.string(),
      collectionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify order has remaining credits
      // Assign collection to coach
      // Increment collectionsUsed
    }),
});
```

---

### Phase 3: Frontend Implementation

#### 3.1 Coach Product Management

Create `src/app/_components/client/authed/CoachProductManager.tsx`:
- List coach's products
- Create/edit products
- View orders received

#### 3.2 Student Booking Flow

Create `src/app/_components/client/authed/BookCoachSession.tsx`:
- Display coach's available products
- Initiate checkout
- Show order history

#### 3.3 Enhanced Coach Selector

Update `CoachSelector.tsx`:
- Check if student has unused order credits
- Show "Book Session" button if no credits
- Allow assignment only with valid credits

#### 3.4 Order Dashboard

Create `src/app/orders/page.tsx`:
- Students: View purchased sessions, remaining credits
- Coaches: View received orders, earnings

---

### Phase 4: Business Logic

#### 4.1 Assignment Flow with Payments

```
1. Student views coach profile
2. Student sees coach's products (e.g., "Single Video Review - $25")
3. Student clicks "Book Session"
4. Redirected to Polar checkout
5. After payment, webhook updates order status
6. Student can now assign collection to coach
7. Coach reviews and adds notes
8. Order marked as COMPLETED when all credits used
```

#### 4.2 Subscription Flow

```
1. Student purchases monthly subscription
2. Webhook creates ACTIVE order
3. Student can assign up to N collections per month
4. At period end, credits reset (or roll over based on config)
5. If cancelled, order marked EXPIRED at period end
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Polar.sh sandbox account
- [ ] Add database schema changes
- [ ] Install dependencies
- [ ] Create Polar client utility
- [ ] Implement webhook handler
- [ ] Create basic checkout route

### Phase 2: Backend APIs (Week 2-3)
- [ ] Implement payments tRPC router
- [ ] Product CRUD operations
- [ ] Checkout session creation
- [ ] Order management
- [ ] Webhook event handlers

### Phase 3: Frontend (Week 3-4)
- [ ] Coach product management UI
- [ ] Student booking flow
- [ ] Order dashboard
- [ ] Update coach selector with payment checks

### Phase 4: Testing & Polish (Week 4-5)
- [ ] End-to-end testing with sandbox
- [ ] Error handling improvements
- [ ] UI/UX refinements
- [ ] Documentation

### Phase 5: Production (Week 5-6)
- [ ] Switch to production Polar account
- [ ] Configure production webhooks
- [ ] Gradual rollout
- [ ] Monitor and iterate

---

## Security Considerations

1. **Webhook Validation** - Always validate webhook signatures
2. **Order Verification** - Verify order ownership before allowing actions
3. **Rate Limiting** - Prevent checkout spam
4. **Idempotency** - Handle duplicate webhook deliveries
5. **Audit Logging** - Log all payment-related actions

---

## Testing Strategy

### Sandbox Testing
- Use Polar sandbox environment
- Test card: `4242 4242 4242 4242`
- Test all webhook events
- Verify order state transitions

### Integration Tests
- Mock Polar API responses
- Test tRPC procedures
- Verify database state changes

---

## Monitoring & Analytics

1. **Order Metrics** - Track successful/failed orders
2. **Revenue Dashboard** - Coach earnings, platform fees
3. **Webhook Health** - Monitor delivery success rate
4. **Customer Journey** - Checkout abandonment, conversion

---

## Future Enhancements

1. **Discount Codes** - Promotional pricing
2. **Referral System** - Student/coach referrals
3. **Tiered Pricing** - Volume discounts
4. **Gift Cards** - Prepaid coaching credits
5. **Coach Payouts** - Automated payout scheduling
6. **Usage-Based Billing** - Per-minute video review pricing

---

## References

- [Polar.sh Documentation](https://polar.sh/docs)
- [Polar Next.js Adapter](https://polar.sh/docs/integrate/sdk/adapters/nextjs)
- [Polar Webhooks](https://polar.sh/docs/integrate/webhooks/endpoints)
- [Polar API Reference](https://polar.sh/docs/api-reference)
- [Polar Sandbox](https://sandbox.polar.sh)
