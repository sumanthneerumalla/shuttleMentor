# Polar.sh Payment Integration - Database Schema

This document contains the complete Prisma schema additions for integrating Polar.sh payments into ShuttleMentor.

---

## Schema Overview

### New Models

| Model | Purpose |
|-------|---------|
| `CoachingProduct` | Products/services coaches offer for sale |
| `CoachingOrder` | Completed purchases linking students to coaches |
| `PolarCustomer` | Maps ShuttleMentor users to Polar customers |

### Modified Models

| Model | Changes |
|-------|---------|
| `User` | New relations to products, orders, and Polar customer |
| `VideoCollection` | Optional link to paid order |

---

## Complete Schema Additions

Add the following to `prisma/schema.prisma`:

```prisma
// ============================================================================
// PAYMENT INTEGRATION MODELS
// ============================================================================

// Enum for product types
enum ProductType {
  ONE_TIME        // Single video collection review
  PACKAGE         // Multiple reviews (e.g., 3 sessions)
  SUBSCRIPTION    // Monthly coaching subscription
}

// Enum for order status
enum OrderStatus {
  PENDING         // Checkout created but not paid
  PAID            // Payment successful, ready to use
  ACTIVE          // Subscription is active
  COMPLETED       // All sessions/credits used
  CANCELLED       // Cancelled or refunded
  EXPIRED         // Subscription expired
}

// CoachingProduct - Products/services that coaches offer
model CoachingProduct {
  productId         String      @id @default(cuid())
  polarProductId    String      @unique // Polar's product ID
  coachId           String
  coach             User        @relation("CoachProducts", fields: [coachId], references: [userId], onDelete: Cascade)
  
  // Product details
  name              String      @db.VarChar(100)
  description       String?     @db.Text
  priceAmount       Int         // Price in cents (e.g., 2500 = $25.00)
  priceCurrency     String      @default("usd") @db.VarChar(3)
  productType       ProductType @default(ONE_TIME)
  maxCollections    Int         @default(1) // Number of collections that can be reviewed
  
  // Status
  isActive          Boolean     @default(true)
  
  // Timestamps
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  orders            CoachingOrder[]

  @@index([coachId])
  @@index([polarProductId])
  @@index([isActive])
}

// CoachingOrder - Represents a purchased coaching session/package
model CoachingOrder {
  orderId           String      @id @default(cuid())
  
  // Polar references
  polarOrderId      String      @unique // Polar's order ID
  polarCheckoutId   String?     // Polar's checkout ID (for tracking)
  
  // Relationships
  productId         String
  product           CoachingProduct @relation(fields: [productId], references: [productId])
  studentId         String
  student           User        @relation("StudentOrders", fields: [studentId], references: [userId])
  coachId           String
  coach             User        @relation("CoachOrders", fields: [coachId], references: [userId])
  
  // Payment details
  status            OrderStatus @default(PENDING)
  amountPaid        Int         // Amount in cents
  currency          String      @default("usd") @db.VarChar(3)
  
  // Usage tracking
  collectionsUsed   Int         @default(0)
  collectionsTotal  Int         // Copied from product.maxCollections at purchase time
  
  // For subscriptions
  expiresAt         DateTime?   // When the subscription period ends
  
  // Metadata (stored as JSON for flexibility)
  metadata          Json?       // Additional data from checkout (e.g., pre-selected collection)
  
  // Timestamps
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  assignedCollections VideoCollection[] @relation("PaidCollections")

  @@index([studentId])
  @@index([coachId])
  @@index([polarOrderId])
  @@index([status])
  @@index([createdAt])
}

// PolarCustomer - Links ShuttleMentor users to Polar customers
model PolarCustomer {
  id                String      @id @default(cuid())
  userId            String      @unique
  user              User        @relation(fields: [userId], references: [userId], onDelete: Cascade)
  polarCustomerId   String      @unique // Polar's customer ID
  
  // Timestamps
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  @@index([polarCustomerId])
}
```

---

## User Model Updates

Update the existing `User` model to add new relations:

```prisma
model User {
  userId        String   @id @default(cuid())
  clerkUserId   String   @unique
  email         String?
  firstName     String?
  lastName      String?
  profileImage  String?
  userType      UserType @default(STUDENT)
  timeZone      String?
  clubShortName String   @default("default-club-001")
  club          Club     @relation(fields: [clubShortName], references: [clubShortName])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Existing relations
  studentProfile      StudentProfile?
  coachProfile        CoachProfile?
  videoCollections    VideoCollection[]
  uploadedCollections VideoCollection[] @relation("UploadedBy")
  assignedCollections VideoCollection[] @relation("AssignedCoach")
  coachingNotes       MediaCoachNote[]

  // NEW: Payment relations
  coachProducts       CoachingProduct[] @relation("CoachProducts")
  studentOrders       CoachingOrder[]   @relation("StudentOrders")
  coachOrders         CoachingOrder[]   @relation("CoachOrders")
  polarCustomer       PolarCustomer?

  @@index([clerkUserId])
  @@index([clubShortName])
}
```

---

## VideoCollection Model Updates

