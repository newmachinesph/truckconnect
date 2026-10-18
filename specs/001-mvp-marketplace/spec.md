# Feature Specification: TruckConnect PH — MVP Marketplace

**Feature Branch**: `001-mvp-marketplace`
**Created**: 2026-03-13
**Status**: Draft
**Input**: TruckConnect PH Blueprint (truckconnect-ph-blueprint.md)

## User Scenarios & Testing

### User Story 1 — Shipper Posts a Load (Priority: P1)

A shipper (MSME, manufacturer, or e-commerce seller) opens TruckConnect PH, signs up or logs in, and posts a cargo load specifying: pickup location, drop-off location, cargo type, weight/dimensions, preferred truck type, and desired pickup date/time. The system shows an estimated market rate. Nearby available truckers receive the load notification.

**Why this priority**: Without load posting, there is no marketplace. This is the core supply-demand connection point.

**Independent Test**: A shipper can register, post a load with full details, see a rate estimate, and the load appears in the trucker feed. No trucker acceptance needed for this story to deliver value (shipper sees the system works).

**Acceptance Scenarios**:

1. **Given** a registered shipper, **When** they fill in origin (Manila), destination (Cebu), cargo weight (5 tons), truck type (6-wheeler closed van), and pickup date, **Then** the system displays an estimated rate based on distance and truck type, and the load is published.
2. **Given** a load is posted, **When** no truck type is specified, **Then** the system suggests appropriate truck types based on cargo weight and dimensions.
3. **Given** a shipper is not logged in, **When** they try to post a load, **Then** they are redirected to sign up / log in first.
4. **Given** a load is posted, **When** the pickup date is in the past, **Then** the system rejects it with a clear error message.

---

### User Story 2 — Trucker Browses and Accepts Loads (Priority: P1)

An independent truck owner opens TruckConnect PH, registers their truck(s) (plate number, truck type, capacity, LTFRB accreditation), sets their current location/availability, and browses available loads. They can filter by route, cargo type, and date. When they find a suitable load, they accept it — creating a booking.

**Why this priority**: Equal to load posting — without trucker acceptance, no transaction occurs. Together with US1, this forms the minimum viable marketplace.

**Independent Test**: A trucker can register, add their truck details, browse loads, filter them, and accept a load. The shipper sees the booking confirmation.

**Acceptance Scenarios**:

1. **Given** a registered trucker with a verified truck, **When** they browse loads, **Then** they see loads sorted by relevance (distance from current location, route match).
2. **Given** a load is available, **When** a trucker accepts it, **Then** a booking is created, the shipper is notified, and the load is removed from the available feed.
3. **Given** a trucker has no verified truck, **When** they try to accept a load, **Then** they are prompted to complete truck registration first.
4. **Given** multiple truckers are browsing, **When** one accepts a load, **Then** it becomes unavailable to others in real-time (no double-booking).

---

### User Story 3 — Rate Calculator & Transparent Pricing (Priority: P1)

The platform provides transparent, market-rate pricing. When a shipper enters origin, destination, and truck type, the rate calculator shows a fare breakdown: base distance rate, truck type multiplier, fuel surcharge, and platform fee. This eliminates broker opacity.

**Why this priority**: Pricing transparency is the #1 shipper pain point and TruckConnect's core value proposition vs. brokers.

**Independent Test**: Any user (even unauthenticated) can enter a route and truck type and see a rate estimate with a full breakdown.

**Acceptance Scenarios**:

1. **Given** origin (Quezon City) and destination (Batangas), truck type (10-wheeler), **When** the user requests a rate, **Then** the system returns a breakdown: base rate (₱/km × distance), fuel surcharge, platform fee, and total.
2. **Given** fuel prices have changed, **When** the rate is calculated, **Then** the fuel surcharge reflects current fuel prices (updated weekly or via API).
3. **Given** a route with RO-RO ferry component, **When** the rate is calculated, **Then** the estimate includes a ferry surcharge line item.

---

### User Story 4 — User Registration & Authentication (Priority: P1)

Both shippers and truckers can register using email or phone number. NextAuth handles authentication with email magic links or OTP via SMS. Users select their role (shipper or trucker) during onboarding. Profile includes business name, contact details, and location.

**Why this priority**: Foundation for all other stories — no marketplace without users.

**Independent Test**: A user can register, receive a verification email/OTP, log in, and see their role-specific dashboard.

**Acceptance Scenarios**:

1. **Given** a new user, **When** they sign up with email, **Then** they receive a magic link, click it, select their role (shipper/trucker), and land on their dashboard.
2. **Given** a new user, **When** they sign up with phone number, **Then** they receive an OTP, verify it, select their role, and land on their dashboard.
3. **Given** an existing user, **When** they log in, **Then** they are taken directly to their role-specific dashboard.
4. **Given** a user session, **When** the session expires, **Then** the user is prompted to re-authenticate without losing their current page state.

---

### User Story 5 — Digital Waybill & Tracking (Priority: P2)

