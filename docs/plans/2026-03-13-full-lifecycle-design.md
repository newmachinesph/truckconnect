# TruckConnect PH — Full Lifecycle Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create implementation plans from this design.

**Goal:** Transform TruckConnect PH from an 80%-built MVP into a complete full-lifecycle demo that showcases every user journey — from guest landing to delivery confirmation — with realistic UI, simulated payments, and document workflows powered by UploadThing.

**Design Philosophy:** Option A — Simulated with Realistic UI. Every screen looks production-ready. Payments show GCash/bank UI with "Demo: Auto-approved" badges. Document uploads go through UploadThing but verification is instant. The happy path is cinematic; edge cases are functional but simpler.

**Priority:** Customer-facing flows (shipper + trucker) first. Admin is functional but not polished.

---

## Architecture Decisions

### Upload Infrastructure
- **UploadThing** for all file uploads (SEA1 region)
- File types: truck photos, government IDs, LTFRB certificates, cargo photos, ePOD delivery proof, BOL documents, insurance certificates
- Replace current base64 ePOD storage with UploadThing URLs

### New Database Models Required
The existing 13-model Prisma schema covers ~60% of the user stories. New models needed:

```
Document          — uploaded files (type, url, status, userId, metadata)
Review            — ratings between parties (bookerId, revieweeId, tripId, dimensions)
Dispute           — cargo damage, late delivery, no-show claims
InsurancePolicy   — per-booking cargo insurance (tier, premium, coverage)
ContractLane      — recurring route agreements (shipper + carrier)
Notification      — in-app notification center
Subscription      — fleet plans and enterprise tiers
ReferralCode      — growth program tracking
CancellationLog   — cancellation audit trail with reason/penalty
```

### State Machine Extensions
Current booking states: CONFIRMED → IN_TRANSIT → DELIVERED → COMPLETED (+ CANCELLED, DISPUTED)

Extended states needed:
```
PENDING_PICKUP → PICKED_UP → IN_TRANSIT → AT_FERRY → IN_TRANSIT_2 → ARRIVING → DELIVERED → COMPLETED
                                                                                    ↓
                                                                                DISPUTED → RESOLVED
```

### New API Routes Required
~35 new API endpoints across the 27 modules (detailed per phase below).

### Key Libraries to Add
- `uploadthing` + `@uploadthing/react` — file uploads
- `@react-email/components` + `resend` — email templates (optional, can stub)
- No new major dependencies — existing stack (Next.js 16, Prisma, Redis, Three.js) covers everything

---

## Phase 1 — Hero Demo Flow

**Modules covered:** 1 (Guest), 2 (Registration), 4 (Load Posting), 5 (Search/Discovery), 6 (Bidding), 12 (Pickup/BOL), 13 (Tracking), 14 (Delivery/ePOD), 15 (Payment), 17 (Ratings)

**This is the "wow" path:** Guest → Register → Post Load → Carrier Matches → Real-time Track → ePOD → Payment → Rate Each Other.

### 1.1 Guest Experience (Module 1)

**What exists:** Landing page with hero, value props, 3D visualizer, popular routes, rate calculator.

**What's needed:**
- **Public reviews section** on landing page — show 6-8 recent 5-star reviews with shipper/carrier avatars, route, and quote. Data from seeded reviews.
- **FAQ accordion** at bottom of landing page — 8-10 questions about how bookings, contracts, and payments work. Static content, `Disclosure` component from Headless UI.
- **Sample rates widget** — already have rate calculator; add "Popular Route Rates" card showing Manila→Cebu, Manila→Davao, Manila→Pampanga with estimated prices per truck type. No login required.
- **SMS app download link** — simple modal with phone number input and "Send Download Link" button. Demo: shows success toast, no actual SMS.

**Schema changes:** None.
**API changes:** None (use existing data).
**Files to create/modify:**
- Modify: `src/app/(public)/page.tsx` — add reviews section, FAQ, sample rates
- Create: `src/components/landing/PublicReviews.tsx`
- Create: `src/components/landing/FAQ.tsx`
- Create: `src/components/landing/SampleRates.tsx`
- Create: `src/components/landing/SMSDownloadModal.tsx`

### 1.2 Registration & Onboarding (Module 2)

**What exists:** Email/phone registration, role selection (SHIPPER/TRUCKER), basic onboarding.

**What's needed:**
- **Multi-step progressive onboarding** — don't force everything in one session
  - Step 1: Account creation (name, email/phone, OTP) ✅ exists
  - Step 2: Role selection ✅ exists
  - Step 3: Profile setup (role-specific)
    - Shipper: Business name, type (MSME/Enterprise), address, GCash number
    - Trucker: LTFRB certificate upload (UploadThing), truck registration (OR/CR upload), cargo insurance upload, truck photos, home base location, preferred regions
    - Driver: Professional license upload, linked fleet account (optional)
  - Step 4: Payment method setup (GCash number or bank account link)
- **Facebook login button** — UI only, shows "Coming soon" toast on click in demo
- **Language preference** — Filipino/English toggle in profile (UI only, content stays English)
- **Government ID upload** — UploadThing file upload with preview, instant "Verified ✓" badge in demo
- **Progress indicator** — show completion percentage, allow saving and resuming

**Schema changes:**
```prisma
model Document {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        DocumentType
  fileName    String
  fileUrl     String
  fileSize    Int
  status      DocumentStatus @default(PENDING)
  verifiedAt  DateTime?
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, type])
}

enum DocumentType {
  GOVERNMENT_ID
  LTFRB_CERTIFICATE
  VEHICLE_OR_CR
  CARGO_INSURANCE
  TRUCK_PHOTO
  DRIVER_LICENSE
  SEC_REGISTRATION
  BIR_TIN
  DELIVERY_PHOTO
  BOL_DOCUMENT
  EPOD_PHOTO
}

enum DocumentStatus {
  PENDING
  VERIFIED
  REJECTED
  EXPIRED
}
```

**Add to User model:**
```prisma
  preferredLanguage String @default("en")
  onboardingStep    Int    @default(0)
  documents         Document[]
```

**Add to TruckerProfile:**
```prisma
  homeBaseLat       Float?
  homeBaseLng       Float?
  preferredRegions  String[] // e.g., ["NCR", "CALABARZON", "Central Visayas"]
```

**API changes:**
- Create: `POST /api/uploadthing` — UploadThing route handler
- Modify: `PATCH /api/users/profile` — accept onboarding step, language, documents
- Create: `GET /api/documents` — list user's documents
- Create: `POST /api/documents/verify` — instant verify in demo mode

