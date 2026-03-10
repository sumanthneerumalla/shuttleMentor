# Doc Change Map if Moving from Polar to Stripe

This file lists which existing docs would need wording changes if the payment provider changes to Stripe Connect.

## Must-update docs

1. `designFiles/calendaring/README.md`
- Replace "All payments through Polar" decision with provider-agnostic wording or Stripe Connect wording.
- Update Phase 3 label from "Payments Integration (Polar)" to "Payments Integration (Stripe Connect)".
- Update credit flow references that mention Polar checkout fallback.

2. `designFiles/calendaring/bookable-events-strategy.md`
- Replace all "through Polar" statements in finalized decisions and event behavior tables.
- Update Product model comments:
  - `polarProductId`/`polarPriceId` assumptions -> Stripe or provider-neutral fields.
- Update registration flow section:
  - Polar checkout + Polar webhook -> Stripe Checkout Session + Connect webhook.
- Update coaching slot blocking transition trigger source to Stripe webhook events.

3. `designFiles/calendaring/database-schema.md`
- Replace Polar-specific field commentary with provider-neutral (or Stripe-specific) payment identity fields.
- Update `EventRegistration.polarOrderId` discussion.
- Update indexing rationale for payment external IDs.

4. `designFiles/calendaring/progressPhase2.md`
- Payments section task names from Polar to Stripe equivalents:
  - product sync
  - checkout session creation
  - Connect webhooks
  - registration creation on paid events

5. `designFiles/calendaring/frontend-integration.md`
- Replace "Polar checkout URL" references in public/event detail UX.
- Replace webhook and booking CTA assumptions.

6. `designFiles/calendaring/api-design.md`
- Update procedures that mention Polar product/order mapping to Stripe Connect product/price/session/payment mapping.
- Add club-connected-account onboarding and status procedures.

## Optional/cleanup docs

If revived from `payments-implementation` branch:
- `designFiles/polar-*` docs should be either archived or rewritten as provider-agnostic "payments architecture" docs.

## Migration note

If supporting both providers temporarily:
- Introduce `paymentProvider` enum in docs and keep both ID sets during migration window.
- Keep webhook handlers side-by-side until all active products and events are migrated.
