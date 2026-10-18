# A trucking marketplace for the Philippines - why this ₱500B+ industry is still stuck on phone calls

The Philippine trucking industry is massive - over ₱500 billion - and almost entirely undigitized at the SME and owner-operator level.

**Everything still runs on phone calls.** Shippers spend hours calling brokers. Brokers mark up rates 30–50%. Truckers drive back empty from Mindanao because there's no way to find return loads. And everyone navigates Metro Manila's truck ban windows by word of mouth.

This demo explores what a **two-sided trucking marketplace** could look like for the Philippines - connecting shippers directly with truck owners. Think Grab, but for freight.

---

## The core concept

- **Shippers** post a load (origin, destination, cargo type, truck needed). Verified truckers bid on it. No middlemen, no opaque pricing.
- **Truckers** browse available loads, bid competitively, and get paid instantly via GCash the moment delivery is confirmed through electronic proof of delivery (ePOD). No more waiting 30–60 days for a check.
- **Backhaul marketplace** - trucks returning empty from provincial routes list available capacity at discounted rates. Shippers get cheap loads, truckers fill dead runs. Nobody in the PH market is solving this.

## What makes this PH-specific

- **Truck ban scheduler** - MMDA and LGU truck ban windows built into the booking flow. The platform flags conflicts and suggests compliant delivery windows.
- **RO-RO interisland booking** - End-to-end Luzon-Visayas-Mindanao routes combining trucking + ferry into one transaction. Currently 100% manual coordination.
- **GCash instant payouts** - The 30–60 day payment cycle kills owner-operators running 1–5 trucks. Instant settlement after ePOD changes the game.
- **Facebook Messenger bot** - A huge chunk of independent truckers and provincial MSMEs live in Facebook Groups. A Messenger bot handles booking confirmations and load alerts without needing an app download.

## The competitive gap

Transportify doesn't solve empty backhauls, doesn't serve MSME e-commerce sellers deeply, and doesn't make RO-RO interisland seamless. Lalamove is small parcels only. FAST Logistics is enterprise-only with company fleets. There's a wide open lane for an SME-first, owner-operator-friendly platform.

## Why now

- Philippine e-commerce projected to hit $12B+, driving massive truckload demand
- 99% of PH businesses are MSMEs - most locked out of enterprise logistics platforms
- GCash has 90M+ wallets making instant digital payment viable at scale
- PhilSys digital ID rollout enables trust-layer verification for both sides

---

## Live demo

**[https://truckconnect.vercel.app](https://truckconnect.vercel.app)**

Every flow is functional, no real data.

### Public pages (no login needed)

- [Landing page](https://truckconnect.vercel.app)
- [Rate Calculator](https://truckconnect.vercel.app/rate-calculator) - instant freight estimates with RO-RO routes
- [Live Tracking Demo](https://truckconnect.vercel.app/track/demo) - simulated truck moving along real Philippine highways, Grab-style
- [Help Center](https://truckconnect.vercel.app/help)
- [Messenger Bot Preview](https://truckconnect.vercel.app/messenger-demo)

### Demo accounts (just type the email, no password)

| Role | Email | What you'll see |
|------|-------|----------------|
| Shipper | `shipper@test.com` | Post loads, view bids, track shipments, payments |
| Trucker | `trucker@test.com` | Browse loads, submit bids, manage fleet, earnings |
| Admin | `admin@test.com` | Analytics, approvals, disputes, compliance |

---

Feedback welcome - especially from anyone in logistics, marketplace businesses, or the PH startup scene. What's missing? What would make someone switch from the current process?