**Files to create/modify:**
- Create: `src/app/api/uploadthing/core.ts` — UploadThing file router (truck photos, IDs, certificates, ePOD, BOL)
- Create: `src/app/api/uploadthing/route.ts` — Next.js route handler
- Modify: `src/app/(auth)/onboarding/page.tsx` — multi-step with uploads
- Create: `src/components/onboarding/ShipperOnboarding.tsx`
- Create: `src/components/onboarding/TruckerOnboarding.tsx`
- Create: `src/components/onboarding/DriverOnboarding.tsx`
- Create: `src/components/uploads/FileUpload.tsx` — reusable UploadThing component
- Create: `src/components/uploads/DocumentCard.tsx` — show uploaded doc with status badge

### 1.3 Load Posting (Module 4)

**What exists:** Basic load posting form (origin, destination, cargo, weight, truck type, date).

**What's needed:**
- **Multi-drop support** — add "Add Stop" button for multiple delivery points in sequence
- **Special handling flags** — checkboxes: Fragile, Temperature-Controlled, Oversized, Hazardous
- **Rate estimate before posting** — call rate engine v2 and show estimated cost inline before submit
- **Budget cap** — "Maximum budget" input field
- **Document attachments** — UploadThing upload for PO, delivery instructions, product photos
- **Template save/load** — "Save as Template" button, "Load from Template" dropdown
- **Duplicate past load** — button on my-loads page to clone a previous posting
- **Cancel before confirmation** — delete button on OPEN loads
- **Truck ban warning** — if pickup time falls in MMDA window, show amber warning banner
- **LTL consolidation hint** — if cargo < 50% of truck capacity, show "Consider LTL?" suggestion
- **Backhaul request flag** — checkbox "This is a backhaul/return load" with discounted rate indicator

**Schema changes:**
Add to Load model:
```prisma
  specialHandling   String[]  // ["FRAGILE", "TEMPERATURE", "OVERSIZED", "HAZARDOUS"]
  maxBudget         Float?
  isBackhaulRequest Boolean   @default(false)
  templateName      String?   // if saved as template
  isTemplate        Boolean   @default(false)
  parentLoadId      String?   // if duplicated from another load
  documents         Document[]
```

New model for multi-drop:
```prisma
model LoadStop {
  id          String   @id @default(cuid())
  loadId      String
  load        Load     @relation(fields: [loadId], references: [id], onDelete: Cascade)
  sequence    Int
  address     String
  lat         Float
  lng         Float
  notes       String?
  createdAt   DateTime @default(now())

  @@index([loadId])
  @@unique([loadId, sequence])
}
```

**API changes:**
- Modify: `POST /api/loads` — accept multi-drop stops, special handling, budget, documents
- Create: `GET /api/loads/templates` — list saved templates for current shipper
- Create: `POST /api/loads/[id]/duplicate` — clone a load with new dates
- Modify: `DELETE /api/loads/[id]` — allow cancellation of OPEN loads

**Files to create/modify:**
- Modify: `src/app/(dashboard)/shipper/post-load/page.tsx` — add multi-drop, special handling, budget, truck ban check, LTL hint
- Create: `src/components/loads/MultiDropEditor.tsx` — add/remove/reorder delivery stops
- Create: `src/components/loads/SpecialHandlingSelector.tsx`
- Create: `src/components/loads/TruckBanWarning.tsx`
- Create: `src/components/loads/LTLSuggestion.tsx`
- Modify: `src/app/(dashboard)/shipper/my-loads/page.tsx` — add duplicate and template buttons

### 1.4 Search & Discovery (Module 5)

**What exists:** Trucker load browsing with city search, truck type filter, real-time SSE.

**What's needed for shippers:**
- **Carrier search page** — new page for shippers to browse available truckers
  - Filter by: route proximity, truck type, rating, completed trips, accreditation status
  - View carrier profile: truck photos, trip history, ratings, insurance coverage
  - "Invite to Bid" button
  - Experience tags (FMCG, construction, perishables)

**What's needed for truckers:**
- **Backhaul board search** — already exists at `/trucker/backhaul`, enhance with date/route filters
- **Cargo type filter** — add to available loads
- **Route alerts** — save preferred routes, get notified when matching load posted
- **Shipper reputation** — show shipper rating and history before accepting

**What's needed for drivers:**
- **Driver assignment view** — filtered list showing only loads assigned by fleet manager

**Schema changes:**
Add to TruckerProfile:
```prisma
  experienceTags    String[]  // ["FMCG", "CONSTRUCTION", "PERISHABLES", "ELECTRONICS"]
  completedTrips    Int       @default(0)
```

New model:
```prisma
model RouteAlert {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  originCity    String
  destCity      String
  truckType     TruckType?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([originCity, destCity])
}
```

**API changes:**
- Create: `GET /api/carriers` — search carriers with filters
- Create: `GET /api/carriers/[id]` — carrier public profile
- Create: `POST /api/route-alerts` — save route alert
- Create: `GET /api/route-alerts` — list user's alerts
- Modify: `GET /api/loads` — add cargo type filter, shipper rating data

**Files to create/modify:**
- Create: `src/app/(dashboard)/shipper/carriers/page.tsx` — carrier search
- Create: `src/app/(dashboard)/shipper/carriers/[id]/page.tsx` — carrier profile
- Create: `src/components/carriers/CarrierCard.tsx`
- Create: `src/components/carriers/CarrierFilters.tsx`
- Modify: `src/app/(dashboard)/trucker/available-loads/page.tsx` — add cargo type filter, shipper rating
- Create: `src/components/loads/RouteAlertButton.tsx`

### 1.5 Bidding & Rate Negotiation (Module 6)

**What exists:** Direct accept (trucker clicks "Accept" on a load). No bidding.

**What's needed:**
- **Bid submission** — trucker submits proposed rate + comments on a load
- **Bid dashboard for shipper** — view all bids side-by-side (rate, carrier profile, ETA)
- **Counter-offer flow** — shipper can counter a bid, trucker can accept/revise
- **Bidding deadline** — shipper sets deadline when posting
- **Direct invite** — shipper invites specific carriers to bid
- **Instant accept** — trucker can accept platform rate without bidding (existing flow)
- **Reject all & repost** — shipper can reject all bids and revise the load

