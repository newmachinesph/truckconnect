import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  _request: Request,
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

    const carrier = await prisma.truckerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            createdAt: true,
            reviewsReceived: {
              include: {
                reviewer: {
                  select: { id: true, name: true, image: true },
                },
                booking: {
                  select: {
                    load: {
                      select: { originAddress: true, destAddress: true },
                    },
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        },
        trucks: true,
      },
    })

    if (!carrier) {
      return Response.json(
        { success: false, error: "Carrier not found" },
        { status: 404 }
      )
    }

    const reviews = carrier.user.reviewsReceived
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
        : 0

    const ratingBreakdown = {
      onTime:
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.onTimeRating, 0) / reviews.length
          : 0,
      cargoCare:
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.cargoCareRating, 0) / reviews.length
          : 0,
      communication:
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.communicationRating, 0) / reviews.length
          : 0,
      professionalism:
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.professionalismRating, 0) / reviews.length
          : 0,
    }

    // Check if this carrier is saved by the current user
    const savedCarrier = await prisma.savedCarrier.findUnique({
      where: {
        shipperId_carrierId: {
          shipperId: session.user.id,
          carrierId: carrier.user.id,
        },
      },
    })

    const data = {
      id: carrier.id,
      userId: carrier.user.id,
      name: carrier.user.name,
      image: carrier.user.image,
      memberSince: carrier.user.createdAt,
      avgRating: Math.round(avgRating * 10) / 10,
      ratingBreakdown,
      reviewCount: reviews.length,
      completedTrips: carrier.completedTrips,
      experienceTags: carrier.experienceTags,
      preferredRegions: carrier.preferredRegions,
      ltfrbAccreditation: carrier.ltfrbAccreditation,
      isAvailable: carrier.isAvailable,
      isSaved: !!savedCarrier,
      trucks: carrier.trucks.map((t) => ({
        id: t.id,
        plateNumber: t.plateNumber,
        truckType: t.truckType,
        capacityTons: t.capacityTons,
        lengthFt: t.lengthFt,
        widthFt: t.widthFt,
        heightFt: t.heightFt,
        photoUrl: t.photoUrl,
        isVerified: t.isVerified,
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        reviewerName: r.reviewer.name,
        reviewerImage: r.reviewer.image,
        overallRating: r.overallRating,
        comment: r.comment,
        response: r.response,
        route: r.booking?.load
          ? `${r.booking.load.originAddress} -> ${r.booking.load.destAddress}`
          : null,
        createdAt: r.createdAt,
      })),
    }

    return Response.json({ success: true, data })
  } catch (error) {
    console.error("GET /api/carriers/[id] error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
