/**
 * Enhanced rate calculation engine with RO-RO segment support.
 *
 * This module works independently of the database-backed rate-engine.ts so it
 * can be used for instant browser-side estimates as well as the API route.
 */

import type { Route, RouteSegment } from "./philippine-routes"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SegmentBreakdown {
  type: "land" | "roro"
  from: string
  to: string
  distanceKm: number
  cost: number
  duration: string
}

export interface RateBreakdownV2 {
  landDistanceKm: number
  roroDistanceKm: number
  totalDistanceKm: number

  segments: SegmentBreakdown[]

  baseRate: number // land transport cost
  roroFees: number // total RO-RO charges
  fuelSurcharge: number // 15 % on land portion
  tollFees: number // estimated tolls
  shipperPlatformFee: number // 3.5 %
  truckerPlatformFee: number // 6 %

  totalShipperPays: number
  totalTruckerReceives: number
  estimatedDuration: string // e.g., "18-24 hours"

  hasRoro: boolean
  roroNote?: string // e.g., "Includes 2Go ferry Batangas-Cebu"
}

// ---------------------------------------------------------------------------
// Configuration – base rates per km by truck type (in PHP)
// ---------------------------------------------------------------------------

const BASE_RATE_PER_KM: Record<string, number> = {
  FOUR_WHEELER: 28,
  SIX_WHEELER_OPEN: 35,
  SIX_WHEELER_CLOSED: 38,
  SIX_WHEELER: 35,
  TEN_WHEELER: 48,
  TRAILER: 62,
  WING_VAN: 65,
}

/** Map the API truck type to a RO-RO fee key (4/6/10/trailer). */
function roroFeeKey(truckType: string): "FOUR_WHEELER" | "SIX_WHEELER" | "TEN_WHEELER" | "TRAILER" {
  switch (truckType) {
    case "FOUR_WHEELER":
      return "FOUR_WHEELER"
    case "SIX_WHEELER_OPEN":
    case "SIX_WHEELER_CLOSED":
    case "SIX_WHEELER":
      return "SIX_WHEELER"
    case "TEN_WHEELER":
      return "TEN_WHEELER"
    case "TRAILER":
    case "WING_VAN":
      return "TRAILER"
    default:
      return "SIX_WHEELER"
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHours(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`
  }
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function estimateDurationRange(hours: number): string {
  // Add +/- 20 % buffer
  const low = Math.max(1, Math.floor(hours * 0.85))
  const high = Math.ceil(hours * 1.2)
  if (low === high) return `~${low} hours`
  return `${low}-${high} hours`
}

/** Estimate toll fees for a land distance (Philippine expressway averages). */
function estimateTollFees(landDistanceKm: number): number {
  // Rough average: about 2.5 PHP per km for expressway stretches.
  // Only ~40 % of a typical route is on toll roads.
  return Math.round(landDistanceKm * 2.5 * 0.4)
}

// ---------------------------------------------------------------------------
// Segment cost calculation
// ---------------------------------------------------------------------------

function calculateSegmentCost(
  segment: RouteSegment,
  truckType: string
): number {
  if (segment.type === "roro") {
    const key = roroFeeKey(truckType)
    return segment.roroFee?.[key] ?? 0
  }
  // Land segment
  const ratePerKm = BASE_RATE_PER_KM[truckType] ?? BASE_RATE_PER_KM["SIX_WHEELER"]
  return Math.round(segment.distanceKm * ratePerKm)
}

// ---------------------------------------------------------------------------
// Main calculation
// ---------------------------------------------------------------------------

export function calculateRateV2(
  route: Route,
  truckType: string
): RateBreakdownV2 {
  let landDistanceKm = 0
  let roroDistanceKm = 0
  const segmentBreakdowns: SegmentBreakdown[] = []
  let totalRoroFees = 0
  let totalLandCost = 0
  const roroOperators: string[] = []

  for (const segment of route.segments) {
    const cost = calculateSegmentCost(segment, truckType)

    if (segment.type === "roro") {
      roroDistanceKm += segment.distanceKm
      totalRoroFees += cost
      if (segment.ferryOperator) {
        roroOperators.push(
          `${segment.ferryOperator} (${segment.from} - ${segment.to})`
        )
      }
    } else {
      landDistanceKm += segment.distanceKm
      totalLandCost += cost
    }

    segmentBreakdowns.push({
      type: segment.type,
      from: segment.from,
      to: segment.to,
      distanceKm: segment.distanceKm,
      cost,
      duration: formatHours(segment.durationHours),
    })
  }

  const baseRate = totalLandCost
  const fuelSurcharge = Math.round(baseRate * 0.15)
  const tollFees = estimateTollFees(landDistanceKm)

  const subtotal = baseRate + fuelSurcharge + tollFees + totalRoroFees
  const shipperPlatformFee = Math.round(subtotal * 0.035)
  const truckerPlatformFee = Math.round(subtotal * 0.06)

  const totalShipperPays = subtotal + shipperPlatformFee
  const totalTruckerReceives = subtotal - truckerPlatformFee

  const roroNote =
    roroOperators.length > 0
      ? `Includes ${roroOperators.join("; ")}`
      : undefined

  return {
    landDistanceKm,
    roroDistanceKm,
    totalDistanceKm: landDistanceKm + roroDistanceKm,

    segments: segmentBreakdowns,

    baseRate,
    roroFees: totalRoroFees,
    fuelSurcharge,
    tollFees,
    shipperPlatformFee,
    truckerPlatformFee,

    totalShipperPays,
    totalTruckerReceives,
    estimatedDuration: estimateDurationRange(route.totalDurationHours),

    hasRoro: route.hasRoro,
    roroNote,
  }
}

// ---------------------------------------------------------------------------
// Fallback: simple distance-based estimate (no route data)
// ---------------------------------------------------------------------------

export function calculateFallbackRate(
  distanceKm: number,
  truckType: string
): RateBreakdownV2 {
  const ratePerKm = BASE_RATE_PER_KM[truckType] ?? BASE_RATE_PER_KM["SIX_WHEELER"]
  const baseRate = Math.round(distanceKm * ratePerKm)
  const fuelSurcharge = Math.round(baseRate * 0.15)
  const tollFees = estimateTollFees(distanceKm)

  const subtotal = baseRate + fuelSurcharge + tollFees
  const shipperPlatformFee = Math.round(subtotal * 0.035)
  const truckerPlatformFee = Math.round(subtotal * 0.06)

  // Rough estimate: 50 km/h average for trucks in the Philippines
  const hours = distanceKm / 50

  return {
    landDistanceKm: distanceKm,
    roroDistanceKm: 0,
    totalDistanceKm: distanceKm,
    segments: [
      {
        type: "land",
        from: "Origin",
        to: "Destination",
        distanceKm,
        cost: baseRate,
        duration: formatHours(hours),
      },
    ],
    baseRate,
    roroFees: 0,
    fuelSurcharge,
    tollFees,
    shipperPlatformFee,
    truckerPlatformFee,
    totalShipperPays: subtotal + shipperPlatformFee,
    totalTruckerReceives: subtotal - truckerPlatformFee,
    estimatedDuration: estimateDurationRange(hours),
    hasRoro: false,
  }
}