**Schema changes:**
```prisma
model Bid {
  id            String    @id @default(cuid())
visua  loadId        String
  load          Load      @relation(fields: [loadId], references: [id], onDelete: Cascade)
  truckerId     String
  trucker       TruckerProfile @relation(fields: [truckerId], references: [id])
  proposedRate  Float
  comments      String?
  status        BidStatus @default(PENDING)
  counterRate   Float?    // shipper counter-offer
  counterNote   String?
  respondedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([loadId])
  @@index([truckerId])
}

enum BidStatus {
  PENDING
  ACCEPTED
  REJECTED
  COUNTERED
  WITHDRAWN
  EXPIRED
}
```

Add to Load:
```prisma
  biddingDeadline DateTime?
  bids            Bid[]
```

**API changes:**
- Create: `POST /api/loads/[id]/bids` — submit bid
- Create: `GET /api/loads/[id]/bids` — list bids on a load (shipper view)
- Create: `PATCH /api/bids/[id]` — accept/reject/counter a bid
- Create: `POST /api/loads/[id]/invite` — invite carrier to bid

**Files to create/modify:**
- Create: `src/app/(dashboard)/shipper/loads/[id]/bids/page.tsx` — bid comparison view
- Create: `src/components/bids/BidCard.tsx`
- Create: `src/components/bids/BidForm.tsx`
- Create: `src/components/bids/CounterOfferModal.tsx`
- Modify: `src/app/(dashboard)/trucker/available-loads/page.tsx` — add "Place Bid" alongside "Accept"

### 1.6 Pickup & Bill of Lading (Module 12)

**What exists:** Basic booking detail with status transitions. No BOL.

**What's needed:**
- **Digital BOL generation** — auto-generated when driver arrives at pickup
  - Contains: trip reference, cargo description, declared value, seal number, special instructions
  - Pre-loading cargo photos attached via UploadThing
  - Cargo discrepancy notes field
- **Digital signature** — shipper signs BOL on driver's device (canvas signature pad)
- **BOL copy distribution** — instant copy to shipper and consignee
- **Refusal flag** — driver can flag cargo mismatch and trigger alert
- **Consignee notification** — send ETA + BOL details to consignee phone (demo: show notification in UI)

**Schema changes:**
```prisma
model BillOfLading {
  id              String   @id @default(cuid())
  bookingId       String   @unique
  booking         Booking  @relation(fields: [bookingId], references: [id])
  referenceNumber String   @unique
  cargoDescription String
  declaredValue   Float?
  sealNumber      String?
  specialInstructions String?
  discrepancyNotes String?
  shipperSignature String?  // base64 signature image
  signedAt        DateTime?
  preLoadPhotos   String[]  // UploadThing URLs
  status          BOLStatus @default(DRAFT)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum BOLStatus {
  DRAFT
  SIGNED
  DISPUTED
}
```

**API changes:**
- Create: `POST /api/bookings/[id]/bol` — generate BOL
- Create: `PATCH /api/bookings/[id]/bol` — update BOL (add photos, sign, add notes)
- Create: `GET /api/bookings/[id]/bol` — get BOL data

**Files to create/modify:**
- Create: `src/components/bookings/BillOfLading.tsx` — BOL display/form
- Create: `src/components/bookings/SignaturePad.tsx` — canvas signature capture
- Create: `src/components/bookings/CargoPhotoUpload.tsx` — pre-loading photos
- Modify: `src/app/(dashboard)/trucker/booking/[id]/page.tsx` — add BOL section at pickup stage
- Modify: `src/app/(dashboard)/shipper/booking/[id]/page.tsx` — show BOL copy

### 1.7 In-Transit Tracking (Module 13)

**What exists:** GPS tracking infrastructure (TrackingPoint model, Redis cache, SSE), basic map component.

**What's needed:**
- **Live GPS map with real-time updates** — shipper sees truck moving on map via SSE
- **Shareable tracking link** — public URL `/track/[bookingId]` that works without login
- **Automated ETA updates** — calculate remaining distance, show countdown
- **Driver incident reporting** — breakdown/delay/road closure quick-report buttons
- **Route deviation alert** — if truck deviates >5km from expected route, alert shipper
- **In-app messaging** — already exists, needs SSE wiring for real-time
- **Turn-by-turn with truck ban awareness** — show truck ban zones on map (UI overlay)
- **Fleet map** — fleet manager sees all active trucks on single map
- **Long stop alert** — alert if truck stops >2 hours unexpectedly
- **RO-RO ferry tracking** — show ferry leg on tracking map (for interisland)

**Schema changes:**
```prisma
model IncidentReport {
  id          String       @id @default(cuid())
  bookingId   String
  booking     Booking      @relation(fields: [bookingId], references: [id])
  type        IncidentType
  description String?
  lat         Float?
  lng         Float?
  resolvedAt  DateTime?
  createdAt   DateTime     @default(now())

  @@index([bookingId])
}

enum IncidentType {
  BREAKDOWN
  ROAD_CLOSURE
  TRAFFIC_DELAY
  WEATHER
  ACCIDENT
  OTHER
}
```

**API changes:**
- Create: `GET /api/track/[bookingId]` — public tracking endpoint (no auth)
- Create: `POST /api/bookings/[id]/incidents` — report incident
- Modify: `GET /api/bookings/[id]/tracking` — add ETA calculation
- Create: `GET /api/fleet/map` — all active trucks for fleet manager

**Files to create/modify:**
- Create: `src/app/(public)/track/[id]/page.tsx` — public tracking page
- Create: `src/components/tracking/LiveTrackingMap.tsx` — real-time map with SSE
- Create: `src/components/tracking/ETADisplay.tsx`
- Create: `src/components/tracking/IncidentReportButton.tsx`
- Create: `src/components/tracking/RouteDeviationAlert.tsx`
- Create: `src/app/(dashboard)/trucker/fleet-map/page.tsx` — fleet overview
- Modify: `src/app/(dashboard)/shipper/booking/[id]/page.tsx` — integrate live tracking
- Modify: `src/app/(dashboard)/trucker/booking/[id]/page.tsx` — add incident reporting

### 1.8 Delivery & ePOD (Module 14)

**What exists:** ePOD upload (base64 data URL), basic delivery confirmation.

**What's needed:**
- **Replace base64 with UploadThing** — proper file storage for delivery photos
- **Cargo inspection flow** — consignee inspects before signing, adds damage notes + photos
- **Digital signature** — consignee signs ePOD on driver's device (reuse SignaturePad)
- **GPS + timestamp stamp** — auto-stamp ePOD with location and time
- **Partial acceptance** — consignee can flag missing items
- **Failed delivery** — driver records failed attempt with reason
- **ePOD PDF generation** — auto-generate PDF with photos for shipper records
- **Mandatory sign** — prevent "Mark Delivered" without consignee signature

