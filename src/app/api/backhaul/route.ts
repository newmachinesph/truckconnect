import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { backhaulSchema } from "@/lib/validators"

export async function GET() {
  try {
    const now = new Date()

    // Auto-deactivate expired offers
    await prisma.backhaulOffer.updateMany({
      where: {
        isActive: true,
        expiresAt: { lt: now },
      },
      data: { isActive: false },
    })

    const offers = await prisma.backhaulOffer.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: now },
      },
      include: {
        truckerProfile: {
          include: {
            user: { select: { name: true } },
            trucks: { take: 1 },
          },
        },
      },
      orderBy: { departureTime: "asc" },
    })

    return Response.json({ success: true, data: offers })
  } catch (error) {
    console.error("GET /api/backhaul error:", error)
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
      include: { truckerProfile: true },
    })

    if (user?.role !== "TRUCKER" || !user.truckerProfile) {
      return Response.json(
        { success: false, error: "Trucker access only" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = backhaulSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const offer = await prisma.backhaulOffer.create({
      data: {
        truckerProfileId: user.truckerProfile.id,
        originAddress: data.originAddress,
        originLat: data.originLat,
        originLng: data.originLng,
        destAddress: data.destAddress,
        destLat: data.destLat,
        destLng: data.destLng,
        truckType: data.truckType,
        availableTons: data.availableTons,
        discountedRate: data.discountedRate,
        departureTime: data.departureTime,
        expiresAt: data.expiresAt,
      },
      include: { truckerProfile: true },
    })

    return Response.json({ success: true, data: offer }, { status: 201 })
  } catch (error) {
    console.error("POST /api/backhaul error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
