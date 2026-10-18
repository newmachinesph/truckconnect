import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const reviews = await prisma.review.findMany({
      where: { revieweeId: id },
      include: {
        reviewer: {
          select: { name: true, image: true },
        },
        booking: {
          select: {
            waybillNumber: true,
            load: {
              select: { originAddress: true, destAddress: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length
      : 0

    return Response.json({
      success: true,
      data: {
        reviews,
        avgRating,
        totalReviews: reviews.length,
      },
    })
  } catch (error) {
    console.error("GET /api/users/[id]/reviews error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