**Schema changes:**
Add to Booking:
```prisma
  epodSignature       String?   // base64 consignee signature
  epodDamageNotes     String?
  epodDamagePhotos    String[]  // UploadThing URLs
  epodMissingItems    String?
  epodDeliveryStatus  DeliveryStatus @default(FULL)
  failedDeliveryReason String?
  failedDeliveryAt    DateTime?
```

```prisma
enum DeliveryStatus {
  FULL
  PARTIAL
  REFUSED
  FAILED
}
```

**API changes:**
- Modify: `POST /api/bookings/[id]/epod` — accept UploadThing URLs, signature, damage notes
- Create: `GET /api/bookings/[id]/epod/pdf` — generate ePOD PDF

**Files to create/modify:**
- Create: `src/components/bookings/EPODFlow.tsx` — multi-step: inspect → sign → confirm
- Create: `src/components/bookings/DamageReport.tsx` — damage notes + photos
- Create: `src/components/bookings/FailedDelivery.tsx`
- Modify: `src/app/(dashboard)/trucker/booking/[id]/page.tsx` — replace basic ePOD with full flow

### 1.9 Payment & Settlement (Module 15)

**What exists:** No payment integration. Rate calculation only.

**What's needed (Demo: Simulated with Realistic UI):**
- **GCash payment UI** — realistic checkout screen showing:
  - Charge breakdown: freight rate + platform fee + insurance (if selected) + accessorial charges
  - GCash/bank account selector
  - "Pay ₱X" button → instant success with "Demo: Auto-approved" badge
- **Escrow hold simulation** — show "Funds held in escrow" status on booking
- **Carrier payout UI** — after ePOD confirmation, show "₱X released to GCash" with 24hr countdown
  - Payout amount = agreed rate - platform commission
  - Show exact net earnings before accepting load
- **Payment history** — shipper sees all payments; carrier sees all earnings
- **Cash advance** — carrier can request advance on confirmed trips (demo: instant approval)
- **Receipts** — auto-generate payment receipt with BIR-style formatting

**Schema changes:**
```prisma
model Payment {
  id              String        @id @default(cuid())
  bookingId       String
  booking         Booking       @relation(fields: [bookingId], references: [id])
  payerId         String
  payeeId         String
  amount          Float
  platformFee     Float
  netAmount       Float
  method          PaymentMethod
  status          PaymentStatus @default(PENDING)
  escrowHeldAt    DateTime?
  escrowReleasedAt DateTime?
  receiptNumber   String?       @unique
  metadata        Json?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([bookingId])
  @@index([payerId])
  @@index([payeeId])
}

enum PaymentMethod {
  GCASH
  BANK_TRANSFER
  CORPORATE_CREDIT
  CASH_ON_DELIVERY
}

enum PaymentStatus {
  PENDING
  ESCROW_HELD
  RELEASED
  REFUNDED
  FAILED
}
```

**API changes:**
- Create: `POST /api/bookings/[id]/pay` — simulate payment (instant success)
- Create: `GET /api/payments` — payment history
- Create: `GET /api/payments/[id]/receipt` — generate receipt
- Create: `POST /api/payments/[id]/advance` — cash advance request (instant)
- Create: `GET /api/earnings` — carrier earnings dashboard data

**Files to create/modify:**
- Create: `src/app/(dashboard)/shipper/payments/page.tsx` — payment history
- Create: `src/app/(dashboard)/trucker/earnings/page.tsx` — earnings dashboard
- Create: `src/components/payments/CheckoutFlow.tsx` — GCash-style payment UI
- Create: `src/components/payments/PayoutCard.tsx` — payout status/timeline
- Create: `src/components/payments/EscrowBadge.tsx`
- Create: `src/components/payments/Receipt.tsx`
- Create: `src/components/payments/CashAdvanceModal.tsx`

### 1.10 Ratings & Reviews (Module 17)

**What exists:** No rating system.

**What's needed:**
- **Multi-dimensional ratings** — after each completed trip, both parties rate:
  - On-time, Cargo Care, Communication, Professionalism (1-5 stars each)
  - Written review (optional)
- **Review response** — rated party can respond publicly
- **Review display** — show on carrier/shipper profiles
- **Report fraudulent review** — flag button
- **Aggregate score** — weighted average across dimensions
- **Admin alert** — when rating drops below 3.0 threshold

**Schema changes:**
```prisma
model Review {
  id              String   @id @default(cuid())
  bookingId       String
  booking         Booking  @relation(fields: [bookingId], references: [id])
  reviewerId      String
  reviewer        User     @relation("ReviewsGiven", fields: [reviewerId], references: [id])
  revieweeId      String
  reviewee        User     @relation("ReviewsReceived", fields: [revieweeId], references: [id])
  onTimeRating    Int      // 1-5
  cargoCareRating Int      // 1-5
  communicationRating Int  // 1-5
  professionalismRating Int // 1-5
  overallRating   Float    // computed average
  comment         String?
  response        String?
  respondedAt     DateTime?
  isFlagged       Boolean  @default(false)
  flagReason      String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([bookingId, reviewerId])
  @@index([revieweeId])
}
```

**API changes:**
- Create: `POST /api/bookings/[id]/review` — submit review
- Create: `GET /api/users/[id]/reviews` — get reviews for a user
- Create: `PATCH /api/reviews/[id]/respond` — add response to review
- Create: `POST /api/reviews/[id]/flag` — report review

**Files to create/modify:**
- Create: `src/components/reviews/ReviewForm.tsx` — multi-dimension star rating
- Create: `src/components/reviews/ReviewCard.tsx` — display with response
- Create: `src/components/reviews/ReviewSummary.tsx` — aggregate score display
- Create: `src/components/reviews/StarRating.tsx` — reusable star component
- Modify: `src/app/(dashboard)/shipper/booking/[id]/page.tsx` — add review prompt after COMPLETED
- Modify: `src/app/(dashboard)/trucker/booking/[id]/page.tsx` — add review prompt after COMPLETED

---

## Phase 2 — Marketplace Depth

**Modules covered:** 3 (Profile Management), 8 (Backhaul), 9 (LTL Consolidation), 10 (RO-RO Interisland), 11 (Contracts/Documents)

### 2.1 Profile & Account Management (Module 3)

**What exists:** Basic profile page shell, profile API.

**What's needed:**
- **Full profile editor** — role-aware form with all fields
- **Truck management** — add/edit/deactivate trucks with photo uploads
- **Document renewal reminders** — show 30-day expiry warnings for LTFRB, OR/CR
- **Saved addresses** — favorite pickup/delivery locations
- **Saved carriers** — shipper can bookmark preferred carriers for quick rebooking
- **Account deactivation** — temporary pause without deletion
- **Notification preferences** — toggle push/SMS/email per event type

