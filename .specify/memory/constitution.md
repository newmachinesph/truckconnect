# TruckConnect PH Constitution

## Core Principles

### I. PWA-First
All features must be built as a Progressive Web App. No native mobile apps. The PWA must work offline for critical flows (viewing active bookings, cached maps, driver dashboard). Service workers handle caching, push notifications, and background sync. Installable on both Android and iOS via browser.

### II. API Routes in Next.js
All backend logic lives in Next.js API routes (App Router). No separate backend service. Server Actions for mutations, Route Handlers for REST endpoints. Keep the stack simple — one deployable unit on Vercel.

### III. Free-Tier Infrastructure
Default to free-tier services for MVP. Neon PostgreSQL (free), Upstash Redis (free), Vercel Hobby (free), Google Maps ($200 credit). Only OpenAI API has usage-based cost. No premature scaling — optimize for cost, not throughput.

### IV. Philippine-Context Design
Every UX decision must consider Philippine realities: spotty mobile data in provinces, GCash as primary payment, Facebook/Messenger as communication norm, truck ban schedules in Metro Manila, LTFRB regulations, PhilID for identity verification. Tagalog/English bilingual support from day one.

### V. Marketplace Trust & Safety
Two-sided marketplace requires trust infrastructure: verified identities (PhilID), LTFRB accreditation checks, cargo insurance integration, digital waybills with photo evidence, rating systems, and dispute resolution. Trust is the product — without it, neither side transacts.

### VI. Simplicity & YAGNI
Start simple. No microservices, no message queues, no complex orchestration for MVP. Monolith first. Add complexity only when measurable bottlenecks appear. Three lines of repeated code is better than a premature abstraction. Build for Phase 1 (1 corridor, 200 truckers, 50 shippers), not Phase 4.

### VII. Test Coverage for Critical Paths
Tests are required for: payment flows, booking state machines, rate calculations, auth/authorization, and data integrity. Tests are optional for: UI components, static pages, admin dashboards. Integration tests with real Neon DB preferred over mocks for data layer.

## Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js (latest) | Full-stack, SSR, API routes, Vercel-optimized |
| UI | PWA (service workers, manifest) | No app store friction, offline capable |
| Database | Neon PostgreSQL | Serverless Postgres, free tier, PostGIS for geo |
| Cache/Realtime | Upstash Redis | Serverless Redis, free tier, pub/sub |
| Auth | NextAuth (Auth.js) | Open source, Next.js native, multiple providers |
| AI | OpenAI API | GPT for load optimization, route suggestions |
| Maps | Google Maps Platform | Best Philippine coverage, directions + geocoding |
| Hosting | Vercel | Zero-config Next.js deployment, edge functions |
| Payments | GCash integration (via PayMongo or direct) | Philippine standard, instant settlement |
| Messaging | Internal in-app | WebSocket-based chat between shipper and trucker |

## Development Workflow

- Feature branches follow `###-feature-name` convention
- Each feature must have a spec before implementation
- Specs define acceptance criteria as Given/When/Then scenarios
- Deploy previews on Vercel for every PR
- Database migrations via Prisma or Drizzle ORM

## Governance

This constitution governs all development decisions for TruckConnect PH. Any deviation from these principles must be documented with justification in the relevant spec's plan.md. Stack changes require constitution amendment.

**Version**: 1.0.0 | **Ratified**: 2026-03-13 | **Last Amended**: 2026-03-13
