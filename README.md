# SkyHaven web app

The SkyHaven website for renters and landlords in Nigeria: landing page, search, verified listings, inspections, booking with protected payment, move-in confirmation, and the landlord dashboard, onboarding and listing wizard. Built with Next.js 16 (App Router, Cache Components, Partial Prefetching), React 19 and Tailwind 4.

Nigerian by default: naira (₦) in kobo, Lagos time, Nigerian mobile numbers, NIN for landlord verification, and local terms (inspection, self-contain, flat, caution deposit).

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The home page is the landing page: hero, about us, how it works, trust and safety, landlords, policy, partners and get started.

Until the NestJS endpoints exist, the app runs on an in-memory stand-in for the API (`src/lib/api/mock/`). The only data in it is the **Find a Home** listings (16 homes in Lagos, Abuja, Port Harcourt, Ibadan and Enugu, using stock photos and marked "Sample"). There are no demo accounts, bookings or saved homes: sign in with any Nigerian mobile number or email to create your own. The code is shown on screen instead of being sent by SMS. Anything you create resets when the server restarts.

## Accounts and sign-in

Pages: `/sign-up`, `/sign-in`, `/forgot-password` (in `src/app/(auth)/`, no site navbar). On large screens a photo carousel (`components/auth/auth-carousel.tsx`) fills the left half and the form sits centred on the right; phones show the form only. The carousel advances every 5 seconds, pauses on hover, focus or its pause button, and stays still for reduced-motion users.

- **Sign up, in 4 steps** with a progress bar and Back buttons: 1) account type (renter or landlord) → 2) first name, last name, email, Nigerian phone number → 3) password, confirm password, terms → 4) 6-digit code by SMS → account created and signed in. Each step is validated before moving on; if the server rejects a field, the form returns to the step that holds it. Nothing is stored until the code is entered, and "this number already has an account" is only shown after the code proves the phone is theirs.
- **Sign in:** phone or email plus password, or a one-time code (existing accounts only). Wrong account and wrong password give the same message. After 5 failures the identifier is paused for 15 minutes.
- **Forgot password:** phone or email → code → new password. The answer is the same whether or not the account exists. Saving the new password signs out every other session. The token that authorises it lives in an httpOnly cookie, never in the page.
- **Rules:** at least 8 characters with a letter and a number; common passwords and ones containing the name, phone or email are refused (NIST SP 800-63B style). Codes last 10 minutes, allow 5 attempts, and can be resent after 60 seconds, at most 5 per 10 minutes.

The API endpoints this needs are listed in `src/lib/api/contract.ts`. The in-memory stand-in hashes passwords with scrypt; the real API should use argon2id.

## Partners and sponsors

The landing page carousel reads `src/lib/partners.ts`. It holds placeholder slots until partners are signed. Add each partner's logo to `public/partners/` and its entry to that file. Only list organisations that have agreed in writing to appear.

## Animation

Hero entrance animations are plain CSS (`.anim-*` in `src/app/globals.css`), so the headline and photo paint before JavaScript loads. Scroll effects (reveals, parallax, counters, tabs, accordion, mobile menu) use [Motion](https://motion.dev). Everything respects the visitor's "reduce motion" setting.

## Connect to the real API

In `.env.local`:

```bash
SKYHAVEN_DATA_SOURCE=api
API_URL=http://localhost:4000/v1
```

The web app calls the API only from the server. Tokens live in httpOnly cookies, and `src/proxy.ts` rotates an expired access token using the refresh token before a page renders.

## Where things are

| Path | What it holds |
|---|---|
| `src/app/` | Pages. Public: `/`, `/homes`, `/homes/[slug]`, `/how-it-works`, `/landlords`. Tenant: `/account`, `/account/saved`, `/bookings/[id]`. Landlord: `/landlord`, `/landlord/onboarding`, `/landlord/listings/new`, `/landlord/listings/[id]`. |
| `src/app/actions/` | Server Actions. Each one checks the session itself; never trust that a page was protected. |
| `src/lib/api/contract.ts` | The API as the web app uses it: one method per `/v1` route. |
| `src/lib/api/http.ts` | The real API over HTTP. |
| `src/lib/api/mock/` | The sandbox API. It enforces the Developer Blueprint's rules (state machine, submit guards, price snapshots, double-entry ledger, 30-minute payment expiry, auto-release) so the UI is built against real behaviour. |
| `src/lib/dal.ts` | Data access layer: session reads and cached public reads (`'use cache'`, tag `listings`). |
| `src/lib/domain.ts` | Statuses and money rules. A copy: keep it identical to the API's. |
| `src/styles/tokens.css` | Brand tokens. A copy: keep it identical across web apps. Web-only additions (logo colours, heading colour) are in `src/app/globals.css`. |

### Rules this codebase follows

- **Money** is integer minor units (kobo) everywhere. `formatMoney` is for display only. The client never sends an amount: checkout uses the booking's price snapshot.
- **Privacy**: public listing data never includes the street address or the landlord's contact details. They appear on the booking only after payment.
- **Sample data**: stock photos are never presented as real homes. Sample listings carry a "Sample" badge and a notice, are `noindex`, are left out of the sitemap, and the sandbox blocks all crawlers.
- **Brand**: amber (`btn.accent`) is for the one main action on a screen. Verified teal appears only on things that were checked.
- **Cache Components**: anything that reads cookies, `params` or `searchParams` sits inside `<Suspense>`. After a mutation, actions call `updateTag('listings')` if tenants' view changed, and `refresh()` for the user's own pages.

## Commands

```bash
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
npm run typecheck
npm test           # Vitest: redaction, phone and search parsing, and the full booking and listing flows
```

On Windows, if `npm test` fails with "Vitest failed to find the runner", the terminal opened the folder as `c:\` instead of `C:\`. Run `cd C:\Users\...\skyhaven\web` (capital C) and try again.

## Not built yet

- **Photo and document upload** needs the API's signed upload URLs. The sandbox picks from sample photos instead.
- **Map view** in search (the Blueprint allows cutting it if payments slip).
- **Landlord inspection management** (confirming viewings) and **payout history** beyond the summary.
