# Polar Earnings Remittance to Club Owners

> Research date: March 2026. Based on Polar.sh public docs + pricing page.

---

## The Core Problem

ShuttleMentor acts as a **platform** — club owners sell memberships/products to their members, and we need to route the money back to each club owner. Polar is a Merchant of Record (MoR), which means **Polar collects all revenue**, takes their cut (4% + 40¢/transaction), and then pays **you** (ShuttleMentor's Polar org). The platform-to-club-owner split is a layer Polar does not handle natively.

Polar has **no built-in marketplace/split-payment API** (unlike Stripe Connect). Every payout goes to the single Stripe account you connected to your Polar org.

---

## Option A — One Polar Organization Per Club (Recommended)

**How it works:**  
Each club owner creates their own Polar organization and connects their own Stripe payout account. ShuttleMentor's role is to configure/link their Polar org, not to collect money on their behalf.

**Flow:**
```
Customer pays → Club's Polar org (MoR) → Polar takes 4% + 40¢ → Club's Stripe payout account
```

**Pros:**
- Club owner receives money directly — zero intermediary liability for ShuttleMentor
- Club owner handles their own tax forms (1099-K etc.)
- Polar already supports multiple organizations per user — club owners can be added as members of their own org
- No custom remittance logic required

**Cons:**
- Club owner must set up their own Polar org + connect Stripe (takes ~10 min, but it's a one-time onboarding step)
- ShuttleMentor loses visibility into revenue per club (mitigated by webhooks per org)
- Each Polar org needs its own `POLAR_ORGANIZATION_ACCESS_TOKEN` — you'd store this per-club in the DB (e.g., `Club.polarAccessToken`)

**Implementation sketch:**
1. Add `polarOrganizationId` + `polarAccessToken` (encrypted) to the `Club` model
2. During club onboarding, prompt admin to create a Polar org and paste in their Organization Access Token
3. Use that token when creating checkout sessions for that club's products
4. Webhooks: register one endpoint per club org, or use a single endpoint that reads `organization_id` from the event payload to route it

---

## Option B — Single Polar Org + Manual Remittance via Stripe (Simpler to Start)

**How it works:**  
ShuttleMentor has one Polar org. All revenue lands in ShuttleMentor's Stripe account. You periodically transfer the club owner's share via Stripe payouts or bank transfer.

**Flow:**
```
Customer pays → ShuttleMentor Polar org → Polar takes 4% + 40¢ → ShuttleMentor Stripe → Manual/scheduled transfer to club owner
```

**Pros:**
- Zero additional setup for club owners
- Single Polar integration for all clubs

**Cons:**
- ShuttleMentor becomes a **money transmitter** — legally you're holding other people's money, which has licensing implications in many jurisdictions (MSB/MTL requirements)
- You need to track per-club revenue yourself (via Polar webhooks tagging each transaction with metadata)
- Manual or scheduled payouts are operationally painful at scale
- Tax reporting burden shifts to you

**Implementation sketch:**
1. Tag every Polar checkout with `metadata: { clubShortName: "..." }` when creating the checkout session
2. Listen to `order.created` or `subscription.active` webhooks, extract metadata, record revenue in a `ClubRevenue` table
3. Periodically compute each club's balance, issue Stripe payouts manually or via a scheduled job

---

## Option C — Stripe Connect (Bypass Polar for Club Revenue)

Use Polar for ShuttleMentor's own products (e.g., platform subscription, coaching tools) but use **Stripe Connect Express** directly for club owner revenue.

**Flow:**
```
Customer pays → Stripe (your platform account) → Stripe Connect automatic transfer → Club owner's connected account
```

**Pros:**
- Native split payment — Stripe handles the routing, 1099s, and compliance
- You set a platform fee per transaction

**Cons:**
- Polar and Stripe Connect serve different use cases — mixing them adds complexity
- Club owners still need to onboard to Stripe Connect
- Loses Polar's MoR benefits (tax handling, VAT) for club transactions

---

## Recommendation

**Start with Option A.**

Polar is designed for independent creators/orgs — the mental model maps perfectly to "each club is its own business". The onboarding friction (club admin creates Polar org + connects Stripe once) is acceptable.

When you're ready to abstract it:
1. Store `Club.polarOrganizationId` and `Club.polarAccessToken` (server-side only, encrypted at rest)
2. Create a `ClubPolarService` that wraps `@polar-sh/sdk` and passes the club's access token for all API calls
3. Register a single webhook endpoint (`/api/webhooks/polar`) that routes events by `organization_id`

**Don't use Option B at scale** — holding club owner revenue without a money transmitter license is a legal risk.

---

## Polar Pricing Reference (as of March 2026)

| Fee | Amount |
|-----|--------|
| Platform fee | 4% + 40¢ per transaction |
| Stripe payout | $2/month active payout + 0.25% + $0.25 per payout |
| Cross-border | 0.25% (EU) – 1% (other) |
| Minimum payout | Polar has a minimum threshold before withdrawal |

Polar covers Stripe's 2.9% + 30¢ processing fee within their 4% — so the effective MoR cost is the 4% + 40¢ only.

---

## Next Steps (when ready to implement)

- [ ] Decide: Option A (club-owned Polar orgs) vs Option C (Stripe Connect directly)
- [ ] Add `polarOrganizationId` + `polarAccessToken` to `Club` Prisma model (Option A)
- [ ] Build club onboarding flow: prompt admin to create Polar org, store token
- [ ] Create `ClubPolarService` utility for per-org API calls
- [ ] Set up webhook endpoint that routes by `organization_id`
- [ ] Consider encrypting `polarAccessToken` at rest using a KMS key or `@prisma/field-encryption`
