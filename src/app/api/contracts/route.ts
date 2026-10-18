import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = request.nextUrl
    const status = searchParams.get("status") as string | null

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

    const where: Record<string, unknown> = {}

    if (user.shipperProfile) {
      where.shipperId = user.shipperProfile.id
    } else if (user.truckerProfile) {
      where.truckerId = user.truckerProfile.id
    } else {
      // Admin can see all
      if (user.role !== "ADMIN") {
        return Response.json(
          { success: false, error: "No profile found" },
          { status: 403 }
        )
      }
    }

    if (status) {
      where.status = status
    }

    const contracts = await prisma.contractLane.findMany({
      where,
      include: {
        shipper: {
          include: { user: { select: { name: true, email: true } } },
        },
        trucker: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json({ success: true, data: contracts })
  } catch (error) {
    console.error("GET /api/contracts error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      include: { shipperProfile: true },
    })

    if (!user?.shipperProfile) {
      return Response.json(
        { success: false, error: "Shipper profile required" },
        { status: 403 }
      )
    }

    const body = await request.json()

    const {
      truckerId,
      originCity,
      destCity,
      agreedRate,
      startDate,
      endDate,
      fuelSurchargeFormula,
      noticePeriodDays,
    } = body

    if (!truckerId || !originCity || !destCity || !agreedRate || !startDate || !endDate) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const contract = await prisma.contractLane.create({
      data: {
        shipperId: user.shipperProfile.id,
        truckerId,
        originCity,
        destCity,
        agreedRate: parseFloat(agreedRate),
        fuelSurchargeFormula: fuelSurchargeFormula || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        noticePeriodDays: parseInt(noticePeriodDays) || 30,
        status: "DRAFT",
      },
      include: {
        shipper: {
          include: { user: { select: { name: true, email: true } } },
        },
        trucker: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    })

    return Response.json({ success: true, data: contract }, { status: 201 })
  } catch (error) {
    console.error("POST /api/contracts error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
