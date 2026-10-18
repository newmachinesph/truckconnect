import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if ((session.user as any).role !== "ADMIN") {
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { title, body: messageBody, audience } = body

    if (!title || !messageBody || !audience) {
      return Response.json(
        { success: false, error: "title, body, and audience are required" },
        { status: 400 }
      )
    }

    // Find target users based on audience
    const whereClause: any = { isActive: true }
    if (audience === "shippers") {
      whereClause.role = "SHIPPER"
    } else if (audience === "truckers") {
      whereClause.role = "TRUCKER"
    }
    // "all" means no role filter

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    })

    // Create notifications for all targeted users
    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((user) => ({
          userId: user.id,
          type: "BROADCAST",
          title,
          body: messageBody,
          data: { audience, sentBy: session.user!.id },
        })),
      })
    }

    return Response.json({
      success: true,
      data: { recipientCount: users.length },
    })
  } catch (error) {
    console.error("POST /api/admin/broadcast error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
