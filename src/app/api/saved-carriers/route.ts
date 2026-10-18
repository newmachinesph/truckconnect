import { NextRequest } from "next/server"
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

    const saved = await prisma.savedCarrier.findMany({
      where: { shipperId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    // Fetch carrier details for each saved carrier
    const carrierIds = saved.map((s) => s.carrierId)
    const carriers = await prisma.truckerProfile.findMany({
      where: {
        user: { id: { in: carrierIds } },
      },
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
          },
        },
      },
    })

    const data = carriers.map((carrier) => {
      const reviews = carrier.user.reviewsReceived
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
          : 0
      const savedEntry = saved.find((s) => s.carrierId === carrier.user.id)

      return {
        savedId: savedEntry?.id,
        id: carrier.id,
        userId: carrier.user.id,
        name: carrier.user.name,
        image: carrier.user.image,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
        completedTrips: carrier.completedTrips,
        experienceTags: carrier.experienceTags,
        isAvailable: carrier.isAvailable,
        trucks: carrier.trucks,
        savedAt: savedEntry?.createdAt,
        notes: savedEntry?.notes,
      }
    })

    return Response.json({ success: true, data })
  } catch (error) {
    console.error("GET /api/saved-carriers error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { carrierId, notes } = body

    if (!carrierId) {
      return Response.json(
        { success: false, error: "carrierId is required" },
        { status: 400 }
      )
    }

    const saved = await prisma.savedCarrier.upsert({
      where: {
        shipperId_carrierId: {
          shipperId: session.user.id,
          carrierId,
        },
      },
      create: {
        shipperId: session.user.id,
        carrierId,
        notes: notes || null,
      },
      update: {
        notes: notes || null,
      },
    })

    return Response.json({ success: true, data: saved }, { status: 201 })
  } catch (error) {
    console.error("POST /api/saved-carriers error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = request.nextUrl
    const carrierId = searchParams.get("carrierId")

    if (!carrierId) {
      return Response.json(
        { success: false, error: "carrierId is required" },
        { status: 400 }
      )
    }

    await prisma.savedCarrier.delete({
      where: {
        shipperId_carrierId: {
          shipperId: session.user.id,
          carrierId,
        },
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/saved-carriers error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
