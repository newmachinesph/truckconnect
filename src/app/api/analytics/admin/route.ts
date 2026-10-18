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

    // Fetch all bookings with loads
    const bookings = await prisma.booking.findMany({
      include: {
        load: true,
      },
    })

    const completedBookings = bookings.filter(
      (b) => b.status === "DELIVERED" || b.status === "COMPLETED"
    )

    // GMV: total agreed rates
    const gmv = completedBookings.reduce((sum, b) => sum + b.agreedRate, 0)

    // Platform revenue: sum of platform fees
    const platformRevenue = completedBookings.reduce(
      (sum, b) => sum + b.platformFeeShipper + b.platformFeeTrucker,
      0
    )

    // Active users
    const activeUsers = await prisma.user.count({
      where: { isActive: true },
    })

    // Dispute rate
    const disputes = await prisma.dispute.count()
    const disputeRate = bookings.length > 0
      ? Math.round((disputes / bookings.length) * 100)
      : 0

    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
      where: { isActive: true },
    })

    const roleBreakdown = usersByRole.map((r) => ({
      role: r.role || "UNSET",
      count: r._count,
    }))

    // Top corridors
    const corridorMap = new Map<string, { origin: string; dest: string; count: number; gmv: number }>()
    for (const b of completedBookings) {
      const key = `${b.load.originAddress}|${b.load.destAddress}`
      const existing = corridorMap.get(key) || {
        origin: b.load.originAddress,
        dest: b.load.destAddress,
        count: 0,
        gmv: 0,
      }
      existing.count++
      existing.gmv += b.agreedRate
      corridorMap.set(key, existing)
    }
    const topCorridors = Array.from(corridorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // Monthly metrics (last 6 months)
    const monthlyMetrics: { month: string; gmv: number; bookings: number; revenue: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = d.toLocaleDateString("en-PH", { month: "short", year: "2-digit" })
      const monthBookings = completedBookings.filter((b) => {
        const bd = new Date(b.createdAt)
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear()
      })
      const monthGmv = monthBookings.reduce((s, b) => s + b.agreedRate, 0)
      const monthRevenue = monthBookings.reduce(
        (s, b) => s + b.platformFeeShipper + b.platformFeeTrucker,
        0
      )
      monthlyMetrics.push({
        month: monthLabel,
        gmv: monthGmv,
        bookings: monthBookings.length,
        revenue: monthRevenue,
      })
    }

    return Response.json({
      success: true,
      data: {
        summary: {
          gmv,
          activeUsers,
          platformRevenue,
          disputeRate,
        },
        roleBreakdown,
        topCorridors,
        monthlyMetrics,
      },
    })
  } catch (error) {
    console.error("GET /api/analytics/admin error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
