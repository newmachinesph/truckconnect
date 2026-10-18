import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { loadPostSchema } from "@/lib/validators"
import { calculateDistance } from "@/lib/maps"
import { calculateRate } from "@/lib/rate-engine"
import { publishEvent } from "@/lib/sse"
import { apiRateLimit, getClientIp, checkRateLimit } from "@/lib/rate-limit"
import { parsePagination, paginatedResponse } from "@/lib/pagination"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const status = searchParams.get("status") as
      | "OPEN"
      | "BOOKED"
      | "IN_TRANSIT"
      | "DELIVERED"
      | "CANCELLED"
      | null
    const truckType = searchParams.get("truckType") as string | null
    const minWeight = searchParams.get("minWeight")
    const maxWeight = searchParams.get("maxWeight")

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }
    if (truckType) {
      where.preferredTruck = truckType
    }
    if (minWeight || maxWeight) {
      where.weightTons = {
        ...(minWeight ? { gte: parseFloat(minWeight) } : {}),
        ...(maxWeight ? { lte: parseFloat(maxWeight) } : {}),
      }
    }

    const { skip, take, page, limit } = parsePagination(searchParams)

    const [loads, total] = await Promise.all([
      prisma.load.findMany({
        where,
        include: { shipperProfile: true },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.load.count({ where }),
    ])

    return Response.json({
      success: true,
      ...paginatedResponse(loads, total, page, limit),
    })
  } catch (error) {
    console.error("GET /api/loads error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimit(apiRateLimit, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shipperProfile: true },
    })

    if (!user?.shipperProfile) {
      return Response.json(
        { success: false, error: "Shipper profile required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = loadPostSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Calculate distance and rate estimate
    const { distanceKm } = await calculateDistance(
      data.originLat,
      data.originLng,
      data.destLat,
      data.destLng
    )

    const truckType = data.preferredTruck || "SIX_WHEELER_CLOSED"
    const rateBreakdown = await calculateRate(distanceKm, truckType)

    const load = await prisma.load.create({
      data: {
        shipperProfileId: user.shipperProfile.id,
        originAddress: data.originAddress,
        originLat: data.originLat,
        originLng: data.originLng,
        destAddress: data.destAddress,
        destLat: data.destLat,
        destLng: data.destLng,
        cargoType: data.cargoType,
        weightTons: data.weightTons,
        lengthFt: data.lengthFt,
        widthFt: data.widthFt,
        heightFt: data.heightFt,
        preferredTruck: data.preferredTruck,
        pickupDate: data.pickupDate,
        rateEstimate: rateBreakdown.totalShipperPays,
        distanceKm,
      },
      include: { shipperProfile: true },
    })

    await publishEvent("loads", "new-load", load)

    return Response.json({ success: true, data: load }, { status: 201 })
  } catch (error) {
    console.error("POST /api/loads error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