**Schema changes:**
```prisma
model SavedAddress {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  label     String   // "Warehouse A", "Main Office"
  address   String
  lat       Float
  lng       Float
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId])
}

model SavedCarrier {
  id          String   @id @default(cuid())
  shipperId   String
  carrierId   String
  notes       String?
  createdAt   DateTime @default(now())

  @@unique([shipperId, carrierId])
}

model NotificationPreference {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  push      Json     // { "booking_confirmed": true, "delivery_complete": true, ... }
  sms       Json
  email     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Add to User:
```prisma
  isActive          Boolean  @default(true)
  deactivatedAt     DateTime?
  savedAddresses    SavedAddress[]
  notificationPref  NotificationPreference?
```

**Files to create/modify:**
- Rewrite: `src/app/(dashboard)/profile/page.tsx` — full-featured profile editor
- Create: `src/components/profile/TruckManager.tsx` — add/edit/remove trucks
- Create: `src/components/profile/DocumentManager.tsx` — upload/renew documents
- Create: `src/components/profile/SavedAddresses.tsx`
- Create: `src/components/profile/NotificationPreferences.tsx`
- Create: `src/app/(dashboard)/shipper/saved-carriers/page.tsx`

### 2.2 Backhaul Marketplace Enhancement (Module 8)

**What exists:** Basic backhaul post/browse at `/trucker/backhaul`.

**What's needed:**
- **Discounted rate display** — clearly show savings vs standard rate
- **Partial backhaul** — prorated rate for less-than-full-truck
- **Auto-suggest** — after delivery completion, suggest backhaul loads on return route
- **Bulk posting** — fleet manager posts all return legs at once
- **Shipper backhaul browse** — new page for shippers to find discounted backhaul capacity

**Files to create/modify:**
- Modify: `src/app/(dashboard)/trucker/backhaul/page.tsx` — enhanced UI with discounts, auto-suggest
- Create: `src/app/(dashboard)/shipper/backhaul/page.tsx` — shipper backhaul search
- Create: `src/components/backhaul/BackhaulSuggestion.tsx` — post-delivery suggestion card
- Create: `src/components/backhaul/BulkPostForm.tsx` — fleet bulk posting

### 2.3 LTL Consolidation (Module 9)

**What exists:** OpenAI integration stub, LTL hint in rate engine.

**What's needed:**
- **Consolidation matching** — detect loads going same direction around same time
- **Opt-in flow** — shipper sees "Save ₱X by consolidating" and can join
- **Rate splitting** — prorated cost per shipper based on space used
- **Separate BOL** — each shipper in consolidated load gets own BOL
- **Carrier manifest** — single view of all cargo items across consolidated shippers

**Schema changes:**
```prisma
model ConsolidatedLoad {
  id            String   @id @default(cuid())
  masterLoadId  String   @unique
  masterLoad    Load     @relation("MasterLoad", fields: [masterLoadId], references: [id])
  childLoads    Load[]   @relation("ConsolidatedChild")
  totalWeight   Float
  totalRate     Float
  status        LoadStatus @default(OPEN)
  createdAt     DateTime @default(now())
}
```

Add to Load:
```prisma
  consolidatedLoadId  String?
  consolidatedLoad    ConsolidatedLoad? @relation("ConsolidatedChild", fields: [consolidatedLoadId], references: [id])
```

**Files to create/modify:**
- Create: `src/components/loads/ConsolidationOffer.tsx` — opt-in card with savings
- Create: `src/app/api/loads/consolidate/route.ts` — matching and consolidation API
- Modify: `src/app/(dashboard)/shipper/post-load/page.tsx` — show consolidation offers

### 2.4 RO-RO Interisland Booking (Module 10)

**What exists:** Philippine routes with RO-RO data in `philippine-routes.ts`, rate engine v2 handles ferry pricing.

**What's needed:**
- **End-to-end booking** — single transaction for trucking + ferry legs
- **Ferry schedule display** — show available RO-RO slots when booking interisland
- **Combined rate quote** — trucking + ferry in one price
- **Ferry leg tracking** — show sailing progress on tracking map
- **Ferry delay notification** — alert if ferry cancelled/delayed

**Schema changes:**
Add to Booking:
```prisma
  ferryRouteId    String?
  ferryDeparture  DateTime?
  ferryArrival    DateTime?
  ferryStatus     String?   // "BOOKED", "BOARDING", "SAILING", "ARRIVED"
```

**Files to create/modify:**
- Create: `src/components/bookings/FerrySchedule.tsx` — RO-RO slot picker
- Create: `src/components/tracking/FerryTracking.tsx` — ferry leg visualization
- Modify: rate calculator and booking flow to show combined rate for interisland routes

### 2.5 Contracts & Document Management (Module 11)

**What exists:** No contract system.

**What's needed:**
- **Load Confirmation document** — auto-generated at booking confirmation
- **Carrier-Shipper Agreement** — for recurring contract lanes
  - Includes fuel surcharge adjustment clause
  - E-sign with OTP/fingerprint (demo: signature pad)
- **Document library** — filter by carrier, route, date
- **Contract termination** — with notice period and audit trail
- **Send for review** — email to legal team (demo: toast notification)

**Schema changes:**
```prisma
model ContractLane {
  id              String   @id @default(cuid())
  shipperId       String
  shipper         ShipperProfile @relation(fields: [shipperId], references: [id])
  truckerId       String
  trucker         TruckerProfile @relation(fields: [truckerId], references: [id])
  originCity      String
  destCity        String
  agreedRate      Float
  fuelSurchargeFormula String?
  startDate       DateTime
  endDate         DateTime
  noticePeriodDays Int     @default(30)
  status          ContractStatus @default(ACTIVE)
  signedByShipper DateTime?
  signedByTrucker DateTime?
  terminatedAt    DateTime?
  terminationReason String?
  documentUrl     String?  // PDF URL from UploadThing
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([shipperId])
  @@index([truckerId])
}

