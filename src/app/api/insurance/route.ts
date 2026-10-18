import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Find all insurance policies for bookings associated with the user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shipperProfile: true, truckerProfile: true },
    })

    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let policies: any[] = []
    if (user.role === "SHIPPER" && user.shipperProfile) {
      policies = await prisma.insurancePolicy.findMany({
        where: {
          booking: {
            load: { shipperProfileId: user.shipperProfile.id },
          },
        },
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
    } else if (user.role === "TRUCKER" && user.truckerProfile) {
      policies = await prisma.insurancePolicy.findMany({
        where: {
          booking: { truckerProfileId: user.truckerProfile.id },
        },
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
    } else {
      policies = []
    }

    return Response.json({ success: true, data: policies })
  } catch (error) {
    console.error("GET /api/insurance error:", error)
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
    const { bookingId, tier, declaredValue } = body

    if (!bookingId || !tier || !declaredValue) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Calculate premium based on tier
    const premiumRate = tier === "BASIC" ? 0.01 : 0.025
    const coverageMax = tier === "BASIC" ? 100000 : 500000
    const premium = Math.round(declaredValue * premiumRate)

    // Check if policy already exists for this booking
    const existing = await prisma.insurancePolicy.findUnique({
      where: { bookingId },
    })
    if (existing) {
      return Response.json(
        { success: false, error: "Insurance policy already exists for this booking" },
        { status: 409 }
      )
    }

    const policy = await prisma.insurancePolicy.create({
      data: {
        bookingId,
        tier,
        declaredValue,
        premium,
        coverageMax,
        claimPhotos: [],
      },
    })

    return Response.json({ success: true, data: policy }, { status: 201 })
  } catch (error) {
    console.error("POST /api/insurance error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
