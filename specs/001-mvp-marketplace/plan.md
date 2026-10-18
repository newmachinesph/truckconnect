# Implementation Plan: TruckConnect PH — MVP Marketplace

**Branch**: `001-mvp-marketplace` | **Date**: 2026-03-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-mvp-marketplace/spec.md`

## Summary

Build a two-sided trucking marketplace PWA connecting Philippine shippers and independent truck owners. The MVP covers: user auth, load posting, trucker browsing/acceptance, transparent rate calculator, digital waybills, GPS tracking, backhaul marketplace, truck ban scheduling, and in-app messaging. Built as a Next.js full-stack PWA deployed on Vercel with Neon PostgreSQL and Upstash Redis.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Framework**: Next.js (latest stable, App Router)
**Primary Dependencies**: NextAuth (Auth.js), Prisma ORM, Upstash Redis, Google Maps JS API, OpenAI SDK, Tailwind CSS, Headless UI, next-pwa
**Design System**: [Branding & Design System](../../docs/plans/2026-03-13-branding-design.md) — Inter + JetBrains Mono, Emerald/Slate palette, Tailwind CSS + Headless UI, light mode only
**Storage**: Neon PostgreSQL (with PostGIS extension for geospatial queries)
**Testing**: Vitest (unit), Playwright (E2E), Testing Library (components)
**Target Platform**: PWA — mobile-first responsive web, installable on Android/iOS
**Project Type**: Full-stack web application (monolith)
**Performance Goals**: <2s rate calculation, <1s real-time feed updates, 90+ Lighthouse
**Constraints**: Free-tier infrastructure, offline-capable for critical views, bilingual (EN/TL)
**Scale/Scope**: 500 concurrent users, ~50 screens, 1 corridor (Manila-Cebu) for launch

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| PWA-First | ✅ PASS | Service worker, manifest, offline support planned |
| API Routes in Next.js | ✅ PASS | All backend in App Router route handlers + server actions |
| Free-Tier Infrastructure | ✅ PASS | Neon free, Upstash free, Vercel Hobby, Google Maps $200 credit |
| Philippine-Context Design | ✅ PASS | GCash, truck bans, PhilID, bilingual planned |
| Marketplace Trust & Safety | ✅ PASS | Verification flows, digital waybills, ePOD in spec |
| Simplicity & YAGNI | ✅ PASS | Monolith, no microservices, single deployable |
| Test Coverage for Critical Paths | ✅ PASS | Payment, booking state machine, rate calc tests required |

## Project Structure

### Documentation (this feature)

```text
specs/001-mvp-marketplace/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Technology research notes
├── data-model.md        # Database schema design
├── contracts/           # API contract definitions
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── onboarding/page.tsx
│   ├── (dashboard)/
│   │   ├── shipper/
│   │   │   ├── page.tsx                    # Shipper dashboard
│   │   │   ├── post-load/page.tsx          # Load posting form
│   │   │   ├── my-loads/page.tsx           # Shipper's load history
│   │   │   └── booking/[id]/page.tsx       # Booking detail + tracking
│   │   └── trucker/
│   │       ├── page.tsx                    # Trucker dashboard
│   │       ├── available-loads/page.tsx    # Browse/filter loads
│   │       ├── my-trucks/page.tsx          # Truck management
│   │       ├── backhaul/page.tsx           # Post backhaul offers
│   │       └── booking/[id]/page.tsx       # Booking detail + waybill
│   ├── (public)/
│   │   ├── page.tsx                        # Landing page
│   │   └── rate-calculator/page.tsx        # Public rate calculator
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts     # NextAuth handlers
│   │   ├── loads/route.ts                  # CRUD loads
│   │   ├── loads/[id]/accept/route.ts      # Accept load (booking)
│   │   ├── bookings/route.ts               # Booking management
│   │   ├── bookings/[id]/tracking/route.ts # GPS tracking updates
│   │   ├── bookings/[id]/epod/route.ts     # ePOD upload
│   │   ├── backhaul/route.ts               # Backhaul CRUD
│   │   ├── rate/calculate/route.ts         # Rate calculator
│   │   ├── messages/route.ts               # Messaging
│   │   ├── trucks/route.ts                 # Truck management
│   │   ├── truck-bans/route.ts             # Truck ban data
│   │   └── users/profile/route.ts          # Profile management
│   ├── layout.tsx
│   ├── manifest.ts                         # PWA manifest
│   └── sw.ts                               # Service worker
├── components/
│   ├── ui/                                 # Shared UI components (buttons, inputs, cards)
│   ├── maps/
│   │   ├── RouteMap.tsx                    # Google Maps route display
│   │   ├── LiveTracking.tsx                # Real-time GPS tracking
│   │   └── LocationPicker.tsx              # Origin/destination selector
│   ├── loads/
│   │   ├── LoadCard.tsx                    # Load listing card
│   │   ├── LoadPostForm.tsx                # Load posting form
│   │   └── LoadFilters.tsx                 # Filter controls
│   ├── bookings/
│   │   ├── BookingDetail.tsx               # Booking view
│   │   ├── Waybill.tsx                     # Digital waybill
│   │   └── EpodUpload.tsx                  # Photo proof upload
│   ├── messaging/
│   │   ├── ChatWindow.tsx                  # Real-time chat
│   │   └── MessageBubble.tsx               # Individual message
│   ├── rate/
│   │   └── RateBreakdown.tsx               # Rate calculation display
│   └── backhaul/
│       ├── BackhaulCard.tsx                # Backhaul offer card
│       └── BackhaulPostForm.tsx            # Post backhaul form
├── lib/
│   ├── db.ts                               # Prisma client
│   ├── auth.ts                             # NextAuth config
│   ├── redis.ts                            # Upstash Redis client
│   ├── maps.ts                             # Google Maps utilities
│   ├── rate-engine.ts                      # Rate calculation logic
│   ├── truck-bans.ts                       # Truck ban checking logic
│   ├── openai.ts                           # OpenAI client
│   └── validators.ts                       # Zod schemas for API validation
├── prisma/
│   ├── schema.prisma                       # Database schema
│   └── migrations/                         # Migration files
├── public/
│   ├── icons/                              # PWA icons
│   └── images/                             # Static assets
└── types/
    └── index.ts                            # Shared TypeScript types

