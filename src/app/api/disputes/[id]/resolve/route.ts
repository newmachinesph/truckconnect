import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || user.role !== "ADMIN") {
      return Response.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { resolution, status } = body

    if (!resolution || !status) {
      return Response.json(
        { success: false, error: "Resolution and status are required" },
        { status: 400 }
      )
    }

    const validStatuses = ["UNDER_REVIEW", "RESOLVED", "CLOSED"]
    if (!validStatuses.includes(status)) {
      return Response.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      )
    }

    const dispute = await prisma.dispute.update({
      where: { id },
      data: {
        status,
        resolution,
        resolvedById: session.user.id,
        resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : undefined,
      },
    })

    return Response.json({ success: true, data: dispute })
  } catch (error) {
    console.error("POST /api/disputes/[id]/resolve error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
