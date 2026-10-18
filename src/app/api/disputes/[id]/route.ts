import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            load: {
              select: {
                cargoType: true,
                originAddress: true,
                destAddress: true,
                pickupDate: true,
                weightTons: true,
              },
            },
          },
        },
        filedBy: { select: { name: true, email: true } },
        resolvedBy: { select: { name: true, email: true } },
      },
    })

    if (!dispute) {
      return Response.json({ success: false, error: "Dispute not found" }, { status: 404 })
    }

    return Response.json({ success: true, data: dispute })
  } catch (error) {
    console.error("GET /api/disputes/[id] error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { counterEvidence, counterPhotos, appealReason } = body

    const dispute = await prisma.dispute.findUnique({ where: { id } })
    if (!dispute) {
      return Response.json({ success: false, error: "Dispute not found" }, { status: 404 })
    }

    // Handle appeal
    if (appealReason) {
      if (dispute.status !== "RESOLVED") {
        return Response.json(
          { success: false, error: "Can only appeal resolved disputes" },
          { status: 400 }
        )
      }

      // Check 7-day appeal window
      if (dispute.resolvedAt) {
        const daysSinceResolution =
          (Date.now() - new Date(dispute.resolvedAt).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceResolution > 7) {
          return Response.json(
            { success: false, error: "Appeal window has expired (7 days)" },
            { status: 400 }
          )
        }
      }

      const updated = await prisma.dispute.update({
        where: { id },
        data: {
          status: "APPEALED",
          appealedAt: new Date(),
          appealReason,
        },
      })
      return Response.json({ success: true, data: updated })
    }

    // Handle counter-evidence
    if (counterEvidence || counterPhotos) {
      const updated = await prisma.dispute.update({
        where: { id },
        data: {
          counterEvidence: counterEvidence || dispute.counterEvidence,
          counterPhotos: counterPhotos || dispute.counterPhotos,
        },
      })
      return Response.json({ success: true, data: updated })
    }

    return Response.json({ success: false, error: "No valid update provided" }, { status: 400 })
  } catch (error) {
    console.error("PATCH /api/disputes/[id] error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
