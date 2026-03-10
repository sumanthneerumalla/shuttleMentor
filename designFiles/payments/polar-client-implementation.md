# Polar.sh Client Implementation Guide

This document provides detailed implementation patterns for integrating Polar.sh into the ShuttleMentor Next.js application. These patterns are designed to be reusable and follow the existing codebase conventions.

---

## Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Polar Client Utility](#polar-client-utility)
3. [Webhook Handler Implementation](#webhook-handler-implementation)
4. [Checkout Implementation](#checkout-implementation)
5. [tRPC Router Patterns](#trpc-router-patterns)
6. [React Components](#react-components)
7. [Error Handling](#error-handling)
8. [Testing Patterns](#testing-patterns)

---

## Setup & Configuration

### 1. Install Dependencies

```bash
npm install @polar-sh/sdk @polar-sh/nextjs @polar-sh/checkout
```

### 2. Environment Variables

Add to `.env` and `.env.production`:

```env
# Polar.sh Configuration
POLAR_ACCESS_TOKEN=polar_oat_xxxxxxxxxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
POLAR_MODE=sandbox
POLAR_SUCCESS_URL=https://yourapp.com/orders/success
POLAR_RETURN_URL=https://yourapp.com/coaches
```

### 3. Update `src/env.js`

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // ... existing vars ...
    POLAR_ACCESS_TOKEN: z.string().min(1),
    POLAR_WEBHOOK_SECRET: z.string().min(1),
    POLAR_MODE: z.enum(["sandbox", "production"]).default("sandbox"),
    POLAR_SUCCESS_URL: z.string().url(),
    POLAR_RETURN_URL: z.string().url().optional(),
  },
  // ... rest of config ...
});
```

---

## Polar Client Utility

### Create `src/lib/polar.ts`

```typescript
import { Polar } from "@polar-sh/sdk";
import { env } from "~/env";

/**
 * Singleton Polar SDK client instance.
 * Uses environment variables for configuration.
 */
export const polar = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: env.POLAR_MODE,
});

/**
 * Helper to get the correct API base URL based on mode
 */
export const getPolarApiUrl = () => {
  return env.POLAR_MODE === "production"
    ? "https://api.polar.sh/v1"
    : "https://sandbox-api.polar.sh/v1";
};

/**
 * Helper to format price from cents to display string
 */
export const formatPrice = (amountCents: number, currency: string = "usd"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
};

/**
 * Helper to convert dollars to cents for API calls
 */
export const dollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

/**
 * Helper to convert cents to dollars for display
 */
export const centsToDollars = (cents: number): number => {
  return cents / 100;
};
```

---

## Webhook Handler Implementation

### Create `src/app/api/webhooks/polar/route.ts`

```typescript
import { Webhooks } from "@polar-sh/nextjs";
import { db } from "~/server/db";
import { OrderStatus } from "@prisma/client";

/**
 * Polar webhook handler using the Next.js adapter.
 * Handles all payment-related events from Polar.
 */
export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  /**
   * Called when an order is successfully paid.
   * Creates or updates the order record in our database.
   */
  onOrderPaid: async (payload) => {
    const { data: order } = payload;
    
    console.log(`[Polar Webhook] Order paid: ${order.id}`);

    try {
      // Find or create the customer mapping
      let polarCustomer = await db.polarCustomer.findUnique({
        where: { polarCustomerId: order.customer_id },
      });

      if (!polarCustomer && order.customer?.external_id) {
        // Link to existing user via external_id (our userId)
        polarCustomer = await db.polarCustomer.create({
          data: {
            userId: order.customer.external_id,
            polarCustomerId: order.customer_id,
          },
        });
      }

      // Find the product in our database
      const product = await db.coachingProduct.findUnique({
        where: { polarProductId: order.product_id },
      });

      if (!product) {
        console.error(`[Polar Webhook] Product not found: ${order.product_id}`);
        return;
      }

      // Create or update the order
      await db.coachingOrder.upsert({
        where: { polarOrderId: order.id },
        create: {
          polarOrderId: order.id,
          polarCheckoutId: order.checkout_id,
          productId: product.productId,
          studentId: polarCustomer?.userId || order.customer?.external_id!,
          coachId: product.coachId,
          status: OrderStatus.PAID,
          amountPaid: order.total_amount,
          currency: order.currency,
          collectionsTotal: product.maxCollections,
          collectionsUsed: 0,
        },
        update: {
          status: OrderStatus.PAID,
          amountPaid: order.total_amount,
        },
      });

      console.log(`[Polar Webhook] Order processed successfully: ${order.id}`);
    } catch (error) {
      console.error(`[Polar Webhook] Error processing order:`, error);
      throw error; // Re-throw to trigger retry
    }
  },

  /**
   * Called when an order is refunded.
   * Updates the order status and handles any cleanup.
   */
  onOrderRefunded: async (payload) => {
    const { data: order } = payload;
    
    console.log(`[Polar Webhook] Order refunded: ${order.id}`);

    try {
      await db.coachingOrder.update({
        where: { polarOrderId: order.id },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });

      // Optionally: Unassign any collections linked to this order
      await db.videoCollection.updateMany({
        where: { orderId: order.id },
        data: {
          orderId: null,
          assignedCoachId: null,
        },
      });
    } catch (error) {
      console.error(`[Polar Webhook] Error processing refund:`, error);
      throw error;
    }
  },

  /**
   * Called when a subscription becomes active.
   */
  onSubscriptionActive: async (payload) => {
    const { data: subscription } = payload;
    
    console.log(`[Polar Webhook] Subscription active: ${subscription.id}`);

    try {
      // Find order by subscription ID or checkout ID
      const order = await db.coachingOrder.findFirst({
        where: {
          OR: [
            { polarOrderId: subscription.id },
            { polarCheckoutId: subscription.checkout_id },
          ],
        },
      });

      if (order) {
        await db.coachingOrder.update({
          where: { orderId: order.orderId },
          data: {
            status: OrderStatus.ACTIVE,
            expiresAt: subscription.current_period_end 
              ? new Date(subscription.current_period_end) 
              : null,
          },
        });
      }
    } catch (error) {
      console.error(`[Polar Webhook] Error activating subscription:`, error);
      throw error;
    }
  },

  /**
   * Called when a subscription is canceled.
   */
  onSubscriptionCanceled: async (payload) => {
    const { data: subscription } = payload;
    
    console.log(`[Polar Webhook] Subscription canceled: ${subscription.id}`);

    try {
      await db.coachingOrder.updateMany({
        where: { polarOrderId: subscription.id },
        data: {
          status: OrderStatus.EXPIRED,
        },
      });
    } catch (error) {
      console.error(`[Polar Webhook] Error canceling subscription:`, error);
      throw error;
    }
  },

  /**
   * Called when a customer is created in Polar.
   * Links the Polar customer to our user.
   */
  onCustomerCreated: async (payload) => {
    const { data: customer } = payload;
    
    console.log(`[Polar Webhook] Customer created: ${customer.id}`);

    if (customer.external_id) {
      try {
        await db.polarCustomer.upsert({
          where: { polarCustomerId: customer.id },
          create: {
            userId: customer.external_id,
            polarCustomerId: customer.id,
          },
          update: {
            userId: customer.external_id,
          },
        });
      } catch (error) {
        console.error(`[Polar Webhook] Error creating customer:`, error);
        throw error;
      }
    }
  },
});