After a booking is confirmed, the system generates a digital waybill with: booking ID, shipper details, trucker details, cargo description, pickup/delivery addresses, and agreed rate. The trucker's GPS location is shared with the shipper during transit. At delivery, the trucker uploads photo proof (ePOD).

**Why this priority**: Critical for trust and dispute resolution, but only relevant after bookings exist (US1+US2).

**Independent Test**: Given an active booking, the shipper can view the waybill, track the truck on a map, and see the ePOD photo after delivery.

**Acceptance Scenarios**:

1. **Given** a confirmed booking, **When** both parties view the booking, **Then** they see a digital waybill with all agreed terms.
2. **Given** a booking in transit, **When** the shipper opens the booking, **Then** they see the trucker's live GPS position on a Google Map.
3. **Given** a booking at delivery, **When** the trucker uploads a delivery photo, **Then** the shipper receives a notification and can confirm/dispute delivery.
4. **Given** a completed delivery with ePOD, **When** either party views the booking history, **Then** the waybill, route, and ePOD photo are permanently accessible.

---

### User Story 6 — Backhaul Marketplace (Priority: P2)

Truckers returning empty from a delivery can post their available capacity on the backhaul board: current location, destination (return route), truck type, available capacity, and a discounted rate. Shippers along that route see these backhaul offers and can book at reduced rates.

**Why this priority**: Key differentiator vs. competitors. Solves the biggest structural inefficiency in PH trucking. Depends on core marketplace (US1+US2) existing first.

**Independent Test**: A trucker completing a Cebu delivery can post a backhaul offer for the return to Manila. A shipper in Cebu needing Manila-bound transport sees and books it at a discount.

**Acceptance Scenarios**:

1. **Given** a trucker in Cebu with an empty truck, **When** they post a backhaul offer (Cebu→Manila, 10-ton capacity, ₱15,000 discounted rate), **Then** it appears in the backhaul feed for shippers with matching routes.
2. **Given** a backhaul offer exists, **When** a shipper books it, **Then** a booking is created at the discounted rate, and the trucker is notified.
3. **Given** a backhaul offer, **When** the trucker's departure time passes without a booking, **Then** the offer expires automatically.

---

### User Story 7 — Truck Ban Scheduler (Priority: P2)

The booking flow integrates Metro Manila truck ban windows (MMDA and LGU-specific). When a shipper's pickup or delivery falls within a truck ban zone, the system warns them and suggests compliant time windows. Truckers also see truck ban alerts on their dashboard.

**Why this priority**: Unique feature no competitor has. Reduces fines and delays. Builds trust that TruckConnect "gets" PH logistics.

**Independent Test**: A shipper booking a Manila delivery during truck ban hours sees a warning and alternative time suggestions.

**Acceptance Scenarios**:

1. **Given** a shipper booking delivery to Makati at 7:00 AM (during truck ban), **When** they select this time, **Then** the system warns "Truck ban active 5:00 AM – 9:00 AM in Makati" and suggests the next available window.
2. **Given** truck ban data is stored in the system, **When** MMDA updates ban schedules, **Then** an admin can update the ban windows in the system.
3. **Given** a trucker with an active booking, **When** their route passes through a truck ban zone during restricted hours, **Then** they receive an alert with suggested alternative timing or routing.

---

### User Story 8 — In-App Messaging (Priority: P2)

Shippers and truckers can message each other within the platform for booking coordination. Messages are tied to specific bookings. Real-time delivery via Upstash Redis pub/sub. Push notifications via PWA service worker.

**Why this priority**: Essential for coordination but not needed for core marketplace transaction to occur.

**Independent Test**: A shipper and trucker with a confirmed booking can exchange messages in real-time.

**Acceptance Scenarios**:

1. **Given** a confirmed booking, **When** the shipper sends a message, **Then** the trucker receives it in real-time and gets a push notification if the app is backgrounded.
2. **Given** a booking conversation, **When** either party is offline, **Then** messages are queued and delivered when they reconnect.
3. **Given** no active booking between two users, **When** one tries to message the other, **Then** messaging is not available (prevents spam).

---

### User Story 9 — GCash Instant Payout (Priority: P3)

After ePOD confirmation, the trucker receives instant payment via GCash. The platform deducts its take rate (5-8% trucker side) and transfers the remainder. Shippers are charged the full amount (booking rate + 3-4% platform fee) at booking confirmation.

**Why this priority**: Transformative for trucker supply-side lock-in, but requires payment integration complexity. Phase 3 feature per GTM plan.

**Independent Test**: After a delivery is confirmed via ePOD, the trucker's GCash wallet receives payment within minutes.

**Acceptance Scenarios**:

1. **Given** a completed delivery with ePOD confirmed by shipper, **When** payout is triggered, **Then** the trucker receives (booking amount - platform fee) in their registered GCash account.
2. **Given** a payout fails (GCash downtime), **When** the system retries, **Then** it retries 3 times over 24 hours and alerts the trucker if all retries fail.
3. **Given** a disputed delivery, **When** the shipper flags the delivery, **Then** payout is held pending dispute resolution.

---

