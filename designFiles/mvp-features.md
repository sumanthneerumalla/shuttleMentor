# MVP Features — First Customer Launch

Master tracking doc for all workstreams needed to launch with the first customer.

---

## Workstreams

### 1. Facility Management
- Multi-facility support (already partially in schema via ClubFacility)
- Location details: address, email, phone
- Logo upload per facility/club
- Accepted payment methods display
- Associate trainers and staff with specific facilities

**Design doc:** TBD

### 2. Memberships
- Membership types (different tiers per club)
- Start date, end date
- Freeze/postpone memberships (extend end date)
- Membership renewal settings
- Link memberships to clients

**Design doc:** TBD

### 3. Billing & Revenue
- Revenue categories for products/packages
- Coupon restrictions (scope to specific products/categories)
- Earnings reports with date ranges
- Accounts receivable: invoices by customer (date, total, paid, balance)
- Revenue reports: start/end date + location → revenue, payments collected, packages sold, invoice values
- Package sales reports

**Design doc:** TBD
**Dependencies:** Polar integration (Phase 3 — in progress)

### 4. Client Management ← IN PROGRESS
- **Phase 4: User Tags** — tagging, filtering, bulk tagging ← CURRENT
- Client export (CSV/Excel)
- Contact preferences per client
- Configurable required fields for intake/sign-up forms

**Design doc:** `designFiles/phase4-user-tags.md`

### 5. Events & Calendar
- Manual registration: go to event, type name to add registrant
- Event statuses: scheduled, attended, no-show, reschedule/early cancel, late cancel (pay trainer), reserved, waitlist
- Calendar generation based on event bookings + settings
- Court rentals, drop-ins, training/classes support

**Design doc:** `designFiles/calendaring/README.md` (existing), needs extension for statuses + manual registration

### 6. Communications
- Customizable email body/text for transaction emails
- Invoice details filled via template variables
- Email campaigns for specifically tagged clients
- Campaign metrics: open rate, click rate

**Design doc:** TBD

### 7. Documents & Waivers
- Admin-created document/waiver library
- Link waivers to specific packages
- Client signature/acceptance tracking

**Design doc:** TBD

### 8. Reports
- Accounts receivable
- Revenue reports (start/end date, location, categories)
- Package sales (name, invoice number, values)
- Training reports: attendance per person, check-in/out times, accrued earnings
- POS reports: inventory
- Priority (per customer): A/R, invoices, revenue, package sales — example docs available

**Design doc:** TBD

---

## Existing work / phases already in progress

| Phase | Doc | Status |
|---|---|---|
| Phase 2: User Management | `phase2-user-management.md` | Complete |
| Phase 2.5: Calendar & Public Embed | `progressPhase2_5.md` | In progress |
| Phase 3: Polar Payments | `progressPhase3.md` | In progress (P1-P4 remaining) |
| Phase 4: User Tags | `phase4-user-tags.md` | In progress (batch 3 of 4) |

---

## Tech debt / prerequisites (from nextSteps.md)

- Club landing shortname leak — P0 security fix needed
- Input sanitization on user fields
- Video collection pagination
- Coach dashboard cleanup
- Sidebar migration to shadcn

---

## Launch priorities (to be confirmed with customer)

Need to confirm with customer (Fung) which reports are most critical. Known priority:
- Accounts receivable, invoices, revenue report, package sales — example docs available
- New facility will mainly have training/classes, drop-ins, and court rentals
- Customer currently uses Pike13 — look into their calendar for reference
