import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const load = await prisma.load.findUnique({
      where: { id },
      include: {
        shipperProfile: true,
        booking: {
          include: {
            truckerProfile: true,
          },
        },
      },
    })

    if (!load) {
      return Response.json(
        { success: false, error: "Load not found" },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: load })
  } catch (error) {
    console.error("GET /api/loads/[id] error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