enum ContractStatus {
  DRAFT
  PENDING_SIGNATURE
  ACTIVE
  TERMINATED
  EXPIRED
}
```

**Files to create/modify:**
- Create: `src/app/(dashboard)/contracts/page.tsx` — contract library
- Create: `src/app/(dashboard)/contracts/[id]/page.tsx` — contract detail/sign
- Create: `src/app/(dashboard)/contracts/new/page.tsx` — create contract lane
- Create: `src/components/contracts/ContractForm.tsx`
- Create: `src/components/contracts/ContractSignFlow.tsx`
- Create: `src/components/contracts/LoadConfirmation.tsx` — auto-generated doc

---

## Phase 3 — Operations & Trust

**Modules covered:** 7 (Truck Bans), 16 (Insurance), 18 (Notifications), 19 (Disputes), 20 (Cancellations), 21 (Subscriptions), 22 (Analytics)

### 3.1 Truck Ban Scheduling (Module 7)

**What exists:** TruckBanWindow model, truck-bans API, basic ban check in rate engine.

**What's needed:**
- **Visual ban schedule** — calendar/timeline view of active bans per zone
- **Compliant time suggestion** — auto-suggest nearest available window
- **Live conflict flagging** — driver can flag ban conflict during trip
- **Admin ban management** — CRUD for MMDA and LGU ban windows
- **Carrier field reports** — report new/changed bans from the road

**Files to create/modify:**
- Create: `src/components/truck-bans/BanScheduleViewer.tsx` — visual timeline
- Create: `src/components/truck-bans/CompliantTimeSuggester.tsx`
- Modify: `src/app/(dashboard)/admin/page.tsx` — add ban management section

### 3.2 Insurance (Module 16)

**What exists:** No insurance.

**What's needed (Demo: Realistic UI):**
- **Insurance upsell** — during checkout, show Basic vs Comprehensive tiers
- **Premium calculation** — based on declared cargo value
- **Claim filing** — form with ePOD evidence + written description
- **Carrier insurance certificate** — upload to profile via UploadThing

**Schema changes:**
```prisma
model InsurancePolicy {
  id            String   @id @default(cuid())
  bookingId     String   @unique
  booking       Booking  @relation(fields: [bookingId], references: [id])
  tier          InsuranceTier
  declaredValue Float
  premium       Float
  coverageMax   Float
  status        InsuranceStatus @default(ACTIVE)
  claimFiledAt  DateTime?
  claimNotes    String?
  claimPhotos   String[]
  claimStatus   String?
  createdAt     DateTime @default(now())

  @@index([bookingId])
}

enum InsuranceTier {
  BASIC
  COMPREHENSIVE
}

enum InsuranceStatus {
  ACTIVE
  CLAIMED
  EXPIRED
  VOID
}
```

**Files to create/modify:**
- Create: `src/components/insurance/InsuranceUpsell.tsx` — tier selection during checkout
- Create: `src/components/insurance/ClaimForm.tsx` — file claim with evidence
- Create: `src/app/(dashboard)/insurance/page.tsx` — policy overview
- Create: `src/app/api/insurance/route.ts` — CRUD for policies
- Create: `src/app/api/insurance/[id]/claim/route.ts` — file claim

### 3.3 Notifications (Module 18)

**What exists:** No notification system (SSE for messages and loads only).

**What's needed:**
- **Notification center** — bell icon in nav with badge count
- **In-app notifications** — for all key events (booking confirmed, driver en route, delivery complete, payout sent)
- **SMS simulation** — show "SMS sent to +63..." toast (no actual SMS in demo)
- **Notification preferences** — per-event-type toggles (push/SMS/email)
- **Document expiry alerts** — 30-day reminder for LTFRB, OR/CR
- **Trip reminders** — 24h before scheduled pickup

**Schema changes:**
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   // "BOOKING_CONFIRMED", "DRIVER_EN_ROUTE", "DELIVERY_COMPLETE", etc.
  title     String
  body      String
  data      Json?    // { bookingId, loadId, etc. }
  isRead    Boolean  @default(false)
  channel   String   @default("IN_APP") // "IN_APP", "SMS", "EMAIL"
  createdAt DateTime @default(now())

  @@index([userId, isRead])
  @@index([userId, createdAt])
}
```

**Files to create/modify:**
- Create: `src/components/notifications/NotificationBell.tsx` — nav bell with badge
- Create: `src/components/notifications/NotificationPanel.tsx` — dropdown list
- Create: `src/app/api/notifications/route.ts` — CRUD + mark read
- Create: `src/app/api/notifications/stream/route.ts` — SSE for real-time notifications
- Create: `src/lib/notifications.ts` — helper to create notifications from events

### 3.4 Disputes & Claims (Module 19)

**What exists:** DISPUTED booking status in state machine.

**What's needed:**
- **Dispute filing form** — within 48h of delivery, submit with evidence
- **Dispute types** — cargo damage, late delivery, detention fee, cargo misrepresentation, no-show
- **Evidence submission** — photos, chat screenshots, GPS logs (from existing data)
- **Counter-evidence** — other party submits response with own evidence
- **Status tracking** — OPEN → UNDER_REVIEW → RESOLVED / APPEALED
- **Admin dispute queue** — prioritized by age and value
- **Escrow hold** — show "Funds held pending dispute resolution" badge

**Schema changes:**
```prisma
model Dispute {
  id              String        @id @default(cuid())
  bookingId       String
  booking         Booking       @relation(fields: [bookingId], references: [id])
  filedById       String
  filedBy         User          @relation("DisputesFiled", fields: [filedById], references: [id])
  type            DisputeType
  description     String
  evidencePhotos  String[]
  evidenceNotes   String?
  counterEvidence String?
  counterPhotos   String[]
  status          DisputeStatus @default(OPEN)
  resolution      String?
  resolvedById    String?
  resolvedBy      User?         @relation("DisputesResolved", fields: [resolvedById], references: [id])
  resolvedAt      DateTime?
  appealedAt      DateTime?
  appealReason    String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([bookingId])
  @@index([status])
}

enum DisputeType {
  CARGO_DAMAGE
  LATE_DELIVERY
  DETENTION_FEE
  CARGO_MISREPRESENTATION
  NO_SHOW
  OTHER
}

enum DisputeStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED
  APPEALED
  CLOSED
}
```

**Files to create/modify:**
- Create: `src/app/(dashboard)/disputes/page.tsx` — my disputes list
- Create: `src/app/(dashboard)/disputes/[id]/page.tsx` — dispute detail
- Create: `src/app/(dashboard)/disputes/new/page.tsx` — file dispute form
- Create: `src/components/disputes/DisputeForm.tsx`
- Create: `src/components/disputes/EvidenceUpload.tsx`
- Create: `src/components/disputes/DisputeTimeline.tsx`
- Create: `src/app/(dashboard)/admin/disputes/page.tsx` — admin queue
- Create: `src/app/api/disputes/route.ts` — CRUD
- Create: `src/app/api/disputes/[id]/resolve/route.ts` — admin resolution

