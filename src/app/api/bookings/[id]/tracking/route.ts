import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { trackingSchema } from "@/lib/validators"
import { redis } from "@/lib/redis"
import { publishEvent } from "@/lib/sse"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { truckerProfile: true },
    })

    if (user?.role !== "TRUCKER" || !user.truckerProfile) {
      return Response.json(
        { success: false, error: "Trucker access only" },
        { status: 403 }
      )
    }

    const { id: bookingId } = await params

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return Response.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    if (booking.truckerProfileId !== user.truckerProfile.id) {
      return Response.json(
        { success: false, error: "Not your booking" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = trackingSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { lat, lng } = parsed.data

    const trackingPoint = await prisma.trackingPoint.create({
      data: {
        bookingId,
        lat,
        lng,
      },
    })

    // Cache latest position in Redis
    await redis.set(`tracking:${bookingId}:latest`, {
      lat,
      lng,
      timestamp: trackingPoint.timestamp,
    })

    await publishEvent("tracking", "location-update", {
      bookingId,
      lat,
      lng,
      timestamp: trackingPoint.timestamp,
    })

    return Response.json({ success: true, data: trackingPoint }, { status: 201 })
  } catch (error) {
    console.error("POST /api/bookings/[id]/tracking error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id: bookingId } = await params

    // Try Redis cache first
    const cached = await redis.get(`tracking:${bookingId}:latest`)
    if (cached) {
      return Response.json({ success: true, data: cached })
    }

    // Fallback to database
    const latest = await prisma.trackingPoint.findFirst({
      where: { bookingId },
      orderBy: { timestamp: "desc" },
    })

    if (!latest) {
      return Response.json(
        { success: false, error: "No tracking data available" },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: latest })
  } catch (error) {
    console.error("GET /api/bookings/[id]/tracking error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
