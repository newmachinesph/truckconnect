import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return Response.json(
        { success: false, error: "Cancellation reason is required" },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { load: true },
    })

    if (!booking) {
      return Response.json({ success: false, error: "Booking not found" }, { status: 404 })
    }

    if (booking.status === "CANCELLED") {
      return Response.json(
        { success: false, error: "Booking is already cancelled" },
        { status: 400 }
      )
    }

    // Prevent cancellation of delivered or completed bookings
    if (booking.status === "DELIVERED" || booking.status === "COMPLETED") {
      return Response.json(
        { success: false, error: `Cannot cancel a ${booking.status.toLowerCase()} booking` },
        { status: 400 }
      )
    }

    // Verify user is a party to this booking
    const shipperProfile = await prisma.shipperProfile.findUnique({
      where: { id: booking.load.shipperProfileId },
      select: { userId: true },
    })
    const truckerProfile = booking.truckerProfileId ? await prisma.truckerProfile.findUnique({
      where: { id: booking.truckerProfileId },
      select: { userId: true },
    }) : null
    const userRole = (session.user as any).role
    if (userRole !== "ADMIN") {
      const isParty = shipperProfile?.userId === session.user.id ||
        truckerProfile?.userId === session.user.id
      if (!isParty) {
        return Response.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        )
      }
    }

    // Calculate penalty based on time before pickup
    const now = new Date()
    const pickupDate = new Date(booking.load.pickupDate)
    const hoursUntilPickup = (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    let penaltyRate = 0
    if (hoursUntilPickup <= 0) {
      penaltyRate = 0.25 // Day of or past pickup: 25%
    } else if (hoursUntilPickup < 24) {
      penaltyRate = 0.1 // Less than 24h: 10%
    }
    // More than 24h: free cancellation

    const penaltyAmount = Math.round(booking.agreedRate * penaltyRate)

    // Create cancellation log and update booking status in a transaction
    const [cancellation] = await prisma.$transaction([
      prisma.cancellationLog.create({
        data: {
          bookingId: id,
          cancelledById: session.user.id,
          reason,
          penaltyAmount,
        },
      }),
      prisma.booking.update({
        where: { id },
        data: { status: "CANCELLED" },
      }),
      prisma.load.update({
        where: { id: booking.loadId },
        data: { status: "CANCELLED" },
      }),
    ])

    return Response.json({
      success: true,
      data: {
        ...cancellation,
        penaltyRate,
        hoursUntilPickup: Math.max(0, Math.round(hoursUntilPickup)),
      },
    })
  } catch (error) {
    console.error("POST /api/bookings/[id]/cancel error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
