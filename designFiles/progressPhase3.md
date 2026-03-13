# Shuttlementor — Phase 3 Progress

> **Related design docs**: [`designFiles/calendaring/README.md`](./calendaring/README.md) is the
> master calendaring design document and defines its own internal phase numbering
> (calendaring Phase 3 = Polar payments). The phases in *this* document are product-wide
> sprint phases, not calendaring-specific ones.
>
> **Related progress docs**: Non-payment calendaring work now lives in
> [`progressPhase2_5.md`](./progressPhase2_5.md).
>
> **Prerequisites**: Phase 2 complete. Phase 2.5 tracks the remaining public/embed and
> non-payment calendaring items that may need to land before checkout rollout.
>
> **Guiding principle for Phase 3**: Focus only on Polar-backed booking and payment flows.

---

## Priority 1 — Payments: Polar Integration

> See calendaring README Phase 3 for full design. All items below are Polar-dependent.

- [ ] **P1** Polar product sync
  - Webhook handler to write `polarProductId` / `polarPriceId` back to `Product` table
  - Sync product price/title changes from Polar dashboard

- [ ] **P2** Checkout flow for BOOKABLE events
  - Redirect to Polar checkout with `eventId` + `instanceDate` in metadata
  - On successful payment webhook: create `EventRegistration` with `polarOrderId`
  - `isPublic` toggle in event creation UI (needed for public calendar to surface the event)

- [ ] **P3** Capacity enforcement on checkout
  - Prevent checkout when `maxParticipants` is reached
  - Guard in `registerForEvent` mutation and on checkout redirect

- [ ] **P4** `isBlocking` auto-transition for coaching slots on purchase
  - When a `COACHING_SLOT` registration is confirmed, set `isBlocking = true` on the event
  - Reverse on cancellation/refund

---

## Suggested Start Order

1. Finish **C4 + C5** in [`progressPhase2_5.md`](./progressPhase2_5.md) if public booking/embed is still required before checkout rollout
2. **P1** — Polar product sync
3. **P2 + P3** — Checkout flow and capacity enforcement
4. **P4** — Coaching slot `isBlocking` auto-transition
