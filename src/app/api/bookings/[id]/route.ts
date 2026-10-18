import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { publishEvent } from "@/lib/sse"

const VALID_TRANSITIONS: Record<string, string[]> = {
  CONFIRMED: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
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

    const { id } = await params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        load: {
          include: { shipperProfile: { include: { user: { select: { id: true } } } } },
        },
        truckerProfile: {
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, role: true } },
          },
        },
        trackingPoints: {
          orderBy: { timestamp: "desc" },
          take: 50,
        },
      },
    })

    if (!booking) {
      return Response.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    // Verify user is a party to this booking or admin
    const userRole = (session.user as any).role
    const userId = session.user.id
    if (userRole !== "ADMIN") {
      const isShipper = booking.load.shipperProfile?.userId === userId
      const isTrucker = booking.truckerProfile?.user?.id === userId
      if (!isShipper && !isTrucker) {
        return Response.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        )
      }
    }

    return Response.json({ success: true, data: booking })
  } catch (error) {
    console.error("GET /api/bookings/[id] error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

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

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        load: { include: { shipperProfile: { select: { userId: true } } } },
        truckerProfile: { select: { userId: true } },
      },
    })

    if (!booking) {
      return Response.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    // Verify user is a party to this booking
    const userRole = (session.user as any).role
    if (userRole !== "ADMIN") {
      const isShipper = booking.load.shipperProfile?.userId === session.user.id
      const isTrucker = booking.truckerProfile?.userId === session.user.id
      if (!isShipper && !isTrucker) {
        return Response.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        )
      }
    }

    // Check valid state transition
    const allowed = VALID_TRANSITIONS[booking.status]
    if (!allowed || !allowed.includes(newStatus)) {
      return Response.json(
        {
          success: false,
          error: `Cannot transition from ${booking.status} to ${newStatus}`,
        },
        { status: 400 }
      )
    }

    // Map booking status to load status for sync
    const loadStatusMap: Record<string, string> = {
      IN_TRANSIT: "IN_TRANSIT",
      DELIVERED: "DELIVERED",
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status: newStatus },
        include: {
          load: { include: { shipperProfile: true } },
          truckerProfile: true,
        },
      })

      // Sync load status if applicable
      if (loadStatusMap[newStatus]) {
        await tx.load.update({
          where: { id: booking.loadId },
          data: { status: loadStatusMap[newStatus] as "IN_TRANSIT" | "DELIVERED" },
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
    console.error("PATCH /api/bookings/[id] error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
