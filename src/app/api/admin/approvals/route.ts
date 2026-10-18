import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if ((session.user as any).role !== "ADMIN") {
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const filter = searchParams.get("filter") || "PENDING"

    // Get truckers with their documents and trucks, filtered by document status
    const statusMap: Record<string, string[]> = {
      PENDING: ["PENDING"],
      APPROVED: ["VERIFIED"],
      REJECTED: ["REJECTED"],
    }

    const statuses = statusMap[filter] || ["PENDING"]

    const documents = await prisma.document.findMany({
      where: {
        status: { in: statuses as any },
        type: { in: ["LTFRB_CERTIFICATE", "VEHICLE_OR_CR", "CARGO_INSURANCE", "DRIVER_LICENSE", "GOVERNMENT_ID"] },
      },
      include: {
        user: {
          include: {
            truckerProfile: {
              include: {
                trucks: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Group by user
    const userMap = new Map<string, any>()
    for (const doc of documents) {
      if (!userMap.has(doc.userId)) {
        const trucks = doc.user.truckerProfile?.trucks || []
        userMap.set(doc.userId, {
          id: doc.userId,
          name: doc.user.name || "Unknown Carrier",
          email: doc.user.email,
          registeredAt: doc.user.createdAt,
          documents: [],
          truckCount: trucks.length,
          truckTypes: trucks.map((t: any) => t.truckType),
        })
      }
      userMap.get(doc.userId).documents.push({
        id: doc.id,
        type: doc.type,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        status: doc.status,
        createdAt: doc.createdAt,
      })
    }

    const approvals = Array.from(userMap.values())

    return Response.json({ success: true, data: approvals })
  } catch (error) {
    console.error("GET /api/admin/approvals error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

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
    const { userId, action, reason } = body

    if (!userId || !action) {
      return Response.json({ success: false, error: "userId and action are required" }, { status: 400 })
    }

    if (action !== "approve" && action !== "reject") {
      return Response.json({ success: false, error: "action must be approve or reject" }, { status: 400 })
    }

    const newStatus = action === "approve" ? "VERIFIED" : "REJECTED"

    // Update all pending documents for this user
    await prisma.document.updateMany({
      where: { userId, status: "PENDING" },
      data: {
        status: newStatus as any,
        verifiedAt: action === "approve" ? new Date() : undefined,
      },
    })

    // If approving, also verify their trucks
    if (action === "approve") {
      const truckerProfile = await prisma.truckerProfile.findUnique({
        where: { userId },
      })
      if (truckerProfile) {
        await prisma.truck.updateMany({
          where: { truckerProfileId: truckerProfile.id },
          data: { isVerified: true },
        })
      }
    }

    // Send notification to the user
    await prisma.notification.create({
      data: {
        userId,
        type: action === "approve" ? "APPROVAL_APPROVED" : "APPROVAL_REJECTED",
        title: action === "approve" ? "Registration Approved" : "Registration Rejected",
        body:
          action === "approve"
            ? "Your carrier registration has been approved. You can now accept bookings."
            : `Your carrier registration was not approved. Reason: ${reason || "Not specified"}`,
        data: { action, reason },
      },
    })

    return Response.json({ success: true, data: { action, userId } })
  } catch (error) {
    console.error("POST /api/admin/approvals error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
