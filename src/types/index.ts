import { type User, type Load, type Booking, type Truck, type BackhaulOffer, type Message, type TruckType, type LoadStatus, type BookingStatus, type UserRole } from "@prisma/client"

// Re-export Prisma types for convenience
export type { User, Load, Booking, Truck, BackhaulOffer, Message, TruckType, LoadStatus, BookingStatus, UserRole }

// Extended types with relations
export type LoadWithShipper = Load & {
  shipperProfile: {
    businessName: string
    user: { name: string | null; image: string | null }
  }
}

export type BookingWithDetails = Booking & {
  load: LoadWithShipper & {
    shipperProfile: {
      businessName: string
      userId: string
      user: { name: string | null; image: string | null }
    }
  }
  truckerProfile: {
    userId: string
    user: { name: string | null; image: string | null }
    trucks: Truck[]
  }
}

export type BackhaulOfferWithTrucker = BackhaulOffer & {
  truckerProfile: {
    user: { name: string | null }
    trucks: Truck[]
  }
}

// Session types
export type SessionUser = {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  role?: UserRole | null
}

// API response types
export type ApiResponse<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}

// Rate types
export type RateBreakdown = {
  distanceKm: number
  truckType: TruckType
  baseRate: number
  fuelSurcharge: number
  platformFeeShipper: number
  platformFeeTrucker: number
  totalShipperPays: number
  totalTruckerReceives: number
  baseRatePerKm: number
}

// Truck ban types
export type TruckBanCheck = {
  isBanned: boolean
  conflicts: {
    zoneName: string
    startTime: string
    endTime: string
    source: string
  }[]
  suggestedWindows: {
    label: string
    startTime: string
    endTime: string
  }[]
}
