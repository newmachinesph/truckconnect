# Tasks: TruckConnect PH — MVP Marketplace

**Input**: Design documents from `specs/001-mvp-marketplace/`
**Prerequisites**: plan.md (required), spec.md (required)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1–US10)
- Exact file paths included

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, and base configuration

- [ ] T001 Initialize Next.js project with TypeScript, Tailwind CSS, ESLint in `src/`
- [ ] T002 [P] Configure Prisma ORM with Neon PostgreSQL connection in `prisma/schema.prisma` and `src/lib/db.ts`
- [ ] T003 [P] Configure Upstash Redis client in `src/lib/redis.ts`
- [ ] T004 [P] Configure PWA: manifest in `src/app/manifest.ts`, service worker setup, `next-pwa` or `@serwist/next` integration
- [ ] T005 [P] Set up Tailwind CSS with mobile-first breakpoints and TruckConnect design tokens in `tailwind.config.ts`
- [ ] T006 [P] Create shared UI components (Button, Input, Card, Modal, Badge, Toast) in `src/components/ui/`
- [ ] T007 [P] Set up Vitest configuration for unit tests in `vitest.config.ts`
- [ ] T008 [P] Configure environment variables: `DATABASE_URL`, `UPSTASH_REDIS_URL`, `GOOGLE_MAPS_API_KEY`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY`
- [ ] T009 [P] Set up Vercel project and deployment configuration in `vercel.json`
- [ ] T010 [P] Create Zod validation schemas for all API inputs in `src/lib/validators.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, auth, and core infrastructure — MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T011 Define full Prisma schema with all entities (User, ShipperProfile, TruckerProfile, Truck, Load, Booking, BackhaulOffer, Message, TruckBanWindow, RateConfig) in `prisma/schema.prisma`
- [ ] T012 Enable PostGIS extension on Neon and add geospatial columns (lat/lng for locations) to schema
- [ ] T013 Run initial Prisma migration and seed truck ban data + rate config defaults in `prisma/seed.ts`
- [ ] T014 [P] Configure NextAuth with Email provider (magic link) and Credentials provider (phone OTP) in `src/lib/auth.ts`
- [ ] T015 [P] Create NextAuth API route handler in `src/app/api/auth/[...nextauth]/route.ts`
- [ ] T016 [P] Create auth middleware for route protection (shipper vs. trucker roles) in `src/middleware.ts`
- [ ] T017 [P] Create base layout with responsive navigation (role-aware sidebar/bottom nav) in `src/app/layout.tsx`
- [ ] T018 [P] Set up Google Maps loader and utility functions in `src/lib/maps.ts`
- [ ] T019 Create shared TypeScript types for all entities in `src/types/index.ts`
- [ ] T020 [P] Set up SSE (Server-Sent Events) infrastructure for real-time updates via Upstash Redis pub/sub in `src/lib/sse.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 4 — Registration & Auth (Priority: P1) 🎯 MVP

**Goal**: Users can register (email/phone), select role, and access role-specific dashboard

**Independent Test**: Register → verify → select role → see dashboard

### Implementation

- [ ] T021 [US4] Create registration page with email/phone toggle in `src/app/(auth)/register/page.tsx`
- [ ] T022 [US4] Create login page with magic link / OTP flow in `src/app/(auth)/login/page.tsx`
- [ ] T023 [US4] Create role selection onboarding page (shipper/trucker) in `src/app/(auth)/onboarding/page.tsx`
- [ ] T024 [P] [US4] Create shipper dashboard shell in `src/app/(dashboard)/shipper/page.tsx`
- [ ] T025 [P] [US4] Create trucker dashboard shell in `src/app/(dashboard)/trucker/page.tsx`
- [ ] T026 [US4] Create profile management API route in `src/app/api/users/profile/route.ts`
- [ ] T027 [US4] Implement session-based redirect (logged-in users go to dashboard, new users go to onboarding)

**Checkpoint**: Users can register, log in, and see their role-specific dashboard

---

## Phase 4: User Story 3 — Rate Calculator (Priority: P1) 🎯 MVP

**Goal**: Transparent rate calculation with distance, truck type, fuel surcharge breakdown

**Independent Test**: Enter origin/destination + truck type → see rate breakdown

### Implementation

- [ ] T028 [US3] Implement rate calculation engine in `src/lib/rate-engine.ts` (distance × base rate per truck type + fuel surcharge + platform fee)
- [ ] T029 [US3] Create rate calculation API route in `src/app/api/rate/calculate/route.ts` (accepts origin/dest coords + truck type)
- [ ] T030 [US3] Integrate Google Maps Distance Matrix API for route distance in `src/lib/maps.ts`
- [ ] T031 [US3] Create RateBreakdown component in `src/components/rate/RateBreakdown.tsx`
- [ ] T032 [US3] Create public rate calculator page with location pickers in `src/app/(public)/rate-calculator/page.tsx`
- [ ] T033 [US3] Create LocationPicker component (Google Places Autocomplete) in `src/components/maps/LocationPicker.tsx`
- [ ] T034 [US3] Add rate caching in Upstash Redis (1-hour TTL per route+truck combo)
- [ ] T035 [US3] Write unit tests for rate engine in `tests/unit/rate-engine.test.ts`

**Checkpoint**: Anyone can calculate a rate for any PH route — core value prop demo-ready

---

## Phase 5: User Story 1 — Shipper Posts a Load (Priority: P1) 🎯 MVP

**Goal**: Shippers can post cargo loads with full details and see rate estimates

**Independent Test**: Shipper logs in → posts load → load appears in feed

### Implementation

- [ ] T036 [US1] Create load posting form with all fields (origin, dest, cargo, weight, dims, truck type, date) in `src/components/loads/LoadPostForm.tsx`
- [ ] T037 [US1] Create loads API route (POST to create, GET to list) in `src/app/api/loads/route.ts`
- [ ] T038 [US1] Create post-load page integrating form + rate estimate in `src/app/(dashboard)/shipper/post-load/page.tsx`
- [ ] T039 [US1] Create LoadCard component for displaying loads in `src/components/loads/LoadCard.tsx`
- [ ] T040 [US1] Create shipper's "My Loads" page with load history in `src/app/(dashboard)/shipper/my-loads/page.tsx`
- [ ] T041 [US1] Publish new load event to Redis for real-time feed updates
- [ ] T042 [US1] Add truck type suggestion based on cargo weight/dimensions in load API

**Checkpoint**: Shippers can post loads with rate estimates — supply side of marketplace ready

---

## Phase 6: User Story 2 — Trucker Browses & Accepts Loads (Priority: P1) 🎯 MVP

**Goal**: Truckers browse available loads, filter, and accept — creating a booking

**Independent Test**: Trucker logs in → browses loads → accepts one → booking created

### Implementation

- [ ] T043 [US2] Create truck management page in `src/app/(dashboard)/trucker/my-trucks/page.tsx`
- [ ] T044 [US2] Create trucks API route (CRUD) in `src/app/api/trucks/route.ts`
- [ ] T045 [US2] Create LoadFilters component (route, cargo type, date, truck type) in `src/components/loads/LoadFilters.tsx`
- [ ] T046 [US2] Create available loads page with filters + real-time SSE updates in `src/app/(dashboard)/trucker/available-loads/page.tsx`
- [ ] T047 [US2] Create load acceptance API with optimistic locking (prevent double-booking) in `src/app/api/loads/[id]/accept/route.ts`
- [ ] T048 [US2] Create bookings API route (GET list, GET detail) in `src/app/api/bookings/route.ts`
- [ ] T049 [US2] Implement real-time load feed via SSE (loads appear/disappear as posted/accepted)
- [ ] T050 [US2] Send notification to shipper when trucker accepts load
- [ ] T051 [US2] Write integration test for load acceptance + double-booking prevention in `tests/integration/loads.test.ts`

**Checkpoint**: Full marketplace loop complete — shipper posts, trucker accepts, booking created

---

## Phase 7: User Story 5 — Digital Waybill & Tracking (Priority: P2)

**Goal**: Digital waybill generation, GPS live tracking, ePOD upload

**Independent Test**: Active booking → view waybill → track on map → upload ePOD

### Implementation

- [ ] T052 [US5] Create Waybill component displaying all booking terms in `src/components/bookings/Waybill.tsx`
- [ ] T053 [US5] Create booking detail page (shipper view) with waybill + map in `src/app/(dashboard)/shipper/booking/[id]/page.tsx`
- [ ] T054 [US5] Create booking detail page (trucker view) with waybill + status controls in `src/app/(dashboard)/trucker/booking/[id]/page.tsx`
- [ ] T055 [US5] Create GPS tracking API route (POST position, GET latest) in `src/app/api/bookings/[id]/tracking/route.ts`
- [ ] T056 [US5] Create LiveTracking map component in `src/components/maps/LiveTracking.tsx`
- [ ] T057 [US5] Implement GPS position broadcasting via geolocation API + Redis pub/sub
- [ ] T058 [US5] Create ePOD upload component (camera capture + file upload) in `src/components/bookings/EpodUpload.tsx`
- [ ] T059 [US5] Create ePOD API route (upload photo, link to booking) in `src/app/api/bookings/[id]/epod/route.ts`
- [ ] T060 [US5] Create RouteMap component for displaying booking route in `src/components/maps/RouteMap.tsx`
- [ ] T061 [US5] Write integration test for booking lifecycle (confirmed → in_transit → delivered) in `tests/integration/bookings.test.ts`

**Checkpoint**: Complete booking lifecycle with tracking and proof of delivery

---

## Phase 8: User Story 6 — Backhaul Marketplace (Priority: P2)

**Goal**: Truckers post empty return capacity, shippers book at discounted rates

**Independent Test**: Trucker posts backhaul offer → shipper browses and books it

### Implementation

- [ ] T062 [US6] Create backhaul posting form in `src/components/backhaul/BackhaulPostForm.tsx`
- [ ] T063 [US6] Create backhaul API route (CRUD + auto-expire) in `src/app/api/backhaul/route.ts`
- [ ] T064 [US6] Create backhaul page for truckers in `src/app/(dashboard)/trucker/backhaul/page.tsx`
- [ ] T065 [US6] Create BackhaulCard component in `src/components/backhaul/BackhaulCard.tsx`
- [ ] T066 [US6] Add backhaul listings to shipper's load browsing (separate tab or filter)
- [ ] T067 [US6] Implement backhaul offer expiry (cron or check-on-access pattern)
- [ ] T068 [US6] Link backhaul acceptance to booking creation flow (reuse US2 booking logic)

**Checkpoint**: Backhaul marketplace functional — key differentiator live

---

## Phase 9: User Story 7 — Truck Ban Scheduler (Priority: P2)

**Goal**: Warn users about Metro Manila truck ban conflicts during booking

**Independent Test**: Book delivery during truck ban hours → see warning + alternative times

### Implementation

- [ ] T069 [US7] Create truck ban checking logic in `src/lib/truck-bans.ts`
- [ ] T070 [US7] Create truck ban API route (GET bans for area/time) in `src/app/api/truck-bans/route.ts`
- [ ] T071 [US7] Integrate truck ban warnings into load posting flow (check pickup/delivery time + location)
- [ ] T072 [US7] Suggest alternative compliant time windows when ban detected
- [ ] T073 [US7] Add truck ban alerts to trucker dashboard for active bookings
- [ ] T074 [US7] Write unit tests for truck ban checking logic in `tests/unit/truck-bans.test.ts`

**Checkpoint**: Truck ban awareness integrated — no competitor has this

---

## Phase 10: User Story 8 — In-App Messaging (Priority: P2)

**Goal**: Real-time messaging between booked shipper-trucker pairs

**Independent Test**: Shipper and trucker with active booking exchange messages in real-time

### Implementation

- [ ] T075 [US8] Create messages API route (POST send, GET history) in `src/app/api/messages/route.ts`
- [ ] T076 [US8] Create ChatWindow component with real-time SSE updates in `src/components/messaging/ChatWindow.tsx`
- [ ] T077 [US8] Create MessageBubble component in `src/components/messaging/MessageBubble.tsx`
- [ ] T078 [US8] Integrate chat into booking detail pages (shipper + trucker views)
- [ ] T079 [US8] Implement message queuing for offline users (Redis queue, deliver on reconnect)
- [ ] T080 [US8] Add PWA push notification for new messages via Web Push API
- [ ] T081 [US8] Restrict messaging to active booking pairs only (prevent spam)

**Checkpoint**: Communication layer complete — shippers and truckers can coordinate

---

## Phase 11: User Story 9 — GCash Instant Payout (Priority: P3)

**Goal**: Automatic GCash payout to trucker after ePOD confirmation

**Independent Test**: ePOD confirmed → trucker receives GCash payout (minus platform fee)

### Implementation

- [ ] T082 [US9] Research and integrate PayMongo or GCash API for payouts
- [ ] T083 [US9] Create payout API route in `src/app/api/bookings/[id]/payout/route.ts`
- [ ] T084 [US9] Implement payout trigger on ePOD confirmation (after shipper confirms delivery)
- [ ] T085 [US9] Implement platform fee deduction (5-8% trucker side, 3-4% shipper side)
- [ ] T086 [US9] Implement retry logic for failed payouts (3 retries over 24 hours)
- [ ] T087 [US9] Create payout status display on trucker dashboard
- [ ] T088 [US9] Hold payout on disputed deliveries until resolution

**Checkpoint**: Instant payout live — strongest supply-side lock-in feature

---

## Phase 12: User Story 10 — AI Load Optimizer (Priority: P3)

**Goal**: AI groups small LTL loads on same corridor into one truck, splits cost

**Independent Test**: 3 small loads on same route → AI suggests consolidation → shippers accept → single booking

### Implementation

- [ ] T089 [US10] Create LTL consolidation algorithm (group by corridor, date, capacity) in `src/lib/ltl-optimizer.ts`
- [ ] T090 [US10] Integrate OpenAI API for route optimization suggestions in `src/lib/openai.ts`
- [ ] T091 [US10] Create consolidation suggestion API route in `src/app/api/loads/consolidate/route.ts`
- [ ] T092 [US10] Create UI for shippers to view and accept/decline consolidation offers
- [ ] T093 [US10] Implement proportional cost splitting by weight/volume
- [ ] T094 [US10] Create multi-shipper booking record (one booking, multiple shipper loads)

**Checkpoint**: AI-powered LTL consolidation — advanced differentiator

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: PWA hardening, landing page, performance, and deployment readiness

- [ ] T095 [P] Create landing page with value props, rate calculator CTA in `src/app/(public)/page.tsx`
- [ ] T096 [P] PWA hardening: offline fallback pages, app install banner, splash screens
- [ ] T097 [P] Implement service worker caching strategy (precache shell, runtime cache APIs)
- [ ] T098 [P] Add loading states, error boundaries, and empty states across all pages
- [ ] T099 [P] Lighthouse audit and optimization (target: 90+ performance, 100 PWA)
- [ ] T100 [P] Security hardening: rate limiting on API routes, input sanitization, CSRF protection
- [ ] T101 [P] Add bilingual support (EN/TL) for critical UI strings
- [ ] T102 [P] Write E2E tests for full shipper journey in `tests/e2e/shipper-flow.spec.ts`
- [ ] T103 [P] Write E2E tests for full trucker journey in `tests/e2e/trucker-flow.spec.ts`
- [ ] T104 SEO meta tags and Open Graph for landing page and rate calculator
- [ ] T105 Final Vercel deployment configuration and domain setup

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (Auth/US4)**: Depends on Phase 2 — BLOCKS US1, US2 (need logged-in users)
- **Phase 4 (Rate/US3)**: Depends on Phase 2 — can parallel with Phase 3
- **Phase 5 (Load Posting/US1)**: Depends on Phase 3 (auth) + Phase 4 (rate engine)
- **Phase 6 (Trucker Accept/US2)**: Depends on Phase 5 (needs loads to exist)
- **Phase 7–10 (P2 stories)**: Depend on Phase 6 (need complete booking loop). Can run in parallel with each other.
- **Phase 11–12 (P3 stories)**: Depend on Phase 7 (need ePOD for payouts, need load volume for AI)
- **Phase 13 (Polish)**: After all desired stories complete

### Critical Path

```
Setup → Foundation → Auth (US4) → Rate (US3) → Load Posting (US1) → Trucker Accept (US2)
                                                                          ↓
                                                              ┌───────────┼───────────┐
                                                              ↓           ↓           ↓
                                                         Waybill(US5) Backhaul(US6) TruckBan(US7)
                                                              ↓           ↓           ↓
                                                         Messaging(US8)  ...         ...
                                                              ↓
                                                    ┌─────────┴─────────┐
                                                    ↓                   ↓
                                               GCash(US9)         AI Optimizer(US10)
                                                    ↓
                                                 Polish
```

### Parallel Opportunities

- Phase 1: All [P] tasks can run in parallel
- Phase 2: T014, T015, T016, T017, T018, T020 can run in parallel (after T011–T013)
- Phase 3 + Phase 4: Can run in parallel (auth + rate calculator are independent)
- Phase 7 + Phase 8 + Phase 9 + Phase 10: All P2 stories can run in parallel after Phase 6
- Phase 13: All [P] tasks can run in parallel

---

## Implementation Strategy

### MVP First (Phase 1–6)
Complete Setup → Foundation → Auth → Rate Calculator → Load Posting → Trucker Accept.
At this point, the core marketplace loop works: shipper posts, trucker accepts, booking created with transparent pricing. **This is demo-ready and validates the core hypothesis.**

### Differentiator Layer (Phase 7–10)
Add waybill/tracking, backhaul marketplace, truck ban scheduler, messaging. These are the competitive moats that differentiate TruckConnect from Transportify/Lalamove.

### Revenue Layer (Phase 11–12)
Add GCash payouts and AI load optimization. These enable monetization and advanced value.

### Launch Ready (Phase 13)
Polish, test, and deploy. PWA hardened. Landing page live. SEO ready.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
- Total: 105 tasks across 13 phases
