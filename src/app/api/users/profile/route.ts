import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { profileSchema } from "@/lib/validators"

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
      include: { shipperProfile: true, truckerProfile: true },
    })

    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: user })
  } catch (error) {
    console.error("GET /api/users/profile error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = profileSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

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

    // Update user name only if provided (role changes require onboarding, not self-assignment)
    const userUpdate: Record<string, unknown> = {}
    if (data.name !== undefined) userUpdate.name = data.name
    // Only allow role assignment during onboarding (validator already constrains to SHIPPER/TRUCKER)
    if (data.role !== undefined && (!user.role || user.role === "SHIPPER" || user.role === "TRUCKER")) {
      userUpdate.role = data.role
    }

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: userUpdate,
      })
    }

    // Determine effective role for profile upsert
    const effectiveRole = data.role || user.role

    // Create or update profile based on effective role
    if (effectiveRole === "SHIPPER") {
      const shipperUpdate: Record<string, unknown> = {}
      if (data.businessName !== undefined) shipperUpdate.businessName = data.businessName
      if (data.businessType !== undefined) shipperUpdate.businessType = data.businessType
      if (data.businessAddress !== undefined) shipperUpdate.businessAddress = data.businessAddress
      if (data.gcashNumber !== undefined) shipperUpdate.gcashNumber = data.gcashNumber

      await prisma.shipperProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          businessName: data.businessName || "",
          businessType: data.businessType || "",
          businessAddress: data.businessAddress || "",
          gcashNumber: data.gcashNumber,
        },
        update: shipperUpdate,
      })
    } else if (effectiveRole === "TRUCKER") {
      const truckerUpdate: Record<string, unknown> = {}
      if (data.ltfrbAccreditation !== undefined) truckerUpdate.ltfrbAccreditation = data.ltfrbAccreditation
      if (data.gcashNumber !== undefined) truckerUpdate.gcashNumber = data.gcashNumber
      if (data.isAvailable !== undefined) truckerUpdate.isAvailable = data.isAvailable

      await prisma.truckerProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          ltfrbAccreditation: data.ltfrbAccreditation,
          gcashNumber: data.gcashNumber,
          ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
        },
        update: truckerUpdate,
      })
    }

    // Return full user with profile
    const result = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shipperProfile: true, truckerProfile: true },
    })

    return Response.json({ success: true, data: result })
  } catch (error) {
    console.error("PATCH /api/users/profile error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
