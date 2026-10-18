import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  _request: NextRequest,
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

    if ((session.user as any).role !== "ADMIN") {
      return Response.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      )
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        shipperProfile: {
          include: {
            loads: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            _count: { select: { loads: true } },
          },
        },
        truckerProfile: {
          include: {
            trucks: true,
            bookings: {
              orderBy: { createdAt: "desc" },
              take: 10,
              include: { load: true },
            },
            _count: { select: { bookings: true, trucks: true } },
          },
        },
      },
    })

    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: user })
  } catch (error) {
    console.error("GET /api/admin/users/[id] error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    if ((session.user as any).role !== "ADMIN") {
      return Response.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { truckerProfile: true },
    })

    if (!existingUser) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    // Change role
    if (body.role && ["SHIPPER", "TRUCKER", "ADMIN"].includes(body.role)) {
      updateData.role = body.role
    }

    // Verify trucker (update ltfrbAccreditation or truck verification)
    if (body.verifyTrucker === true && existingUser.truckerProfile) {
      await prisma.truck.updateMany({
        where: { truckerProfileId: existingUser.truckerProfile.id },
        data: { isVerified: true },
      })
    }

    if (body.verifyTrucker === false && existingUser.truckerProfile) {
      await prisma.truck.updateMany({
        where: { truckerProfileId: existingUser.truckerProfile.id },
        data: { isVerified: false },
      })
    }

    // Ban/unban: we use setting role to null as a ban mechanism
    // Or we can use a name prefix convention. For simplicity, we disable by removing the role.
    if (body.banned === true) {
      updateData.role = null
    }

    if (body.banned === false && !updateData.role) {
      // Restore the previous role if provided
      if (body.restoreRole && ["SHIPPER", "TRUCKER", "ADMIN"].includes(body.restoreRole)) {
        updateData.role = body.restoreRole
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        shipperProfile: true,
        truckerProfile: true,
      },
    })

    return Response.json({ success: true, data: updatedUser })
  } catch (error) {
    console.error("PATCH /api/admin/users/[id] error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
