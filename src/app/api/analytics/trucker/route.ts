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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { truckerProfile: { include: { trucks: true } } },
    })

    if (!user?.truckerProfile) {
      return Response.json(
        { success: false, error: "Trucker profile required" },
        { status: 403 }
      )
    }

    const profileId = user.truckerProfile.id

    const bookings = await prisma.booking.findMany({
      where: { truckerProfileId: profileId },
      include: {
        load: true,
      },
    })

    const completedBookings = bookings.filter(
      (b) => b.status === "DELIVERED" || b.status === "COMPLETED"
    )
    const activeBookings = bookings.filter(
      (b) => b.status === "CONFIRMED" || b.status === "IN_TRANSIT"
    )

    const totalEarnings = completedBookings.reduce(
      (sum, b) => sum + (b.agreedRate - b.platformFeeTrucker),
      0
    )

    // Total distance
    const totalKm = completedBookings.reduce(
      (sum, b) => sum + (b.load?.distanceKm || 0),
      0
    )
    const revenuePerKm = totalKm > 0 ? Math.round(totalEarnings / totalKm) : 0

    // Utilization: days with bookings vs total days in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentBookings = bookings.filter(
      (b) => new Date(b.createdAt) >= thirtyDaysAgo
    )
    const activeDays = new Set(
      recentBookings.map((b) => new Date(b.createdAt).toDateString())
    ).size
    const utilizationPercent = Math.round((activeDays / 30) * 100)

    // Earnings by month (last 6 months)
    const monthlyEarnings: { month: string; amount: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = d.toLocaleDateString("en-PH", { month: "short", year: "2-digit" })
      const monthBookings = completedBookings.filter((b) => {
        const bd = new Date(b.createdAt)
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear()
      })
      const amount = monthBookings.reduce(
        (s, b) => s + (b.agreedRate - b.platformFeeTrucker),
        0
      )
      monthlyEarnings.push({ month: monthLabel, amount })
    }

    // Top routes
    const routeMap = new Map<string, { origin: string; dest: string; trips: number; totalEarned: number }>()
    for (const b of completedBookings) {
      const key = `${b.load.originAddress}|${b.load.destAddress}`
      const existing = routeMap.get(key) || {
        origin: b.load.originAddress,
        dest: b.load.destAddress,
        trips: 0,
        totalEarned: 0,
      }
      existing.trips++
      existing.totalEarned += b.agreedRate - b.platformFeeTrucker
      routeMap.set(key, existing)
    }
    const topRoutes = Array.from(routeMap.values())
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 5)

    // Fleet utilization per truck
    const trucks = user.truckerProfile.trucks
    const fleetUtilization = trucks.map((truck) => {
      const truckBookings = completedBookings.filter((b) => {
        return b.load?.preferredTruck === truck.truckType
      })
      const truckRevenue = truckBookings.reduce(
        (s, b) => s + (b.agreedRate - b.platformFeeTrucker),
        0
      )
      const truckActiveDays = new Set(
        truckBookings.map((b) => new Date(b.createdAt).toDateString())
      ).size
      return {
        plateNumber: truck.plateNumber,
        truckType: truck.truckType.replace(/_/g, " "),
        trips: truckBookings.length,
        idleDays: Math.max(0, 30 - truckActiveDays),
        revenue: truckRevenue,
      }
    })

    return Response.json({
      success: true,
      data: {
        summary: {
          totalEarnings,
          activeBookings: activeBookings.length,
          utilizationPercent,
          revenuePerKm,
        },
        monthlyEarnings,
        topRoutes,
        fleetUtilization,
      },
    })
  } catch (error) {
    console.error("GET /api/analytics/trucker error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
