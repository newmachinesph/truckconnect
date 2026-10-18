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
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const method = body.method ?? "GCASH"

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

    // Only the shipper (payer) should be initiating payment
    const shipperProfile = await prisma.shipperProfile.findFirst({
      where: { userId: session.user.id },
    })

    if (!shipperProfile || booking.load.shipperProfileId !== shipperProfile.id) {
      return Response.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    const totalAmount = booking.agreedRate + booking.platformFeeShipper
    const netAmount = booking.agreedRate - booking.platformFeeTrucker
    const receiptNumber = `RC-${Date.now().toString(36).toUpperCase()}`

    // Find the trucker's userId for payeeId
    const truckerProfile = await prisma.truckerProfile.findUnique({
      where: { id: booking.truckerProfileId },
    })

    if (!truckerProfile) {
      return Response.json(
        { success: false, error: "Trucker profile not found" },
        { status: 404 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId: id,
        payerId: session.user.id,
        payeeId: truckerProfile.userId,
        amount: totalAmount,
        platformFee: booking.platformFeeShipper + booking.platformFeeTrucker,
        netAmount,
        method,
        status: "ESCROW_HELD",
        escrowHeldAt: new Date(),
        receiptNumber,
      },
    })

    return Response.json({ success: true, data: payment })
  } catch (error) {
    console.error("POST /api/bookings/[id]/pay error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
