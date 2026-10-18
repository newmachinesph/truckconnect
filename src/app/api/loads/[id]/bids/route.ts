import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { bidSchema } from "@/lib/validators"
import { publishEvent } from "@/lib/sse"
import { apiRateLimit, getClientIp, checkRateLimit } from "@/lib/rate-limit"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: loadId } = await params

    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: { id: true, shipperProfileId: true },
    })

    if (!load) {
      return Response.json(
        { success: false, error: "Load not found" },
        { status: 404 }
      )
    }

    const bids = await prisma.bid.findMany({
      where: { loadId },
      include: {
        trucker: {
          include: {
            user: {
              select: { name: true, image: true },
            },
            trucks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json({ success: true, data: bids })
  } catch (error) {
    console.error("GET /api/loads/[id]/bids error:", error)
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
    const rateLimitResponse = await checkRateLimit(apiRateLimit, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        truckerProfile: {
          include: { trucks: true },
        },
      },
    })

    if (!user?.truckerProfile) {
      return Response.json(
        { success: false, error: "Trucker profile required" },
        { status: 403 }
      )
    }

    const { id: loadId } = await params

    const body = await request.json()
    const parsed = bidSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const load = await prisma.load.findUnique({
      where: { id: loadId },
    })

    if (!load) {
      return Response.json(
        { success: false, error: "Load not found" },
        { status: 404 }
      )
    }

    if (load.status !== "OPEN") {
      return Response.json(
        { success: false, error: "Load is not open for bidding" },
        { status: 409 }
      )
    }

    // Prevent duplicate bids from the same trucker
    const existingBid = await prisma.bid.findFirst({
      where: {
        loadId,
        truckerId: user.truckerProfile.id,
        status: { in: ["PENDING", "COUNTERED"] },
      },
    })

    if (existingBid) {
      return Response.json(
        { success: false, error: "You already have an active bid on this load" },
        { status: 409 }
      )
    }

    const bid = await prisma.bid.create({
      data: {
        loadId,
        truckerId: user.truckerProfile.id,
        proposedRate: parsed.data.proposedRate,
        comments: parsed.data.comments,
      },
      include: {
        trucker: {
          include: {
            user: {
              select: { name: true, image: true },
            },
            trucks: true,
          },
        },
      },
    })

    await publishEvent("loads", "bid-submitted", {
      loadId,
      bidId: bid.id,
      truckerId: bid.truckerId,
    })

    return Response.json({ success: true, data: bid }, { status: 201 })
  } catch (error) {
    console.error("POST /api/loads/[id]/bids error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
