import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { canTransition } from "@/lib/booking-state-machine"
import { publishEvent } from "@/lib/sse"
import type { BookingStatus } from "@prisma/client"

/** Map booking status to load status for keeping them in sync. */
const LOAD_STATUS_MAP: Record<string, "IN_TRANSIT" | "DELIVERED" | "CANCELLED"> = {
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
}

const VALID_BOOKING_STATUSES: BookingStatus[] = [
  "CONFIRMED",
  "IN_TRANSIT",
  "DELIVERED",
  "DISPUTED",
  "COMPLETED",
  "CANCELLED",
]

export async function PATCH(
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

    const { id } = await params
    const body = await request.json()
    const { status: newStatus } = body

    if (!newStatus) {
      return Response.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      )
    }

    if (!VALID_BOOKING_STATUSES.includes(newStatus)) {
      return Response.json(
        { success: false, error: `Invalid status: ${newStatus}` },
        { status: 400 }
      )
    }

    // Fetch booking with load for authorization checks
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { load: true },
    })

    if (!booking) {
      return Response.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    // Validate state machine transition
    const transition = canTransition(booking.status, newStatus as BookingStatus)
    if (!transition.valid) {
      return Response.json(
        { success: false, error: transition.error },
        { status: 400 }
      )
    }

    // Authorization: determine if user is shipper or trucker for this booking
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shipperProfile: true, truckerProfile: true },
    })

    const isShipper =
      user?.shipperProfile &&
      booking.load.shipperProfileId === user.shipperProfile.id
    const isTrucker =
      user?.truckerProfile &&
      booking.truckerProfileId === user.truckerProfile.id

    if (!isShipper && !isTrucker) {
      return Response.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    // Shipper can only cancel
    if (isShipper && !isTrucker) {
      if (newStatus !== "CANCELLED") {
        return Response.json(
          { success: false, error: "Shippers can only cancel bookings" },
          { status: 403 }
        )
      }
    }

    // Trucker can update to IN_TRANSIT, DELIVERED, or DISPUTED
    if (isTrucker && !isShipper) {
      const truckerAllowed: BookingStatus[] = ["IN_TRANSIT", "DELIVERED", "DISPUTED"]
      if (!truckerAllowed.includes(newStatus as BookingStatus)) {
        return Response.json(
          {
            success: false,
            error: `Truckers can only update to: ${truckerAllowed.join(", ")}`,
          },
          { status: 403 }
        )
      }
    }

    // Perform the update in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status: newStatus as BookingStatus },
        include: {
          load: { include: { shipperProfile: true } },
          truckerProfile: {
            include: { user: { select: { name: true, phone: true } } },
          },
        },
      })

      // Sync load status if applicable
      const loadStatus = LOAD_STATUS_MAP[newStatus]
      if (loadStatus) {
        await tx.load.update({
          where: { id: booking.loadId },
          data: { status: loadStatus },
        })
      }

      return updatedBooking
    })

    await publishEvent("bookings", "status-changed", {
      bookingId: id,
      loadId: booking.loadId,
      oldStatus: booking.status,
      newStatus,
    })

    return Response.json({ success: true, data: updated })
  } catch (error) {
    console.error("PATCH /api/bookings/[id]/status error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