### User Story 10 — AI Load Optimizer (LTL Consolidation) (Priority: P3)

The AI groups multiple small shippers going the same direction into one truck (Less-Than-Truckload consolidation). It calculates optimal groupings and splits the cost proportionally by weight/volume. Uses OpenAI API for route optimization suggestions.

**Why this priority**: Advanced feature that requires significant volume of loads to be useful. Phase 3/4 feature.

**Independent Test**: Three shippers with small loads (1-2 tons each) going Manila→Cebu are grouped into one 6-wheeler booking, each paying proportionally less than an individual FTL.

**Acceptance Scenarios**:

1. **Given** 3 pending loads on the same corridor (Manila→Cebu), each under 3 tons, **When** the AI optimizer runs, **Then** it suggests consolidation into one truck with cost split by weight.
2. **Given** a consolidation suggestion, **When** all shippers accept, **Then** a single booking is created with multiple shippers and one trucker.
3. **Given** one shipper in a consolidation declines, **When** the group is recalculated, **Then** the remaining shippers see updated (higher) individual costs.

---

### Edge Cases

- What happens when a shipper cancels after trucker acceptance? → Cancellation policy with time-based penalties.
- What if GPS tracking fails in provincial areas? → Fallback to last known position + manual status updates.
- What if two truckers accept the same load simultaneously? → First-accept wins, second gets "load no longer available" message (optimistic locking).
- What if a trucker's LTFRB accreditation expires mid-booking? → Alert trucker, flag booking for review, don't auto-cancel.
- What if fuel prices spike 20% between booking and delivery? → Rate is locked at booking time; fuel surcharge adjustments apply only to future bookings.

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow shipper registration with email or phone number, with role selection during onboarding.
- **FR-002**: System MUST allow trucker registration including truck details (plate, type, capacity, LTFRB accreditation number).
- **FR-003**: System MUST allow shippers to post loads with: origin, destination, cargo type, weight, dimensions, truck type preference, and pickup date.
- **FR-004**: System MUST calculate and display transparent rate estimates based on distance, truck type, and current fuel prices.
- **FR-005**: System MUST allow truckers to browse, filter, and accept available loads.
- **FR-006**: System MUST prevent double-booking of loads (optimistic locking).
- **FR-007**: System MUST generate digital waybills for confirmed bookings.
- **FR-008**: System MUST display trucker GPS position on a map for active bookings.
- **FR-009**: System MUST support ePOD (photo upload at delivery) with shipper confirmation.
- **FR-010**: System MUST support backhaul posting by truckers with discounted rates.
- **FR-011**: System MUST warn users when bookings conflict with Metro Manila truck ban windows.
- **FR-012**: System MUST provide in-app real-time messaging between booked shipper-trucker pairs.
- **FR-013**: System MUST work as an installable PWA with offline support for critical views.
- **FR-014**: System MUST support GCash payouts after ePOD confirmation (Phase 3).
- **FR-015**: System MUST support LTL consolidation via AI optimizer (Phase 3).

### Key Entities

- **User**: Base entity — email/phone, name, role (shipper/trucker), verified status, profile photo.
- **ShipperProfile**: Business name, business type (MSME/manufacturer/distributor), business address, GCash number.
- **TruckerProfile**: Linked trucks, LTFRB accreditation, GCash number, current location, availability status.
- **Truck**: Plate number, truck type (4W/6W/10W/trailer), capacity (tons), dimensions, photos, verification status.
- **Load**: Shipper ID, origin, destination, cargo type, weight, dimensions, preferred truck type, pickup date, status (open/booked/in_transit/delivered/cancelled), rate estimate.
- **Booking**: Load ID, Trucker ID, agreed rate, status (confirmed/in_transit/delivered/disputed/completed), waybill data, ePOD photo URL.
- **BackhaulOffer**: Trucker ID, origin, destination, available capacity, discounted rate, expiry time, status.
- **Message**: Booking ID, sender ID, content, timestamp, read status.
- **TruckBanWindow**: Zone/area, day_of_week, start_time, end_time, truck_types_affected, source (MMDA/LGU).
- **RateConfig**: Base rate per km by truck type, fuel surcharge multiplier, platform fee percentages.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A shipper can post a load and receive a trucker acceptance within the same session (under 10 minutes in demo conditions).
- **SC-002**: Rate calculator returns estimates within 2 seconds for any Philippine origin-destination pair.
- **SC-003**: PWA achieves Lighthouse score of 90+ for Performance and 100 for PWA compliance.
- **SC-004**: Real-time load feed updates within 1 second when a new load is posted or a load is accepted.
- **SC-005**: System supports 500 concurrent users on Vercel Hobby tier without degradation.
- **SC-006**: Shipper registration to first load post takes under 3 minutes.
- **SC-007**: Trucker registration to first load acceptance takes under 5 minutes.
- **SC-008**: GPS tracking updates every 30 seconds during active transit.
- **SC-009**: In-app messages delivered within 2 seconds of sending.
- **SC-010**: Zero double-bookings under concurrent load acceptance.
