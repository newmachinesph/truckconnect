import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    if ((session.user as any).role !== "ADMIN") {
      return Response.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      )
    }

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalShippers,
      totalTruckers,
      totalAdmins,
      activeTruckers,
      activeShippers,
      loadsOpen,
      loadsBooked,
      loadsInTransit,
      loadsDelivered,
      loadsCancelled,
      bookingsConfirmed,
      bookingsInTransit,
      bookingsDelivered,
      bookingsCompleted,
      bookingsCancelled,
      bookingsDisputed,
      revenueResult,
      recentLoads24h,
      recentLoads7d,
      recentBookings24h,
      recentBookings7d,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "SHIPPER" } }),
      prisma.user.count({ where: { role: "TRUCKER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.truckerProfile.count({ where: { isAvailable: true } }),
      prisma.shipperProfile.count(),
      prisma.load.count({ where: { status: "OPEN" } }),
      prisma.load.count({ where: { status: "BOOKED" } }),
      prisma.load.count({ where: { status: "IN_TRANSIT" } }),
      prisma.load.count({ where: { status: "DELIVERED" } }),
      prisma.load.count({ where: { status: "CANCELLED" } }),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.booking.count({ where: { status: "IN_TRANSIT" } }),
      prisma.booking.count({ where: { status: "DELIVERED" } }),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
      prisma.booking.count({ where: { status: "CANCELLED" } }),
      prisma.booking.count({ where: { status: "DISPUTED" } }),
      prisma.booking.aggregate({
        _sum: {
          platformFeeShipper: true,
          platformFeeTrucker: true,
        },
      }),
      prisma.load.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.load.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.booking.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.booking.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ])

    const totalPlatformFees =
      (revenueResult._sum.platformFeeShipper || 0) +
      (revenueResult._sum.platformFeeTrucker || 0)

    return Response.json({
      success: true,
      data: {
        users: {
          totalShippers,
          totalTruckers,
          totalAdmins,
          total: totalShippers + totalTruckers + totalAdmins,
          activeTruckers,
          activeShippers,
        },
        loads: {
          total: loadsOpen + loadsBooked + loadsInTransit + loadsDelivered + loadsCancelled,
          open: loadsOpen,
          booked: loadsBooked,
          inTransit: loadsInTransit,
          delivered: loadsDelivered,
          cancelled: loadsCancelled,
        },
        bookings: {
          total: bookingsConfirmed + bookingsInTransit + bookingsDelivered + bookingsCompleted + bookingsCancelled + bookingsDisputed,
          confirmed: bookingsConfirmed,
          inTransit: bookingsInTransit,
          delivered: bookingsDelivered,
          completed: bookingsCompleted,
          cancelled: bookingsCancelled,
          disputed: bookingsDisputed,
        },
        revenue: {
          totalPlatformFees,
        },
        recentActivity: {
          loadsLast24h: recentLoads24h,
          loadsLast7d: recentLoads7d,
          bookingsLast24h: recentBookings24h,
          bookingsLast7d: recentBookings7d,
        },
      },
    })
  } catch (error) {
    console.error("GET /api/admin/stats error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
