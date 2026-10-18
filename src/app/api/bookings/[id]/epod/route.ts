import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { publishEvent } from "@/lib/sse"

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { truckerProfile: true },
    })

    if (user?.role !== "TRUCKER" || !user.truckerProfile) {
      return Response.json(
        { success: false, error: "Trucker access only" },
        { status: 403 }
      )
    }

    const { id: bookingId } = await params

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return Response.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    if (booking.truckerProfileId !== user.truckerProfile.id) {
      return Response.json(
        { success: false, error: "Not your booking" },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const photo = formData.get("photo") as File | null

    if (!photo) {
      return Response.json(
        { success: false, error: "Photo file is required" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!photo.type.startsWith("image/")) {
      return Response.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (photo.size > 5 * 1024 * 1024) {
      return Response.json(
        { success: false, error: "File size must be under 5MB" },
        { status: 400 }
      )
    }

    // Convert to base64 data URL (temporary storage approach)
    const bytes = await photo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUrl = `data:${photo.type};base64,${base64}`

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        epodPhotoUrl: dataUrl,
        epodConfirmedAt: new Date(),
      },
    })

    await publishEvent("bookings", "epod-uploaded", {
      bookingId,
      loadId: booking.loadId,
    })

    return Response.json({
      success: true,
      data: {
        bookingId: updated.id,
        epodPhotoUrl: updated.epodPhotoUrl,
        epodConfirmedAt: updated.epodConfirmedAt,
      },
    })
  } catch (error) {
    console.error("POST /api/bookings/[id]/epod error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
