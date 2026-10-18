import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const truckerProfile = await prisma.truckerProfile.findFirst({
      where: { userId: session.user.id },
    })

    if (!truckerProfile) {
      return Response.json({ success: false, error: "Trucker profile required" }, { status: 403 })
    }

    const bookings = await prisma.booking.findMany({
      where: { truckerProfileId: truckerProfile.id },
      include: {
        load: {
          select: {
            originAddress: true,
            destAddress: true,
            cargoType: true,
            pickupDate: true,
          },
        },
        payments: {
          where: { payeeId: session.user.id },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const totalEarnings = bookings.reduce((sum, b) => {
      const earned = b.agreedRate - b.platformFeeTrucker
      return sum + (b.status === "COMPLETED" || b.status === "DELIVERED" ? earned : 0)
    }, 0)

    const pendingEarnings = bookings.reduce((sum, b) => {
      const earned = b.agreedRate - b.platformFeeTrucker
      return sum + (b.status === "CONFIRMED" || b.status === "IN_TRANSIT" ? earned : 0)
    }, 0)

    const completedTrips = bookings.filter(
      (b) => b.status === "COMPLETED" || b.status === "DELIVERED"
    ).length

    return Response.json({
      success: true,
      data: {
        totalEarnings,
        pendingEarnings,
        completedTrips,
        bookings: bookings.map((b) => ({
          id: b.id,
          waybillNumber: b.waybillNumber,
          status: b.status,
          agreedRate: b.agreedRate,
          platformFee: b.platformFeeTrucker,
          netEarning: b.agreedRate - b.platformFeeTrucker,
          load: b.load,
          paymentStatus: b.payments[0]?.status ?? "PENDING",
          createdAt: b.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error("GET /api/earnings error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
