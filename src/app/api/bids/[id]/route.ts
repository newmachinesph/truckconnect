import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { counterOfferSchema } from "@/lib/validators"
import { publishEvent } from "@/lib/sse"
import { apiRateLimit, getClientIp, checkRateLimit } from "@/lib/rate-limit"

export async function PATCH(
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

    const { id: bidId } = await params
    const body = await request.json()
    const { action } = body as { action: string }

    if (!action) {
      return Response.json(
        { success: false, error: "Action is required" },
        { status: 400 }
      )
    }

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        load: {
          include: { shipperProfile: true },
        },
        trucker: true,
      },
    })

    if (!bid) {
      return Response.json(
        { success: false, error: "Bid not found" },
        { status: 404 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        shipperProfile: true,
        truckerProfile: true,
      },
    })

    switch (action) {
      case "accept": {
        // Only the shipper who owns the load can accept
        if (user?.shipperProfile?.id !== bid.load.shipperProfileId) {
          return Response.json(
            { success: false, error: "Only the load owner can accept bids" },
            { status: 403 }
          )
        }

        if (bid.status !== "PENDING") {
          return Response.json(
            { success: false, error: "Bid is not in a pending state" },
            { status: 409 }
          )
        }

        const result = await prisma.$transaction(async (tx) => {
          // Accept this bid
          const acceptedBid = await tx.bid.update({
            where: { id: bidId, status: "PENDING" },
            data: {
              status: "ACCEPTED",
              respondedAt: new Date(),
            },
          })

          // Reject all other pending/countered bids on this load
          await tx.bid.updateMany({
            where: {
              loadId: bid.loadId,
              id: { not: bidId },
              status: { in: ["PENDING", "COUNTERED"] },
            },
            data: {
              status: "REJECTED",
              respondedAt: new Date(),
            },
          })

          // Update load status to BOOKED
          await tx.load.update({
            where: { id: bid.loadId, status: "OPEN" },
            data: { status: "BOOKED" },
          })

          // Create booking with the agreed rate
          const agreedRate = acceptedBid.proposedRate
          const platformFeeShipper = Math.round(agreedRate * 0.035)
          const platformFeeTrucker = Math.round(agreedRate * 0.06)

          const booking = await tx.booking.create({
            data: {
              loadId: bid.loadId,
              truckerProfileId: bid.truckerId,
              agreedRate,
              platformFeeShipper,
              platformFeeTrucker,
              status: "CONFIRMED",
            },
            include: {
              load: { include: { shipperProfile: true } },
              truckerProfile: true,
            },
          })

          return { acceptedBid, booking }
        })

        await publishEvent("loads", "bid-accepted", {
          loadId: bid.loadId,
          bidId: bid.id,
          bookingId: result.booking.id,
        })

        return Response.json({ success: true, data: result })
      }

      case "reject": {
        // Only the shipper who owns the load can reject
        if (user?.shipperProfile?.id !== bid.load.shipperProfileId) {
          return Response.json(
            { success: false, error: "Only the load owner can reject bids" },
            { status: 403 }
          )
        }

        if (bid.status !== "PENDING" && bid.status !== "COUNTERED") {
          return Response.json(
            { success: false, error: "Bid cannot be rejected in its current state" },
            { status: 409 }
          )
        }

        const rejectedBid = await prisma.bid.update({
          where: { id: bidId },
          data: {
            status: "REJECTED",
            respondedAt: new Date(),
          },
        })

        await publishEvent("loads", "bid-rejected", {
          loadId: bid.loadId,
          bidId: bid.id,
        })

        return Response.json({ success: true, data: rejectedBid })
      }

      case "counter": {
        // Only the shipper who owns the load can counter
        if (user?.shipperProfile?.id !== bid.load.shipperProfileId) {
          return Response.json(
            { success: false, error: "Only the load owner can counter bids" },
            { status: 403 }
          )
        }

        if (bid.status !== "PENDING") {
          return Response.json(
            { success: false, error: "Only pending bids can be countered" },
            { status: 409 }
          )
        }

        const parsed = counterOfferSchema.safeParse(body)
        if (!parsed.success) {
          return Response.json(
            { success: false, error: parsed.error.flatten().fieldErrors },
            { status: 400 }
          )
        }

        const counteredBid = await prisma.bid.update({
          where: { id: bidId },
          data: {
            status: "COUNTERED",
            counterRate: parsed.data.counterRate,
            counterNote: parsed.data.counterNote,
            respondedAt: new Date(),
          },
        })

        await publishEvent("loads", "bid-countered", {
          loadId: bid.loadId,
          bidId: bid.id,
          counterRate: parsed.data.counterRate,
        })

        return Response.json({ success: true, data: counteredBid })
      }

      case "accept_counter": {
        // Only the trucker who placed the bid can accept a counter
        if (user?.truckerProfile?.id !== bid.truckerId) {
          return Response.json(
            { success: false, error: "Only the bid owner can accept a counter offer" },
            { status: 403 }
          )
        }

        if (bid.status !== "COUNTERED" || !bid.counterRate) {
          return Response.json(
            { success: false, error: "No counter offer to accept" },
            { status: 409 }
          )
        }

        const counterResult = await prisma.$transaction(async (tx) => {
          // Accept this bid at the counter rate
          const acceptedBid = await tx.bid.update({
            where: { id: bidId, status: "COUNTERED" },
            data: {
              status: "ACCEPTED",
              proposedRate: bid.counterRate!,
              respondedAt: new Date(),
            },
          })

          // Reject all other pending/countered bids on this load
          await tx.bid.updateMany({
            where: {
              loadId: bid.loadId,
              id: { not: bidId },
              status: { in: ["PENDING", "COUNTERED"] },
            },
            data: {
              status: "REJECTED",
              respondedAt: new Date(),
            },
          })

          // Update load status to BOOKED
          await tx.load.update({
            where: { id: bid.loadId, status: "OPEN" },
            data: { status: "BOOKED" },
          })

          // Create booking with the counter rate
          const agreedRate = bid.counterRate!
          const platformFeeShipper = Math.round(agreedRate * 0.035)
          const platformFeeTrucker = Math.round(agreedRate * 0.06)

          const booking = await tx.booking.create({
            data: {
              loadId: bid.loadId,
              truckerProfileId: bid.truckerId,
              agreedRate,
              platformFeeShipper,
              platformFeeTrucker,
              status: "CONFIRMED",
            },
            include: {
              load: { include: { shipperProfile: true } },
              truckerProfile: true,
            },
          })

          return { acceptedBid, booking }
        })

        await publishEvent("loads", "counter-accepted", {
          loadId: bid.loadId,
          bidId: bid.id,
          bookingId: counterResult.booking.id,
        })

        return Response.json({ success: true, data: counterResult })
      }

      case "withdraw": {
        // Only the trucker who placed the bid can withdraw
        if (user?.truckerProfile?.id !== bid.truckerId) {
          return Response.json(
            { success: false, error: "Only the bid owner can withdraw" },
            { status: 403 }
          )
        }

        if (bid.status !== "PENDING" && bid.status !== "COUNTERED") {
          return Response.json(
            { success: false, error: "Bid cannot be withdrawn in its current state" },
            { status: 409 }
          )
        }

        const withdrawnBid = await prisma.bid.update({
          where: { id: bidId },
          data: {
            status: "WITHDRAWN",
            respondedAt: new Date(),
          },
        })

        await publishEvent("loads", "bid-withdrawn", {
          loadId: bid.loadId,
          bidId: bid.id,
        })

        return Response.json({ success: true, data: withdrawnBid })
      }

      default:
        return Response.json(
          { success: false, error: "Invalid action. Must be one of: accept, reject, counter, accept_counter, withdraw" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("PATCH /api/bids/[id] error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
