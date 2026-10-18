# Data Model: TruckConnect PH — MVP Marketplace

## Entity Relationship Overview

```
User (1) ──── (0..1) ShipperProfile
  │
  └── (0..1) TruckerProfile (1) ──── (1..*) Truck

Load (1) ──── (0..1) Booking (1) ──── (0..*) Message
  │                      │
  └── ShipperProfile     └── TruckerProfile

BackhaulOffer ──── TruckerProfile

TruckBanWindow (standalone reference data)
RateConfig (standalone configuration data)
```

## Prisma Schema (Draft)

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}

enum UserRole {
  SHIPPER
  TRUCKER
}

enum LoadStatus {
  OPEN
  BOOKED
  IN_TRANSIT
  DELIVERED
  CANCELLED
}

enum BookingStatus {
  CONFIRMED
  IN_TRANSIT
  DELIVERED
  DISPUTED
  COMPLETED
}

enum TruckType {
  FOUR_WHEELER
  SIX_WHEELER_OPEN
  SIX_WHEELER_CLOSED
  TEN_WHEELER
  TRAILER
  WING_VAN
}

model User {
  id              String          @id @default(cuid())
  email           String?         @unique
  phone           String?         @unique
  name            String
  role            UserRole?
  emailVerified   DateTime?
  image           String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  shipperProfile  ShipperProfile?
  truckerProfile  TruckerProfile?
  accounts        Account[]
  sessions        Session[]
  sentMessages    Message[]       @relation("sender")
}

model ShipperProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  businessName    String
  businessType    String    // MSME, manufacturer, distributor
  businessAddress String
  gcashNumber     String?

  user            User      @relation(fields: [userId], references: [id])
  loads           Load[]
}

model TruckerProfile {
  id              String          @id @default(cuid())
  userId          String          @unique
  ltfrbAccreditation String?
  gcashNumber     String?
  currentLat      Float?
  currentLng      Float?
  isAvailable     Boolean         @default(true)

  user            User            @relation(fields: [userId], references: [id])
  trucks          Truck[]
  bookings        Booking[]
  backhaulOffers  BackhaulOffer[]
}

model Truck {
  id              String    @id @default(cuid())
  truckerProfileId String
  plateNumber     String    @unique
  truckType       TruckType
  capacityTons    Float
  lengthFt        Float?
  widthFt         Float?
  heightFt        Float?
  photoUrl        String?
  isVerified      Boolean   @default(false)
  createdAt       DateTime  @default(now())

  truckerProfile  TruckerProfile @relation(fields: [truckerProfileId], references: [id])
}

model Load {
  id              String     @id @default(cuid())
  shipperProfileId String
  originAddress   String
  originLat       Float
  originLng       Float
  destAddress     String
  destLat         Float
  destLng         Float
  cargoType       String
  weightTons      Float
  lengthFt        Float?
  widthFt         Float?
  heightFt        Float?
  preferredTruck  TruckType?
  pickupDate      DateTime
  rateEstimate    Float?     // calculated by rate engine
  distanceKm      Float?     // from Google Maps
  status          LoadStatus @default(OPEN)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  shipperProfile  ShipperProfile @relation(fields: [shipperProfileId], references: [id])
  booking         Booking?
}

model Booking {
  id              String        @id @default(cuid())
  loadId          String        @unique
  truckerProfileId String
  agreedRate      Float
  platformFeeShipper Float     // 3-4%
  platformFeeTrucker Float     // 5-8%
  status          BookingStatus @default(CONFIRMED)
  waybillNumber   String        @unique @default(cuid())
  epodPhotoUrl    String?
  epodConfirmedAt DateTime?
  payoutStatus    String?       // pending, paid, failed
  payoutAmount    Float?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  load            Load           @relation(fields: [loadId], references: [id])
  truckerProfile  TruckerProfile @relation(fields: [truckerProfileId], references: [id])
  messages        Message[]
  trackingPoints  TrackingPoint[]
}

model TrackingPoint {
  id        String   @id @default(cuid())
  bookingId String
  lat       Float
  lng       Float
  timestamp DateTime @default(now())

  booking   Booking  @relation(fields: [bookingId], references: [id])

  @@index([bookingId, timestamp])
}

model BackhaulOffer {
  id              String    @id @default(cuid())
  truckerProfileId String
  originAddress   String
  originLat       Float
  originLng       Float
  destAddress     String
  destLat         Float
  destLng         Float
  truckType       TruckType
  availableTons   Float
  discountedRate  Float
  departureTime   DateTime
  expiresAt       DateTime
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())

  truckerProfile  TruckerProfile @relation(fields: [truckerProfileId], references: [id])

  @@index([isActive, expiresAt])
}

model Message {
  id        String   @id @default(cuid())
  bookingId String
  senderId  String
  content   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  booking   Booking  @relation(fields: [bookingId], references: [id])
  sender    User     @relation("sender", fields: [senderId], references: [id])

  @@index([bookingId, createdAt])
}

model TruckBanWindow {
  id              String   @id @default(cuid())
  zoneName        String   // e.g., "Makati CBD", "EDSA", "C5"
  dayOfWeek       Int[]    // 0=Sunday, 1=Monday, etc.
  startTime       String   // "05:00" (24h format, Asia/Manila)
  endTime         String   // "09:00"
  truckTypesAffected TruckType[]
  source          String   // "MMDA" or LGU name
  isActive        Boolean  @default(true)
  updatedAt       DateTime @updatedAt
}

model RateConfig {
  id              String    @id @default(cuid())
  truckType       TruckType @unique
  baseRatePerKm   Float     // ₱ per kilometer
  fuelSurchargeMultiplier Float @default(1.0)
  platformFeeShipperPct   Float @default(0.035) // 3.5%
  platformFeeTruckerPct   Float @default(0.06)  // 6%
  updatedAt       DateTime  @updatedAt
}

// NextAuth required models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

## Indexes & Performance Notes

- `Load`: Index on `(status, pickupDate)` for available load queries
- `TrackingPoint`: Index on `(bookingId, timestamp)` for latest position queries
- `BackhaulOffer`: Index on `(isActive, expiresAt)` for active offer queries
- `Message`: Index on `(bookingId, createdAt)` for conversation history
- PostGIS spatial indexes on lat/lng columns for proximity queries (find nearby loads/truckers)

## Rate Calculation Formula

```
totalRate = (distanceKm × baseRatePerKm[truckType]) × fuelSurchargeMultiplier
shipperPays = totalRate + (totalRate × platformFeeShipperPct)
truckerReceives = totalRate - (totalRate × platformFeeTruckerPct)
```
