import { TruckType } from "@prisma/client"
import { prisma } from "./db"
import { redis } from "./redis"

export interface RateBreakdown {
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

export async function calculateRate(
  distanceKm: number,
  truckType: TruckType
): Promise<RateBreakdown> {
  // Check cache first
  const cacheKey = `rate:${truckType}:${Math.round(distanceKm)}`
  const cached = await redis.get<RateBreakdown>(cacheKey)
  if (cached) return cached

  const config = await prisma.rateConfig.findUnique({
    where: { truckType },
  })

  if (!config) {
    throw new Error(`No rate config found for truck type: ${truckType}`)
  }

  const baseRate = distanceKm * config.baseRatePerKm
  const fuelSurcharge = baseRate * (config.fuelSurchargeMultiplier - 1)
  const subtotal = baseRate + fuelSurcharge
  const platformFeeShipper = subtotal * config.platformFeeShipperPct
  const platformFeeTrucker = subtotal * config.platformFeeTruckerPct

  const breakdown: RateBreakdown = {
    distanceKm,
    truckType,
    baseRate: Math.round(baseRate),
    fuelSurcharge: Math.round(fuelSurcharge),
    platformFeeShipper: Math.round(platformFeeShipper),
    platformFeeTrucker: Math.round(platformFeeTrucker),
    totalShipperPays: Math.round(subtotal + platformFeeShipper),
    totalTruckerReceives: Math.round(subtotal - platformFeeTrucker),
    baseRatePerKm: config.baseRatePerKm,
  }

  // Cache for 1 hour
  await redis.set(cacheKey, breakdown, { ex: 3600 })

  return breakdown
}

export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH")}`
}

export const TRUCK_TYPE_LABELS: Record<TruckType, string> = {
  FOUR_WHEELER: "4-Wheeler",
  SIX_WHEELER_OPEN: "6-Wheeler (Open)",
  SIX_WHEELER_CLOSED: "6-Wheeler (Closed Van)",
  TEN_WHEELER: "10-Wheeler",
  TRAILER: "Trailer",
  WING_VAN: "Wing Van",
}

export function suggestTruckType(weightTons: number): TruckType[] {
  if (weightTons <= 2) return ["FOUR_WHEELER", "SIX_WHEELER_OPEN", "SIX_WHEELER_CLOSED"]
  if (weightTons <= 5) return ["SIX_WHEELER_OPEN", "SIX_WHEELER_CLOSED"]
  if (weightTons <= 10) return ["TEN_WHEELER"]
  if (weightTons <= 15) return ["TRAILER", "WING_VAN"]
  return ["TRAILER", "WING_VAN"]
}
