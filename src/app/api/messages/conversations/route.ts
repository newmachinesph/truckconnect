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
      include: { shipperProfile: true, truckerProfile: true },
    })

    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Build where clause based on user role
    let whereClause: Record<string, unknown>

    if (user.shipperProfile) {
      whereClause = { load: { shipperProfileId: user.shipperProfile.id } }
    } else if (user.truckerProfile) {
      whereClause = { truckerProfileId: user.truckerProfile.id }
    } else {
      return Response.json({ success: true, data: [] })
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        load: {
          include: {
            shipperProfile: {
              include: { user: { select: { name: true } } },
            },
          },
        },
        truckerProfile: {
          include: { user: { select: { name: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: session.user.id },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    const conversations = bookings.map((booking) => {
      const isShipper = user.shipperProfile !== null
      const otherPartyName = isShipper
        ? booking.truckerProfile.user.name || "Trucker"
        : booking.load.shipperProfile.user.name || "Shipper"

      const lastMessage = booking.messages[0] || null

      return {
        bookingId: booking.id,
        status: booking.status,
        otherPartyName,
        originAddress: booking.load.originAddress,
        destAddress: booking.load.destAddress,
        lastMessage: lastMessage?.content || null,
        lastMessageAt: lastMessage?.createdAt || null,
        unreadCount: booking._count.messages,
      }
    })

    return Response.json({ success: true, data: conversations })
  } catch (error) {
    console.error("GET /api/messages/conversations error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
