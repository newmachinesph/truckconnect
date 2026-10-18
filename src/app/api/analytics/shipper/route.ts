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
      include: { shipperProfile: true },
    })

    if (!user?.shipperProfile) {
      return Response.json(
        { success: false, error: "Shipper profile required" },
        { status: 403 }
      )
    }

    const profileId = user.shipperProfile.id

    // Get all loads for this shipper
    const loads = await prisma.load.findMany({
      where: { shipperProfileId: profileId },
      include: {
        booking: {
          include: {
            truckerProfile: {
              include: { user: { select: { name: true } } },
            },
            reviews: true,
          },
        },
      },
    })

    const bookings = loads
      .map((l) => l.booking)
      .filter(Boolean)

    const completedBookings = bookings.filter(
      (b) => b!.status === "DELIVERED" || b!.status === "COMPLETED"
    )

    const totalSpend = completedBookings.reduce(
      (sum, b) => sum + (b!.agreedRate || 0),
      0
    )
    const activeLoads = loads.filter((l) => l.status === "OPEN" || l.status === "BOOKED" || l.status === "IN_TRANSIT").length
    const avgCostPerLoad = completedBookings.length > 0 ? totalSpend / completedBookings.length : 0

    // On-time delivery % (demo: simulate based on completed bookings)
    const onTimeCount = Math.round(completedBookings.length * 0.87)
    const onTimePercent = completedBookings.length > 0
      ? Math.round((onTimeCount / completedBookings.length) * 100)
      : 0

    // Spend by month (last 6 months)
    const monthlySpend: { month: string; amount: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = d.toLocaleDateString("en-PH", { month: "short", year: "2-digit" })
      const monthBookings = completedBookings.filter((b) => {
        const bd = new Date(b!.createdAt)
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear()
      })
      const amount = monthBookings.reduce((s, b) => s + (b!.agreedRate || 0), 0)
      monthlySpend.push({ month: monthLabel, amount })
    }

    // Top carriers
    const carrierMap = new Map<string, { name: string; trips: number; totalSpend: number; totalRating: number; ratingCount: number }>()
    for (const b of completedBookings) {
      const name = b!.truckerProfile?.user?.name || "Unknown"
      const key = b!.truckerProfileId
      const existing = carrierMap.get(key) || { name, trips: 0, totalSpend: 0, totalRating: 0, ratingCount: 0 }
      existing.trips++
      existing.totalSpend += b!.agreedRate || 0
      if (b!.reviews?.length) {
        for (const r of b!.reviews) {
          existing.totalRating += r.overallRating
          existing.ratingCount++
        }
      }
      carrierMap.set(key, existing)
    }
    const topCarriers = Array.from(carrierMap.values())
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 5)
      .map((c) => ({
        name: c.name,
        trips: c.trips,
        totalSpend: c.totalSpend,
        avgRating: c.ratingCount > 0 ? (c.totalRating / c.ratingCount).toFixed(1) : "N/A",
      }))

    // Route frequency
    const routeMap = new Map<string, { origin: string; dest: string; count: number; totalCost: number }>()
    for (const load of loads) {
      if (!load.booking) continue
      const key = `${load.originAddress}|${load.destAddress}`
      const existing = routeMap.get(key) || {
        origin: load.originAddress,
        dest: load.destAddress,
        count: 0,
        totalCost: 0,
      }
      existing.count++
      existing.totalCost += load.booking.agreedRate || 0
      routeMap.set(key, existing)
    }
    const routeFrequency = Array.from(routeMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((r) => ({
        ...r,
        avgCost: r.count > 0 ? Math.round(r.totalCost / r.count) : 0,
      }))

    return Response.json({
      success: true,
      data: {
        summary: {
          totalSpend,
          activeLoads,
          avgCostPerLoad: Math.round(avgCostPerLoad),
          onTimePercent,
        },
        monthlySpend,
        topCarriers,
        routeFrequency,
      },
    })
  } catch (error) {
    console.error("GET /api/analytics/shipper error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
