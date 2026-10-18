import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { truckSchema } from "@/lib/validators"

export async function GET() {
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

    const trucks = await prisma.truck.findMany({
      where: { truckerProfileId: user.truckerProfile.id },
      orderBy: { createdAt: "desc" },
    })

    return Response.json({ success: true, data: trucks })
  } catch (error) {
    console.error("GET /api/trucks error:", error)
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
    const parsed = truckSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check for duplicate plate number
    const existing = await prisma.truck.findUnique({
      where: { plateNumber: data.plateNumber },
    })

    if (existing) {
      return Response.json(
        { success: false, error: "Plate number already registered" },
        { status: 409 }
      )
    }

    const truck = await prisma.truck.create({
      data: {
        truckerProfileId: user.truckerProfile.id,
        plateNumber: data.plateNumber,
        truckType: data.truckType,
        capacityTons: data.capacityTons,
        lengthFt: data.lengthFt,
        widthFt: data.widthFt,
        heightFt: data.heightFt,
        isVerified: true, // Auto-verify for MVP
      },
    })

    return Response.json({ success: true, data: truck }, { status: 201 })
  } catch (error) {
    console.error("POST /api/trucks error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
