# Stripe Evaluation for Calendaring Payments (vs Polar)

Date: 2026-03-04
Branch reviewed: `feat-calendar`
Also reviewed: `payments-implementation` branch payment docs

## 1) What exists today

Current calendaring docs are built around Polar as the payment provider (Product sync, checkout redirect, webhook-confirmed registration creation, coach-slot blocking transition after purchase).

In current code/schema:
- `Product` has `polarProductId`, `polarPriceId`
- `EventRegistration` has `polarOrderId`
- Calendaring API already carries `productId`/`priceInCents` for event display
- No production payment pipeline (checkout + webhook + registration creation) is implemented yet

In `payments-implementation` branch:
- There are dedicated Polar planning docs (`polar-payment-integration-plan.md`, `polar-client-implementation.md`, etc.) focused on coaching products/orders.

## 2) Can Stripe support "each club sells and gets paid to its own bank"?

Yes. This is a native Stripe Connect use case.

The cleanest approach is:
- Each club = a Stripe Connected Account
- Club onboards with Stripe-hosted onboarding (or embedded onboarding)
- Club adds/owns payout bank account on connected account
- Customer charges are created for that connected account
- Payouts remit to that connected account's bank account

Relevant Stripe docs:
- Connected account onboarding/account links: https://docs.stripe.com/connect/hosted-onboarding
- Dashboard access and Express dashboard: https://docs.stripe.com/connect/express-dashboard
- Payouts to connected accounts: https://docs.stripe.com/connect/payouts-connected-accounts
- Direct charges: https://docs.stripe.com/connect/direct-charges

## 3) Which Stripe Connect model fits ShuttleMentor?

### Option A (recommended): Express + Direct charges

Why:
- Matches SaaS/platform model for club-owned sales
- Funds land on connected account balance (not platform's charge ledger)
- Club can see earnings/payouts and manage payout account via Express dashboard
- Platform can still take app fees (`application_fee_amount`/`application_fee_percent`)

Tradeoff:
- Platform still has liability considerations for Express/Custom configurations (negative balances/disputes can roll up to platform depending on configuration)

### Option B: Standard + Direct charges

Why:
- Clubs have full Stripe Dashboard and strongest account ownership semantics
- Lower platform responsibility in some liability scenarios

Tradeoff:
- Less productized UX control for your platform
- More fragmented support/admin experience

### Option C: Destination charges

Why:
- Strong platform-level visibility and easier centralized reporting

Tradeoff:
- Charges occur on platform, then transfer out to clubs
- Platform generally carries fee/refund/dispute burden for this model

For your stated goal (club remits to own bank, not yours), Option A or B is better than destination charges.

## 4) Memberships and recurring products on Stripe

Stripe supports recurring Checkout for Connect.

For club-owned recurring memberships:
- Create Checkout Session in `subscription` mode
- Use connected account context (`Stripe-Account` header) for direct-charge model
- Use Connect subscription fields for fee split as needed

Reference:
- Checkout Session API supports Connect fields including `subscription_data.application_fee_percent` and `subscription_data.transfer_data`: https://docs.stripe.com/api/checkout/sessions/create

## 5) What would need to change in our Polar-shaped design

## A) Data model adjustments

Keep current generic structure (`Product`, `EventRegistration`) and add provider-neutral + Stripe IDs.

Suggested additions:
- `Club` (or new `ClubPaymentAccount`) stores:
  - `stripeConnectedAccountId`
  - onboarding/payout readiness flags (`chargesEnabled`, `payoutsEnabled`, `detailsSubmitted`)
  - dashboard type (`express`/`full`/`none`)
- `Product`:
  - `paymentProvider` enum (`POLAR`, `STRIPE`)
  - `stripeProductId`, `stripePriceId` (nullable)
  - optionally `stripeAccountId` (if products exist per connected account)
- `EventRegistration`:
  - `paymentProvider`
  - `stripeCheckoutSessionId`, `stripePaymentIntentId`, `stripeInvoiceId`, `stripeSubscriptionId` (nullable, as needed)
  - keep provider-specific order ID fields only if still supporting Polar in parallel

## B) API flow changes

New/updated procedures:
- Club payment onboarding:
  - create connected account
  - create account onboarding link
  - fetch account status
  - create Express login link
- Product sync:
  - create/update Stripe Product + Price in connected account
- Checkout:
  - create checkout session for one-time event booking
  - create checkout session for recurring membership/subscription
- Webhooks:
  - consume Connect webhooks (events on connected accounts)
  - map event -> registration upsert / cancellation/refund state updates

## C) Event booking lifecycle changes

Current Polar plan says: redirect to Polar checkout and create registration on Polar webhook.

Stripe equivalent:
1. user clicks Book
2. backend creates Stripe Checkout Session (connected account context)
3. redirect user to Stripe-hosted checkout
4. Connect webhook receives completion/payment events
5. transactional registration creation + capacity checks + conflict handling
6. update event state (`isBlocking` transition for coaching slots, if required)

## D) Webhook architecture change

Use a Connect webhook endpoint for events on connected accounts.

Reference:
- https://docs.stripe.com/connect/webhooks

Important for your multi-club setup:
- Each event includes connected-account context, which you map back to `clubShortName` via stored `stripeConnectedAccountId`.

## 6) Comparison summary (Polar docs vs Stripe equivalent)

- "Create Polar products from Product table" -> "Create Stripe Product/Price on connected account"
- "Redirect to Polar checkout" -> "Create Stripe Checkout Session and redirect to session URL"
- "Polar order webhook creates EventRegistration" -> "Stripe Connect webhook (checkout/invoice/payment) creates EventRegistration"
- "Polar order IDs on registration" -> "Stripe payment/session/invoice/subscription IDs on registration"
- "Polar handles payout" -> "Stripe Connect payouts to connected account bank"

## 7) Practical recommendation

If you want club-level commerce ownership and direct remittance to each club bank account, adopt:
- Stripe Connect Express
- Direct charges per club connected account
- App fee for platform revenue
- Connect webhooks + transactional registration creation in your DB (capacity remains source of truth)

This preserves your existing calendaring architecture with minimal conceptual change (only payment provider plumbing shifts).

## 8) Sources reviewed

Stripe docs:
- https://docs.stripe.com/connect/hosted-onboarding
- https://docs.stripe.com/connect/onboarding
- https://docs.stripe.com/connect/direct-charges
- https://docs.stripe.com/connect/destination-charges
- https://docs.stripe.com/connect/charges-transfers
- https://docs.stripe.com/connect/payouts-connected-accounts
- https://docs.stripe.com/connect/express-dashboard
- https://docs.stripe.com/connect/integrate-express-dashboard
- https://docs.stripe.com/connect/webhooks
- https://docs.stripe.com/disputes/connect
- https://docs.stripe.com/api/checkout/sessions/create

Project docs reviewed:
- `designFiles/calendaring/README.md`
- `designFiles/calendaring/bookable-events-strategy.md`
- `designFiles/calendaring/progressPhase2.md`
- `payments-implementation` branch Polar docs under `designFiles/polar-*.md`