// Ensure raw body is available for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
```

---

## Checkout Implementation

### Option 1: Simple Checkout Route

Create `src/app/api/checkout/route.ts`:

```typescript
import { Checkout } from "@polar-sh/nextjs";
import { env } from "~/env";

/**
 * Simple checkout handler using Polar's Next.js adapter.
 * Usage: GET /api/checkout?products=PRODUCT_ID&customerExternalId=USER_ID
 */
export const GET = Checkout({
  accessToken: env.POLAR_ACCESS_TOKEN,
  successUrl: env.POLAR_SUCCESS_URL,
  returnUrl: env.POLAR_RETURN_URL,
  server: env.POLAR_MODE,
});
```

### Option 2: Custom Checkout with tRPC

Add to `src/server/api/routers/payments.ts`:

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { polar } from "~/lib/polar";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";

export const paymentsRouter = createTRPCRouter({
  /**
   * Create a checkout session for a coaching product.
   * Returns the checkout URL for redirect.
   */
  createCheckout: protectedProcedure
    .input(z.object({
      productId: z.string(),
      collectionId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get the product from our database
      const product = await ctx.db.coachingProduct.findUnique({
        where: { productId: input.productId },
        include: {
          coach: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!product || !product.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found or inactive",
        });
      }

      // Get current user
      const user = await ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
        select: {
          userId: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      try {
        // Create checkout session in Polar
        const checkout = await polar.checkouts.create({
          products: [product.polarProductId],
          customerExternalId: user.userId, // Link to our user
          customerEmail: user.email || undefined,
          customerName: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : undefined,
          successUrl: `${env.POLAR_SUCCESS_URL}?checkout_id={CHECKOUT_ID}`,
          returnUrl: env.POLAR_RETURN_URL,
          metadata: {
            shuttlementor_product_id: product.productId,
            shuttlementor_coach_id: product.coachId,
            shuttlementor_collection_id: input.collectionId || "",
          },
        });

        return {
          checkoutUrl: checkout.url,
          checkoutId: checkout.id,
        };
      } catch (error) {
        console.error("[Payments] Error creating checkout:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),
});
```

