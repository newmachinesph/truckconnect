import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = request.nextUrl
    const truckType = searchParams.get("truckType")
    const minRating = searchParams.get("minRating")
    const minTrips = searchParams.get("minTrips")
    const experienceTag = searchParams.get("experienceTag")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {
      isAvailable: true,
    }

    if (truckType) {
      where.trucks = { some: { truckType } }
    }

    if (minTrips) {
      where.completedTrips = { gte: parseInt(minTrips) }
    }

    if (experienceTag) {
      where.experienceTags = { has: experienceTag }
    }

    if (search) {
      where.user = {
        name: { contains: search, mode: "insensitive" },
      }
    }

    const carriers = await prisma.truckerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            reviewsReceived: {
              select: { overallRating: true },
            },
          },
        },
        trucks: {
          select: {
            id: true,
            truckType: true,
            capacityTons: true,
            plateNumber: true,
          },
        },
      },
      orderBy: { completedTrips: "desc" },
      take: 20,
    })

    // Compute average ratings and filter by minRating if specified
    const carriersWithRatings = carriers.map((carrier) => {
      const reviews = carrier.user.reviewsReceived
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
          : 0
      const reviewCount = reviews.length

      return {
        id: carrier.id,
        userId: carrier.user.id,
        name: carrier.user.name,
        image: carrier.user.image,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount,
        completedTrips: carrier.completedTrips,
        experienceTags: carrier.experienceTags,
        preferredRegions: carrier.preferredRegions,
        isAvailable: carrier.isAvailable,
        trucks: carrier.trucks,
      }
    })

    // Filter by rating if specified
    const filtered = minRating
      ? carriersWithRatings.filter((c) => c.avgRating >= parseFloat(minRating))
      : carriersWithRatings

    return Response.json({ success: true, data: filtered })
  } catch (error) {
    console.error("GET /api/carriers error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
