import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
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

    const contract = await prisma.contractLane.findUnique({
      where: { id },
      include: {
        shipper: {
          include: { user: { select: { name: true, email: true } } },
        },
        trucker: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    })

    if (!contract) {
      return Response.json(
        { success: false, error: "Contract not found" },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: contract })
  } catch (error) {
    console.error("GET /api/contracts/[id] error:", error)
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

    const { id } = await params
    const body = await request.json()
    const { action, terminationReason, signature } = body

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

    const contract = await prisma.contractLane.findUnique({
      where: { id },
    })

    if (!contract) {
      return Response.json(
        { success: false, error: "Contract not found" },
        { status: 404 }
      )
    }

    let updateData: Record<string, unknown> = {}

    if (action === "sign") {
      if (user.shipperProfile && contract.shipperId === user.shipperProfile.id) {
        updateData.signedByShipper = new Date()
      } else if (user.truckerProfile && contract.truckerId === user.truckerProfile.id) {
        updateData.signedByTrucker = new Date()
      } else {
        return Response.json(
          { success: false, error: "Not authorized to sign this contract" },
          { status: 403 }
        )
      }

      // If both parties signed, move to ACTIVE
      const updatedContract = await prisma.contractLane.update({
        where: { id },
        data: updateData,
      })

      if (updatedContract.signedByShipper && updatedContract.signedByTrucker) {
        await prisma.contractLane.update({
          where: { id },
          data: { status: "ACTIVE" },
        })
      } else if (contract.status === "DRAFT") {
        await prisma.contractLane.update({
          where: { id },
          data: { status: "PENDING_SIGNATURE" },
        })
      }
    } else if (action === "terminate") {
      updateData = {
        status: "TERMINATED",
        terminatedAt: new Date(),
        terminationReason: terminationReason || "Terminated by party",
      }
      await prisma.contractLane.update({
        where: { id },
        data: updateData,
      })
    } else if (action === "submit") {
      // Move from draft to pending signature
      updateData = { status: "PENDING_SIGNATURE" }
      await prisma.contractLane.update({
        where: { id },
        data: updateData,
      })
    } else {
      // General update
      await prisma.contractLane.update({
        where: { id },
        data: body,
      })
    }

    // Re-fetch with includes
    const updated = await prisma.contractLane.findUnique({
      where: { id },
      include: {
        shipper: {
          include: { user: { select: { name: true, email: true } } },
        },
        trucker: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    })

    return Response.json({ success: true, data: updated })
  } catch (error) {
    console.error("PATCH /api/contracts/[id] error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