---

## tRPC Router Patterns

### Complete Payments Router

Create `src/server/api/routers/payments.ts`:

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { polar } from "~/lib/polar";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";
import { ProductType, OrderStatus, UserType } from "@prisma/client";

// Input schemas
const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  priceAmount: z.number().int().min(100).max(99999999), // $1 - $999,999.99
  productType: z.nativeEnum(ProductType),
  maxCollections: z.number().int().min(1).max(10),
});

const updateProductSchema = createProductSchema.partial().extend({
  productId: z.string(),
  isActive: z.boolean().optional(),
});

export const paymentsRouter = createTRPCRouter({
  /**
   * Create a new coaching product (coach only).
   */
  createProduct: protectedProcedure
    .input(createProductSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user is a coach
      const user = await ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
        include: { coachProfile: true },
      });

      if (!user || (user.userType !== UserType.COACH && user.userType !== UserType.ADMIN)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coaches can create products",
        });
      }

      // Determine recurring interval for Polar
      const isRecurring = input.productType === ProductType.SUBSCRIPTION;
      
      try {
        // Create product in Polar
        const polarProduct = await polar.products.create({
          name: input.name,
          description: input.description,
          prices: [{
            amountType: "fixed",
            priceAmount: input.priceAmount,
            priceCurrency: "usd",
            ...(isRecurring && { recurringInterval: "month" }),
          }],
        });

        // Save to our database
        const product = await ctx.db.coachingProduct.create({
          data: {
            polarProductId: polarProduct.id,
            coachId: user.userId,
            name: input.name,
            description: input.description,
            priceAmount: input.priceAmount,
            productType: input.productType,
            maxCollections: input.maxCollections,
          },
        });

        return product;
      } catch (error) {
        console.error("[Payments] Error creating product:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create product",
        });
      }
    }),

  /**
   * Update an existing product (coach only, own products).
   */
  updateProduct: protectedProcedure
    .input(updateProductSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const product = await ctx.db.coachingProduct.findUnique({
        where: { productId: input.productId },
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      if (product.coachId !== user.userId && user.userType !== UserType.ADMIN) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      // Update in Polar if name/description changed
      if (input.name || input.description) {
        try {
          await polar.products.update({
            id: product.polarProductId,
            name: input.name,
            description: input.description,
          });
        } catch (error) {
          console.error("[Payments] Error updating Polar product:", error);
        }
      }

      // Update in our database
      return ctx.db.coachingProduct.update({
        where: { productId: input.productId },
        data: {
          name: input.name,
          description: input.description,
          isActive: input.isActive,
          maxCollections: input.maxCollections,
        },
      });
    }),

  /**
   * Get products for a specific coach.
   */
  getCoachProducts: protectedProcedure
    .input(z.object({ coachId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.coachingProduct.findMany({
        where: {
          coachId: input.coachId,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  /**
   * Get current user's products (for coaches).
   */
  getMyProducts: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return ctx.db.coachingProduct.findMany({
        where: { coachId: user.userId },
        orderBy: { createdAt: "desc" },
      });
    }),

  /**
   * Get current user's orders (as student).
   */
  getMyOrders: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return ctx.db.coachingOrder.findMany({
        where: { studentId: user.userId },
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
    }),

  /**
   * Get orders received by current user (as coach).
   */
  getReceivedOrders: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return ctx.db.coachingOrder.findMany({
        where: { coachId: user.userId },
        include: {
          product: true,
          student: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedCollections: {
            select: {
              collectionId: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  /**
   * Get available credits for assigning to a specific coach.
   */
  getAvailableCredits: protectedProcedure
    .input(z.object({ coachId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Find orders with remaining credits for this coach
      const orders = await ctx.db.coachingOrder.findMany({
        where: {
          studentId: user.userId,
          coachId: input.coachId,
          status: { in: [OrderStatus.PAID, OrderStatus.ACTIVE] },
        },
        include: { product: true },
      });

      return orders
        .filter(order => order.collectionsUsed < order.collectionsTotal)
        .map(order => ({
          orderId: order.orderId,
          productName: order.product.name,
          remaining: order.collectionsTotal - order.collectionsUsed,
          total: order.collectionsTotal,
        }));
    }),

  /**
   * Use an order credit to assign a collection to a coach.
   */
  useCredit: protectedProcedure
    .input(z.object({
      orderId: z.string(),
      collectionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkUserId: ctx.auth.userId },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Get the order
      const order = await ctx.db.coachingOrder.findUnique({
        where: { orderId: input.orderId },
        include: { product: true },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      // Verify ownership
      if (order.studentId !== user.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your order" });
      }

      // Check status
      if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.ACTIVE) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order is not active" });
      }

      // Check remaining credits
      if (order.collectionsUsed >= order.collectionsTotal) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No remaining credits" });
      }

      // Get the collection
      const collection = await ctx.db.videoCollection.findUnique({
        where: { collectionId: input.collectionId },
      });

      if (!collection || collection.isDeleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
      }

      // Verify collection ownership
      if (collection.userId !== user.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your collection" });
      }

      // Check if already assigned
      if (collection.orderId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Collection already assigned to an order" });
      }

      // Perform the assignment in a transaction
      return ctx.db.$transaction(async (tx) => {
        // Update collection
        await tx.videoCollection.update({
          where: { collectionId: input.collectionId },
          data: {
            orderId: order.orderId,
            assignedCoachId: order.coachId,
          },
        });

        // Increment used credits
        const updatedOrder = await tx.coachingOrder.update({
          where: { orderId: order.orderId },
          data: {
            collectionsUsed: { increment: 1 },
            // Mark as completed if all credits used
            status: order.collectionsUsed + 1 >= order.collectionsTotal
              ? OrderStatus.COMPLETED
              : order.status,
          },
        });

        return updatedOrder;
      });
    }),

  /**
   * Create checkout session (see earlier implementation).
   */
  createCheckout: protectedProcedure
    .input(z.object({
      productId: z.string(),
      collectionId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Implementation from earlier section
      // ...
    }),
});
```

### Register the Router

Update `src/server/api/root.ts`:

```typescript
import { paymentsRouter } from "~/server/api/routers/payments";

export const appRouter = createTRPCRouter({
  // ... existing routers ...
  payments: paymentsRouter,
});
```

---

## React Components

### Checkout Button Component

Create `src/app/_components/client/authed/CheckoutButton.tsx`:

```typescript
"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/app/_components/shared/Button";
import { ShoppingCart, Loader2 } from "lucide-react";

interface CheckoutButtonProps {
  productId: string;
  collectionId?: string;
  className?: string;
}

export default function CheckoutButton({ 
  productId, 
  collectionId,
  className 
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckout = api.payments.createCheckout.useMutation({
    onSuccess: (data) => {
      // Redirect to Polar checkout
      window.location.href = data.checkoutUrl;
    },
    onError: (err) => {
      setIsLoading(false);
      setError(err.message);
    },
  });

  const handleClick = () => {
    setIsLoading(true);
    setError(null);
    createCheckout.mutate({ productId, collectionId });
  };

  return (
    <div className={className}>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Redirecting...
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Book Session
          </>
        )}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
```

### Product Card Component

Create `src/app/_components/client/authed/CoachProductCard.tsx`:

```typescript
"use client";

import { formatPrice } from "~/lib/polar";
import CheckoutButton from "./CheckoutButton";
import { Clock, Video, Repeat } from "lucide-react";

interface CoachProductCardProps {
  product: {
    productId: string;
    name: string;
    description: string | null;
    priceAmount: number;
    priceCurrency: string;
    productType: "ONE_TIME" | "PACKAGE" | "SUBSCRIPTION";
    maxCollections: number;
  };
  collectionId?: string;
}

export default function CoachProductCard({ product, collectionId }: CoachProductCardProps) {
  const getProductTypeLabel = () => {
    switch (product.productType) {
      case "ONE_TIME":
        return "Single Review";
      case "PACKAGE":
        return `${product.maxCollections} Reviews`;
      case "SUBSCRIPTION":
        return "Monthly";
      default:
        return "";
    }
  };

  const getProductIcon = () => {
    switch (product.productType) {
      case "ONE_TIME":
        return <Video className="w-5 h-5" />;
      case "PACKAGE":
        return <Clock className="w-5 h-5" />;
      case "SUBSCRIPTION":
        return <Repeat className="w-5 h-5" />;
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            {getProductIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <span className="text-sm text-gray-500">{getProductTypeLabel()}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[var(--primary)]">
            {formatPrice(product.priceAmount, product.priceCurrency)}
          </p>
          {product.productType === "SUBSCRIPTION" && (
            <span className="text-sm text-gray-500">/month</span>
          )}
        </div>
      </div>

      {product.description && (
        <p className="text-gray-600 mb-4 flex-grow">{product.description}</p>
      )}

      <div className="mt-auto">
        <CheckoutButton productId={product.productId} collectionId={collectionId} />
      </div>
    </div>
  );
}
```

### Order History Component

Create `src/app/_components/client/authed/OrderHistory.tsx`:

```typescript
"use client";

import { api } from "~/trpc/react";
import { formatPrice } from "~/lib/polar";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

export default function OrderHistory() {
  const { data: orders, isLoading } = api.payments.getMyOrders.useQuery();

  if (isLoading) {
    return <div className="animate-pulse">Loading orders...</div>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No orders yet. Book a coaching session to get started!
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
      case "ACTIVE":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case "CANCELLED":
      case "EXPIRED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PAID":
        return "Ready to Use";
      case "ACTIVE":
        return "Active Subscription";
      case "PENDING":
        return "Pending Payment";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      case "EXPIRED":
        return "Expired";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.orderId} className="glass-panel p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{order.product.name}</h3>
              <p className="text-sm text-gray-500">
                Coach: {order.coach.coachProfile?.displayUsername || 
                  `${order.coach.firstName} ${order.coach.lastName}`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">
                {formatPrice(order.amountPaid, order.currency)}
              </p>
              <div className="flex items-center gap-1 text-sm">
                {getStatusIcon(order.status)}
                <span>{getStatusLabel(order.status)}</span>
              </div>
            </div>
          </div>
          
          {(order.status === "PAID" || order.status === "ACTIVE") && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Sessions Used</span>
                <span className="font-medium">
                  {order.collectionsUsed} / {order.collectionsTotal}
                </span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[var(--primary)] rounded-full h-2 transition-all"
                  style={{ 
                    width: `${(order.collectionsUsed / order.collectionsTotal) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Error Handling

### Polar Error Types

```typescript
// src/lib/polar-errors.ts

export class PolarError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "PolarError";
  }
}

export const handlePolarError = (error: unknown): never => {
  if (error instanceof Error) {
    // Check for specific Polar error types
    if (error.message.includes("rate limit")) {
      throw new PolarError("Too many requests. Please try again later.", "RATE_LIMITED", 429);
    }
    if (error.message.includes("unauthorized")) {
      throw new PolarError("Payment service authentication failed.", "UNAUTHORIZED", 401);
    }
    if (error.message.includes("not found")) {
      throw new PolarError("Product not found in payment system.", "NOT_FOUND", 404);
    }
  }
  
  throw new PolarError("An unexpected payment error occurred.", "UNKNOWN", 500);
};
```

---

## Testing Patterns

### Mock Polar Client for Tests

```typescript
// src/lib/__mocks__/polar.ts

export const mockPolar = {
  products: {
    create: jest.fn(),
    update: jest.fn(),
    get: jest.fn(),
    list: jest.fn(),
  },
  checkouts: {
    create: jest.fn(),
    get: jest.fn(),
  },
  customers: {
    get: jest.fn(),
    getByExternalId: jest.fn(),
  },
};

export const polar = mockPolar;
```

### Webhook Testing

```typescript
// Test webhook signature validation
import { validateEvent } from "@polar-sh/sdk/webhooks";

describe("Polar Webhooks", () => {
  it("should validate webhook signature", () => {
    const payload = JSON.stringify({ type: "order.paid", data: {} });
    const headers = {
      "webhook-id": "test-id",
      "webhook-timestamp": Date.now().toString(),
      "webhook-signature": "valid-signature",
    };
    
    // Test validation logic
  });
});
```

---

## Deployment Checklist

### Before Going Live

- [ ] Create production Polar organization
- [ ] Generate production access token
- [ ] Configure production webhook endpoint
- [ ] Set production environment variables
- [ ] Test with real payment (small amount)
- [ ] Verify webhook delivery in Polar dashboard
- [ ] Set up monitoring/alerting for webhook failures

### Environment Variables for Production

```env
POLAR_ACCESS_TOKEN=polar_oat_production_xxxx
POLAR_WEBHOOK_SECRET=whsec_production_xxxx
POLAR_MODE=production
POLAR_SUCCESS_URL=https://shuttlementor.com/orders/success
POLAR_RETURN_URL=https://shuttlementor.com/coaches
```

---

## Quick Reference

### Polar SDK Methods

```typescript
// Products
polar.products.create({ name, description, prices })
polar.products.update({ id, name, description })
polar.products.get({ id })
polar.products.list({ organizationId })

// Checkouts
polar.checkouts.create({ products, customerExternalId, successUrl, metadata })
polar.checkouts.get({ id })

// Customers
polar.customers.get({ id })
polar.customers.getByExternalId({ externalId })
polar.customers.state({ id }) // Get customer state with benefits

// Orders
polar.orders.list({ customerId, productId })
polar.orders.get({ id })
```

### Webhook Event Types

| Event | When Fired |
|-------|------------|
| `order.paid` | Payment successful |
| `order.refunded` | Order refunded |
| `subscription.active` | Subscription started |
| `subscription.canceled` | Subscription cancelled |
| `customer.created` | New customer created |
| `customer.state_changed` | Customer state updated |

---

## Support Resources

- [Polar Documentation](https://polar.sh/docs)
- [Polar Discord](https://dub.sh/polar-discord)
- [Polar GitHub](https://github.com/polarsource/polar)
- [Next.js Examples](https://github.com/polarsource/examples/tree/main/with-nextjs)