Update the existing `VideoCollection` model to optionally link to a paid order:

```prisma
model VideoCollection {
  collectionId     String    @id @default(cuid())
  userId           String
  user             User      @relation(fields: [userId], references: [userId], onDelete: Cascade)
  uploadedByUserId String?
  uploadedByUser   User?     @relation("UploadedBy", fields: [uploadedByUserId], references: [userId], onDelete: SetNull)
  title            String
  description      String?   @db.Text
  mediaType        MediaType
  assignedCoachId  String?
  assignedCoach    User?     @relation("AssignedCoach", fields: [assignedCoachId], references: [userId], onDelete: SetNull)
  isDeleted        Boolean   @default(false)
  deletedAt        DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // Existing relations
  media Media[]

  // NEW: Payment relation - links to the order that paid for this review
  orderId          String?
  order            CoachingOrder? @relation("PaidCollections", fields: [orderId], references: [orderId], onDelete: SetNull)

  @@index([userId])
  @@index([isDeleted])
  @@index([assignedCoachId])
  @@index([uploadedByUserId])
  @@index([orderId]) // NEW index
}
```

---

## Migration Steps

### Step 1: Create Migration File

Run the following command to create a new migration:

```bash
npx prisma migrate dev --name add_payment_models
```

### Step 2: Review Generated SQL

The migration should generate SQL similar to:

```sql
-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('ONE_TIME', 'PACKAGE', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "CoachingProduct" (
    "productId" TEXT NOT NULL,
    "polarProductId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "priceAmount" INTEGER NOT NULL,
    "priceCurrency" VARCHAR(3) NOT NULL DEFAULT 'usd',
    "productType" "ProductType" NOT NULL DEFAULT 'ONE_TIME',
    "maxCollections" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingProduct_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "CoachingOrder" (
    "orderId" TEXT NOT NULL,
    "polarOrderId" TEXT NOT NULL,
    "polarCheckoutId" TEXT,
    "productId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "amountPaid" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
    "collectionsUsed" INTEGER NOT NULL DEFAULT 0,
    "collectionsTotal" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingOrder_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "PolarCustomer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "polarCustomerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolarCustomer_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "VideoCollection" ADD COLUMN "orderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CoachingProduct_polarProductId_key" ON "CoachingProduct"("polarProductId");
CREATE INDEX "CoachingProduct_coachId_idx" ON "CoachingProduct"("coachId");
CREATE INDEX "CoachingProduct_polarProductId_idx" ON "CoachingProduct"("polarProductId");
CREATE INDEX "CoachingProduct_isActive_idx" ON "CoachingProduct"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CoachingOrder_polarOrderId_key" ON "CoachingOrder"("polarOrderId");
CREATE INDEX "CoachingOrder_studentId_idx" ON "CoachingOrder"("studentId");
CREATE INDEX "CoachingOrder_coachId_idx" ON "CoachingOrder"("coachId");
CREATE INDEX "CoachingOrder_polarOrderId_idx" ON "CoachingOrder"("polarOrderId");
CREATE INDEX "CoachingOrder_status_idx" ON "CoachingOrder"("status");
CREATE INDEX "CoachingOrder_createdAt_idx" ON "CoachingOrder"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PolarCustomer_userId_key" ON "PolarCustomer"("userId");
CREATE UNIQUE INDEX "PolarCustomer_polarCustomerId_key" ON "PolarCustomer"("polarCustomerId");
CREATE INDEX "PolarCustomer_polarCustomerId_idx" ON "PolarCustomer"("polarCustomerId");

-- CreateIndex
CREATE INDEX "VideoCollection_orderId_idx" ON "VideoCollection"("orderId");

-- AddForeignKey
ALTER TABLE "CoachingProduct" ADD CONSTRAINT "CoachingProduct_coachId_fkey" 
    FOREIGN KEY ("coachId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingOrder" ADD CONSTRAINT "CoachingOrder_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES "CoachingProduct"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingOrder" ADD CONSTRAINT "CoachingOrder_studentId_fkey" 
    FOREIGN KEY ("studentId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingOrder" ADD CONSTRAINT "CoachingOrder_coachId_fkey" 
    FOREIGN KEY ("coachId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolarCustomer" ADD CONSTRAINT "PolarCustomer_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoCollection" ADD CONSTRAINT "VideoCollection_orderId_fkey" 
    FOREIGN KEY ("orderId") REFERENCES "CoachingOrder"("orderId") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Step 3: Deploy Migration

For production deployment:

```bash
npx prisma migrate deploy
```

---

## TypeScript Types

After running the migration, Prisma will generate types. Here are the key types you'll use:

```typescript
import { 
  CoachingProduct, 
  CoachingOrder, 
  PolarCustomer,
  ProductType,
  OrderStatus 
} from "@prisma/client";

// Product with coach info
type ProductWithCoach = CoachingProduct & {
  coach: {
    firstName: string | null;
    lastName: string | null;
    coachProfile: {
      displayUsername: string | null;
    } | null;
  };
};