### 3.5 Cancellations & No-Shows (Module 20)

**What exists:** CANCELLED status in booking state machine.

**What's needed:**
- **Cancellation policy display** — clear rules before booking confirmation
- **Time-based penalties** — no penalty if cancelled early, fee if cancelled late
- **Auto-refund** — instant GCash refund on carrier cancellation (demo: instant)
- **Alternative carrier suggestion** — when booking cancelled, show available carriers
- **Cancellation tracking** — admin monitors cancellation rates per user

**Schema changes:**
```prisma
model CancellationLog {
  id              String   @id @default(cuid())
  bookingId       String
  booking         Booking  @relation(fields: [bookingId], references: [id])
  cancelledById   String
  cancelledBy     User     @relation(fields: [cancelledById], references: [id])
  reason          String
  penaltyAmount   Float    @default(0)
  isWaived        Boolean  @default(false)
  refundStatus    String?  // "PENDING", "COMPLETED"
  createdAt       DateTime @default(now())

  @@index([bookingId])
  @@index([cancelledById])
}
```

**Files to create/modify:**
- Create: `src/components/bookings/CancellationFlow.tsx` — reason + policy display
- Create: `src/components/bookings/AlternativeCarriers.tsx` — suggestions after cancel
- Modify: booking status API to create CancellationLog on cancel

### 3.6 Subscriptions & Fleet Plans (Module 21)

**What exists:** No subscription system.

**What's needed (Demo: UI only):**
- **Plan selection page** — 3 tiers: Free, Fleet Pro (₱2,999/mo), Enterprise (custom)
- **Fleet dashboard** — all trucks, drivers, trips, earnings in one view
- **Priority badge** — "Fleet Pro" badge on subscribed carriers in search results
- **Subscription management** — upgrade/downgrade/cancel in settings

**Schema changes:**
```prisma
model Subscription {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  plan        SubscriptionPlan
  status      SubscriptionStatus @default(ACTIVE)
  startDate   DateTime @default(now())
  endDate     DateTime?
  amount      Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum SubscriptionPlan {
  FREE
  FLEET_PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  TRIAL
}
```

**Files to create/modify:**
- Create: `src/app/(dashboard)/subscription/page.tsx` — plan selection/management
- Create: `src/components/subscription/PlanCard.tsx` — pricing card
- Create: `src/components/subscription/FleetDashboard.tsx` — fleet overview

### 3.7 Analytics & Reporting (Module 22)

**What exists:** Admin stats API with basic aggregates.

**What's needed:**
- **Shipper analytics** — spend per month by carrier/route/cargo, on-time delivery rates, CSV export
- **Carrier analytics** — earnings per week/month, utilization rates, revenue per km
- **Fleet analytics** — per-truck performance, idle days, backhaul ratio
- **Admin analytics** — GMV, active users, take rate, dispute rates, corridor heatmap
- **CSV export** — all reports downloadable

**Files to create/modify:**
- Create: `src/app/(dashboard)/shipper/analytics/page.tsx` — shipper dashboard
- Create: `src/app/(dashboard)/trucker/analytics/page.tsx` — carrier dashboard
- Create: `src/app/(dashboard)/admin/analytics/page.tsx` — platform dashboard
- Create: `src/components/analytics/SpendChart.tsx`
- Create: `src/components/analytics/EarningsChart.tsx`
- Create: `src/components/analytics/UtilizationChart.tsx`
- Create: `src/components/analytics/CorridorHeatmap.tsx`
- Create: `src/app/api/analytics/shipper/route.ts`
- Create: `src/app/api/analytics/trucker/route.ts`
- Create: `src/app/api/analytics/export/route.ts` — CSV generation

---

## Phase 4 — Growth & Edge Cases

**Modules covered:** 23 (Admin Panel), 24 (Compliance), 25 (Support), 26 (Referrals), 27 (Offline)

### 4.1 Admin Panel Enhancement (Module 23)

**What exists:** Basic admin with user list, booking list, stats.

**What's needed:**
- **Registration approval queue** — review carrier docs, approve/reject
- **Re-verification trigger** — manually request re-verification
- **Account suspension** — suspend/ban with recorded reason
- **Full transaction history** — per-user view of all activity
- **Payout override** — manually release escrow in edge cases
- **Commission management** — adjust rates per booking type
- **Broadcast notifications** — send to all users or segments
- **Blacklisted cargo** — manage prohibited items list
- **Promo codes** — create and manage discount campaigns

**Files to create/modify:**
- Modify: `src/app/(dashboard)/admin/page.tsx` — enhanced dashboard
- Create: `src/app/(dashboard)/admin/approvals/page.tsx` — registration queue
- Create: `src/app/(dashboard)/admin/promos/page.tsx` — promo management
- Create: `src/app/(dashboard)/admin/broadcast/page.tsx` — notification sender
- Create: `src/components/admin/ApprovalCard.tsx`
- Create: `src/components/admin/UserDetailPanel.tsx`
- Create: various admin API routes

### 4.2 Compliance Officer (Module 24)

**What exists:** No compliance features.

**What's needed:**
- **Expiry queue** — documents approaching expiry (30-day window)
- **LTFRB cross-reference** — UI to check against public registry (demo: manual verify button)
- **OR/CR photo match** — side-by-side doc vs truck photo comparison
- **Audit trail** — log every document review action
- **Daily expired docs report** — auto-generated morning report
- **Document type management** — manage required docs per vehicle class

**Files to create/modify:**
- Create: `src/app/(dashboard)/admin/compliance/page.tsx` — compliance dashboard
- Create: `src/components/compliance/ExpiryQueue.tsx`
- Create: `src/components/compliance/DocumentReview.tsx` — side-by-side review
- Create: `src/components/compliance/AuditLog.tsx`

### 4.3 Support & Help (Module 25)

**What exists:** No support system.

**What's needed:**
- **Help center** — FAQ page with search (static content, Disclosure components)
- **In-app chat** — support ticket via messaging (reuse ChatWindow)
- **Ticket tracking** — submit and track support tickets
- **Report user** — flag misconduct from any profile
- **Filipino language default** — for support content

**Files to create/modify:**
- Create: `src/app/(public)/help/page.tsx` — help center with FAQ
- Create: `src/app/(dashboard)/support/page.tsx` — my tickets
- Create: `src/app/(dashboard)/support/new/page.tsx` — new ticket form
- Create: `src/components/support/TicketCard.tsx`
- Create: `src/components/support/ReportUserModal.tsx`

### 4.4 Referral & Growth (Module 26)

**What exists:** No referral system.

