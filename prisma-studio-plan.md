# Prisma Studio Embedded Database Admin Panel - Implementation Plan

## Context

**Goal:** Provide ShuttleMentor administrators with direct database access through an embedded Prisma Studio interface at `/database`.

**Why:** Admin users need to perform database operations (viewing, editing, debugging) without requiring direct database access or external tools.

**Requirements:**
- Admin-only access with server-side validation
- Full read/write database access
- Available in all environments (development, staging, production)
- No audit logging required
- Secure API endpoints with proper authentication

---

## Overview

Embed Prisma Studio into the ShuttleMentor web app at `/database`, accessible only to ADMIN users, with server-side route protection.

---

## Architecture

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **AdminGuard** | `src/app/_components/server/AdminGuard.tsx` | Server-side admin validation + redirect |
| **API Route** | `src/app/api/studio/route.ts` | Backend endpoint for SQL query execution |
| **DatabaseStudio** | `src/app/database/DatabaseStudio.tsx` | Client component wrapping Prisma Studio |
| **Page** | `src/app/database/page.tsx` | Route entry point with AdminGuard |
| **SideNavigation** | Update existing | Add "Database" link for ADMIN users |

---

## Prerequisites

- PostgreSQL database (confirmed in schema.prisma)
- `@prisma/studio-core` package installed
- Existing `isAdmin()` utility in `src/server/utils/utils.ts`

---

## Implementation Steps

### 1. Install Dependencies

```bash
npm install @prisma/studio-core
```

*Note: May need `--force` flag if dependency resolution issues occur.*

### 2. Create AdminGuard Server Component

**File:** `src/app/_components/server/AdminGuard.tsx`

**Pattern:** Follow existing `OnboardedGuard.tsx` pattern

**Logic:**
1. Get Clerk session via `auth()`
2. If no session → redirect to `/`
3. Fetch user from DB by `clerkUserId`
4. If user not found or `userType !== ADMIN` → redirect to `/home`
5. Return children if admin

**Exports:**
- `getAdminUserOrRedirect()` - utility function
- `AdminGuard` - wrapper component

### 3. Create API Route for SQL Queries

**File:** `src/app/api/studio/route.ts`

**Security:** This is critical - the API must also validate admin access server-side.

**Implementation:**
```typescript
// Pseudocode structure
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Validate admin auth using Clerk + DB lookup
  // 2. If not admin, return 403 Forbidden
  // 3. Parse query from request body
  // 4. Execute via createPrismaPostgresHttpClient (PostgreSQL)
  // 5. Return results or serialized error
}

export async function GET() {
  // Health check endpoint
}

export async function OPTIONS() {
  // CORS preflight
}
```

**Key imports from `@prisma/studio-core`:**
- `createPrismaPostgresHttpClient` from `@prisma/studio-core/data/ppg`
- `serializeError` from `@prisma/studio-core/data/bff`

**CORS:** Restrict to same origin in production (not `*`)

### 4. Create DatabaseStudio Client Component

**File:** `src/app/database/DatabaseStudio.tsx`

**Requirements:**
- `"use client"` directive
- Import `@prisma/studio-core/ui/index.css`
- Dynamic import of `Studio` component with `ssr: false`
- Use `createPostgresAdapter` + `createStudioBFFClient`
- Wrap in Suspense with loading state

**Styling:** Follow `globals.css` conventions:
- Use CSS variables (`--primary`, `--background`, etc.)
- Use existing component classes (`.glass-card`, `.section-heading`)
- Full-height layout: `h-[calc(100vh-<header_height>)]`

### 5. Create Database Page

**File:** `src/app/database/page.tsx`

**Structure:**
```tsx
// Server component
import { AdminGuard } from "~/app/_components/server/AdminGuard";
import DatabaseStudio from "./DatabaseStudio";

export default function DatabasePage() {
  return (
    <AdminGuard>
      <DatabaseStudio />
    </AdminGuard>
  );
}
```

### 6. Update SideNavigation

**File:** `src/app/_components/client/authed/SideNavigation.tsx`

**Change:** Add new nav item to the Admin section children array:

```typescript
{
  label: "Database",
  href: "/database",
  userTypes: [UserType.ADMIN],
}
```

**Location:** Inside the existing "Admin" nav group (lines 146-177), add to `children` array alongside "All Collections" and "Users".

---

## Security Considerations

1. **Double validation:** Both the page (via AdminGuard) AND the API route must independently verify admin status
2. **API route auth:** Cannot rely on client-side checks alone - the `/api/studio` endpoint executes raw SQL
3. **CORS:** Restrict `Access-Control-Allow-Origin` to the app's domain in production
4. **No public exposure:** The Studio UI and API should never be accessible to non-admins

---

## File Summary

| Action | File |
|--------|------|
| **CREATE** | `src/app/_components/server/AdminGuard.tsx` |
| **CREATE** | `src/app/api/studio/route.ts` |
| **CREATE** | `src/app/database/DatabaseStudio.tsx` |
| **CREATE** | `src/app/database/page.tsx` |
| **MODIFY** | `src/app/_components/client/authed/SideNavigation.tsx` |
| **MODIFY** | `package.json` (via npm install) |

---

## Testing

1. **Admin access:** ADMIN user can navigate to `/database` and see Prisma Studio
2. **Non-admin redirect:** Non-admin users redirected to `/home` when visiting `/database`
3. **API security:** Direct API calls to `/api/studio` return 403 for non-admins
4. **Studio functionality:** Can read/write database records through Prisma Studio interface

---

## Notes

- **Read/Write:** Full database access (no read-only restrictions)
- **Environment:** Available in all environments (development, staging, production)
- **Audits:** No audit logging implemented
- **Reusable utilities:** Leverages existing `isAdmin()` from `src/server/utils/utils.ts`