// Order with full relations
type OrderWithRelations = CoachingOrder & {
  product: CoachingProduct;
  student: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  coach: {
    firstName: string | null;
    lastName: string | null;
    coachProfile: {
      displayUsername: string | null;
    } | null;
  };
  assignedCollections: {
    collectionId: string;
    title: string;
  }[];
};
```

---

## Query Examples

### Get Coach's Products

```typescript
const products = await db.coachingProduct.findMany({
  where: {
    coachId: coachUserId,
    isActive: true,
  },
  orderBy: { createdAt: "desc" },
});
```

### Get Student's Active Orders

```typescript
const orders = await db.coachingOrder.findMany({
  where: {
    studentId: studentUserId,
    status: { in: ["PAID", "ACTIVE"] },
  },
  include: {
    product: true,
    coach: {
      select: {
        firstName: true,
        lastName: true,
        coachProfile: {
          select: { displayUsername: true },
        },
      },
    },
  },
  orderBy: { createdAt: "desc" },
});
```

### Get Available Credits for a Coach

```typescript
const availableCredits = await db.coachingOrder.findMany({
  where: {
    studentId: studentUserId,
    coachId: coachUserId,
    status: { in: ["PAID", "ACTIVE"] },
  },
  select: {
    orderId: true,
    collectionsUsed: true,
    collectionsTotal: true,
    product: {
      select: { name: true },
    },
  },
}).then(orders => 
  orders.filter(o => o.collectionsUsed < o.collectionsTotal)
);
```

### Check if Collection is Paid

```typescript
const collection = await db.videoCollection.findUnique({
  where: { collectionId },
  include: {
    order: {
      select: {
        status: true,
        student: { select: { firstName: true, lastName: true } },
      },
    },
  },
});

const isPaid = collection?.order?.status === "PAID" || 
               collection?.order?.status === "ACTIVE";
```

### Get Coach's Earnings Summary

```typescript
const earnings = await db.coachingOrder.aggregate({
  where: {
    coachId: coachUserId,
    status: { in: ["PAID", "ACTIVE", "COMPLETED"] },
  },
  _sum: {
    amountPaid: true,
  },
  _count: {
    orderId: true,
  },
});

// earnings._sum.amountPaid = total cents earned
// earnings._count.orderId = total orders
```

---

## Data Integrity Considerations

### Cascading Deletes

| Relation | On Delete Behavior |
|----------|-------------------|
| `CoachingProduct.coach` | CASCADE - Products deleted when coach deleted |
| `CoachingOrder.product` | RESTRICT - Cannot delete product with orders |
| `CoachingOrder.student` | RESTRICT - Cannot delete student with orders |
| `CoachingOrder.coach` | RESTRICT - Cannot delete coach with orders |
| `PolarCustomer.user` | CASCADE - Customer mapping deleted with user |
| `VideoCollection.order` | SET NULL - Collection unlinked if order deleted |

### Business Rules to Enforce in Code

1. **Product Creation**: Only COACH and ADMIN users can create products
2. **Order Assignment**: Only the student who owns the order can use credits
3. **Collection Assignment**: Collection must belong to the student using the credit
4. **Credit Limits**: Cannot exceed `collectionsTotal` for an order
5. **Status Transitions**: Orders should follow valid state machine transitions

### Status State Machine

```
PENDING → PAID (on successful payment)
PENDING → CANCELLED (on checkout abandonment/failure)

PAID → COMPLETED (when all credits used)
PAID → CANCELLED (on refund)

ACTIVE → COMPLETED (when all credits used in period)
ACTIVE → EXPIRED (when subscription ends)
ACTIVE → CANCELLED (on refund/cancellation)
```

---

## Rollback Plan

If you need to rollback the migration:

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back add_payment_models

# Or manually with SQL
DROP TABLE IF EXISTS "PolarCustomer";
DROP TABLE IF EXISTS "CoachingOrder";
DROP TABLE IF EXISTS "CoachingProduct";
ALTER TABLE "VideoCollection" DROP COLUMN IF EXISTS "orderId";
DROP TYPE IF EXISTS "OrderStatus";
DROP TYPE IF EXISTS "ProductType";
```

---

## Future Schema Considerations

### Potential Additions

1. **Discount Codes**
```prisma
model DiscountCode {
  id            String   @id @default(cuid())
  code          String   @unique
  discountType  DiscountType // PERCENTAGE, FIXED
  discountValue Int
  maxUses       Int?
  usedCount     Int      @default(0)
  expiresAt     DateTime?
  productId     String?  // Optional: limit to specific product
  coachId       String?  // Optional: limit to specific coach
}
```

2. **Payout Tracking**
```prisma
model CoachPayout {
  id          String   @id @default(cuid())
  coachId     String
  amount      Int
  currency    String
  status      PayoutStatus
  periodStart DateTime
  periodEnd   DateTime
  paidAt      DateTime?
}
```

3. **Review/Rating System**
```prisma
model CoachingReview {
  id          String   @id @default(cuid())
  orderId     String   @unique
  studentId   String
  coachId     String
  rating      Int      // 1-5
  comment     String?
  createdAt   DateTime @default(now())
}
```