**What's needed:**
- **Referral code generation** — unique code per user
- **Referral tracking** — see who signed up and completed first trip
- **Bonus display** — show earned bonuses (carrier: ₱500, shipper: ₱200 credit)
- **Fleet bulk referral** — single link for all trucks

**Schema changes:**
```prisma
model ReferralCode {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  code        String   @unique
  usageCount  Int      @default(0)
  totalBonus  Float    @default(0)
  createdAt   DateTime @default(now())
}

model Referral {
  id            String   @id @default(cuid())
  referrerId    String
  referredId    String
  code          String
  bonusAmount   Float
  bonusPaidAt   DateTime?
  firstTripAt   DateTime?
  createdAt     DateTime @default(now())

  @@unique([referrerId, referredId])
}
```

**Files to create/modify:**
- Create: `src/app/(dashboard)/referrals/page.tsx` — referral dashboard
- Create: `src/components/referrals/ReferralCard.tsx`
- Create: `src/components/referrals/ShareCode.tsx`
- Create: `src/app/api/referrals/route.ts`

### 4.5 Offline & Low-Connectivity (Module 27)

**What exists:** No offline support.

**What's needed (Demo: Simulated):**
- **Trip caching** — show "Offline Mode" banner with cached trip details
- **Offline ePOD** — queue ePOD for sync when connected (demo: instant with banner)
- **SMS fallback UI** — show "SMS sent" toasts for critical updates
- **Messenger bot mockup** — static page showing what the bot conversation looks like
- **Basic phone SMS confirmation** — UI showing SMS reply flow

**Files to create/modify:**
- Create: `src/components/offline/OfflineBanner.tsx`
- Create: `src/components/offline/OfflineEPOD.tsx`
- Create: `src/app/(public)/messenger-demo/page.tsx` — mockup of Messenger bot

---

## Database Migration Summary

### New Models (10)
1. `Document` — file uploads with verification status
2. `Bid` — load bidding system
3. `BillOfLading` — digital BOL
4. `IncidentReport` — in-transit incident reporting
5. `Payment` — payment/escrow tracking
6. `Review` — multi-dimensional ratings
7. `Dispute` — claims and disputes
8. `InsurancePolicy` — per-booking insurance
9. `ContractLane` — recurring route agreements
10. `Notification` — in-app notification center

### New Models (Growth - 6)
11. `ConsolidatedLoad` — LTL consolidation
12. `SavedAddress` — favorite locations
13. `SavedCarrier` — bookmarked carriers
14. `Subscription` — fleet plans
15. `ReferralCode` — referral program
16. `Referral` — referral tracking

### Extended Models (6)
17. `CancellationLog` — cancellation audit
18. `NotificationPreference` — per-event notification settings
19. `RouteAlert` — saved route notifications
20. `LoadStop` — multi-drop delivery points

### Modified Existing Models
- `User` — add preferredLanguage, onboardingStep, isActive, relations
- `Load` — add specialHandling, maxBudget, isBackhaulRequest, templateName, biddingDeadline
- `Booking` — add ferry fields, ePOD enhancement fields, delivery status
- `TruckerProfile` — add homeBase, preferredRegions, experienceTags, completedTrips

### New Enums (15)
DocumentType, DocumentStatus, BidStatus, BOLStatus, IncidentType, PaymentMethod, PaymentStatus, InsuranceTier, InsuranceStatus, DisputeType, DisputeStatus, ContractStatus, SubscriptionPlan, SubscriptionStatus, DeliveryStatus

---

## New Pages Summary

### Phase 1 (15 new pages/major modifications)
1. Landing page enhancements (reviews, FAQ, sample rates)
2. Multi-step onboarding (shipper/trucker/driver flows)
3. Enhanced load posting (multi-drop, special handling)
4. Carrier search (shipper)
5. Carrier profile page
6. Bid comparison view
7. Public tracking page
8. Fleet map
9. Shipper payments page
10. Trucker earnings page
11. Enhanced booking details (BOL, ePOD flow, review)

### Phase 2 (8 new pages)
12. Full profile editor
13. Shipper backhaul browse
14. Contract library
15. Contract detail/sign
16. Create contract

### Phase 3 (10 new pages)
17. Shipper analytics
18. Trucker analytics
19. Admin analytics
20. Subscription management
21. Disputes list/detail/create
22. Insurance overview

### Phase 4 (8 new pages)
23. Admin approvals queue
24. Compliance dashboard
25. Help center
26. Support tickets
27. Referral dashboard
28. Messenger demo mockup

**Total: ~41 new pages/major modifications across 4 phases**

---

## Seed Data Requirements

For the demo to work impressively, seed data needs:
- **5 shipper accounts** — various business types (MSME, enterprise, individual)
- **8 trucker accounts** — with different truck types, ratings, experience tags
- **3 fleet manager accounts** — with 3-5 trucks each
- **20+ completed bookings** — across popular routes with full lifecycle data
- **50+ reviews** — multi-dimensional, realistic comments
- **10 active loads** — for demo browsing
- **5 backhaul offers** — on popular return routes
- **3 active disputes** — at different stages
- **Sample documents** — uploaded to UploadThing (placeholder images)
- **Payment records** — with realistic amounts
- **Notification history** — showing typical activity

---

## Implementation Order

**Phase 1 tasks (in dependency order):**
1. UploadThing setup (foundation for all uploads)
2. Prisma schema migration (all new models)
3. Document upload components
4. Enhanced onboarding flow
5. Load posting enhancements
6. Bidding system
7. Carrier search
8. BOL generation
9. Live tracking improvements
10. ePOD flow enhancement
11. Payment simulation
12. Rating system
13. Landing page enhancements
14. Seed data expansion
15. E2E test updates

**Phase 2-4 follow sequentially after Phase 1 is solid.**

---

## Success Criteria

The demo is complete when a user can:
1. ✅ Land on homepage, see reviews, rates, FAQ, 3D visualizer
2. ✅ Register as shipper or trucker with document uploads
3. ✅ Post a load with multi-drop, special handling, and budget
4. ✅ Browse and bid on loads as a trucker
5. ✅ Accept a bid and create a booking
6. ✅ Generate a digital BOL at pickup with cargo photos
7. ✅ Track the truck in real-time on a map
8. ✅ Complete delivery with full ePOD flow (inspect, sign, confirm)
9. ✅ See realistic GCash payment flow
10. ✅ Rate each other with multi-dimensional reviews
11. ✅ Browse backhaul offers and contracts
12. ✅ File a dispute with evidence
13. ✅ View analytics and earnings
14. ✅ Manage profile, trucks, and documents
