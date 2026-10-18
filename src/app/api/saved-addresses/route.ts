import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const addresses = await prisma.savedAddress.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    })

    return Response.json({ success: true, data: addresses })
  } catch (error) {
    console.error("GET /api/saved-addresses error:", error)
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

    const body = await request.json()
    const { label, address, lat, lng, isDefault } = body

    if (!label || !address) {
      return Response.json(
        { success: false, error: "label and address are required" },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const saved = await prisma.savedAddress.create({
      data: {
        userId: session.user.id,
        label,
        address,
        lat: lat || 0,
        lng: lng || 0,
        isDefault: isDefault || false,
      },
    })

    return Response.json({ success: true, data: saved }, { status: 201 })
  } catch (error) {
    console.error("POST /api/saved-addresses error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = request.nextUrl
    const id = searchParams.get("id")

    if (!id) {
      return Response.json(
        { success: false, error: "id is required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const address = await prisma.savedAddress.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!address) {
      return Response.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      )
    }

    await prisma.savedAddress.delete({ where: { id } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/saved-addresses error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
