# TruckConnect

![License: MIT](https://img.shields.io/badge/license-MIT-green) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-blue) ![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748)

Live demo: https://truckconnect.vercel.app

A Philippine freight marketplace connecting shippers with truckers and carriers — no middlemen, transparent pricing, and instant payouts. Built as a full-stack Next.js monolith with role-based dashboards for shippers, truckers, and admins.

## Overview

TruckConnect enables shippers to post loads, browse carriers, and book freight — while truckers manage their fleet, accept jobs, and track earnings. The platform includes real-time messaging, contract management, insurance tracking, dispute resolution, and a live freight rate calculator.

## Features

### For Shippers
- Post and manage freight loads
- Browse and save carriers
- Book and track shipments
- Manage contracts and disputes
- Referral program

### For Truckers
- Browse and bid on available loads
- Manage trucks, routes, and backhaul
- Track earnings and payments
- Handle insurance and truck ban compliance
- Subscription management

### Platform
- Real-time messaging
- Interactive freight rate calculator (Philippine routes)
- 3D load visualizer (Three.js)
- Google Maps integration
- Admin dashboard with full moderation
- Notification preferences and push alerts
- Saved addresses and carrier favorites

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | NextAuth.js |
| Styling | Tailwind CSS |
| Maps | Google Maps JS API |
| 3D | React Three Fiber / Three.js |
| File Uploads | UploadThing |
| Cache / Rate Limiting | Upstash Redis |
| AI | OpenAI |
| Email | Resend |
| CMS | Sanity |
| Testing | Vitest, Playwright (E2E) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

```bash
npm install
```

### Database Setup

```bash
npm run db:push
npm run db:seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/         # Login, register, onboarding
│   ├── (dashboard)/    # Authenticated shipper/trucker/admin dashboards
│   │   ├── admin/
│   │   ├── shipper/
│   │   └── trucker/
│   ├── (public)/       # Public-facing marketplace pages
│   │   ├── loads/
│   │   ├── carriers/
│   │   ├── rate-calculator/
│   │   └── ...
│   ├── api/            # API route handlers
│   └── ...
├── lib/                # Utilities, validators, route data
└── types/

prisma/
└── schema.prisma

e2e/                    # Playwright E2E tests
tests/                  # Vitest unit tests
```

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

## License

MIT. See [LICENSE](LICENSE).
