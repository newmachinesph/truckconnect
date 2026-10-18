import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { messageSchema } from "@/lib/validators"
import { redis } from "@/lib/redis"
import { apiRateLimit, getClientIp, checkRateLimit } from "@/lib/rate-limit"
import { parsePagination, paginatedResponse } from "@/lib/pagination"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const bookingId = request.nextUrl.searchParams.get("bookingId")
    if (!bookingId) {
      return Response.json(
        { success: false, error: "bookingId query parameter is required" },
        { status: 400 }
      )
    }

    // Verify user is part of the booking
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shipperProfile: true, truckerProfile: true },
    })

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { load: true },
    })

    if (!booking) {
      return Response.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    const isShipper =
      user?.shipperProfile &&
      booking.load.shipperProfileId === user.shipperProfile.id
    const isTrucker =
      user?.truckerProfile &&
      booking.truckerProfileId === user.truckerProfile.id

    if (!isShipper && !isTrucker) {
      return Response.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    const { skip, take, page, limit } = parsePagination(request.nextUrl.searchParams)
    const where = { bookingId }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take,
      }),
      prisma.message.count({ where }),
    ])

    return Response.json({
      success: true,
      ...paginatedResponse(messages, total, page, limit),
    })
  } catch (error) {
    console.error("GET /api/messages error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimit(apiRateLimit, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = messageSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { bookingId, content } = parsed.data

    // Verify user is part of the booking
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shipperProfile: true, truckerProfile: true },
    })

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { load: true },
    })

    if (!booking) {
      return Response.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    const isShipper =
      user?.shipperProfile &&
      booking.load.shipperProfileId === user.shipperProfile.id
    const isTrucker =
      user?.truckerProfile &&
      booking.truckerProfileId === user.truckerProfile.id

    if (!isShipper && !isTrucker) {
      return Response.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    const message = await prisma.message.create({
      data: {
        bookingId,
        senderId: session.user.id,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    })

    // Push to Redis list for SSE streaming
    await redis.rpush(
      `sse:messages:${bookingId}`,
      JSON.stringify({
        id: message.id,
        content: message.content,
        senderName: message.sender.name,
        senderId: message.sender.id,
        timestamp: message.createdAt,
      })
    )

    return Response.json({ success: true, data: message }, { status: 201 })
  } catch (error) {
    console.error("POST /api/messages error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
