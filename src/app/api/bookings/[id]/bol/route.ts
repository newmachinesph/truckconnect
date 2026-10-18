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
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify user is a party to this booking
    const booking = await prisma.booking.findUnique({
      where: { id },
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

    const userRole = (session.user as any).role
    if (userRole !== "ADMIN") {
      const isParty = booking.load.shipperProfile?.userId === session.user.id ||
        booking.truckerProfile?.userId === session.user.id
      if (!isParty) {
        return Response.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        )
      }
    }

    const billOfLading = await prisma.billOfLading.findUnique({
      where: { bookingId: id },
    })

    if (!billOfLading) {
      return Response.json(
        { success: false, error: "Bill of Lading not found" },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: billOfLading })
  } catch (error) {
    console.error("GET /api/bookings/[id]/bol error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
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
    const body = await request.json()

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { load: true },
    })

    if (!booking) {
      return Response.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    // Verify user is a party to this booking
    const shipperUserId = await prisma.shipperProfile.findUnique({
      where: { id: booking.load.shipperProfileId },
      select: { userId: true },
    })
    const truckerUserId = await prisma.truckerProfile.findUnique({
      where: { id: booking.truckerProfileId },
      select: { userId: true },
    })
    const userRole = (session.user as any).role
    if (userRole !== "ADMIN") {
      const isParty = shipperUserId?.userId === session.user.id ||
        truckerUserId?.userId === session.user.id
      if (!isParty) {
        return Response.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        )
      }
    }

    const referenceNumber = `BOL-${Date.now().toString(36).toUpperCase()}`
    const cargoDescription =
      body.cargoDescription ?? `${booking.load.cargoType} - ${booking.load.weightTons}T`

    const status = body.shipperSignature ? "SIGNED" : "DRAFT"

    const billOfLading = await prisma.billOfLading.upsert({
      where: { bookingId: id },
      create: {
        bookingId: id,
        referenceNumber,
        cargoDescription,
        declaredValue: body.declaredValue ?? null,
        sealNumber: body.sealNumber ?? null,
        specialInstructions: body.specialInstructions ?? null,
        discrepancyNotes: body.discrepancyNotes ?? null,
        shipperSignature: body.shipperSignature ?? null,
        signedAt: body.shipperSignature ? new Date() : null,
        preLoadPhotos: body.preLoadPhotos ?? [],
        status,
      },
      update: {
        cargoDescription,
        declaredValue: body.declaredValue ?? undefined,
        sealNumber: body.sealNumber ?? undefined,
        specialInstructions: body.specialInstructions ?? undefined,
        discrepancyNotes: body.discrepancyNotes ?? undefined,
        shipperSignature: body.shipperSignature ?? undefined,
        signedAt: body.shipperSignature ? new Date() : undefined,
        preLoadPhotos: body.preLoadPhotos ?? undefined,
        status: body.shipperSignature ? "SIGNED" : undefined,
      },
    })

    return Response.json({ success: true, data: billOfLading })
  } catch (error) {
    console.error("POST /api/bookings/[id]/bol error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
