import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { calculateRate } from "@/lib/rate-engine"
import { publishEvent } from "@/lib/sse"
import { apiRateLimit, getClientIp, checkRateLimit } from "@/lib/rate-limit"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      include: {
        truckerProfile: {
          include: { trucks: true },
        },
      },
    })

    if (!user?.truckerProfile) {
      return Response.json(
        { success: false, error: "Trucker profile required" },
        { status: 403 }
      )
    }

    const verifiedTruck = user.truckerProfile.trucks.find((t) => t.isVerified)
    if (!verifiedTruck) {
      return Response.json(
        { success: false, error: "A verified truck is required to accept loads" },
        { status: 403 }
      )
    }

    const { id: loadId } = await params

    // Use transaction with optimistic locking
    const booking = await prisma.$transaction(async (tx) => {
      const load = await tx.load.findUnique({
        where: { id: loadId },
      })

      if (!load) {
        throw new Error("LOAD_NOT_FOUND")
      }

      if (load.status !== "OPEN") {
        throw new Error("LOAD_NOT_AVAILABLE")
      }

      // Calculate rate and fees
      const truckType = load.preferredTruck || verifiedTruck.truckType
      const distanceKm = load.distanceKm || 0
      const rateBreakdown = await calculateRate(distanceKm, truckType)

      // Update load status to BOOKED
      await tx.load.update({
        where: { id: loadId, status: "OPEN" },
        data: { status: "BOOKED" },
      })

      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          loadId,
          truckerProfileId: user.truckerProfile!.id,
          agreedRate: rateBreakdown.totalShipperPays,
          platformFeeShipper: rateBreakdown.platformFeeShipper,
          platformFeeTrucker: rateBreakdown.platformFeeTrucker,
          status: "CONFIRMED",
        },
        include: {
          load: { include: { shipperProfile: true } },
          truckerProfile: true,
        },
      })

      return newBooking
    })

    await publishEvent("loads", "load-accepted", {
      loadId,
      bookingId: booking.id,
      truckerProfileId: booking.truckerProfileId,
    })

    return Response.json({ success: true, data: booking }, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "LOAD_NOT_FOUND") {
        return Response.json(
          { success: false, error: "Load not found" },
          { status: 404 }
        )
      }
      if (error.message === "LOAD_NOT_AVAILABLE") {
        return Response.json(
          { success: false, error: "Load is no longer available" },
          { status: 409 }
        )
      }
    }
    console.error("POST /api/loads/[id]/accept error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
