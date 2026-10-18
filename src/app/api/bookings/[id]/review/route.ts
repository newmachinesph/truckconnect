import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const reviewSchema = z.object({
  revieweeId: z.string().min(1),
  onTimeRating: z.number().int().min(1).max(5),
  cargoCareRating: z.number().int().min(1).max(5),
  communicationRating: z.number().int().min(1).max(5),
  professionalismRating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

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

    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      revieweeId,
      onTimeRating,
      cargoCareRating,
      communicationRating,
      professionalismRating,
      comment,
    } = parsed.data

    // Verify booking exists and is COMPLETED
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

    // Verify user is a party to this booking
    const isParty = booking.load.shipperProfile?.userId === session.user.id ||
      booking.truckerProfile?.userId === session.user.id
    if (!isParty) {
      return Response.json(
        { success: false, error: "You can only review bookings you participated in" },
        { status: 403 }
      )
    }

    if (booking.status !== "COMPLETED") {
      return Response.json(
        { success: false, error: "Reviews can only be left on completed bookings" },
        { status: 400 }
      )
    }

    // Check for duplicate review (@@unique([bookingId, reviewerId]))
    const existing = await prisma.review.findUnique({
      where: {
        bookingId_reviewerId: {
          bookingId: id,
          reviewerId: session.user.id,
        },
      },
    })

    if (existing) {
      return Response.json(
        { success: false, error: "You have already reviewed this booking" },
        { status: 409 }
      )
    }

    const overallRating =
      (onTimeRating + cargoCareRating + communicationRating + professionalismRating) / 4

    const review = await prisma.review.create({
      data: {
        bookingId: id,
        reviewerId: session.user.id,
        revieweeId,
        onTimeRating,
        cargoCareRating,
        communicationRating,
        professionalismRating,
        overallRating,
        comment,
      },
    })

    return Response.json({ success: true, data: review })
  } catch (error) {
    console.error("POST /api/bookings/[id]/review error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
