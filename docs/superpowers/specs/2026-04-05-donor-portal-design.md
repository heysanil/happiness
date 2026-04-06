# Donor Portal Design Spec

## Context

The app currently redirects donors to Stripe's billing portal for login and subscription management. This spec replaces Stripe's portal with a custom donor portal that provides:

- **Email OTP authentication** via better-auth (no passwords)
- **Donation history** with all past donations linked to the donor's email
- **PDF tax receipts** with fiscal sponsor details for each donation
- **Subscription management** — view and cancel recurring donations

The motivation is to own the donor experience end-to-end rather than deferring to Stripe's generic portal UI.

## Authentication

### Stack

- **Library**: `better-auth` with `emailOTP` plugin
- **Session strategy**: Stateless JWT cookie sessions (`cookieCache` with `jwe` encryption strategy)
- **Database**: Add `user` + `verification` tables to existing PlanetScale/MySQL via better-auth's Drizzle adapter
- **Email delivery**: Nodemailer + SMTP (configured via env vars `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`)

### Auth files

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | Server-side better-auth config with emailOTP plugin, Drizzle adapter, stateless sessions |
| `src/lib/auth-client.ts` | Client-side better-auth with `emailOTPClient()` plugin |
| `src/app/api/auth/[...all]/route.ts` | Better-auth catch-all route handler via `toNextJsHandler` |
| `src/db/schema/auth.ts` | Better-auth generated Drizzle schema (user, verification tables) — generated via `npx auth generate`, separate from existing `src/db/schema.ts` |

### Session configuration

```typescript
session: {
  cookieCache: {
    enabled: true,
    maxAge: 7 * 24 * 60 * 60, // 7 days
    strategy: "jwe",
  },
}
```

### Flow

1. Donor enters email at `/portal`
2. Server generates 6-digit OTP, stores in `verification` table, sends via Nodemailer
3. Donor enters OTP code
4. Server verifies OTP, creates/finds user record, sets stateless JWE cookie
5. Redirect to `/portal/dashboard`

## Routes

### Frontend routes (`src/app/(frontend)/portal/`)

| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| `/portal` | `LoginPage` (client) | Public | Two-step email OTP login form |
| `/portal/dashboard` | `DashboardPage` (server) | Required | Donation history + subscriptions |

### API routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/[...all]` | GET/POST | Mixed | better-auth catch-all (OTP send/verify, session) |
| `/v1/portal/receipt/[donationID]` | GET | Portal session | Generate + stream PDF tax receipt |
| `/v1/portal/subscriptions/[subscriptionID]` | DELETE | Portal session | Cancel subscription at period end |

### Portal auth middleware

New `authorizePortal` helper in `src/app/(api)/v1/middleware/authorizePortal.ts`:
- Uses better-auth's `auth.api.getSession()` to validate the stateless cookie from the request headers
- Extracts user email from the verified session
- Returns donor email or throws 401
- Used by receipt and subscription API routes

## Portal UI

### Login page (`/portal`)

Client component with two states:

1. **Email input**: Text input + "Send verification code" button
2. **OTP input**: 6-digit code input + "Verify & sign in" button + "Resend code" link

Uses paris `Input`, `Button` components. Centered layout, max-width ~400px.

### Dashboard page (`/portal/dashboard`)

Server component. Layout:

- **Nav bar**: App logo + "Donor Portal" breadcrumb, donor email, sign out button
- **Welcome section**: "Welcome back, {firstName}" + subtitle
- **Active Subscriptions section**: Cards showing plan name, amount/month, next charge date, cancel button
- **Donation History table**: Columns — Campaign, Amount, Date, Status, Receipt download link

Styling: Tailwind + paris components, matching existing frontend patterns. Uses `layout.module.scss` container styles.

### Subscription cancel flow

- Cancel button triggers client action calling `DELETE /v1/portal/subscriptions/[id]`
- API route calls `stripe.subscriptions.update(id, { cancel_at_period_end: true })`
- UI updates to show "Canceling — ends {date}" status
- Confirmation dialog before cancel action

## Data Sources

### Donation history

```typescript
// In dashboard server component
// 1. Look up donor by email
const donor = await getDonor(email);
// 2. Fetch donations with page info for campaign names
const donations = await listDonations({
  filter: { donor: donor.id },
  include: { page: true },
});
```

Uses existing `getDonor` from `src/db/ops/donors/getDonor.ts` (supports email lookup) and `listDonations` from `src/db/ops/donations/listDonations.ts` (supports `include: { page: true }` for campaign names).

### Subscriptions (Stripe API)

```typescript
const customers = await stripe.customers.list({ email, limit: 1 });
const subscriptions = await stripe.subscriptions.list({
  customer: customers.data[0].id,
  status: 'active',
});
```

Extract from each subscription:
- Plan name (from subscription metadata or product name)
- Amount and interval
- `current_period_end` for next charge date
- Subscription ID for cancel action

### PDF receipt

Generated server-side via `@react-pdf/renderer` in the receipt API route.

Receipt content:
- **Header**: Organization logo + name (from `HappinessConfig`)
- **Donor info**: Full name, email
- **Donation details**: Amount, date, campaign/page name
- **Fiscal sponsor**: Name + EIN (from `HappinessConfig.fiscalSponsorName`, `HappinessConfig.fiscalSponsorEIN`)
- **Tax statement**: "This donation is tax-deductible to the extent allowed by law. No goods or services were provided in exchange for this contribution."
- **Reference**: Donation ID (`don_...`)

Receipt component: `src/lib/receipt/DonationReceipt.tsx`

## Existing Code Changes

| File | Change |
|------|--------|
| `src/app/(frontend)/PortalButton.tsx` | Update `href` to `/portal` |
| `src/app/(api)/v1/portal/route.ts` | Remove (was Stripe portal redirect) |
| `src/lib/stripe/getPortalURL.ts` | Remove (no longer needed) |
| `src/app/(frontend)/[pageID]/page.tsx` | Update portal link from `/v1/portal` to `/portal` |

## New Dependencies

| Package | Purpose |
|---------|---------|
| `better-auth` | Authentication framework |
| `nodemailer` | SMTP email delivery for OTP codes |
| `@react-pdf/renderer` | PDF receipt generation |

## Environment Variables (new)

| Variable | Description |
|----------|-------------|
| `BETTER_AUTH_SECRET` | Secret key for better-auth session signing/encryption |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | From email address for OTP emails |

## Verification

1. **Auth flow**: Start dev server, navigate to `/portal`, enter email, check server logs (or actual email) for OTP, verify code, confirm redirect to dashboard
2. **Donation history**: Verify donations table displays correctly for the authenticated donor email, with correct campaign names and amounts
3. **Receipt PDF**: Click "Receipt" link, verify PDF downloads with correct donor info, donation amount, fiscal sponsor details, and tax statement
4. **Subscription management**: Verify active subscriptions display with correct amounts and dates. Test cancel flow — confirm Stripe subscription is updated to `cancel_at_period_end: true`
5. **Auth protection**: Verify `/portal/dashboard` redirects to `/portal` when unauthenticated. Verify receipt/subscription API routes return 401 without valid session cookie
6. **Sign out**: Verify sign out clears cookie and redirects to `/portal`