tests/
├── unit/
│   ├── rate-engine.test.ts                 # Rate calculation tests
│   └── truck-bans.test.ts                  # Truck ban logic tests
├── integration/
│   ├── loads.test.ts                       # Load CRUD + acceptance
│   ├── bookings.test.ts                    # Booking state machine
│   └── auth.test.ts                        # Authentication flows
└── e2e/
    ├── shipper-flow.spec.ts                # Full shipper journey
    └── trucker-flow.spec.ts                # Full trucker journey
```

**Structure Decision**: Single Next.js application (monolith). All backend logic in API routes and server actions. No separate backend service. This aligns with the Simplicity principle and Vercel deployment model.

## Key Technical Decisions

### 1. Database Schema (PostGIS)
Use Neon PostgreSQL with PostGIS extension for geospatial queries (finding nearby loads/truckers, route distance calculations). Prisma ORM with raw SQL for PostGIS-specific queries.

### 2. Real-Time Architecture
Upstash Redis pub/sub for: load feed updates, booking status changes, messaging, and GPS tracking. Client subscribes via Server-Sent Events (SSE) from API routes (WebSocket not supported on Vercel Hobby — SSE is the correct approach).

### 3. Rate Calculation Engine
Server-side calculation using: Google Maps Distance Matrix API for route distance, configurable rate tables per truck type, real-time fuel price multiplier, platform fee calculation. Results cached in Upstash Redis (1-hour TTL per route+truck combination).

### 4. PWA Strategy
- `next-pwa` or `@serwist/next` for service worker generation
- Precache: app shell, critical CSS/JS, rate tables
- Runtime cache: Google Maps tiles, API responses (stale-while-revalidate)
- Offline: cached dashboard, active booking details, last-known GPS position
- Push notifications via Web Push API (no FCM needed)

### 5. Authentication Flow
NextAuth with: Email magic link provider (primary), Credentials provider with OTP for phone (via SMS API), Session stored in database (Prisma adapter). Role-based middleware for shipper vs. trucker route protection.

### 6. File Uploads (ePOD)
Vercel Blob Storage (free 256MB on Hobby) or Uploadthing for ePOD photos. Images compressed client-side before upload. Linked to booking record in database.

### 7. Truck Ban Data
Static seed data for MMDA truck ban windows stored in PostgreSQL. Admin can update via simple CRUD. No external API dependency — truck ban schedules change infrequently. Time-zone aware (Asia/Manila).

## Complexity Tracking

No constitution violations. Single monolith, free-tier stack, no premature abstractions.
