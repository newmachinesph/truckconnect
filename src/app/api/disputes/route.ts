import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const disputes = await prisma.dispute.findMany({
      where: { filedById: session.user.id },
      include: {
        booking: {
          include: {
            load: {
              select: { cargoType: true, originAddress: true, destAddress: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json({ success: true, data: disputes })
  } catch (error) {
    console.error("GET /api/disputes error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, type, description, evidencePhotos, evidenceNotes } = body

    if (!bookingId || !type || !description) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify user is a party to this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        load: { include: { shipperProfile: { select: { userId: true } } } },
        truckerProfile: { select: { userId: true } },
      },
    })

    if (!booking) {
      return Response.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    const isParty = booking.load.shipperProfile?.userId === session.user.id ||
      booking.truckerProfile?.userId === session.user.id
    if (!isParty) {
      return Response.json(
        { success: false, error: "You can only dispute bookings you participated in" },
        { status: 403 }
      )
    }

    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        filedById: session.user.id,
        type,
        description,
        evidencePhotos: evidencePhotos || [],
        evidenceNotes: evidenceNotes || null,
        counterPhotos: [],
      },
    })

    return Response.json({ success: true, data: dispute }, { status: 201 })
  } catch (error) {
    console.error("POST /api/disputes error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
